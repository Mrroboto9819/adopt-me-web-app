<script lang="ts">
    import { auth } from "$lib/stores/auth.svelte";
    import { toast } from "$lib/stores/toast.svelte";
    import { goto } from "$app/navigation";
    import { Heart, MessageCircle, Share2, Bookmark, MoreHorizontal, MapPin, Flag, Mail, Phone, BadgeCheck, Pencil, Trash2 } from "lucide-svelte";
    import VideoPlayer from "./VideoPlayer.svelte";
    import ReportPostModal from "./ReportPostModal.svelte";
    import EditPostModal from "./EditPostModal.svelte";
    import DeletePostModal from "./DeletePostModal.svelte";
    import { _ } from "$lib/i18n";

    // Props for the post
    let { post, onVoteChange, onPostUpdated, onPostDeleted } = $props<{
        post: any;
        onVoteChange?: () => void;
        onPostUpdated?: (updatedPost: any) => void;
        onPostDeleted?: () => void;
    }>();

    let isVoting = $state(false);
    let isSaving = $state(false);
    let showReportModal = $state(false);
    let showEditModal = $state(false);
    let showDeleteModal = $state(false);
    let showMoreMenu = $state(false);
    let isSaved = $state(false);

    // Check if current user is the owner
    const isOwner = $derived(auth.user && post.author && post.author.id === auth.user.id);

    // Sync isSaved with post.isSaved when it changes
    $effect(() => {
        isSaved = post.isSaved ?? false;
    });

    // Format date relative
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

    // Get post type badge
    function getPostTypeBadge(postType: string, reportType?: string) {
        switch (postType) {
            case 'adopt':
                return { label: $_("post.adoption"), class: 'bg-green-500 text-white' };
            case 'missing':
                if (reportType === 'lost') {
                    return { label: $_("post.lost_pet"), class: 'bg-red-500 text-white' };
                }
                if (reportType === 'found') {
                    return { label: $_("post.found_pet"), class: 'bg-orange-500 text-white' };
                }
                return { label: $_("post.missing_pet"), class: 'bg-red-500 text-white' };
            default:
                return { label: $_("post.general_post"), class: 'bg-indigo-500 text-white' };
        }
    }

    async function handleLike(e: Event) {
        e.stopPropagation();

        if (!auth.user || !auth.token) {
            window.location.href = "/login";
            return;
        }

        if (isVoting) return;
        isVoting = true;

        try {
            // Toggle like (1 for like, remove if already liked)
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
                    variables: shouldRemove
                        ? { postId: post.id }
                        : { postId: post.id, value: 1 },
                }),
            });

            const result = await response.json();
            if (result.errors) throw new Error(result.errors[0].message);

            const updatedPost = shouldRemove ? result.data.removeVote : result.data.votePost;
            post.voteScore = updatedPost.voteScore;
            post.upvotes = updatedPost.upvotes;
            post.downvotes = updatedPost.downvotes;
            post.userVote = updatedPost.userVote;

            if (onVoteChange) onVoteChange();
        } catch (e: any) {
            toast.error(e.message || $_("common.failed_vote"));
        } finally {
            isVoting = false;
        }
    }

    function navigateToPost() {
        goto(`/post/${post.id}`);
    }

    function handleCardClick(e: MouseEvent) {
        const target = e.target as HTMLElement;
        if (target.closest('button') || target.closest('a')) {
            return;
        }
        navigateToPost();
    }

    function handleShare(e: Event) {
        e.stopPropagation();
        const url = `${window.location.origin}/post/${post.id}`;
        if (navigator.share) {
            navigator.share({ title: post.title, url }).catch(() => {});
        } else {
            navigator.clipboard.writeText(url).then(() => {
                toast.success($_("common.link_copied"));
            }).catch(() => {
                toast.error($_("common.copy_failed"));
            });
        }
    }

    async function handleSave(e: Event) {
        e.stopPropagation();

        if (!auth.user || !auth.token) {
            window.location.href = "/login";
            return;
        }

        if (isSaving) return;
        isSaving = true;

        const newSavedState = !isSaved;

        try {
            const mutation = newSavedState
                ? `mutation SavePost($postId: ID!) { savePost(postId: $postId) { id isSaved } }`
                : `mutation UnsavePost($postId: ID!) { unsavePost(postId: $postId) { id isSaved } }`;

            const response = await fetch("/api/graphql", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${auth.token}`,
                },
                body: JSON.stringify({
                    query: mutation,
                    variables: { postId: post.id },
                }),
            });

            const result = await response.json();
            if (result.errors) throw new Error(result.errors[0].message);

            const updatedPost = newSavedState ? result.data.savePost : result.data.unsavePost;
            isSaved = updatedPost.isSaved;
            post.isSaved = updatedPost.isSaved;
            toast.success(isSaved ? $_("post.saved") : $_("post.unsaved"));
        } catch (e: any) {
            toast.error(e.message || $_("common.failed_action"));
        } finally {
            isSaving = false;
        }
    }

    const postTypeBadge = $derived(getPostTypeBadge(post.postType, post.reportType));
    const isLiked = $derived(post.userVote === 1);
    const likeCount = $derived(post.upvotes ?? post.voteScore ?? 0);
</script>

<div
    class="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow overflow-hidden cursor-pointer"
    onclick={handleCardClick}
    onkeydown={(e) => e.key === 'Enter' && handleCardClick(e)}
    role="button"
    tabindex="0"
    aria-label={$_("post_card.view_post")}
>
    <!-- Header -->
    <div class="p-3 sm:p-4 flex items-center gap-2 sm:gap-3">
        <!-- Author Avatar -->
        <a
            href={post.author ? `/user/${post.author.id}` : '#'}
            onclick={(e) => e.stopPropagation()}
            class="flex-shrink-0"
        >
            {#if post.author?.profilePicture}
                <img
                    src={post.author.profilePicture}
                    alt={post.author.fullName}
                    class="w-9 h-9 sm:w-10 sm:h-10 rounded-full object-cover ring-2 ring-gray-100 dark:ring-gray-700"
                />
            {:else}
                <div class="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
                    {post.author?.firstName?.[0]?.toUpperCase() || '?'}
                </div>
            {/if}
        </a>

        <!-- Author Info -->
        <div class="flex-1 min-w-0">
            <a
                href={post.author ? `/user/${post.author.id}` : '#'}
                onclick={(e) => e.stopPropagation()}
                class="font-semibold text-sm sm:text-base text-gray-900 dark:text-white hover:underline truncate flex items-center gap-1 max-w-fit"
            >
                <span class="truncate">{post.author?.fullName || $_("post_card.unknown")}</span>
                {#if post.author?.emailVerified || post.author?.phoneVerified}
                    <span title={$_("common.verified")} class="flex-shrink-0">
                        <BadgeCheck class="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-500" />
                    </span>
                {/if}
            </a>
            <div class="flex items-center gap-1.5 sm:gap-2 text-[11px] sm:text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                <span class="{postTypeBadge.class} text-[9px] sm:text-[10px] font-bold px-1.5 sm:px-2 py-0.5 rounded-full whitespace-nowrap">
                    {postTypeBadge.label}
                </span>
                <span>•</span>
                <span>{formatRelativeTime(post.createdAt)}</span>
                {#if post.location}
                    <span>•</span>
                    <span class="flex items-center gap-0.5 truncate max-w-[100px] sm:max-w-none">
                        <MapPin class="w-3 h-3 flex-shrink-0" />
                        <span class="truncate">{post.location}</span>
                    </span>
                {/if}
            </div>
        </div>

        <!-- More Options -->
        <div class="relative">
            <button
                onclick={(e) => { e.stopPropagation(); showMoreMenu = !showMoreMenu; }}
                class="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
            >
                <MoreHorizontal class="w-5 h-5 text-gray-500 dark:text-gray-400" />
            </button>

            {#if showMoreMenu}
                <div class="absolute right-0 top-full mt-1 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-10 min-w-[140px]">
                    {#if isOwner}
                        <button
                            onclick={(e) => { e.stopPropagation(); showMoreMenu = false; showEditModal = true; }}
                            class="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                        >
                            <Pencil class="w-4 h-4" />
                            {$_("common.edit")}
                        </button>
                        <button
                            onclick={(e) => { e.stopPropagation(); showMoreMenu = false; showDeleteModal = true; }}
                            class="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                        >
                            <Trash2 class="w-4 h-4" />
                            {$_("common.delete")}
                        </button>
                    {:else if auth.user && post.author}
                        <button
                            onclick={(e) => { e.stopPropagation(); showMoreMenu = false; showReportModal = true; }}
                            class="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                        >
                            <Flag class="w-4 h-4" />
                            {$_("common.report")}
                        </button>
                    {/if}
                    <button
                        onclick={(e) => { e.stopPropagation(); showMoreMenu = false; handleShare(e); }}
                        class="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                        <Share2 class="w-4 h-4" />
                        {$_("common.share")}
                    </button>
                </div>
                <button
                    onclick={(e) => { e.stopPropagation(); showMoreMenu = false; }}
                    class="fixed inset-0 z-[5]"
                    aria-label="Close menu"
                ></button>
            {/if}
        </div>
    </div>

    <!-- Content -->
    <div class="px-3 sm:px-4 pb-2 sm:pb-3">
        <!-- Title -->
        <h3 class="text-sm sm:text-base font-semibold text-gray-900 dark:text-white mb-1.5 sm:mb-2 leading-snug">
            {post.title}
        </h3>

        <!-- Description -->
        {#if post.description}
            <div class="text-gray-700 dark:text-gray-300 text-xs sm:text-sm mb-2 sm:mb-3 line-clamp-3 prose prose-sm dark:prose-invert max-w-none prose-p:my-1">
                {@html post.description}
            </div>
        {/if}

        <!-- Tags -->
        {#if post.tags && post.tags.length > 0}
            <div class="flex flex-wrap gap-1 sm:gap-1.5 mb-2 sm:mb-3">
                {#each post.tags.slice(0, 4) as tag}
                    <span class="text-[11px] sm:text-xs text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer">
                        #{tag}
                    </span>
                {/each}
                {#if post.tags.length > 4}
                    <span class="text-[11px] sm:text-xs text-gray-400">+{post.tags.length - 4}</span>
                {/if}
            </div>
        {/if}
    </div>

    <!-- Media (Images/Video) -->
    {#if post.images && post.images.length > 0}
        <div class="relative">
            {#if post.images.length === 1}
                <img
                    src={post.images[0]}
                    alt="Post image"
                    class="w-full aspect-[16/10] object-cover select-none"
                    draggable="false"
                    oncontextmenu={(e) => e.preventDefault()}
                />
            {:else if post.images.length === 2}
                <div class="grid grid-cols-2 gap-0.5">
                    {#each post.images.slice(0, 2) as image, i}
                        <img
                            src={image}
                            alt="Post image {i + 1}"
                            class="w-full aspect-square object-cover select-none"
                            draggable="false"
                            oncontextmenu={(e) => e.preventDefault()}
                        />
                    {/each}
                </div>
            {:else if post.images.length === 3}
                <div class="grid grid-cols-2 gap-0.5">
                    <img
                        src={post.images[0]}
                        alt="Post image 1"
                        class="w-full aspect-square object-cover select-none row-span-2"
                        draggable="false"
                        oncontextmenu={(e) => e.preventDefault()}
                    />
                    <div class="grid grid-rows-2 gap-0.5">
                        {#each post.images.slice(1, 3) as image, i}
                            <img
                                src={image}
                                alt="Post image {i + 2}"
                                class="w-full h-full object-cover select-none"
                                draggable="false"
                                oncontextmenu={(e) => e.preventDefault()}
                            />
                        {/each}
                    </div>
                </div>
            {:else}
                <div class="grid grid-cols-2 gap-0.5">
                    {#each post.images.slice(0, 4) as image, i}
                        <div class="relative">
                            <img
                                src={image}
                                alt="Post image {i + 1}"
                                class="w-full aspect-square object-cover select-none"
                                draggable="false"
                                oncontextmenu={(e) => e.preventDefault()}
                            />
                            {#if i === 3 && post.images.length > 4}
                                <div class="absolute inset-0 bg-black/60 flex items-center justify-center">
                                    <span class="text-white font-bold text-2xl">+{post.images.length - 4}</span>
                                </div>
                            {/if}
                        </div>
                    {/each}
                </div>
            {/if}
        </div>
    {/if}

    {#if post.video}
        <div onclick={(e) => e.stopPropagation()}>
            <VideoPlayer src={post.video} compact={true} />
        </div>
    {/if}

    <!-- Pet Cards (if adoption/missing post) -->
    {#if post.pets?.length > 0}
        <div class="mx-3 sm:mx-4 my-2 sm:my-3 space-y-2">
            {#each post.pets as pet}
                <div class="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700/50 dark:to-gray-700/30 rounded-xl p-2.5 sm:p-3 border border-gray-200 dark:border-gray-600">
                    <div class="flex gap-2.5 sm:gap-3">
                        <!-- Pet Image -->
                        <div class="w-14 h-14 sm:w-16 sm:h-16 rounded-lg overflow-hidden flex-shrink-0 bg-gray-200 dark:bg-gray-600">
                            {#if pet.coverImage}
                                <img
                                    src={pet.coverImage}
                                    alt={pet.name}
                                    class="w-full h-full object-cover"
                                    draggable="false"
                                />
                            {:else}
                                <div class="w-full h-full flex items-center justify-center text-xl sm:text-2xl">🐾</div>
                            {/if}
                        </div>
                        <!-- Pet Info -->
                        <div class="flex-1 min-w-0">
                            <div class="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                                <h4 class="font-bold text-sm sm:text-base text-gray-900 dark:text-white truncate max-w-[120px] sm:max-w-none">{pet.name}</h4>
                                {#if pet.status === "Adopted"}
                                    <span class="text-[9px] sm:text-[10px] font-bold bg-green-500 text-white px-1.5 py-0.5 rounded-full">
                                        {$_("post_card.adopted")}
                                    </span>
                                {/if}
                            </div>
                            <p class="text-[11px] sm:text-xs text-gray-600 dark:text-gray-400 truncate">
                                {pet.species?.label || pet.customSpecies || $_("post_card.unknown")} • {pet.breed?.name || pet.customBreed || $_("post_card.mixed")}
                            </p>
                            <div class="flex gap-1.5 sm:gap-2 mt-1 sm:mt-1.5 flex-wrap">
                                {#if pet.age}
                                    <span class="text-[9px] sm:text-[10px] bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 px-1.5 sm:px-2 py-0.5 rounded-full font-medium">
                                        {pet.age} {$_("post_card.yrs")}
                                    </span>
                                {/if}
                                {#if pet.gender}
                                    <span class="text-[9px] sm:text-[10px] bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 px-1.5 sm:px-2 py-0.5 rounded-full font-medium">
                                        {pet.gender}
                                    </span>
                                {/if}
                            </div>
                        </div>
                    </div>
                </div>
            {/each}
        </div>
    {/if}

    <!-- Contact Info (for adopt/missing posts) -->
    {#if (post.postType === 'adopt' || post.postType === 'missing') && post.preferredContact}
        <div class="mx-3 sm:mx-4 my-2 sm:my-3">
            <div class="flex items-center gap-2.5 sm:gap-3 p-2.5 sm:p-3 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-xl border border-indigo-100 dark:border-indigo-800/50">
                {#if post.preferredContact === 'email' && post.contactEmail}
                    <div class="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center flex-shrink-0">
                        <Mail class="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div class="flex-1 min-w-0">
                        <p class="text-[11px] sm:text-xs text-gray-500 dark:text-gray-400 font-medium">{$_("post.contact_via_email")}</p>
                        <a
                            href="mailto:{post.contactEmail}"
                            onclick={(e) => e.stopPropagation()}
                            class="text-xs sm:text-sm font-semibold text-indigo-600 dark:text-indigo-400 hover:underline truncate block"
                        >
                            {post.contactEmail}
                        </a>
                    </div>
                {:else if post.preferredContact === 'phone' && post.contactPhone}
                    <div class="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-green-100 dark:bg-green-900/50 flex items-center justify-center flex-shrink-0">
                        <Phone class="w-4 h-4 sm:w-5 sm:h-5 text-green-600 dark:text-green-400" />
                    </div>
                    <div class="flex-1 min-w-0">
                        <p class="text-[11px] sm:text-xs text-gray-500 dark:text-gray-400 font-medium">{$_("post.contact_via_phone")}</p>
                        <a
                            href="tel:{post.contactPhoneCountryCode ? `+${post.contactPhoneCountryCode}` : ''}{post.contactPhone}"
                            onclick={(e) => e.stopPropagation()}
                            class="text-xs sm:text-sm font-semibold text-green-600 dark:text-green-400 hover:underline truncate block"
                        >
                            {#if post.contactPhoneCountryCode}+{post.contactPhoneCountryCode} {/if}{post.contactPhone}
                        </a>
                    </div>
                {/if}
            </div>
        </div>
    {/if}

    <!-- Actions Bar -->
    <div class="px-2 sm:px-4 py-2 sm:py-3 border-t border-gray-100 dark:border-gray-700">
        <div class="flex items-center justify-between">
            <!-- Left Actions -->
            <div class="flex items-center gap-0.5 sm:gap-1">
                <!-- Like Button -->
                <button
                    onclick={handleLike}
                    disabled={isVoting}
                    class="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 sm:py-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 group"
                >
                    <Heart
                        class="w-5 h-5 transition-all {isLiked ? 'text-red-500 fill-red-500 scale-110' : 'text-gray-500 dark:text-gray-400 group-hover:text-red-500'}"
                    />
                    {#if likeCount > 0}
                        <span class="text-xs sm:text-sm font-medium {isLiked ? 'text-red-500' : 'text-gray-600 dark:text-gray-400'}">
                            {likeCount}
                        </span>
                    {/if}
                </button>

                <!-- Comment Button -->
                <button
                    onclick={(e) => { e.stopPropagation(); navigateToPost(); }}
                    class="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 sm:py-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors group"
                >
                    <MessageCircle class="w-5 h-5 text-gray-500 dark:text-gray-400 group-hover:text-indigo-500" />
                    {#if (post.commentCount ?? 0) > 0}
                        <span class="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">{post.commentCount}</span>
                    {/if}
                </button>

                <!-- Share Button -->
                <button
                    onclick={handleShare}
                    class="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 sm:py-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors group"
                >
                    <Share2 class="w-5 h-5 text-gray-500 dark:text-gray-400 group-hover:text-indigo-500" />
                </button>
            </div>

            <!-- Right Actions -->
            <div class="flex items-center gap-0.5 sm:gap-1">
                <!-- Report Button (hidden on mobile to save space, available in more menu) -->
                {#if auth.user && post.author && post.author.id !== auth.user.id}
                    <button
                        onclick={(e) => { e.stopPropagation(); showReportModal = true; }}
                        class="hidden sm:flex items-center gap-1.5 px-2 sm:px-3 py-1.5 sm:py-2 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors group"
                        title={$_("common.report")}
                    >
                        <Flag class="w-5 h-5 text-gray-500 dark:text-gray-400 group-hover:text-red-500" />
                    </button>
                {/if}

                <!-- Save Button -->
                <button
                    onclick={handleSave}
                    disabled={isSaving}
                    class="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 sm:py-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors group disabled:opacity-50"
                >
                    <Bookmark
                        class="w-5 h-5 transition-all {isSaved ? 'text-indigo-500 fill-indigo-500' : 'text-gray-500 dark:text-gray-400 group-hover:text-indigo-500'}"
                    />
                </button>

                <!-- Adopt Button (for adoption posts) -->
                {#if post.pets?.length > 0 && post.postType === 'adopt' && post.pets.some((p: any) => p.status !== "Adopted")}
                    <button
                        onclick={(e) => {
                            e.stopPropagation();
                            if (!auth.user) {
                                window.location.href = "/login";
                            } else {
                                navigateToPost();
                            }
                        }}
                        class="flex items-center gap-1 sm:gap-1.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white text-[11px] sm:text-sm font-semibold px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-full transition-all shadow-sm hover:shadow-md active:scale-95"
                    >
                        <Heart class="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        {$_("common.adopt")}
                    </button>
                {/if}
            </div>
        </div>
    </div>
</div>

<!-- Report Modal -->
<ReportPostModal
    bind:open={showReportModal}
    postId={post.id}
    onClose={() => showReportModal = false}
/>

<!-- Edit Modal -->
<EditPostModal
    bind:open={showEditModal}
    {post}
    onClose={() => showEditModal = false}
    onPostUpdated={(updatedPost) => {
        showEditModal = false;
        if (onPostUpdated) onPostUpdated(updatedPost);
    }}
/>

<!-- Delete Modal -->
<DeletePostModal
    bind:open={showDeleteModal}
    {post}
    onClose={() => showDeleteModal = false}
    onPostDeleted={() => {
        showDeleteModal = false;
        if (onPostDeleted) onPostDeleted();
    }}
/>
