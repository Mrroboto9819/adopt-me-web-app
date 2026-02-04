<script lang="ts">
    import { auth } from "$lib/stores/auth.svelte";
    import PostCard from "$lib/components/PostCard.svelte";
    import CreatePostModal from "$lib/components/CreatePostModal.svelte";
    import SEO from "$lib/components/SEO.svelte";
    import StructuredData from "$lib/components/StructuredData.svelte";
    import { onMount } from "svelte";
    import { fade } from "svelte/transition";
    import logo from "$lib/assets/favicon.svg";

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
        CircleCheck,
        LayoutList,
        Search,
        FileText,
        Heart,
        Coffee,
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

    // Filter state
    let speciesList = $state<any[]>([]);
    let selectedSpeciesId = $state<string | null>(null);
    let selectedPostType = $state<string | null>(null);
    let sortBy = $state<"popular" | "recent">("popular");

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
            query GetPostsFeed($first: Int, $after: String, $speciesId: ID, $postType: PostType, $sortBy: String) {
              postsFeed(first: $first, after: $after, speciesId: $speciesId, postType: $postType, sortBy: $sortBy) {
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
                    commentCount
                    author {
                      id
                      name
                      profilePicture
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
    });

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
    title="Home - Find Pets for Adoption"
    description="Discover dogs, cats, rabbits and more pets available for adoption near you. Browse adoption listings, share success stories, and connect with pet lovers in your community."
    keywords="pet adoption, adopt a pet, dogs for adoption, cats for adoption, animal shelter, rescue pets, adopt don't shop"
/>
<StructuredData type="WebSite" />
<StructuredData type="Organization" />

<div class="bg-gray-50 min-h-[calc(100vh-3.5rem)] pt-8 pb-12">
    <!-- Offset for fixed navbar -->
    <div
        class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-12 gap-8"
    >
        <!-- Left Sidebar (Navigation) - Hidden on mobile, visible on medium+ -->
        <div class="hidden md:block md:col-span-3 lg:col-span-3">
            <div class="sticky top-24 space-y-6">
                <!-- Navigation Menu -->
                <div
                    class="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden p-2"
                >
                    <div
                        class="px-4 py-3 text-xs font-bold text-gray-400 uppercase tracking-widest"
                    >
                        Sort By
                    </div>
                    <button
                        onclick={() => setSortBy("popular")}
                        class="flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm mb-1 transition-colors w-full text-left {sortBy ===
                        'popular'
                            ? 'bg-indigo-50/50 text-indigo-700 font-semibold'
                            : 'hover:bg-gray-50 text-gray-600'}"
                    >
                        <TrendingUp class="w-5 h-5" />
                        Popular
                    </button>
                    <button
                        onclick={() => setSortBy("recent")}
                        class="flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition-colors w-full text-left {sortBy ===
                        'recent'
                            ? 'bg-indigo-50/50 text-indigo-700 font-semibold'
                            : 'hover:bg-gray-50 text-gray-600'}"
                    >
                        <Clock class="w-5 h-5" />
                        Recent
                    </button>
                </div>

                <!-- Species Filter -->
                <div
                    class="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden p-2"
                >
                    <div
                        class="px-4 py-3 text-xs font-bold text-gray-400 uppercase tracking-widest"
                    >
                        Filter by Species
                    </div>
                    <button
                        onclick={() => setSpeciesFilter(null)}
                        class="flex items-center gap-3 px-4 py-2.5 rounded-xl font-medium text-sm transition-colors w-full text-left {selectedSpeciesId ===
                        null
                            ? 'bg-indigo-50 text-indigo-700'
                            : 'hover:bg-gray-50 text-gray-600'}"
                    >
                        <PawPrint class="w-5 h-5" />
                        All Species
                    </button>
                    {#each speciesList as species}
                        <button
                            onclick={() => setSpeciesFilter(species.id)}
                            class="flex items-center gap-3 px-4 py-2.5 rounded-xl font-medium text-sm transition-colors w-full text-left {selectedSpeciesId ===
                            species.id
                                ? 'bg-indigo-50 text-indigo-700'
                                : 'hover:bg-gray-50 text-gray-600'}"
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
                    class="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden p-2"
                >
                    <div
                        class="px-4 py-3 text-xs font-bold text-gray-400 uppercase tracking-widest"
                    >
                        Post Type
                    </div>
                    <button
                        onclick={() => setPostTypeFilter(null)}
                        class="flex items-center gap-3 px-4 py-2.5 rounded-xl font-medium text-sm transition-colors w-full text-left {selectedPostType ===
                        null
                            ? 'bg-indigo-50 text-indigo-700'
                            : 'hover:bg-gray-50 text-gray-600'}"
                    >
                        <LayoutList class="w-4 h-4" /> All Posts
                    </button>
                    <button
                        onclick={() => setPostTypeFilter("adopt")}
                        class="flex items-center gap-3 px-4 py-2.5 rounded-xl font-medium text-sm transition-colors w-full text-left {selectedPostType ===
                        'adopt'
                            ? 'bg-indigo-50 text-indigo-700'
                            : 'hover:bg-gray-50 text-gray-600'}"
                    >
                        <Home class="w-4 h-4" /> Adoptions
                    </button>
                    <button
                        onclick={() => setPostTypeFilter("missing")}
                        class="flex items-center gap-3 px-4 py-2.5 rounded-xl font-medium text-sm transition-colors w-full text-left {selectedPostType ===
                        'missing'
                            ? 'bg-indigo-50 text-indigo-700'
                            : 'hover:bg-gray-50 text-gray-600'}"
                    >
                        <Search class="w-4 h-4" /> Missing Pets
                    </button>
                    <button
                        onclick={() => setPostTypeFilter("post")}
                        class="flex items-center gap-3 px-4 py-2.5 rounded-xl font-medium text-sm transition-colors w-full text-left {selectedPostType ===
                        'post'
                            ? 'bg-indigo-50 text-indigo-700'
                            : 'hover:bg-gray-50 text-gray-600'}"
                    >
                        <FileText class="w-4 h-4" /> General Posts
                    </button>
                </div>
            </div>
        </div>

        <!-- Center Feed (Posts) -->
        <div class="md:col-span-9 lg:col-span-6 space-y-6">
            <div class="flex items-center justify-between">
                <div>
                    <h1 class="text-xl font-bold text-gray-900">Home Feed</h1>
                    <p class="text-xs text-gray-500">
                        {loading
                            ? "Loading feed..."
                            : isRefreshing
                              ? "Refreshing..."
                              : `Updated at ${formatTime(lastUpdated)}`}
                    </p>
                </div>
                <!-- <button
                    onclick={refreshFeed}
                    class="px-3 py-2 text-xs font-semibold text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-60 disabled:cursor-not-allowed"
                    disabled={loading || isRefreshing}
                >
                    Refresh
                </button> -->
            </div>
            <!-- Support Us Button -->
            <a
                href="/support"
                class="block bg-gradient-to-r from-yellow-400 to-orange-500 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all duration-300 group mb-6"
            >
                <div class="flex items-center gap-4">
                    <div
                        class="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center text-white backdrop-blur-sm"
                    >
                        <Coffee class="w-5 h-5" />
                    </div>
                    <div class="flex-1 text-white">
                        <h3 class="font-bold text-sm">Support the Developer</h3>
                        <p class="text-xs text-white/90">
                            Help us keep the platform free and running!
                        </p>
                    </div>
                    <div
                        class="px-3 py-1.5 bg-white/20 backdrop-blur-sm rounded-lg text-white text-xs font-bold group-hover:bg-white/30 transition-colors"
                    >
                        Buy Coffee
                    </div>
                </div>
            </a>

            <!-- Create Post Input -->
            {#if auth.user}
                <button
                    onclick={() => (showCreateModal = true)}
                    class="bg-white p-4 rounded-2xl border border-gray-200/60 shadow-sm flex items-center gap-4 w-full hover:shadow-md hover:border-indigo-200 transition-all duration-300 group"
                >
                    <div
                        class="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold shadow-md overflow-hidden"
                    >
                        {#if auth.user.profilePicture}
                            <img
                                src={auth.user.profilePicture}
                                alt={auth.user.name}
                                class="w-full h-full object-cover"
                            />
                        {:else}
                            {auth.user.name[0].toUpperCase()}
                        {/if}
                    </div>
                    <div
                        class="flex-1 bg-gray-50 border border-gray-200/80 rounded-xl py-2.5 px-4 text-sm text-gray-500 text-left group-hover:bg-white transition-colors"
                    >
                        What are you want to share today?
                    </div>
                    <div
                        class="p-2 bg-indigo-50 text-indigo-600 rounded-full group-hover:bg-indigo-100 transition-colors"
                    >
                        <Plus class="w-5 h-5" />
                    </div>
                </button>
            {/if}

            <!-- Feed Content -->
            {#if loading}
                <div class="space-y-6">
                    {#each Array(3) as _}
                        <div
                            class="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 animate-pulse"
                        >
                            <div class="flex gap-4 mb-4">
                                <div
                                    class="w-12 h-12 bg-gray-200 rounded-full"
                                ></div>
                                <div class="flex-1 space-y-2">
                                    <div
                                        class="h-4 bg-gray-200 rounded w-1/4"
                                    ></div>
                                    <div
                                        class="h-3 bg-gray-200 rounded w-1/6"
                                    ></div>
                                </div>
                            </div>
                            <div class="h-48 bg-gray-200 rounded-xl mb-4"></div>
                            <div class="h-4 bg-gray-200 rounded w-3/4"></div>
                        </div>
                    {/each}
                </div>
            {:else if error}
                <div
                    class="bg-red-50 text-red-600 p-6 rounded-2xl border border-red-100 text-center shadow-sm"
                >
                    <p class="font-medium">{error}</p>
                    <button
                        onclick={refreshFeed}
                        class="mt-4 px-4 py-2 text-sm font-semibold text-white bg-red-600 rounded-lg hover:bg-red-700"
                    >
                        Try again
                    </button>
                </div>
            {:else if posts.length === 0}
                <div
                    class="bg-white p-12 rounded-3xl border border-gray-200 text-center text-gray-500 shadow-sm"
                >
                    <div
                        class="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4"
                    >
                        <PawPrint class="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 class="text-xl font-bold text-gray-900 mb-2">
                        No pets yet!
                    </h3>
                    <p class="text-gray-500">
                        Be the first to list a pet for adoption in our
                        community.
                    </p>
                </div>
            {:else}
                <div class="space-y-6" in:fade={{ duration: 300 }}>
                    {#each posts as post (post.id)}
                        <PostCard {post} />
                    {/each}
                </div>

                <!-- Infinite scroll trigger -->
                {#if hasMore}
                    <div
                        bind:this={observerTarget}
                        class="py-8 flex justify-center"
                    >
                        {#if loadingMore}
                            <div
                                class="flex items-center gap-3 text-sm text-gray-500"
                            >
                                <div
                                    class="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"
                                ></div>
                                Loading more...
                            </div>
                        {/if}
                    </div>
                {:else if posts.length > 0}
                    <div
                        class="text-center py-12 text-gray-400 text-sm font-medium"
                    >
                        You've reached the end! 🐾
                    </div>
                {/if}
            {/if}
        </div>

        <!-- Right Sidebar (Community Info) - Hidden on medium, visible on large -->
        <div class="hidden lg:block lg:col-span-3">
            <div
                class="bg-white rounded-2xl border border-gray-200 shadow-sm sticky top-24 overflow-hidden"
            >
                <div
                    class="bg-gradient-to-r from-indigo-600 to-purple-600 h-24 relative"
                ></div>
                <div class="px-6 pb-6">
                    <div
                        class="relative -mt-10 mb-4 flex justify-between items-end"
                    >
                        <div
                            class="w-20 h-20 bg-white rounded-2xl flex items-center justify-center p-1.5 shadow-md"
                        >
                            <div
                                class="w-full h-full bg-indigo-50 rounded-xl flex items-center justify-center"
                            >
                                <img
                                    src={logo}
                                    alt="AdoptMe"
                                    class="h-15 w-auto"
                                />
                                <!-- <PawPrint class="w-8 h-8 text-indigo-600" /> -->
                            </div>
                        </div>
                    </div>

                    <h2 class="text-xl font-bold text-gray-900 mb-1">
                        AdoptMe Community
                    </h2>
                    <p
                        class="text-xs font-medium text-indigo-600 mb-4 uppercase tracking-wide"
                    >
                        Since 2026
                    </p>

                    <p class="text-sm text-gray-600 mb-4 leading-relaxed">
                        We created AdoptMe to help people share and find animals
                        looking for a loving home. Our mission is to build a
                        welcoming community where pet lovers can connect, share
                        adoption stories, and give every animal a chance at
                        happiness.
                    </p>

                    <p class="text-sm text-gray-500 mb-6 leading-relaxed">
                        Whether you're looking to adopt, rehome a pet, or simply
                        connect with fellow animal enthusiasts, you're in the
                        right place.
                    </p>

                    <div
                        class="flex flex-col gap-3 text-sm text-gray-500 border-t border-gray-100 pt-4 mb-6"
                    >
                        <div class="flex items-center gap-3">
                            <CircleCheck class="w-4 h-4 text-green-500" />
                            <span>Verified Listings</span>
                        </div>
                        <div class="flex items-center gap-3">
                            <Clock class="w-4 h-4 text-orange-500" />
                            <span>Active Community</span>
                        </div>
                        <div class="flex items-center gap-3">
                            <Heart class="w-4 h-4 text-rose-500" />
                            <span>Free Forever</span>
                        </div>
                    </div>

                    <button
                        onclick={() => (showCreateModal = true)}
                        class="w-full bg-gray-900 hover:bg-black text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-gray-200 transform active:scale-95"
                    >
                        Create Post
                    </button>
                </div>
            </div>

            <div class="mt-8 text-center">
                <p class="text-xs text-gray-400 font-medium">
                    &copy; 2026 AdoptMe <br />
                    <a href="/about" class="hover:underline">About</a> •
                    <!-- <a href="/contact" class="hover:underline">Contact</a> • -->
                    <a href="/support" class="hover:underline">Support Us</a>
                </p>
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
