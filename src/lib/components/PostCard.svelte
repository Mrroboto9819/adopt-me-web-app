<script lang="ts">
    import { auth } from "$lib/stores/auth.svelte";
    import { toast } from "$lib/stores/toast.svelte";
    import { goto } from "$app/navigation";
    import VideoPlayer from "./VideoPlayer.svelte";

    // Props for the post
    let { post, onVoteChange } = $props<{
        post: any;
        onVoteChange?: () => void;
    }>();

    let isVoting = $state(false);

    // Format date relative (simple version)
    function formatDate(dateStr: string) {
        const d = new Date(Number(dateStr));
        return d.toLocaleDateString() + " " + d.toLocaleTimeString();
    }

    // Get post type badge
    function getPostTypeBadge(postType: string) {
        switch (postType) {
            case 'adopt':
                return { label: 'Adoption', class: 'bg-green-100 text-green-700 border-green-200' };
            case 'missing':
                return { label: 'Missing', class: 'bg-red-100 text-red-700 border-red-200' };
            default:
                return { label: 'Post', class: 'bg-blue-100 text-blue-700 border-blue-200' };
        }
    }

    async function handleVote(value: number, e: Event) {
        e.stopPropagation(); // Prevent card click

        if (!auth.user || !auth.token) {
            window.location.href = "/login";
            return;
        }

        if (isVoting) return;
        isVoting = true;

        try {
            // If user already voted with same value, remove vote
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
                    variables: shouldRemove
                        ? { postId: post.id }
                        : { postId: post.id, value },
                }),
            });

            const result = await response.json();
            if (result.errors) throw new Error(result.errors[0].message);

            // Update the post with new vote data
            const updatedPost = shouldRemove ? result.data.removeVote : result.data.votePost;
            post.voteScore = updatedPost.voteScore;
            post.upvotes = updatedPost.upvotes;
            post.downvotes = updatedPost.downvotes;
            post.userVote = updatedPost.userVote;

            if (onVoteChange) onVoteChange();
        } catch (e: any) {
            toast.error(e.message || "Failed to vote");
        } finally {
            isVoting = false;
        }
    }

    function navigateToPost() {
        goto(`/post/${post.id}`);
    }

    function handleCardClick(e: MouseEvent) {
        // Don't navigate if clicking on interactive elements
        const target = e.target as HTMLElement;
        if (target.closest('button') || target.closest('a')) {
            return;
        }
        navigateToPost();
    }

    const postTypeBadge = $derived(getPostTypeBadge(post.postType));
</script>

<div
    class="bg-white border border-gray-300 rounded-md hover:border-gray-400 transition-colors cursor-pointer mb-4 overflow-hidden"
    onclick={handleCardClick}
    role="article"
>
    <div class="flex">
        <!-- Vote Column -->
        <div
            class="w-10 bg-gray-50/50 flex flex-col items-center py-2 gap-1 border-r border-gray-100"
        >
            <button
                onclick={(e) => handleVote(1, e)}
                class="hover:bg-gray-200 rounded p-1 transition-colors disabled:opacity-50"
                class:text-orange-500={post.userVote === 1}
                class:text-gray-400={post.userVote !== 1}
                disabled={isVoting}
                aria-label="Upvote"
            >
                <svg
                    class="w-6 h-6"
                    fill={post.userVote === 1 ? "currentColor" : "none"}
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    ><path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M5 15l7-7 7 7"
                    ></path></svg
                >
            </button>
            <span class="text-sm font-bold" class:text-orange-500={post.voteScore > 0} class:text-indigo-500={post.voteScore < 0} class:text-gray-700={post.voteScore === 0}>
                {post.voteScore ?? 0}
            </span>
            <button
                onclick={(e) => handleVote(-1, e)}
                class="hover:bg-gray-200 rounded p-1 transition-colors disabled:opacity-50"
                class:text-indigo-500={post.userVote === -1}
                class:text-gray-400={post.userVote !== -1}
                disabled={isVoting}
                aria-label="Downvote"
            >
                <svg
                    class="w-6 h-6"
                    fill={post.userVote === -1 ? "currentColor" : "none"}
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    ><path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M19 9l-7 7-7-7"
                    ></path></svg
                >
            </button>
        </div>

        <!-- Content Column -->
        <div class="p-2 pb-1 flex-1">
            <!-- Meta Header -->
            <div class="flex items-center text-xs text-gray-500 mb-2 gap-1 flex-wrap">
                <span class="{postTypeBadge.class} px-1.5 rounded-full border">
                    {postTypeBadge.label}
                </span>
                {#if post.pet}
                    {#if post.pet.status === "Adopted"}
                        <span class="bg-green-100 text-green-700 px-1.5 rounded-full border border-green-200">
                            Adopted
                        </span>
                    {:else}
                        <span class="bg-indigo-100 text-indigo-700 px-1.5 rounded-full border border-indigo-200">
                            Available
                        </span>
                    {/if}
                {/if}
                {#if post.author}
                    <a
                        href="/user/{post.author.id}"
                        onclick={(e) => e.stopPropagation()}
                        class="flex items-center gap-1.5 hover:opacity-80 transition-opacity"
                    >
                        {#if post.author.profilePicture}
                            <img src={post.author.profilePicture} alt={post.author.name} class="w-5 h-5 rounded-full object-cover" />
                        {:else}
                            <span class="w-5 h-5 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold">
                                {post.author.name[0].toUpperCase()}
                            </span>
                        {/if}
                        <span class="hover:underline font-semibold text-gray-700">
                            u/{post.author.name}
                        </span>
                    </a>
                {:else}
                    <span class="text-gray-500">Unknown</span>
                {/if}
                <span>•</span>
                <span>{formatDate(post.createdAt)}</span>
                {#if post.location}
                    <span>•</span>
                    <span class="flex items-center">
                        <svg class="w-3 h-3 mr-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
                        </svg>
                        {post.location}
                    </span>
                {/if}
            </div>

            <!-- Title -->
            <h3 class="text-lg font-medium text-gray-900 mb-2 leading-snug hover:text-indigo-600 transition-colors">
                {post.title}
            </h3>

            <!-- Post Images (if any) -->
            {#if post.images && post.images.length > 0}
                <div class="mb-3">
                    {#if post.images.length === 1}
                        <img
                            src={post.images[0]}
                            alt="Post image"
                            class="w-full max-h-96 object-cover rounded-lg border border-gray-200 select-none pointer-events-none"
                            draggable="false"
                            oncontextmenu={(e) => e.preventDefault()}
                        />
                    {:else}
                        <div class="grid grid-cols-2 gap-2">
                            {#each post.images.slice(0, 4) as image, i}
                                <div class="relative">
                                    <img
                                        src={image}
                                        alt="Post image {i + 1}"
                                        class="w-full h-40 object-cover rounded-lg border border-gray-200 select-none pointer-events-none"
                                        draggable="false"
                                        oncontextmenu={(e) => e.preventDefault()}
                                    />
                                    {#if i === 3 && post.images.length > 4}
                                        <div class="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center">
                                            <span class="text-white font-bold text-lg">+{post.images.length - 4}</span>
                                        </div>
                                    {/if}
                                </div>
                            {/each}
                        </div>
                    {/if}
                </div>
            {/if}

            <!-- Post Video (if any) -->
            {#if post.video}
                <div class="mb-3" onclick={(e) => e.stopPropagation()}>
                    <VideoPlayer src={post.video} compact={true} class="border border-gray-200" />
                </div>
            {/if}

            <!-- Tags (if any) -->
            {#if post.tags && post.tags.length > 0}
                <div class="flex flex-wrap gap-1 mb-2">
                    {#each post.tags as tag}
                        <span class="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                            #{tag}
                        </span>
                    {/each}
                </div>
            {/if}

            <!-- Pet Info (only if post has a pet) -->
            {#if post.pet}
                <div class="mb-3">
                    <div class="bg-gray-100 rounded-lg p-3 border border-gray-200 flex gap-4">
                        <!-- Pet Image -->
                        <div class="w-24 h-24 bg-gray-200 rounded-md flex-shrink-0 flex items-center justify-center text-gray-400 overflow-hidden">
                            {#if post.pet.coverImage}
                                <img
                                    src={post.pet.coverImage}
                                    alt={post.pet.name}
                                    class="w-full h-full object-cover select-none"
                                    draggable="false"
                                    oncontextmenu={(e) => e.preventDefault()}
                                />
                            {:else}
                                <svg class="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                                </svg>
                            {/if}
                        </div>
                        <div>
                            <h4 class="font-bold text-gray-800">
                                {post.pet.name}
                                <span class="font-normal text-gray-500 text-sm">
                                    ({post.pet.species?.label || post.pet.customSpecies || "Unknown"})
                                </span>
                            </h4>
                            <p class="text-sm text-gray-600 mt-1 line-clamp-2">
                                {post.pet.description || "No description provided."}
                            </p>
                            <div class="flex gap-2 mt-2 text-xs font-medium">
                                <span class="bg-gray-200 text-gray-700 px-2 py-0.5 rounded">
                                    {post.pet.breed?.name || post.pet.customBreed || "Mixed"}
                                </span>
                                <span class="bg-gray-200 text-gray-700 px-2 py-0.5 rounded">
                                    {post.pet.age ? `${post.pet.age} yrs` : "Age N/A"}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            {:else}
                <!-- Post Description for general posts -->
                <p class="text-gray-600 text-sm mb-3 line-clamp-3">
                    {post.description}
                </p>
            {/if}

            <!-- Actions Bar -->
            <div class="flex items-center gap-1 text-gray-500 font-bold text-xs mt-1">
                <div class="flex items-center gap-1.5 p-2 rounded group">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
                    </svg>
                    <span>{post.commentCount ?? 0} Comments</span>
                </div>
                <button
                    onclick={(e) => { e.stopPropagation(); alert('Share feature coming soon!'); }}
                    class="flex items-center gap-1.5 hover:bg-gray-200 p-2 rounded transition-colors group"
                >
                    <svg class="w-5 h-5 group-hover:text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"></path>
                    </svg>
                    <span class="group-hover:text-indigo-600">Share</span>
                </button>

                <!-- Adopt button for adoption posts -->
                {#if post.pet && post.postType === 'adopt'}
                    <button
                        onclick={(e) => {
                            e.stopPropagation();
                            if (!auth.user) {
                                window.location.href = "/login";
                            } else {
                                alert("Contact feature coming soon!");
                            }
                        }}
                        class="ml-auto flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-full transition-colors shadow-sm"
                        aria-label="Adopt this pet"
                    >
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path>
                        </svg>
                        Adopt
                    </button>
                {/if}
            </div>
        </div>
    </div>
</div>
