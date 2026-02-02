<script lang="ts">
    import { auth } from "$lib/stores/auth.svelte";
    import PostCard from "$lib/components/PostCard.svelte";
    import CreatePostModal from "$lib/components/CreatePostModal.svelte";
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
        CheckCircle,
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
            query GetPostsFeed($first: Int, $after: String) {
              postsFeed(first: $first, after: $after) {
                edges {
                  cursor
                  node {
                    id
                    title
                    description
                    location
                    createdAt
                    author {
                      name
                    }
                    pet {
                      name
                      species {
                        label
                        name
                      }
                      customSpecies
                      breed {
                        label
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
                        first: 10,
                        after: cursor,
                    },
                }),
            });

            const result = await response.json();
            if (result.errors) throw new Error(result.errors[0].message);

            const { edges, pageInfo } = result.data.postsFeed;

            // Append new posts
            if (cursor) {
                posts = [...posts, ...edges.map((edge: any) => edge.node)];
            } else {
                posts = edges.map((edge: any) => edge.node);
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
    async function refreshFeed() {
        if (isRefreshing) return;
        isRefreshing = true;
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
        await fetchPosts();
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

    // Mock categories
    const categories = [
        { name: "Dogs", icon: Dog },
        { name: "Cats", icon: Cat },
        { name: "Birds", icon: Bird },
        { name: "Rabbits", icon: Rabbit },
        { name: "Other", icon: Fish },
    ];

    function formatTime(value: Date | null) {
        if (!value) return "Never";
        return value.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
        });
    }
</script>

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
                        Menu
                    </div>
                    <a
                        href="/"
                        class="flex items-center gap-3 px-4 py-3 bg-indigo-50/50 text-indigo-700 rounded-xl font-semibold text-sm mb-1 transition-colors"
                    >
                        <Home class="w-5 h-5" />
                        Home Feed
                    </a>
                    <a
                        href="/popular"
                        class="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 text-gray-600 rounded-xl font-medium text-sm transition-colors"
                    >
                        <TrendingUp class="w-5 h-5" />
                        Popular
                    </a>
                </div>

                <!-- Categories -->
                <div
                    class="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden p-2"
                >
                    <div
                        class="px-4 py-3 text-xs font-bold text-gray-400 uppercase tracking-widest"
                    >
                        Categories
                    </div>
                    {#each categories as cat}
                        <a
                            href={`/category/${cat.name.toLowerCase()}`}
                            class="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 rounded-xl text-gray-600 font-medium text-sm transition-colors group"
                        >
                            <span
                                class="text-gray-400 group-hover:text-indigo-500 transition-colors"
                            >
                                <cat.icon class="w-5 h-5" />
                            </span>
                            {cat.name}
                        </a>
                    {/each}
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
                <button
                    onclick={refreshFeed}
                    class="px-3 py-2 text-xs font-semibold text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-60 disabled:cursor-not-allowed"
                    disabled={loading || isRefreshing}
                >
                    Refresh
                </button>
            </div>
            <!-- Create Post Input -->
            {#if auth.user}
                <button
                    onclick={() => (showCreateModal = true)}
                    class="bg-white p-4 rounded-2xl border border-gray-200/60 shadow-sm flex items-center gap-4 w-full hover:shadow-md hover:border-indigo-200 transition-all duration-300 group"
                >
                    <div
                        class="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold shadow-md"
                    >
                        {auth.user.name[0].toUpperCase()}
                    </div>
                    <div
                        class="flex-1 bg-gray-50 border border-gray-200/80 rounded-xl py-2.5 px-4 text-sm text-gray-500 text-left group-hover:bg-white transition-colors"
                    >
                        What are you looking for today?
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
                            <div class="flex items-center gap-3 text-sm text-gray-500">
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
                        Since 2024
                    </p>

                    <p class="text-sm text-gray-600 mb-6 leading-relaxed">
                        The best place to find your new furry friend. Post pets
                        for adoption, share success stories, and connect with
                        other pet lovers.
                    </p>

                    <div
                        class="flex flex-col gap-3 text-sm text-gray-500 border-t border-gray-100 pt-4 mb-6"
                    >
                        <div class="flex items-center gap-3">
                            <CheckCircle class="w-4 h-4 text-green-500" />
                            <span>Verified Listings</span>
                        </div>
                        <div class="flex items-center gap-3">
                            <Clock class="w-4 h-4 text-orange-500" />
                            <span>Updated Hourly</span>
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
                    &copy; 2025 AdoptMe Inc. <br />
                    <a href="/privacy" class="hover:underline">Privacy</a> •
                    <a href="/terms" class="hover:underline">Terms</a>
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
