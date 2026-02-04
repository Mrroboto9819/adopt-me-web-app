<script lang="ts">
    import { page } from "$app/stores";
    import { onMount } from "svelte";
    import { fade } from "svelte/transition";
    import { auth } from "$lib/stores/auth.svelte";
    import { goto } from "$app/navigation";
    import SEO from "$lib/components/SEO.svelte";
    import { FileText } from "lucide-svelte";

    let userId = $derived($page.params.id);
    let user = $state<any>(null);
    let userPosts = $state<any[]>([]);
    let userPets = $state<any[]>([]);
    let loading = $state(true);
    let loadingPosts = $state(false);
    let loadingPets = $state(false);
    let activeTab = $state<"posts" | "pets">("posts");
    let error = $state("");

    async function fetchUser() {
        loading = true;
        error = "";
        try {
            const response = await fetch("/api/graphql", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    query: `
                        query GetUser($id: ID!) {
                            user(id: $id) {
                                id
                                name
                                profilePicture
                                coverImage
                                createdAt
                            }
                        }
                    `,
                    variables: { id: userId },
                }),
            });

            const result = await response.json();
            if (result.errors) throw new Error(result.errors[0].message);

            user = result.data.user;
            if (!user) {
                error = "User not found";
            }
        } catch (e: any) {
            error = e.message || "Failed to load user";
        } finally {
            loading = false;
        }
    }

    async function fetchUserPosts() {
        if (userPosts.length > 0) return;
        loadingPosts = true;
        try {
            const response = await fetch("/api/graphql", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    query: `
                        query GetUserPosts($userId: ID!) {
                            userPosts(userId: $userId) {
                                id
                                title
                                description
                                postType
                                tags
                                images
                                location
                                createdAt
                                voteScore
                                commentCount
                                pet {
                                    id
                                    name
                                    species { label }
                                    breed { name }
                                    customSpecies
                                    customBreed
                                    coverImage
                                    status
                                }
                            }
                        }
                    `,
                    variables: { userId },
                }),
            });

            const result = await response.json();
            if (result.errors) throw new Error(result.errors[0].message);
            userPosts = result.data.userPosts || [];
        } catch (e: any) {
            console.error(e.message);
        } finally {
            loadingPosts = false;
        }
    }

    async function fetchUserPets() {
        if (userPets.length > 0) return;
        loadingPets = true;
        try {
            const response = await fetch("/api/graphql", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    query: `
                        query GetUserPets($userId: ID!) {
                            userPets(userId: $userId) {
                                id
                                name
                                species { label }
                                breed { name }
                                customSpecies
                                customBreed
                                coverImage
                                age
                                description
                            }
                        }
                    `,
                    variables: { userId },
                }),
            });

            const result = await response.json();
            if (result.errors) throw new Error(result.errors[0].message);
            userPets = result.data.userPets || [];
        } catch (e: any) {
            console.error(e.message);
        } finally {
            loadingPets = false;
        }
    }

    function formatDate(dateStr: string) {
        const d = new Date(Number(dateStr));
        return d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
    }

    function switchTab(tab: "posts" | "pets") {
        activeTab = tab;
        if (tab === "posts" && userPosts.length === 0) {
            fetchUserPosts();
        } else if (tab === "pets" && userPets.length === 0) {
            fetchUserPets();
        }
    }

    onMount(async () => {
        // Redirect to own profile if viewing self
        if (auth.user?.id === userId) {
            goto("/profile");
            return;
        }
        await fetchUser();
        if (user) {
            await fetchUserPosts();
        }
    });
</script>

{#if user}
    <SEO
        title={`${user.name}'s Profile`}
        description={`View ${user.name}'s profile on AdoptMe. See their pets and adoption posts.`}
        image={user.profilePicture || user.coverImage || '/og-image.jpg'}
        type="profile"
    />
{:else}
    <SEO
        title="User Profile"
        description="View user profile on AdoptMe"
    />
{/if}

<div class="min-h-screen bg-gray-50 pb-12">
    {#if loading}
        <div class="flex justify-center items-center py-24">
            <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
    {:else if error}
        <div class="max-w-2xl mx-auto px-4 py-24 text-center">
            <div class="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
                <div class="text-6xl mb-4">😿</div>
                <h1 class="text-xl font-bold text-gray-900 mb-2">{error}</h1>
                <p class="text-gray-500 mb-6">The user you're looking for doesn't exist or has been removed.</p>
                <a href="/" class="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
                    Go Home
                </a>
            </div>
        </div>
    {:else if user}
        <!-- Cover Image -->
        <div class="h-48 md:h-64 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 relative">
            {#if user.coverImage}
                <img
                    src={user.coverImage}
                    alt="Cover"
                    class="w-full h-full object-cover"
                />
            {/if}
        </div>

        <!-- Profile Header -->
        <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="relative -mt-16 mb-6">
                <div class="flex flex-col sm:flex-row sm:items-end sm:gap-6">
                    <!-- Avatar -->
                    <div class="w-32 h-32 rounded-full border-4 border-white bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-4xl font-bold shadow-lg overflow-hidden">
                        {#if user.profilePicture}
                            <img
                                src={user.profilePicture}
                                alt={user.name}
                                class="w-full h-full object-cover"
                            />
                        {:else}
                            {user.name[0].toUpperCase()}
                        {/if}
                    </div>

                    <!-- User Info -->
                    <div class="mt-4 sm:mt-0 sm:pb-2 flex-1">
                        <h1 class="text-2xl font-bold text-gray-900">{user.name}</h1>
                        <p class="text-gray-500 text-sm">
                            Member since {formatDate(user.createdAt)}
                        </p>
                    </div>
                </div>
            </div>

            <!-- Tabs Navigation -->
            <div class="flex border-b border-gray-200 mb-6">
                <button
                    onclick={() => switchTab("posts")}
                    class="{activeTab === 'posts'
                        ? 'border-indigo-500 text-indigo-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-6 border-b-2 font-medium text-sm transition-colors"
                >
                    Posts ({userPosts.length})
                </button>
                <button
                    onclick={() => switchTab("pets")}
                    class="{activeTab === 'pets'
                        ? 'border-indigo-500 text-indigo-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-6 border-b-2 font-medium text-sm transition-colors"
                >
                    Pets ({userPets.length})
                </button>
            </div>

            <!-- Tab Content -->
            {#if activeTab === "posts"}
                <div in:fade={{ duration: 200 }}>
                    {#if loadingPosts}
                        <div class="flex justify-center py-12">
                            <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
                        </div>
                    {:else if userPosts.length === 0}
                        <div class="text-center py-16 bg-white rounded-2xl shadow-sm border border-dashed border-gray-300">
                            <div class="mx-auto h-16 w-16 text-gray-400 mb-4 bg-gray-50 rounded-full flex items-center justify-center">
                                <FileText class="w-8 h-8" />
                            </div>
                            <h3 class="text-sm font-medium text-gray-900">No posts yet</h3>
                            <p class="mt-1 text-sm text-gray-500">
                                {user.name} hasn't shared any posts.
                            </p>
                        </div>
                    {:else}
                        <div class="space-y-4">
                            {#each userPosts as post}
                                <a
                                    href="/post/{post.id}"
                                    class="block bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow border border-gray-100 overflow-hidden"
                                >
                                    <div class="p-5">
                                        <div class="flex items-start justify-between gap-4">
                                            <div class="flex-1">
                                                <div class="flex items-center gap-2 mb-2">
                                                    <span class="text-xs px-2 py-0.5 rounded-full font-medium {
                                                        post.postType === 'adopt' ? 'bg-green-100 text-green-700' :
                                                        post.postType === 'missing' ? 'bg-red-100 text-red-700' :
                                                        'bg-blue-100 text-blue-700'
                                                    }">
                                                        {post.postType === 'adopt' ? 'Adoption' : post.postType === 'missing' ? 'Missing' : 'Post'}
                                                    </span>
                                                    <span class="text-xs text-gray-500">
                                                        {new Date(Number(post.createdAt)).toLocaleDateString()}
                                                    </span>
                                                </div>
                                                <h3 class="font-semibold text-gray-900 mb-1 hover:text-indigo-600 transition-colors">
                                                    {post.title}
                                                </h3>
                                                <p class="text-sm text-gray-600 line-clamp-2">
                                                    {post.description}
                                                </p>
                                                {#if post.pet}
                                                    <div class="mt-2 flex items-center gap-2 text-xs text-gray-500">
                                                        <span class="bg-gray-100 px-2 py-0.5 rounded">
                                                            {post.pet.name} ({post.pet.species?.label || post.pet.customSpecies || 'Pet'})
                                                        </span>
                                                    </div>
                                                {/if}
                                            </div>
                                            {#if post.images && post.images.length > 0}
                                                <img
                                                    src={post.images[0]}
                                                    alt=""
                                                    class="w-20 h-20 rounded-lg object-cover flex-shrink-0"
                                                />
                                            {/if}
                                        </div>
                                        <div class="mt-3 pt-3 border-t border-gray-100 flex items-center gap-4 text-xs text-gray-500">
                                            <span class="flex items-center gap-1">
                                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7"></path>
                                                </svg>
                                                {post.voteScore ?? 0} votes
                                            </span>
                                            <span class="flex items-center gap-1">
                                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
                                                </svg>
                                                {post.commentCount ?? 0} comments
                                            </span>
                                            {#if post.location}
                                                <span class="flex items-center gap-1">
                                                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                                                    </svg>
                                                    {post.location}
                                                </span>
                                            {/if}
                                        </div>
                                    </div>
                                </a>
                            {/each}
                        </div>
                    {/if}
                </div>
            {/if}

            {#if activeTab === "pets"}
                <div in:fade={{ duration: 200 }}>
                    {#if loadingPets}
                        <div class="flex justify-center py-12">
                            <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
                        </div>
                    {:else if userPets.length === 0}
                        <div class="text-center py-16 bg-white rounded-2xl shadow-sm border border-dashed border-gray-300">
                            <div class="mx-auto h-16 w-16 text-gray-400 mb-4 bg-gray-50 rounded-full flex items-center justify-center">
                                🐾
                            </div>
                            <h3 class="text-sm font-medium text-gray-900">No pets</h3>
                            <p class="mt-1 text-sm text-gray-500">
                                {user.name} hasn't added any pets yet.
                            </p>
                        </div>
                    {:else}
                        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {#each userPets as pet}
                                <div class="group bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow border border-gray-100 overflow-hidden">
                                    <div class="relative h-48 bg-gray-200 overflow-hidden">
                                        {#if pet.coverImage}
                                            <img
                                                src={pet.coverImage}
                                                alt={pet.name}
                                                class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                            />
                                        {:else}
                                            <div class="w-full h-full flex items-center justify-center text-4xl bg-indigo-50 text-indigo-200">
                                                🐾
                                            </div>
                                        {/if}
                                        <div class="absolute top-2 right-2">
                                            <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-white/90 text-gray-800 backdrop-blur-sm shadow-sm">
                                                {pet.species?.label || pet.customSpecies || "Unknown"}
                                            </span>
                                        </div>
                                    </div>
                                    <div class="p-5">
                                        <h3 class="text-lg font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">
                                            {pet.name}
                                        </h3>
                                        <p class="text-sm text-gray-500 mt-1">
                                            {pet.breed?.name || pet.customBreed || "Unknown breed"}
                                        </p>
                                        {#if pet.age}
                                            <p class="text-xs text-gray-400 mt-1">
                                                {pet.age} years old
                                            </p>
                                        {/if}
                                        {#if pet.description}
                                            <p class="text-sm text-gray-600 mt-2 line-clamp-2">
                                                {pet.description}
                                            </p>
                                        {/if}
                                    </div>
                                </div>
                            {/each}
                        </div>
                    {/if}
                </div>
            {/if}
        </div>
    {/if}
</div>
