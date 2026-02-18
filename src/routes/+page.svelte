<script lang="ts">
    import { auth } from "$lib/stores/auth.svelte";
    import PostCard from "$lib/components/PostCard.svelte";
    import PostCardSkeleton from "$lib/components/PostCardSkeleton.svelte";
    import CreatePostModal from "$lib/components/CreatePostModal.svelte";
    import SEO from "$lib/components/SEO.svelte";
    import StructuredData from "$lib/components/StructuredData.svelte";
    import AdSlot from "$lib/components/AdSlot.svelte";
    import { onMount } from "svelte";
    import { fade } from "svelte/transition";
    import { _ } from "$lib/i18n";
    import { page } from "$app/stores";
    import { goto } from "$app/navigation";
    import gsap from "gsap";

    import {
        Home,
        TrendingUp,
        Dog,
        Cat,
        Bird,
        Rabbit,
        Fish,
        Plus,
        PawPrint,
        Clock,
        LayoutList,
        Search,
        FileText,
        XCircle,
    } from "lucide-svelte";

    let posts = $state<any[]>([]);
    let loading = $state(true);
    let loadingMore = $state(false);
    let isRefreshing = $state(false);
    let error = $state("");
    let hasMore = $state(true);
    let endCursor = $state<string | null>(null);
    let observerTarget = $state<HTMLElement | null>(null);
    let showCreateModal = $state(false);
    let lastUpdated = $state<Date | null>(null);

    // Element refs for GSAP animations
    let leftSidebarEl: HTMLDivElement | null = $state(null);
    let rightSidebarEl: HTMLDivElement | null = $state(null);
    let feedHeaderEl: HTMLDivElement | null = $state(null);
    let hasAnimated = $state(false);

    // Filter state
    let speciesList = $state<any[]>([]);
    let selectedSpeciesId = $state<string | null>(null);
    let selectedPostType = $state<string | null>(null);
    let sortBy = $state<"popular" | "recent">("popular");
    let searchQuery = $state<string>("");

    // Watch for URL search parameter changes
    $effect(() => {
        const urlSearch = $page.url.searchParams.get("search");
        const newSearch = urlSearch || "";
        if (newSearch !== searchQuery) {
            searchQuery = newSearch;
            // Trigger refresh when search changes
            if (!loading) {
                refreshFeed();
            }
        }
    });

    function clearSearch() {
        goto("/");
    }

    // Fetch species for filter buttons
    async function fetchSpecies() {
        try {
            const response = await fetch("/api/graphql", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    query: `query { species { id name label } }`,
                }),
            });
            const result = await response.json();
            if (result.data?.species) {
                speciesList = result.data.species;
            }
        } catch (e) {
            console.error("Failed to fetch species:", e);
        }
    }

    // Handle filter change
    function setSpeciesFilter(speciesId: string | null) {
        selectedSpeciesId = speciesId;
        refreshFeed();
    }

    function setPostTypeFilter(postType: string | null) {
        selectedPostType = postType;
        refreshFeed();
    }

    function setSortBy(sort: "popular" | "recent") {
        sortBy = sort;
        refreshFeed();
    }

    // Fetch posts function (reusable for initial load and pagination)
    async function fetchPosts(cursor: string | null = null) {
        try {
            error = "";
            const response = await fetch("/api/graphql", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    ...(auth.token
                        ? { Authorization: `Bearer ${auth.token}` }
                        : {}),
                },
                body: JSON.stringify({
                    query: `
            query GetPostsFeed($first: Int, $after: String, $speciesId: ID, $postType: PostType, $sortBy: String, $search: String) {
              postsFeed(first: $first, after: $after, speciesId: $speciesId, postType: $postType, sortBy: $sortBy, search: $search) {
                edges {
                  cursor
                  node {
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
                    isSaved
                    commentCount
                    author {
                      id
                      firstName
                      lastName
                      secondLastName
                      fullName
                      profilePicture
                      emailVerified
                      phoneVerified
                    }
                    pet {
                      name
                      species {
                        id
                        label
                        name
                      }
                      customSpecies
                      breed {
                        name
                      }
                      customBreed
                      age
                      description
                      status
                      coverImage
                    }
                    pets {
                      id
                      name
                      species { id label name }
                      customSpecies
                      breed { name }
                      customBreed
                      age
                      gender
                      description
                      status
                      coverImage
                    }
                  }
                }
                pageInfo {
                  hasNextPage
                  endCursor
                }
                totalCount
              }
            }
          `,
                    variables: {
                        first: 3,
                        after: cursor,
                        speciesId: selectedSpeciesId || null,
                        postType: selectedPostType || null,
                        sortBy: sortBy,
                        search: searchQuery || null,
                    },
                }),
            });

            const result = await response.json();
            if (result.errors) throw new Error(result.errors[0].message);

            const { edges, pageInfo } = result.data.postsFeed;

            // Append new posts (with deduplication to prevent duplicate key errors)
            const newPosts = edges.map((edge: any) => edge.node);
            if (cursor) {
                // Filter out any posts that already exist
                const existingIds = new Set(posts.map((p: any) => p.id));
                const uniqueNewPosts = newPosts.filter(
                    (p: any) => !existingIds.has(p.id),
                );
                posts = [...posts, ...uniqueNewPosts];
            } else {
                posts = newPosts;
            }

            hasMore = pageInfo.hasNextPage;
            endCursor = pageInfo.endCursor;
            lastUpdated = new Date();
        } catch (e: any) {
            error = e.message;
        }
    }

    // Load more posts
    async function loadMore() {
        if (loadingMore || !hasMore) return;

        loadingMore = true;
        await fetchPosts(endCursor);
        loadingMore = false;
    }

    // Refresh feed (after creating post)
    // If a new post is provided, prepend it to show immediately at the top
    async function refreshFeed(newPost?: any) {
        if (isRefreshing) return;
        isRefreshing = true;

        // If we have a new post, prepend it immediately for instant feedback
        if (newPost) {
            // Filter out any existing post with the same ID to prevent duplicates
            posts = [newPost, ...posts.filter((p: any) => p.id !== newPost.id)];
            isRefreshing = false;
            return;
        }

        // Otherwise do a full refresh
        loading = true;
        posts = [];
        hasMore = true;
        endCursor = null;
        await fetchPosts();
        loading = false;
        isRefreshing = false;
    }

    // Initial fetch on mount
    onMount(async () => {
        await Promise.all([fetchPosts(), fetchSpecies()]);
        loading = false;

        // Run entrance animations after data loads
        if (!hasAnimated) {
            hasAnimated = true;
            runEntranceAnimations();
        }
    });

    // Subtle entrance animations following Nielsen's heuristics
    function runEntranceAnimations() {
        const tl = gsap.timeline({ defaults: { ease: "power2.out" } });

        // Animate left sidebar - slide from left
        if (leftSidebarEl) {
            const filterButtons = leftSidebarEl.querySelectorAll("button, a");
            tl.fromTo(
                leftSidebarEl,
                { opacity: 0, x: -20 },
                { opacity: 1, x: 0, duration: 0.4 },
                0
            );
            tl.fromTo(
                filterButtons,
                { opacity: 0, x: -10 },
                { opacity: 1, x: 0, duration: 0.3, stagger: 0.03 },
                0.2
            );
        }

        // Animate feed header
        if (feedHeaderEl) {
            tl.fromTo(
                feedHeaderEl,
                { opacity: 0, y: -10 },
                { opacity: 1, y: 0, duration: 0.3 },
                0.1
            );
        }

        // Animate right sidebar - slide from right
        if (rightSidebarEl) {
            tl.fromTo(
                rightSidebarEl,
                { opacity: 0, x: 20 },
                { opacity: 1, x: 0, duration: 0.4 },
                0.15
            );
        }
    }

    // Setup Intersection Observer reactively when observerTarget changes
    $effect(() => {
        if (!observerTarget) return;

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && hasMore && !loadingMore) {
                    loadMore();
                }
            },
            { threshold: 0.1 },
        );

        observer.observe(observerTarget);

        return () => {
            observer.disconnect();
        };
    });

    function formatTime(value: Date | null) {
        if (!value) return "Never";
        return value.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
        });
    }
</script>

<SEO
    title={$_("home.title")}
    description={$_("home.description")}
    keywords="pet adoption, adopt a pet, dogs for adoption, cats for adoption, animal shelter, rescue pets, adopt don't shop"
/>
<StructuredData type="WebSite" />
<StructuredData type="Organization" />

<div class="bg-gray-50 dark:bg-gray-900 min-h-[calc(100vh-3.5rem)] pt-8 pb-12 transition-colors">
    <!-- Offset for fixed navbar -->
    <div
        class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-12 gap-8"
    >
        <!-- Left Sidebar (Navigation) - Hidden on mobile, visible on medium+ -->
        <div class="hidden md:block md:col-span-3 lg:col-span-3">
            <div bind:this={leftSidebarEl} class="sticky top-24 space-y-6" style="opacity: 0;">
                <!-- Navigation Menu -->
                <div
                    class="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden p-2 transition-colors"
                >
                    <div
                        class="px-4 py-3 text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest"
                    >
                        {$_("home.sort_by")}
                    </div>
                    <button
                        onclick={() => setSortBy("popular")}
                        class="flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm mb-1 transition-colors w-full text-left {sortBy ===
                        'popular'
                            ? 'bg-indigo-50/50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 font-semibold'
                            : 'hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300'}"
                    >
                        <TrendingUp class="w-5 h-5" />
                        {$_("home.popular")}
                    </button>
                    <button
                        onclick={() => setSortBy("recent")}
                        class="flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition-colors w-full text-left {sortBy ===
                        'recent'
                            ? 'bg-indigo-50/50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 font-semibold'
                            : 'hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300'}"
                    >
                        <Clock class="w-5 h-5" />
                        {$_("home.recent")}
                    </button>
                </div>

                <!-- Species Filter -->
                <div
                    class="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden p-2 transition-colors"
                >
                    <div
                        class="px-4 py-3 text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest"
                    >
                        {$_("home.filter_species")}
                    </div>
                    <button
                        onclick={() => setSpeciesFilter(null)}
                        class="flex items-center gap-3 px-4 py-2.5 rounded-xl font-medium text-sm transition-colors w-full text-left {selectedSpeciesId ===
                        null
                            ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400'
                            : 'hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300'}"
                    >
                        <PawPrint class="w-5 h-5" />
                        {$_("home.all_species")}
                    </button>
                    {#each speciesList as species}
                        <button
                            onclick={() => setSpeciesFilter(species.id)}
                            class="flex items-center gap-3 px-4 py-2.5 rounded-xl font-medium text-sm transition-colors w-full text-left {selectedSpeciesId ===
                            species.id
                                ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400'
                                : 'hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300'}"
                        >
                            {#if species.name === "dog"}
                                <Dog class="w-5 h-5" />
                            {:else if species.name === "cat"}
                                <Cat class="w-5 h-5" />
                            {:else if species.name === "bird"}
                                <Bird class="w-5 h-5" />
                            {:else if species.name === "rabbit"}
                                <Rabbit class="w-5 h-5" />
                            {:else}
                                <Fish class="w-5 h-5" />
                            {/if}
                            {species.label}
                        </button>
                    {/each}
                </div>

                <!-- Post Type Filter -->
                <div
                    class="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden p-2 transition-colors"
                >
                    <div
                        class="px-4 py-3 text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest"
                    >
                        {$_("home.post_type")}
                    </div>
                    <button
                        onclick={() => setPostTypeFilter(null)}
                        class="flex items-center gap-3 px-4 py-2.5 rounded-xl font-medium text-sm transition-colors w-full text-left {selectedPostType ===
                        null
                            ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400'
                            : 'hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300'}"
                    >
                        <LayoutList class="w-4 h-4" /> {$_("home.all_posts")}
                    </button>
                    <button
                        onclick={() => setPostTypeFilter("adopt")}
                        class="flex items-center gap-3 px-4 py-2.5 rounded-xl font-medium text-sm transition-colors w-full text-left {selectedPostType ===
                        'adopt'
                            ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400'
                            : 'hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300'}"
                    >
                        <Home class="w-4 h-4" /> {$_("home.adoptions")}
                    </button>
                    <button
                        onclick={() => setPostTypeFilter("missing")}
                        class="flex items-center gap-3 px-4 py-2.5 rounded-xl font-medium text-sm transition-colors w-full text-left {selectedPostType ===
                        'missing'
                            ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400'
                            : 'hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300'}"
                    >
                        <Search class="w-4 h-4" /> {$_("home.missing_pets")}
                    </button>
                    <button
                        onclick={() => setPostTypeFilter("post")}
                        class="flex items-center gap-3 px-4 py-2.5 rounded-xl font-medium text-sm transition-colors w-full text-left {selectedPostType ===
                        'post'
                            ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400'
                            : 'hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300'}"
                    >
                        <FileText class="w-4 h-4" /> {$_("home.general_posts")}
                    </button>
                </div>

                <!-- Left Sidebar Ad -->
                <AdSlot format="rectangle" slot="left-sidebar-1" />
            </div>
        </div>

        <!-- Center Feed (Posts) -->
        <div class="md:col-span-9 lg:col-span-6 space-y-6">
            <div bind:this={feedHeaderEl} class="flex items-center justify-between" style="opacity: 0;">
                <div>
                    <h1 class="text-xl font-bold text-gray-900 dark:text-white">{$_("home.feed_title")}</h1>
                    <p class="text-xs text-gray-500 dark:text-gray-400">
                        {loading
                            ? $_("home.loading_feed")
                            : isRefreshing
                              ? $_("home.refreshing")
                              : $_("home.updated_at", { values: { time: formatTime(lastUpdated) } })}
                    </p>
                </div>
            </div>

            <!-- Active Search Indicator -->
            {#if searchQuery}
                <div
                    class="flex items-center justify-between bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-200 dark:border-indigo-800 rounded-xl px-4 py-3"
                >
                    <div class="flex items-center gap-3">
                        <Search class="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                        <div>
                            <p class="text-sm font-medium text-indigo-900 dark:text-indigo-100">
                                {$_("home.search_results_for")}
                            </p>
                            <p class="text-xs text-indigo-600 dark:text-indigo-400 font-semibold">
                                "{searchQuery}"
                            </p>
                        </div>
                    </div>
                    <button
                        onclick={clearSearch}
                        class="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-800/50 rounded-lg transition-colors"
                    >
                        <XCircle class="w-4 h-4" />
                        {$_("home.clear_search")}
                    </button>
                </div>
            {/if}

            <!-- Create Post Input -->
            {#if auth.user}
                <button
                    onclick={() => (showCreateModal = true)}
                    class="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-200/60 dark:border-gray-700 shadow-sm flex items-center gap-4 w-full hover:shadow-md hover:border-indigo-200 dark:hover:border-indigo-600 transition-all duration-300 group"
                >
                    <div
                        class="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold shadow-md overflow-hidden"
                    >
                        {#if auth.user.profilePicture}
                            <img
                                src={auth.user.profilePicture}
                                alt={auth.user.fullName}
                                class="w-full h-full object-cover"
                            />
                        {:else}
                            {auth.user.firstName?.[0]?.toUpperCase() || '?'}
                        {/if}
                    </div>
                    <div
                        class="flex-1 bg-gray-50 dark:bg-gray-700 border border-gray-200/80 dark:border-gray-600 rounded-xl py-2.5 px-4 text-sm text-gray-500 dark:text-gray-300 text-left group-hover:bg-white dark:group-hover:bg-gray-600 transition-colors"
                    >
                        {$_("home.what_share")}
                    </div>
                    <div
                        class="p-2 bg-indigo-50 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 rounded-full group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900 transition-colors"
                    >
                        <Plus class="w-5 h-5" />
                    </div>
                </button>
            {/if}

            <!-- Feed Content -->
            {#if loading}
                <div class="space-y-6">
                    {#each [1, 2, 3] as _}
                        <PostCardSkeleton />
                    {/each}
                </div>
            {:else if error}
                <div
                    class="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-6 rounded-2xl border border-red-100 dark:border-red-800 text-center shadow-sm"
                >
                    <p class="font-medium">{error}</p>
                    <button
                        onclick={refreshFeed}
                        class="mt-4 px-4 py-2 text-sm font-semibold text-white bg-red-600 rounded-lg hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-600"
                    >
                        {$_("home.try_again")}
                    </button>
                </div>
            {:else if posts.length === 0}
                <div
                    class="bg-white dark:bg-gray-800 p-12 rounded-3xl border border-gray-200 dark:border-gray-700 text-center text-gray-500 dark:text-gray-400 shadow-sm"
                >
                    <div
                        class="mx-auto w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4"
                    >
                        {#if searchQuery}
                            <Search class="w-8 h-8 text-gray-400 dark:text-gray-500" />
                        {:else}
                            <PawPrint class="w-8 h-8 text-gray-400 dark:text-gray-500" />
                        {/if}
                    </div>
                    <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-2">
                        {searchQuery ? $_("home.no_search_results") : $_("home.no_pets_title")}
                    </h3>
                    <p class="text-gray-500 dark:text-gray-400">
                        {#if searchQuery}
                            "{searchQuery}"
                        {:else}
                            {$_("home.no_pets_text")}
                        {/if}
                    </p>
                    {#if searchQuery}
                        <button
                            onclick={clearSearch}
                            class="mt-4 px-4 py-2 text-sm font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors"
                        >
                            {$_("home.clear_search")}
                        </button>
                    {/if}
                </div>
            {:else}
                <div class="space-y-6" in:fade={{ duration: 300 }}>
                    {#each posts as post (post.id)}
                        <PostCard
                            {post}
                            onPostDeleted={() => { posts = posts.filter(p => p.id !== post.id); }}
                            onPostUpdated={(updatedPost) => {
                                if (updatedPost) {
                                    posts = posts.map(p => p.id === post.id ? { ...p, ...updatedPost } : p);
                                }
                            }}
                        />
                    {/each}
                </div>

                <!-- Infinite scroll trigger -->
                {#if hasMore}
                    <div bind:this={observerTarget} class="space-y-6">
                        {#if loadingMore}
                            <!-- Skeleton loaders while loading more posts -->
                            {#each [1, 2] as _}
                                <PostCardSkeleton />
                            {/each}
                        {/if}
                    </div>
                {:else if posts.length > 0}
                    <div
                        class="text-center py-12 text-gray-400 dark:text-gray-500 text-sm font-medium"
                    >
                        {$_("home.end_of_feed")}
                    </div>
                {/if}
            {/if}
        </div>

        <!-- Right Sidebar - Hidden on medium, visible on large -->
        <div class="hidden lg:block lg:col-span-3">
            <div bind:this={rightSidebarEl} class="sticky top-24 space-y-4" style="opacity: 0;">
                <!-- Create Post Card -->
                {#if auth.user}
                    <div
                        class="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-5 transition-colors"
                    >
                        <div class="flex items-center gap-3 mb-4">
                            <div
                                class="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold shadow-md overflow-hidden"
                            >
                                {#if auth.user.profilePicture}
                                    <img
                                        src={auth.user.profilePicture}
                                        alt={auth.user.fullName}
                                        class="w-full h-full object-cover"
                                    />
                                {:else}
                                    {auth.user.firstName?.[0]?.toUpperCase() || '?'}
                                {/if}
                            </div>
                            <div class="flex-1">
                                <p class="text-sm font-medium text-gray-900 dark:text-white">
                                    {auth.user.fullName}
                                </p>
                                <p class="text-xs text-gray-500 dark:text-gray-400">
                                    {$_("home.what_share")}
                                </p>
                            </div>
                        </div>
                        <button
                            onclick={() => (showCreateModal = true)}
                            class="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 px-4 rounded-xl transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
                        >
                            <Plus class="w-4 h-4" />
                            {$_("home.create_post")}
                        </button>
                    </div>
                {/if}

                <!-- Right Sidebar Ad -->
                <AdSlot format="rectangle" slot="right-sidebar-1" />

                <!-- Quick Links -->
                <div class="text-center pt-2">
                    <p class="text-xs text-gray-400 dark:text-gray-500 font-medium">
                        &copy; 2026 AdoptMe <br />
                        <a href="/about" class="hover:underline">{$_("home.about")}</a> •
                        <a href="/support" class="hover:underline">{$_("home.support_us")}</a>
                    </p>
                </div>
            </div>
        </div>
    </div>
</div>

<!-- Create Post Modal -->
<CreatePostModal
    bind:open={showCreateModal}
    onClose={() => (showCreateModal = false)}
    onPostCreated={refreshFeed}
/>
