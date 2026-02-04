<script lang="ts">
    import { page } from "$app/stores";
    import { auth } from "$lib/stores/auth.svelte";
    import { toast } from "$lib/stores/toast.svelte";
    import { onMount } from "svelte";
    import SEO from "$lib/components/SEO.svelte";
    import {
        ArrowLeft,
        MapPin,
        Calendar,
        User,
        Heart,
        MessageCircle,
        Share2,
        ChevronLeft,
        ChevronRight,
        X,
        Send,
    } from "lucide-svelte";
    import VideoPlayer from "$lib/components/VideoPlayer.svelte";

    let post = $state<any>(null);
    let loading = $state(true);
    let error = $state("");
    let comments = $state<any[]>([]);
    let loadingComments = $state(false);
    let newComment = $state("");
    let submittingComment = $state(false);
    let isVoting = $state(false);

    // Image gallery state
    let selectedImageIndex = $state<number | null>(null);

    $effect(() => {
        const postId = $page.params.id;
        if (postId) {
            fetchPost(postId);
            fetchComments(postId);
        }
    });

    async function fetchPost(id: string) {
        loading = true;
        error = "";
        try {
            const response = await fetch("/api/graphql", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    ...(auth.token ? { Authorization: `Bearer ${auth.token}` } : {}),
                },
                body: JSON.stringify({
                    query: `
                        query GetPost($id: ID!) {
                            post(id: $id) {
                                id
                                title
                                description
                                postType
                                tags
                                images
                                video
                                location
                                createdAt
                                voteScore
                                upvotes
                                downvotes
                                userVote
                                commentCount
                                author {
                                    id
                                    name
                                    profilePicture
                                }
                                pet {
                                    id
                                    name
                                    species { id label name }
                                    customSpecies
                                    breed { name }
                                    customBreed
                                    age
                                    gender
                                    size
                                    description
                                    status
                                    coverImage
                                    images
                                }
                            }
                        }
                    `,
                    variables: { id },
                }),
            });

            const result = await response.json();
            if (result.errors) throw new Error(result.errors[0].message);
            if (!result.data.post) throw new Error("Post not found");

            post = result.data.post;
        } catch (e: any) {
            error = e.message;
        } finally {
            loading = false;
        }
    }

    async function fetchComments(postId: string) {
        loadingComments = true;
        try {
            const response = await fetch("/api/graphql", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    ...(auth.token ? { Authorization: `Bearer ${auth.token}` } : {}),
                },
                body: JSON.stringify({
                    query: `
                        query GetComments($postId: ID!) {
                            commentsByPost(postId: $postId) {
                                id
                                content
                                createdAt
                                author {
                                    id
                                    name
                                    profilePicture
                                }
                                replies {
                                    id
                                    content
                                    createdAt
                                    author {
                                        id
                                        name
                                        profilePicture
                                    }
                                }
                            }
                        }
                    `,
                    variables: { postId },
                }),
            });

            const result = await response.json();
            if (result.errors) throw new Error(result.errors[0].message);

            comments = result.data.commentsByPost || [];
        } catch (e: any) {
            console.error("Failed to fetch comments:", e);
        } finally {
            loadingComments = false;
        }
    }

    async function handleVote(value: number) {
        if (!auth.user || !auth.token) {
            window.location.href = "/login";
            return;
        }
        if (isVoting || !post) return;
        isVoting = true;

        try {
            const shouldRemove = post.userVote === value;
            const response = await fetch("/api/graphql", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${auth.token}`,
                },
                body: JSON.stringify({
                    query: shouldRemove
                        ? `mutation RemoveVote($postId: ID!) { removeVote(postId: $postId) { id voteScore upvotes downvotes userVote } }`
                        : `mutation VotePost($postId: ID!, $value: Int!) { votePost(postId: $postId, value: $value) { id voteScore upvotes downvotes userVote } }`,
                    variables: shouldRemove ? { postId: post.id } : { postId: post.id, value },
                }),
            });

            const result = await response.json();
            if (result.errors) throw new Error(result.errors[0].message);

            const updatedPost = shouldRemove ? result.data.removeVote : result.data.votePost;
            post.voteScore = updatedPost.voteScore;
            post.upvotes = updatedPost.upvotes;
            post.downvotes = updatedPost.downvotes;
            post.userVote = updatedPost.userVote;
        } catch (e: any) {
            toast.error(e.message || "Failed to vote");
        } finally {
            isVoting = false;
        }
    }

    async function submitComment() {
        if (!auth.user || !auth.token) {
            window.location.href = "/login";
            return;
        }
        if (!newComment.trim() || submittingComment || !post) return;

        submittingComment = true;
        try {
            const response = await fetch("/api/graphql", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${auth.token}`,
                },
                body: JSON.stringify({
                    query: `
                        mutation CreateComment($postId: ID!, $content: String!) {
                            createComment(postId: $postId, content: $content) {
                                id
                                content
                                createdAt
                                author {
                                    id
                                    name
                                    profilePicture
                                }
                            }
                        }
                    `,
                    variables: { postId: post.id, content: newComment.trim() },
                }),
            });

            const result = await response.json();
            if (result.errors) throw new Error(result.errors[0].message);

            comments = [result.data.createComment, ...comments];
            post.commentCount = (post.commentCount || 0) + 1;
            newComment = "";
            toast.success("Comment added!");
        } catch (e: any) {
            toast.error(e.message || "Failed to add comment");
        } finally {
            submittingComment = false;
        }
    }

    function formatDate(dateStr: string) {
        const d = new Date(Number(dateStr));
        return d.toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    }

    function getPostTypeBadge(postType: string) {
        switch (postType) {
            case "adopt":
                return { label: "Adoption", class: "bg-green-100 text-green-700" };
            case "missing":
                return { label: "Missing Pet", class: "bg-red-100 text-red-700" };
            default:
                return { label: "General Post", class: "bg-blue-100 text-blue-700" };
        }
    }

    function openGallery(index: number) {
        selectedImageIndex = index;
    }

    function closeGallery() {
        selectedImageIndex = null;
    }

    function nextImage() {
        if (post && selectedImageIndex !== null) {
            const allImages = getAllImages();
            selectedImageIndex = (selectedImageIndex + 1) % allImages.length;
        }
    }

    function prevImage() {
        if (post && selectedImageIndex !== null) {
            const allImages = getAllImages();
            selectedImageIndex = (selectedImageIndex - 1 + allImages.length) % allImages.length;
        }
    }

    function getAllImages(): string[] {
        if (!post) return [];
        const images: string[] = [];
        if (post.images) images.push(...post.images);
        if (post.pet?.coverImage) images.push(post.pet.coverImage);
        if (post.pet?.images) images.push(...post.pet.images);
        return images;
    }

    function handleKeydown(e: KeyboardEvent) {
        if (selectedImageIndex === null) return;
        if (e.key === "Escape") closeGallery();
        if (e.key === "ArrowRight") nextImage();
        if (e.key === "ArrowLeft") prevImage();
    }
</script>

<svelte:window on:keydown={handleKeydown} />

{#if post}
    <SEO
        title={post.title}
        description={post.description?.slice(0, 160) || `${post.postType === 'adopt' ? 'Pet for adoption' : post.postType === 'missing' ? 'Missing pet' : 'Pet post'} on AdoptMe`}
        image={post.images?.[0] || post.pet?.coverImage || '/og-image.jpg'}
        type="article"
        publishedTime={new Date(Number(post.createdAt)).toISOString()}
    />
{/if}

<div class="bg-gray-50 min-h-screen">
    {#if loading}
        <div class="max-w-4xl mx-auto px-4 py-8">
            <div class="bg-white rounded-2xl p-8 animate-pulse">
                <div class="h-8 bg-gray-200 rounded w-3/4 mb-4"></div>
                <div class="h-64 bg-gray-200 rounded-xl mb-4"></div>
                <div class="h-4 bg-gray-200 rounded w-full mb-2"></div>
                <div class="h-4 bg-gray-200 rounded w-2/3"></div>
            </div>
        </div>
    {:else if error}
        <div class="max-w-4xl mx-auto px-4 py-8">
            <div class="bg-red-50 text-red-600 p-8 rounded-2xl text-center">
                <p class="text-lg font-medium">{error}</p>
                <a href="/" class="mt-4 inline-block px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
                    Go back home
                </a>
            </div>
        </div>
    {:else if post}
        <div class="max-w-4xl mx-auto px-4 py-6">
            <!-- Back button -->
            <a
                href="/"
                class="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 font-medium"
            >
                <ArrowLeft class="w-5 h-5" />
                Back to feed
            </a>

            <!-- Main Post Card -->
            <div class="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                <!-- Post Header -->
                <div class="p-6 border-b border-gray-100">
                    <div class="flex items-center justify-between mb-4">
                        <div class="flex items-center gap-3">
                            <div class="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg overflow-hidden">
                                {#if post.author.profilePicture}
                                    <img src={post.author.profilePicture} alt={post.author.name} class="w-full h-full object-cover" />
                                {:else}
                                    {post.author.name[0].toUpperCase()}
                                {/if}
                            </div>
                            <div>
                                <p class="font-semibold text-gray-900">{post.author.name}</p>
                                <p class="text-sm text-gray-500 flex items-center gap-1">
                                    <Calendar class="w-3.5 h-3.5" />
                                    {formatDate(post.createdAt)}
                                </p>
                            </div>
                        </div>
                        <span class="{getPostTypeBadge(post.postType).class} px-3 py-1 rounded-full text-sm font-medium">
                            {getPostTypeBadge(post.postType).label}
                        </span>
                    </div>

                    <h1 class="text-2xl font-bold text-gray-900 mb-2">{post.title}</h1>

                    {#if post.location}
                        <p class="text-gray-500 flex items-center gap-1 text-sm">
                            <MapPin class="w-4 h-4" />
                            {post.location}
                        </p>
                    {/if}
                </div>

                <!-- Post Images -->
                {#if post.images && post.images.length > 0}
                    <div class="border-b border-gray-100">
                        {#if post.images.length === 1}
                            <button onclick={() => openGallery(0)} class="w-full">
                                <img
                                    src={post.images[0]}
                                    alt="Post image"
                                    class="w-full max-h-[600px] object-contain bg-gray-900 cursor-pointer select-none"
                                    draggable="false"
                                    oncontextmenu={(e) => e.preventDefault()}
                                />
                            </button>
                        {:else}
                            <div class="grid grid-cols-2 gap-1">
                                {#each post.images.slice(0, 4) as image, i}
                                    <button
                                        onclick={() => openGallery(i)}
                                        class="relative aspect-square overflow-hidden cursor-pointer"
                                    >
                                        <img
                                            src={image}
                                            alt="Post image {i + 1}"
                                            class="w-full h-full object-cover hover:opacity-90 transition-opacity select-none"
                                            draggable="false"
                                            oncontextmenu={(e) => e.preventDefault()}
                                        />
                                        {#if i === 3 && post.images.length > 4}
                                            <div class="absolute inset-0 bg-black/60 flex items-center justify-center">
                                                <span class="text-white font-bold text-2xl">+{post.images.length - 4}</span>
                                            </div>
                                        {/if}
                                    </button>
                                {/each}
                            </div>
                        {/if}
                    </div>
                {/if}

                <!-- Post Video -->
                {#if post.video}
                    <div class="p-4 border-b border-gray-100">
                        <VideoPlayer src={post.video} />
                    </div>
                {/if}

                <!-- Post Description -->
                <div class="p-6 border-b border-gray-100">
                    <p class="text-gray-700 whitespace-pre-wrap leading-relaxed">{post.description}</p>

                    <!-- Tags -->
                    {#if post.tags && post.tags.length > 0}
                        <div class="flex flex-wrap gap-2 mt-4">
                            {#each post.tags as tag}
                                <span class="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-sm">
                                    #{tag}
                                </span>
                            {/each}
                        </div>
                    {/if}
                </div>

                <!-- Pet Info (if applicable) -->
                {#if post.pet}
                    <div class="p-6 bg-gray-50 border-b border-gray-100">
                        <h3 class="font-semibold text-gray-900 mb-4">Pet Information</h3>
                        <div class="flex gap-4">
                            {#if post.pet.coverImage}
                                <button
                                    onclick={() => openGallery(post.images?.length || 0)}
                                    class="w-32 h-32 rounded-xl overflow-hidden flex-shrink-0 cursor-pointer"
                                >
                                    <img
                                        src={post.pet.coverImage}
                                        alt={post.pet.name}
                                        draggable="false"
                                        oncontextmenu={(e) => e.preventDefault()}
                                        class="w-full h-full object-cover hover:opacity-90 transition-opacity"
                                    />
                                </button>
                            {/if}
                            <div class="flex-1">
                                <h4 class="text-xl font-bold text-gray-900">{post.pet.name}</h4>
                                <p class="text-gray-600">
                                    {post.pet.species?.label || post.pet.customSpecies || "Unknown species"}
                                    {post.pet.breed?.name || post.pet.customBreed ? ` - ${post.pet.breed?.name || post.pet.customBreed}` : ""}
                                </p>
                                <div class="flex flex-wrap gap-2 mt-3">
                                    {#if post.pet.age}
                                        <span class="bg-white border border-gray-200 px-3 py-1 rounded-full text-sm text-gray-700">
                                            {post.pet.age} years old
                                        </span>
                                    {/if}
                                    {#if post.pet.gender && post.pet.gender !== "Unknown"}
                                        <span class="bg-white border border-gray-200 px-3 py-1 rounded-full text-sm text-gray-700">
                                            {post.pet.gender}
                                        </span>
                                    {/if}
                                    {#if post.pet.size}
                                        <span class="bg-white border border-gray-200 px-3 py-1 rounded-full text-sm text-gray-700">
                                            {post.pet.size}
                                        </span>
                                    {/if}
                                    <span class="px-3 py-1 rounded-full text-sm font-medium {post.pet.status === 'Adopted' ? 'bg-green-100 text-green-700' : 'bg-indigo-100 text-indigo-700'}">
                                        {post.pet.status}
                                    </span>
                                </div>
                                {#if post.pet.description}
                                    <p class="text-gray-600 mt-3 text-sm">{post.pet.description}</p>
                                {/if}
                            </div>
                        </div>
                    </div>
                {/if}

                <!-- Actions Bar -->
                <div class="p-4 flex items-center gap-4 border-b border-gray-100">
                    <div class="flex items-center gap-1">
                        <button
                            onclick={() => handleVote(1)}
                            class="p-2 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
                            class:text-orange-500={post.userVote === 1}
                            class:text-gray-500={post.userVote !== 1}
                            disabled={isVoting}
                        >
                            <svg class="w-6 h-6" fill={post.userVote === 1 ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7"></path>
                            </svg>
                        </button>
                        <span class="font-bold text-lg min-w-[2rem] text-center" class:text-orange-500={post.voteScore > 0} class:text-indigo-500={post.voteScore < 0}>
                            {post.voteScore ?? 0}
                        </span>
                        <button
                            onclick={() => handleVote(-1)}
                            class="p-2 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
                            class:text-indigo-500={post.userVote === -1}
                            class:text-gray-500={post.userVote !== -1}
                            disabled={isVoting}
                        >
                            <svg class="w-6 h-6" fill={post.userVote === -1 ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                            </svg>
                        </button>
                    </div>

                    <div class="flex items-center gap-2 text-gray-500">
                        <MessageCircle class="w-5 h-5" />
                        <span class="font-medium">{post.commentCount ?? 0} comments</span>
                    </div>

                    <button class="flex items-center gap-2 text-gray-500 hover:text-gray-700 ml-auto">
                        <Share2 class="w-5 h-5" />
                        <span class="font-medium">Share</span>
                    </button>

                    {#if post.pet && post.postType === "adopt"}
                        <button
                            onclick={() => {
                                if (!auth.user) {
                                    window.location.href = "/login";
                                } else {
                                    alert("Contact feature coming soon!");
                                }
                            }}
                            class="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-full font-medium transition-colors"
                        >
                            <Heart class="w-5 h-5" />
                            Adopt
                        </button>
                    {/if}
                </div>

                <!-- Comments Section -->
                <div class="p-6">
                    <h3 class="font-semibold text-gray-900 mb-4">Comments ({post.commentCount ?? 0})</h3>

                    <!-- New Comment Form -->
                    {#if auth.user}
                        <div class="flex gap-3 mb-6">
                            <div class="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold flex-shrink-0 overflow-hidden">
                                {#if auth.user.profilePicture}
                                    <img src={auth.user.profilePicture} alt={auth.user.name} class="w-full h-full object-cover" />
                                {:else}
                                    {auth.user.name[0].toUpperCase()}
                                {/if}
                            </div>
                            <div class="flex-1 flex gap-2">
                                <input
                                    type="text"
                                    bind:value={newComment}
                                    placeholder="Write a comment..."
                                    class="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                    onkeydown={(e) => e.key === "Enter" && submitComment()}
                                />
                                <button
                                    onclick={submitComment}
                                    disabled={!newComment.trim() || submittingComment}
                                    class="p-2 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    <Send class="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    {:else}
                        <div class="bg-gray-50 rounded-xl p-4 text-center mb-6">
                            <p class="text-gray-600">
                                <a href="/login" class="text-indigo-600 font-medium hover:underline">Log in</a> to leave a comment
                            </p>
                        </div>
                    {/if}

                    <!-- Comments List -->
                    {#if loadingComments}
                        <div class="space-y-4">
                            {#each Array(3) as _}
                                <div class="flex gap-3 animate-pulse">
                                    <div class="w-10 h-10 rounded-full bg-gray-200"></div>
                                    <div class="flex-1">
                                        <div class="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                                        <div class="h-4 bg-gray-200 rounded w-3/4"></div>
                                    </div>
                                </div>
                            {/each}
                        </div>
                    {:else if comments.length === 0}
                        <p class="text-gray-500 text-center py-8">No comments yet. Be the first to comment!</p>
                    {:else}
                        <div class="space-y-4">
                            {#each comments as comment}
                                <div class="flex gap-3">
                                    <div class="w-10 h-10 rounded-full bg-gradient-to-br from-gray-400 to-gray-500 flex items-center justify-center text-white font-bold flex-shrink-0 text-sm overflow-hidden">
                                        {#if comment.author.profilePicture}
                                            <img src={comment.author.profilePicture} alt={comment.author.name} class="w-full h-full object-cover" />
                                        {:else}
                                            {comment.author.name[0].toUpperCase()}
                                        {/if}
                                    </div>
                                    <div class="flex-1 bg-gray-50 rounded-xl p-3">
                                        <div class="flex items-center gap-2 mb-1">
                                            <span class="font-semibold text-gray-900 text-sm">{comment.author.name}</span>
                                            <span class="text-xs text-gray-500">{formatDate(comment.createdAt)}</span>
                                        </div>
                                        <p class="text-gray-700 text-sm">{comment.content}</p>
                                    </div>
                                </div>

                                <!-- Replies -->
                                {#if comment.replies && comment.replies.length > 0}
                                    <div class="ml-12 space-y-3">
                                        {#each comment.replies as reply}
                                            <div class="flex gap-3">
                                                <div class="w-8 h-8 rounded-full bg-gradient-to-br from-gray-300 to-gray-400 flex items-center justify-center text-white font-bold flex-shrink-0 text-xs overflow-hidden">
                                                    {#if reply.author.profilePicture}
                                                        <img src={reply.author.profilePicture} alt={reply.author.name} class="w-full h-full object-cover" />
                                                    {:else}
                                                        {reply.author.name[0].toUpperCase()}
                                                    {/if}
                                                </div>
                                                <div class="flex-1 bg-gray-50 rounded-xl p-3">
                                                    <div class="flex items-center gap-2 mb-1">
                                                        <span class="font-semibold text-gray-900 text-sm">{reply.author.name}</span>
                                                        <span class="text-xs text-gray-500">{formatDate(reply.createdAt)}</span>
                                                    </div>
                                                    <p class="text-gray-700 text-sm">{reply.content}</p>
                                                </div>
                                            </div>
                                        {/each}
                                    </div>
                                {/if}
                            {/each}
                        </div>
                    {/if}
                </div>
            </div>
        </div>
    {/if}
</div>

<!-- Full Screen Image Gallery Modal -->
{#if selectedImageIndex !== null && post}
    {@const allImages = getAllImages()}
    <div
        class="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
        onclick={closeGallery}
        role="dialog"
        aria-modal="true"
    >
        <button
            onclick={closeGallery}
            class="absolute top-4 right-4 text-white/80 hover:text-white p-2"
        >
            <X class="w-8 h-8" />
        </button>

        {#if allImages.length > 1}
            <button
                onclick={(e) => { e.stopPropagation(); prevImage(); }}
                class="absolute left-4 text-white/80 hover:text-white p-2"
            >
                <ChevronLeft class="w-10 h-10" />
            </button>

            <button
                onclick={(e) => { e.stopPropagation(); nextImage(); }}
                class="absolute right-4 text-white/80 hover:text-white p-2"
            >
                <ChevronRight class="w-10 h-10" />
            </button>
        {/if}

        <img
            src={allImages[selectedImageIndex]}
            alt="Full size"
            class="max-w-[90vw] max-h-[90vh] object-contain select-none"
            onclick={(e) => e.stopPropagation()}
            oncontextmenu={(e) => e.preventDefault()}
            draggable="false"
        />

        {#if allImages.length > 1}
            <div class="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                {#each allImages as _, i}
                    <button
                        onclick={(e) => { e.stopPropagation(); selectedImageIndex = i; }}
                        class="w-2 h-2 rounded-full transition-colors {i === selectedImageIndex ? 'bg-white' : 'bg-white/40'}"
                    ></button>
                {/each}
            </div>
        {/if}
    </div>
{/if}
