<script lang="ts">
    import { page } from "$app/stores";
    import { auth } from "$lib/stores/auth.svelte";
    import { toast } from "$lib/stores/toast.svelte";
    import { onMount } from "svelte";
    import SEO from "$lib/components/SEO.svelte";
    import { _ } from "$lib/i18n";
    import gsap from "gsap";
    import {
        ArrowLeft,
        MapPin,
        Calendar,
        Heart,
        MessageCircle,
        Share2,
        ChevronLeft,
        ChevronRight,
        X,
        Send,
        Flag,
        Bookmark,
        MoreHorizontal,
        PawPrint,
        Mail,
        Phone,
    } from "lucide-svelte";
    import VideoPlayer from "$lib/components/VideoPlayer.svelte";
    import ReportPostModal from "$lib/components/ReportPostModal.svelte";
    import EditPostModal from "$lib/components/EditPostModal.svelte";
    import DeletePostModal from "$lib/components/DeletePostModal.svelte";
    import { Pencil, Trash2 } from "lucide-svelte";
    import { goto } from "$app/navigation";

    let post = $state<any>(null);
    let loading = $state(true);
    let error = $state("");
    let comments = $state<any[]>([]);
    let loadingComments = $state(false);
    let newComment = $state("");
    let submittingComment = $state(false);
    let isVoting = $state(false);
    let isSaved = $state(false);

    // Image gallery state
    let selectedImageIndex = $state<number | null>(null);

    // Report modal state
    let showReportModal = $state(false);
    let showEditModal = $state(false);
    let showDeleteModal = $state(false);

    // Check if current user is the owner
    let isOwner = $derived(auth.user && post?.author && post.author.id === auth.user.id);

    // GSAP animation refs
    let postCardEl: HTMLDivElement | null = $state(null);
    let headerEl: HTMLDivElement | null = $state(null);
    let contentEl: HTMLDivElement | null = $state(null);
    let actionsEl: HTMLDivElement | null = $state(null);
    let commentsEl: HTMLDivElement | null = $state(null);
    let hasAnimated = $state(false);

    // Detect if user came from internal navigation or shared link
    let hasInternalHistory = $state(false);

    $effect(() => {
        // Check if referrer is from the same origin (internal navigation)
        if (typeof document !== "undefined") {
            const referrer = document.referrer;
            const currentOrigin = window.location.origin;
            hasInternalHistory = referrer.startsWith(currentOrigin);
        }
    });

    // Derived states for like functionality
    let isLiked = $derived(post?.userVote === 1);
    let likeCount = $derived(post?.upvotes ?? 0);

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
                                reportType
                                preferredContact
                                contactEmail
                                contactPhone
                                contactPhoneCountryCode
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
                                    firstName
                                    lastName
                                    fullName
                                    profilePicture
                                    emailVerified
                                    phoneVerified
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

            // Run entrance animations after post loads
            if (!hasAnimated) {
                hasAnimated = true;
                requestAnimationFrame(() => {
                    runEntranceAnimations();
                });
            }
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
                                    firstName
                                    lastName
                                    fullName
                                    profilePicture
                                    emailVerified
                                    phoneVerified
                                }
                                replies {
                                    id
                                    content
                                    createdAt
                                    author {
                                        id
                                        firstName
                                        lastName
                                        fullName
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

    function runEntranceAnimations() {
        const tl = gsap.timeline({ defaults: { ease: "power2.out" } });

        // Animate post card container
        if (postCardEl) {
            tl.fromTo(
                postCardEl,
                { opacity: 0, y: 30 },
                { opacity: 1, y: 0, duration: 0.5 },
                0
            );
        }

        // Animate header
        if (headerEl) {
            tl.fromTo(
                headerEl,
                { opacity: 0, x: -20 },
                { opacity: 1, x: 0, duration: 0.4 },
                0.1
            );
        }

        // Animate content
        if (contentEl) {
            tl.fromTo(
                contentEl,
                { opacity: 0, y: 15 },
                { opacity: 1, y: 0, duration: 0.4 },
                0.2
            );
        }

        // Animate actions
        if (actionsEl) {
            tl.fromTo(
                actionsEl,
                { opacity: 0, y: 10 },
                { opacity: 1, y: 0, duration: 0.3 },
                0.3
            );
        }

        // Animate comments
        if (commentsEl) {
            tl.fromTo(
                commentsEl,
                { opacity: 0, y: 20 },
                { opacity: 1, y: 0, duration: 0.4 },
                0.35
            );
        }
    }

    async function handleLike() {
        if (!auth.user || !auth.token) {
            window.location.href = "/login";
            return;
        }
        if (isVoting || !post) return;
        isVoting = true;

        try {
            const shouldRemove = post.userVote === 1;
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
                    variables: shouldRemove ? { postId: post.id } : { postId: post.id, value: 1 },
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
            toast.error(e.message || $_("common.failed_vote"));
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
                                    firstName
                                    lastName
                                    fullName
                                    profilePicture
                                    emailVerified
                                    phoneVerified
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
            toast.success($_("common.comment_added"));
        } catch (e: any) {
            toast.error(e.message || $_("common.failed_comment"));
        } finally {
            submittingComment = false;
        }
    }

    function formatRelativeTime(dateStr: string) {
        const d = new Date(Number(dateStr));
        const now = new Date();
        const diffMs = now.getTime() - d.getTime();
        const diffSecs = Math.floor(diffMs / 1000);
        const diffMins = Math.floor(diffSecs / 60);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);
        const diffWeeks = Math.floor(diffDays / 7);

        if (diffSecs < 60) return $_("time.just_now");
        if (diffMins < 60) return $_("time.mins_ago", { values: { count: diffMins } });
        if (diffHours < 24) return $_("time.hours_ago", { values: { count: diffHours } });
        if (diffDays < 7) return $_("time.days_ago", { values: { count: diffDays } });
        if (diffWeeks < 4) return $_("time.weeks_ago", { values: { count: diffWeeks } });
        return d.toLocaleDateString();
    }

    function formatFullDate(dateStr: string) {
        const d = new Date(Number(dateStr));
        return d.toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    }

    function getPostTypeBadge(postType: string, reportType?: string) {
        switch (postType) {
            case "adopt":
                return { label: $_("post.adoption"), class: "bg-green-500 text-white" };
            case "missing":
                if (reportType === "lost") {
                    return { label: $_("post.lost_pet"), class: "bg-red-500 text-white" };
                }
                if (reportType === "found") {
                    return { label: $_("post.found_pet"), class: "bg-orange-500 text-white" };
                }
                return { label: $_("post.missing_pet"), class: "bg-red-500 text-white" };
            default:
                return { label: $_("post.general_post"), class: "bg-indigo-500 text-white" };
        }
    }

    function handleShare() {
        const url = `${window.location.origin}/post/${post.id}`;
        if (navigator.share) {
            navigator.share({
                title: post.title,
                text: post.description?.slice(0, 100) || post.title,
                url: url
            }).catch(() => {});
        } else {
            navigator.clipboard.writeText(url).then(() => {
                toast.success($_("common.link_copied"));
            }).catch(() => {
                toast.error($_("common.copy_failed"));
            });
        }
    }

    function handleSave() {
        isSaved = !isSaved;
        toast.success(isSaved ? $_("post.saved") : $_("post.unsaved"));
    }

    function openGallery(index: number) {
        selectedImageIndex = index;
        document.body.style.overflow = "hidden";
    }

    function closeGallery() {
        selectedImageIndex = null;
        document.body.style.overflow = "";
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

<svelte:window onkeydown={handleKeydown} />

{#if post}
    <SEO
        title={post.title}
        description={post.description?.slice(0, 160) || `${post.postType === 'adopt' ? 'Pet for adoption' : post.postType === 'missing' ? 'Missing pet' : 'Pet post'} on AdoptMe`}
        image={post.images?.[0] || post.pet?.coverImage || '/og-image.jpg'}
        type="article"
        publishedTime={new Date(Number(post.createdAt)).toISOString()}
    />
{/if}

<div class="bg-gray-50 dark:bg-gray-900 min-h-screen transition-colors pb-20">
    {#if loading}
        <!-- Skeleton Loader -->
        <div class="max-w-2xl mx-auto px-4 py-6">
            <div class="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden animate-pulse">
                <!-- Header Skeleton -->
                <div class="p-4 flex items-center gap-3">
                    <div class="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                    <div class="flex-1">
                        <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32 mb-2"></div>
                        <div class="h-3 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
                    </div>
                    <div class="h-6 bg-gray-200 dark:bg-gray-700 rounded-full w-20"></div>
                </div>
                <!-- Image Skeleton -->
                <div class="aspect-video bg-gray-200 dark:bg-gray-700"></div>
                <!-- Content Skeleton -->
                <div class="p-4 space-y-3">
                    <div class="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                    <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
                    <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
                </div>
                <!-- Actions Skeleton -->
                <div class="px-4 py-3 border-t border-gray-100 dark:border-gray-700 flex gap-4">
                    <div class="h-8 w-16 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                    <div class="h-8 w-16 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                    <div class="h-8 w-16 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                </div>
            </div>
        </div>
    {:else if error}
        <div class="max-w-2xl mx-auto px-4 py-8">
            <div class="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-8 rounded-2xl text-center border border-red-100 dark:border-red-800">
                <p class="text-lg font-medium">{error}</p>
                <a href="/" class="mt-4 inline-block px-6 py-2.5 bg-red-600 text-white rounded-full font-medium hover:bg-red-700 transition-colors">
                    {$_("post.go_back_home")}
                </a>
            </div>
        </div>
    {:else if post}
        <div class="max-w-2xl mx-auto px-4 py-6">
            <!-- Back button - only show if user came from internal navigation -->
            {#if hasInternalHistory}
                <button
                    onclick={() => history.back()}
                    class="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4 font-medium transition-colors group"
                >
                    <ArrowLeft class="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                    {$_("post.go_back")}
                </button>
            {:else}
                <!-- User came from shared link - show Go to Feed instead -->
                <a
                    href="/"
                    class="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4 font-medium transition-colors group"
                >
                    <ArrowLeft class="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                    {$_("post.go_to_feed")}
                </a>
            {/if}

            <!-- Main Post Card -->
            <div
                bind:this={postCardEl}
                class="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden transition-colors"
                style="opacity: 0;"
            >
                <!-- Post Header -->
                <div bind:this={headerEl} class="p-4 flex items-center gap-3" style="opacity: 0;">
                    <!-- Author Avatar -->
                    <a
                        href={`/user/${post.author.id}`}
                        class="flex-shrink-0"
                    >
                        {#if post.author.profilePicture}
                            <img
                                src={post.author.profilePicture}
                                alt={post.author.fullName}
                                class="w-12 h-12 rounded-full object-cover border-2 border-gray-100 dark:border-gray-700 hover:border-indigo-500 transition-colors"
                            />
                        {:else}
                            <div class="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg">
                                {post.author.firstName?.[0]?.toUpperCase() || '?'}
                            </div>
                        {/if}
                    </a>

                    <!-- Author Info -->
                    <div class="flex-1 min-w-0">
                        <div class="flex items-center gap-2 flex-wrap">
                            <a
                                href={`/user/${post.author.id}`}
                                class="font-semibold text-gray-900 dark:text-white hover:underline"
                            >
                                {post.author.fullName}
                            </a>
                            <span class="{getPostTypeBadge(post.postType, post.reportType).class} text-[10px] font-bold px-2 py-0.5 rounded-full">
                                {getPostTypeBadge(post.postType, post.reportType).label}
                            </span>
                        </div>
                        <div class="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                            <span>{formatRelativeTime(post.createdAt)}</span>
                            {#if post.location}
                                <span>•</span>
                                <span class="flex items-center gap-0.5">
                                    <MapPin class="w-3 h-3" />
                                    {post.location}
                                </span>
                            {/if}
                        </div>
                    </div>

                    <!-- More Options -->
                    <div class="flex items-center gap-1">
                        {#if isOwner}
                            <button
                                onclick={() => showEditModal = true}
                                class="p-2 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-full transition-colors group"
                                title={$_("common.edit")}
                            >
                                <Pencil class="w-5 h-5 text-gray-400 group-hover:text-indigo-500" />
                            </button>
                            <button
                                onclick={() => showDeleteModal = true}
                                class="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors group"
                                title={$_("common.delete")}
                            >
                                <Trash2 class="w-5 h-5 text-gray-400 group-hover:text-red-500" />
                            </button>
                        {:else if auth.user && post.author.id !== auth.user.id}
                            <button
                                onclick={() => showReportModal = true}
                                class="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors group"
                                title={$_("common.report")}
                            >
                                <Flag class="w-5 h-5 text-gray-400 group-hover:text-red-500" />
                            </button>
                        {/if}
                    </div>
                </div>

                <!-- Post Images -->
                {#if post.images && post.images.length > 0}
                    <div class="border-t border-b border-gray-100 dark:border-gray-700">
                        {#if post.images.length === 1}
                            <button onclick={() => openGallery(0)} class="w-full">
                                <img
                                    src={post.images[0]}
                                    alt="Post image"
                                    class="w-full max-h-[500px] object-contain bg-gray-900 cursor-pointer select-none"
                                    draggable="false"
                                    oncontextmenu={(e) => e.preventDefault()}
                                />
                            </button>
                        {:else if post.images.length === 2}
                            <div class="grid grid-cols-2 gap-0.5">
                                {#each post.images as image, i}
                                    <button onclick={() => openGallery(i)} class="aspect-square overflow-hidden">
                                        <img
                                            src={image}
                                            alt="Post image {i + 1}"
                                            class="w-full h-full object-cover hover:opacity-95 transition-opacity select-none"
                                            draggable="false"
                                            oncontextmenu={(e) => e.preventDefault()}
                                        />
                                    </button>
                                {/each}
                            </div>
                        {:else if post.images.length === 3}
                            <div class="grid grid-cols-2 gap-0.5">
                                <button onclick={() => openGallery(0)} class="row-span-2 aspect-[3/4] overflow-hidden">
                                    <img
                                        src={post.images[0]}
                                        alt="Post image 1"
                                        class="w-full h-full object-cover hover:opacity-95 transition-opacity select-none"
                                        draggable="false"
                                        oncontextmenu={(e) => e.preventDefault()}
                                    />
                                </button>
                                {#each post.images.slice(1, 3) as image, i}
                                    <button onclick={() => openGallery(i + 1)} class="aspect-square overflow-hidden">
                                        <img
                                            src={image}
                                            alt="Post image {i + 2}"
                                            class="w-full h-full object-cover hover:opacity-95 transition-opacity select-none"
                                            draggable="false"
                                            oncontextmenu={(e) => e.preventDefault()}
                                        />
                                    </button>
                                {/each}
                            </div>
                        {:else}
                            <div class="grid grid-cols-2 gap-0.5">
                                {#each post.images.slice(0, 4) as image, i}
                                    <button
                                        onclick={() => openGallery(i)}
                                        class="relative aspect-square overflow-hidden"
                                    >
                                        <img
                                            src={image}
                                            alt="Post image {i + 1}"
                                            class="w-full h-full object-cover hover:opacity-95 transition-opacity select-none"
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
                    <div class="border-t border-b border-gray-100 dark:border-gray-700">
                        <VideoPlayer src={post.video} />
                    </div>
                {/if}

                <!-- Post Content -->
                <div bind:this={contentEl} class="p-4" style="opacity: 0;">
                    <!-- Title -->
                    <h1 class="text-xl font-bold text-gray-900 dark:text-white mb-3">
                        {post.title}
                    </h1>

                    <!-- Description -->
                    {#if post.description}
                        <div class="text-gray-700 dark:text-gray-300 leading-relaxed prose prose-sm dark:prose-invert max-w-none prose-p:my-2 prose-ul:my-2 prose-ol:my-2 prose-li:my-0.5 prose-strong:font-semibold prose-a:text-indigo-600 dark:prose-a:text-indigo-400 prose-a:no-underline hover:prose-a:underline">
                            {@html post.description}
                        </div>
                    {/if}

                    <!-- Tags -->
                    {#if post.tags && post.tags.length > 0}
                        <div class="flex flex-wrap gap-2 mt-4">
                            {#each post.tags as tag}
                                <span class="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-3 py-1 rounded-full text-sm hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors cursor-pointer">
                                    #{tag}
                                </span>
                            {/each}
                        </div>
                    {/if}

                    <!-- Posted date full -->
                    <p class="text-xs text-gray-400 dark:text-gray-500 mt-4">
                        {formatFullDate(post.createdAt)}
                    </p>
                </div>

                <!-- Pet Info Card -->
                {#if post.pet}
                    <div class="mx-4 mb-4 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-2xl p-4 border border-indigo-100 dark:border-indigo-800/50">
                        <div class="flex items-center gap-2 mb-3">
                            <PawPrint class="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                            <h3 class="font-semibold text-gray-900 dark:text-white">{$_("post.pet_info")}</h3>
                        </div>
                        <div class="flex gap-4">
                            {#if post.pet.coverImage}
                                <button
                                    onclick={() => openGallery(post.images?.length || 0)}
                                    class="w-24 h-24 rounded-xl overflow-hidden flex-shrink-0 shadow-md hover:shadow-lg transition-shadow"
                                >
                                    <img
                                        src={post.pet.coverImage}
                                        alt={post.pet.name}
                                        draggable="false"
                                        oncontextmenu={(e) => e.preventDefault()}
                                        class="w-full h-full object-cover"
                                    />
                                </button>
                            {/if}
                            <div class="flex-1 min-w-0">
                                <h4 class="text-lg font-bold text-gray-900 dark:text-white">{post.pet.name}</h4>
                                <p class="text-sm text-gray-600 dark:text-gray-300">
                                    {post.pet.species?.label || post.pet.customSpecies || "Unknown species"}
                                    {post.pet.breed?.name || post.pet.customBreed ? ` • ${post.pet.breed?.name || post.pet.customBreed}` : ""}
                                </p>
                                <div class="flex flex-wrap gap-1.5 mt-2">
                                    {#if post.pet.age}
                                        <span class="bg-white dark:bg-gray-700 px-2 py-0.5 rounded-full text-xs text-gray-700 dark:text-gray-300 shadow-sm">
                                            {$_("post.years_old", { values: { age: post.pet.age } })}
                                        </span>
                                    {/if}
                                    {#if post.pet.gender && post.pet.gender !== "Unknown"}
                                        <span class="bg-white dark:bg-gray-700 px-2 py-0.5 rounded-full text-xs text-gray-700 dark:text-gray-300 shadow-sm">
                                            {post.pet.gender}
                                        </span>
                                    {/if}
                                    {#if post.pet.size}
                                        <span class="bg-white dark:bg-gray-700 px-2 py-0.5 rounded-full text-xs text-gray-700 dark:text-gray-300 shadow-sm">
                                            {post.pet.size}
                                        </span>
                                    {/if}
                                    <span class="px-2 py-0.5 rounded-full text-xs font-medium {post.pet.status === 'Adopted' ? 'bg-green-500 text-white' : 'bg-indigo-500 text-white'}">
                                        {post.pet.status}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                {/if}

                <!-- Contact Info Section (for adopt/missing posts) -->
                {#if (post.postType === 'adopt' || post.postType === 'missing') && post.preferredContact}
                    <div class="mx-4 mb-4 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-2xl p-4 border border-indigo-100 dark:border-indigo-800/50">
                        <h3 class="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                            {#if post.preferredContact === 'email'}
                                <Mail class="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                            {:else}
                                <Phone class="w-5 h-5 text-green-600 dark:text-green-400" />
                            {/if}
                            {$_("post.contact_info")}
                        </h3>

                        {#if post.preferredContact === 'email' && post.contactEmail}
                            <div class="flex items-center gap-3 bg-white dark:bg-gray-700/50 rounded-xl p-3">
                                <div class="w-12 h-12 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center flex-shrink-0">
                                    <Mail class="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                                </div>
                                <div class="flex-1 min-w-0">
                                    <p class="text-xs text-gray-500 dark:text-gray-400 font-medium mb-1">{$_("post.contact_via_email")}</p>
                                    <a
                                        href="mailto:{post.contactEmail}"
                                        class="text-lg font-semibold text-indigo-600 dark:text-indigo-400 hover:underline break-all"
                                    >
                                        {post.contactEmail}
                                    </a>
                                </div>
                            </div>
                        {:else if post.preferredContact === 'phone' && post.contactPhone}
                            <div class="flex items-center gap-3 bg-white dark:bg-gray-700/50 rounded-xl p-3">
                                <div class="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/50 flex items-center justify-center flex-shrink-0">
                                    <Phone class="w-6 h-6 text-green-600 dark:text-green-400" />
                                </div>
                                <div class="flex-1 min-w-0">
                                    <p class="text-xs text-gray-500 dark:text-gray-400 font-medium mb-1">{$_("post.contact_via_phone")}</p>
                                    <a
                                        href="tel:{post.contactPhoneCountryCode ? `+${post.contactPhoneCountryCode}` : ''}{post.contactPhone}"
                                        class="text-lg font-semibold text-green-600 dark:text-green-400 hover:underline"
                                    >
                                        {#if post.contactPhoneCountryCode}+{post.contactPhoneCountryCode} {/if}{post.contactPhone}
                                    </a>
                                </div>
                            </div>
                        {/if}
                    </div>
                {/if}

                <!-- Actions Bar -->
                <div bind:this={actionsEl} class="px-4 py-3 border-t border-gray-100 dark:border-gray-700" style="opacity: 0;">
                    <div class="flex items-center justify-between">
                        <!-- Left Actions -->
                        <div class="flex items-center gap-1">
                            <!-- Like Button -->
                            <button
                                onclick={handleLike}
                                disabled={isVoting}
                                class="flex items-center gap-1.5 px-3 py-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 group"
                            >
                                <Heart
                                    class="w-6 h-6 transition-all {isLiked ? 'text-red-500 fill-red-500 scale-110' : 'text-gray-500 dark:text-gray-400 group-hover:text-red-500'}"
                                />
                                {#if likeCount > 0}
                                    <span class="text-sm font-semibold {isLiked ? 'text-red-500' : 'text-gray-600 dark:text-gray-400'}">
                                        {likeCount}
                                    </span>
                                {/if}
                            </button>

                            <!-- Comment Button -->
                            <button
                                onclick={() => document.getElementById('comment-input')?.focus()}
                                class="flex items-center gap-1.5 px-3 py-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors group"
                            >
                                <MessageCircle class="w-6 h-6 text-gray-500 dark:text-gray-400 group-hover:text-indigo-500" />
                                {#if (post.commentCount ?? 0) > 0}
                                    <span class="text-sm font-semibold text-gray-600 dark:text-gray-400">{post.commentCount}</span>
                                {/if}
                            </button>

                            <!-- Share Button -->
                            <button
                                onclick={handleShare}
                                class="flex items-center gap-1.5 px-3 py-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors group"
                            >
                                <Share2 class="w-6 h-6 text-gray-500 dark:text-gray-400 group-hover:text-indigo-500" />
                            </button>
                        </div>

                        <!-- Right Actions -->
                        <div class="flex items-center gap-1">
                            <!-- Save Button -->
                            <button
                                onclick={handleSave}
                                class="flex items-center gap-1.5 px-3 py-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors group"
                            >
                                <Bookmark
                                    class="w-6 h-6 transition-all {isSaved ? 'text-indigo-500 fill-indigo-500' : 'text-gray-500 dark:text-gray-400 group-hover:text-indigo-500'}"
                                />
                            </button>

                            <!-- Adopt Button -->
                            {#if post.pet && post.postType === "adopt" && post.pet.status !== "Adopted"}
                                <button
                                    onclick={() => {
                                        if (!auth.user) {
                                            window.location.href = "/login";
                                        } else {
                                            toast.info($_("post.contact_coming"));
                                        }
                                    }}
                                    class="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-5 py-2 rounded-full font-semibold transition-all shadow-md hover:shadow-lg active:scale-95"
                                >
                                    <Heart class="w-5 h-5" />
                                    {$_("common.adopt")}
                                </button>
                            {/if}
                        </div>
                    </div>
                </div>

                <!-- Comments Section -->
                <div bind:this={commentsEl} class="p-4 border-t border-gray-100 dark:border-gray-700" style="opacity: 0;">
                    <h3 class="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                        <MessageCircle class="w-5 h-5" />
                        {$_("common.comments")} ({post.commentCount ?? 0})
                    </h3>

                    <!-- New Comment Form -->
                    {#if auth.user}
                        <div class="flex gap-3 mb-6">
                            <div class="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold flex-shrink-0 overflow-hidden">
                                {#if auth.user.profilePicture}
                                    <img src={auth.user.profilePicture} alt={auth.user.fullName} class="w-full h-full object-cover" />
                                {:else}
                                    {auth.user.firstName?.[0]?.toUpperCase() || '?'}
                                {/if}
                            </div>
                            <div class="flex-1 flex gap-2">
                                <input
                                    id="comment-input"
                                    type="text"
                                    bind:value={newComment}
                                    placeholder={$_("common.write_comment")}
                                    class="flex-1 px-4 py-2.5 border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent focus:bg-white dark:focus:bg-gray-600 transition-all"
                                    onkeydown={(e) => e.key === "Enter" && submitComment()}
                                />
                                <button
                                    onclick={submitComment}
                                    disabled={!newComment.trim() || submittingComment}
                                    class="p-2.5 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-md hover:shadow-lg"
                                >
                                    <Send class="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    {:else}
                        <div class="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 text-center mb-6 border border-gray-100 dark:border-gray-600">
                            <p class="text-gray-600 dark:text-gray-300 text-sm">
                                <a href="/login" class="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline">{$_("common.login_to_comment")}</a> {$_("common.login_to_comment_text")}
                            </p>
                        </div>
                    {/if}

                    <!-- Comments List -->
                    {#if loadingComments}
                        <div class="space-y-4">
                            {#each Array(3) as _}
                                <div class="flex gap-3 animate-pulse">
                                    <div class="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700"></div>
                                    <div class="flex-1">
                                        <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-2"></div>
                                        <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                                    </div>
                                </div>
                            {/each}
                        </div>
                    {:else if comments.length === 0}
                        <div class="text-center py-8">
                            <div class="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-3">
                                <MessageCircle class="w-8 h-8 text-gray-400 dark:text-gray-500" />
                            </div>
                            <p class="text-gray-500 dark:text-gray-400 font-medium">{$_("common.no_comments")}</p>
                            <p class="text-gray-400 dark:text-gray-500 text-sm mt-1">{$_("common.be_first_comment")}</p>
                        </div>
                    {:else}
                        <div class="space-y-4">
                            {#each comments as comment}
                                <div class="flex gap-3 group">
                                    <a href={`/user/${comment.author.id}`} class="flex-shrink-0">
                                        {#if comment.author.profilePicture}
                                            <img src={comment.author.profilePicture} alt={comment.author.fullName} class="w-10 h-10 rounded-full object-cover" />
                                        {:else}
                                            <div class="w-10 h-10 rounded-full bg-gradient-to-br from-gray-400 to-gray-500 flex items-center justify-center text-white font-bold text-sm">
                                                {comment.author.firstName?.[0]?.toUpperCase() || '?'}
                                            </div>
                                        {/if}
                                    </a>
                                    <div class="flex-1">
                                        <div class="bg-gray-50 dark:bg-gray-700/50 rounded-2xl px-4 py-3">
                                            <div class="flex items-center gap-2 mb-1">
                                                <a href={`/user/${comment.author.id}`} class="font-semibold text-gray-900 dark:text-white text-sm hover:underline">
                                                    {comment.author.fullName}
                                                </a>
                                            </div>
                                            <p class="text-gray-700 dark:text-gray-300 text-sm">{comment.content}</p>
                                        </div>
                                        <div class="flex items-center gap-3 mt-1 px-2">
                                            <span class="text-xs text-gray-500 dark:text-gray-400">{formatRelativeTime(comment.createdAt)}</span>
                                            <button class="text-xs text-gray-500 dark:text-gray-400 font-medium hover:text-indigo-600 dark:hover:text-indigo-400">
                                                {$_("common.reply")}
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <!-- Replies -->
                                {#if comment.replies && comment.replies.length > 0}
                                    <div class="ml-12 space-y-3">
                                        {#each comment.replies as reply}
                                            <div class="flex gap-3">
                                                <a href={`/user/${reply.author.id}`} class="flex-shrink-0">
                                                    {#if reply.author.profilePicture}
                                                        <img src={reply.author.profilePicture} alt={reply.author.fullName} class="w-8 h-8 rounded-full object-cover" />
                                                    {:else}
                                                        <div class="w-8 h-8 rounded-full bg-gradient-to-br from-gray-300 to-gray-400 flex items-center justify-center text-white font-bold text-xs">
                                                            {reply.author.firstName?.[0]?.toUpperCase() || '?'}
                                                        </div>
                                                    {/if}
                                                </a>
                                                <div class="flex-1">
                                                    <div class="bg-gray-50 dark:bg-gray-700/50 rounded-2xl px-4 py-2">
                                                        <a href={`/user/${reply.author.id}`} class="font-semibold text-gray-900 dark:text-white text-sm hover:underline">
                                                            {reply.author.fullName}
                                                        </a>
                                                        <p class="text-gray-700 dark:text-gray-300 text-sm">{reply.content}</p>
                                                    </div>
                                                    <span class="text-xs text-gray-500 dark:text-gray-400 mt-1 px-2 block">{formatRelativeTime(reply.createdAt)}</span>
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
            class="absolute top-4 right-4 text-white/80 hover:text-white p-2 hover:bg-white/10 rounded-full transition-colors"
        >
            <X class="w-8 h-8" />
        </button>

        {#if allImages.length > 1}
            <button
                onclick={(e) => { e.stopPropagation(); prevImage(); }}
                class="absolute left-4 text-white/80 hover:text-white p-2 hover:bg-white/10 rounded-full transition-colors"
            >
                <ChevronLeft class="w-10 h-10" />
            </button>

            <button
                onclick={(e) => { e.stopPropagation(); nextImage(); }}
                class="absolute right-4 text-white/80 hover:text-white p-2 hover:bg-white/10 rounded-full transition-colors"
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
            <div class="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 bg-black/50 px-3 py-2 rounded-full">
                {#each allImages as _, i}
                    <button
                        onclick={(e) => { e.stopPropagation(); selectedImageIndex = i; }}
                        class="w-2.5 h-2.5 rounded-full transition-all {i === selectedImageIndex ? 'bg-white scale-110' : 'bg-white/40 hover:bg-white/60'}"
                    ></button>
                {/each}
            </div>
        {/if}
    </div>
{/if}

<!-- Report Post Modal -->
{#if post}
    <ReportPostModal
        bind:open={showReportModal}
        postId={post.id}
        onClose={() => showReportModal = false}
    />

    <!-- Edit Post Modal -->
    <EditPostModal
        bind:open={showEditModal}
        {post}
        onClose={() => showEditModal = false}
        onPostUpdated={(updatedPost) => {
            showEditModal = false;
            // Update post data locally
            if (updatedPost) {
                post = { ...post, ...updatedPost };
            }
        }}
    />

    <!-- Delete Post Modal -->
    <DeletePostModal
        bind:open={showDeleteModal}
        {post}
        onClose={() => showDeleteModal = false}
        onPostDeleted={() => {
            showDeleteModal = false;
            // Navigate back to feed
            goto('/');
        }}
    />
{/if}
