<script lang="ts">
    import { page } from "$app/stores";
    import { onMount } from "svelte";
    import { fade } from "svelte/transition";
    import { auth } from "$lib/stores/auth.svelte";
    import { goto } from "$app/navigation";
    import SEO from "$lib/components/SEO.svelte";
    import PostCard from "$lib/components/PostCard.svelte";
    import { FileText, BadgeCheck, PawPrint, Mail, Phone, MapPin, Calendar, Globe } from "lucide-svelte";
    import { _ } from "svelte-i18n";
    import gsap from "gsap";

    // Helper function to strip HTML tags for preview text
    function stripHtml(html: string): string {
        if (!html) return "";
        return html.replace(/<[^>]*>/g, "").trim();
    }

    let userId = $derived($page.params.id);
    let user = $state<any>(null);
    let userPosts = $state<any[]>([]);
    let userPets = $state<any[]>([]);
    let loading = $state(true);
    let loadingPosts = $state(false);
    let loadingPets = $state(false);
    let activeTab = $state<"posts" | "pets">("posts");
    let error = $state("");

    // Verification banner visibility (same logic as Navbar)
    let needsEmailVerification = $derived(auth.user && (!auth.user.email || !auth.user.emailVerified));
    let needsPhoneVerification = $derived(auth.user && (!auth.user.phone || !auth.user.phoneVerified));
    let showVerificationBanner = $derived(needsEmailVerification || needsPhoneVerification);

    // GSAP animation refs
    let coverEl: HTMLDivElement | null = $state(null);
    let avatarEl: HTMLDivElement | null = $state(null);
    let userInfoEl: HTMLDivElement | null = $state(null);
    let userInfoCardEl: HTMLDivElement | null = $state(null);
    let tabsEl: HTMLDivElement | null = $state(null);
    let contentEl: HTMLDivElement | null = $state(null);
    let hasAnimated = $state(false);

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
                                firstName
                                lastName
                                secondLastName
                                fullName
                                profilePicture
                                coverImage
                                coverImageOffset {
                                    x
                                    y
                                }
                                createdAt
                                emailVerified
                                phoneVerified
                                language
                                timezone
                                address {
                                    city
                                    state
                                    country
                                }
                                preferredSpecies {
                                    id
                                    label
                                }
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
                headers: {
                    "Content-Type": "application/json",
                    ...(auth.token ? { Authorization: `Bearer ${auth.token}` } : {}),
                },
                body: JSON.stringify({
                    query: `
                        query GetUserPosts($userId: ID!) {
                            userPosts(userId: $userId) {
                                id
                                title
                                description
                                postType
                                reportType
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
                                    fullName
                                    profilePicture
                                    emailVerified
                                    phoneVerified
                                }
                                pet {
                                    id
                                    name
                                    species { id label name }
                                    breed { name }
                                    customSpecies
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
                                    breed { name }
                                    customSpecies
                                    customBreed
                                    age
                                    gender
                                    description
                                    status
                                    coverImage
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
                                gender
                                size
                                status
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
        // Animate tab content change
        if (contentEl) {
            gsap.fromTo(
                contentEl,
                { opacity: 0, y: 15 },
                { opacity: 1, y: 0, duration: 0.3, ease: "power2.out" }
            );
        }
    }

    function runEntranceAnimations() {
        const tl = gsap.timeline({ defaults: { ease: "power2.out" } });

        // Animate cover
        if (coverEl) {
            tl.fromTo(
                coverEl,
                { opacity: 0 },
                { opacity: 1, duration: 0.4 },
                0
            );
        }

        // Animate avatar with scale
        if (avatarEl) {
            tl.fromTo(
                avatarEl,
                { opacity: 0, scale: 0.8, y: 20 },
                { opacity: 1, scale: 1, y: 0, duration: 0.5, ease: "back.out(1.5)" },
                0.2
            );
        }

        // Animate user info
        if (userInfoEl) {
            tl.fromTo(
                userInfoEl,
                { opacity: 0, y: 15 },
                { opacity: 1, y: 0, duration: 0.4 },
                0.35
            );
        }

        // Animate user info card
        if (userInfoCardEl) {
            tl.fromTo(
                userInfoCardEl,
                { opacity: 0, y: 15 },
                { opacity: 1, y: 0, duration: 0.4 },
                0.4
            );
        }

        // Animate tabs
        if (tabsEl) {
            tl.fromTo(
                tabsEl,
                { opacity: 0, y: -10 },
                { opacity: 1, y: 0, duration: 0.3 },
                0.5
            );
        }

        // Animate content
        if (contentEl) {
            tl.fromTo(
                contentEl,
                { opacity: 0, y: 20 },
                { opacity: 1, y: 0, duration: 0.4 },
                0.6
            );
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
            // Fetch both posts and pets in parallel for accurate counts
            await Promise.all([fetchUserPosts(), fetchUserPets()]);
            // Run animations after data loads
            if (!hasAnimated) {
                hasAnimated = true;
                requestAnimationFrame(() => {
                    runEntranceAnimations();
                });
            }
        }
    });
</script>

{#if user}
    <SEO
        title={`${user.fullName}'s Profile`}
        description={`View ${user.fullName}'s profile on AdoptMe. See their pets and adoption posts.`}
        image={user.profilePicture || user.coverImage || '/og-image.jpg'}
        type="profile"
    />
{:else}
    <SEO
        title="User Profile"
        description="View user profile on AdoptMe"
    />
{/if}

<div class="min-h-screen bg-gray-50 dark:bg-gray-900 pb-12 transition-colors">
    {#if loading}
        <!-- Skeleton Loading State -->
        <div class="animate-pulse">
            <!-- Cover Skeleton -->
            <div class="h-48 md:h-64 bg-gray-200 dark:bg-gray-800"></div>

            <!-- Profile Header Skeleton -->
            <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                <div class="relative -mt-16 mb-6">
                    <div class="flex flex-col sm:flex-row sm:items-end sm:gap-6">
                        <!-- Avatar Skeleton -->
                        <div class="w-32 h-32 rounded-full bg-gray-300 dark:bg-gray-700 border-4 border-white dark:border-gray-900"></div>

                        <!-- User Info Skeleton -->
                        <div class="mt-4 sm:mt-0 sm:pb-2 flex-1 space-y-3">
                            <div class="h-7 w-48 bg-gray-300 dark:bg-gray-700 rounded-lg"></div>
                            <div class="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
                        </div>
                    </div>
                </div>

                <!-- Tabs Skeleton -->
                <div class="flex border-b border-gray-200 dark:border-gray-700 mb-6">
                    <div class="h-12 w-24 bg-gray-200 dark:bg-gray-700 rounded mr-4"></div>
                    <div class="h-12 w-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
                </div>

                <!-- Content Skeleton -->
                <div class="space-y-4">
                    {#each [1, 2, 3] as _}
                        <div class="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-100 dark:border-gray-700">
                            <div class="flex gap-4">
                                <div class="flex-1 space-y-3">
                                    <div class="h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
                                    <div class="h-5 w-3/4 bg-gray-300 dark:bg-gray-700 rounded"></div>
                                    <div class="h-4 w-full bg-gray-200 dark:bg-gray-700 rounded"></div>
                                    <div class="h-4 w-2/3 bg-gray-200 dark:bg-gray-700 rounded"></div>
                                </div>
                                <div class="w-20 h-20 bg-gray-200 dark:bg-gray-700 rounded-lg flex-shrink-0"></div>
                            </div>
                        </div>
                    {/each}
                </div>
            </div>
        </div>
    {:else if error}
        <div class="max-w-2xl mx-auto px-4 py-24 text-center">
            <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-8">
                <div class="text-6xl mb-4">😿</div>
                <h1 class="text-xl font-bold text-gray-900 dark:text-white mb-2">{error}</h1>
                <p class="text-gray-500 dark:text-gray-400 mb-6">The user you're looking for doesn't exist or has been removed.</p>
                <a href="/" class="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
                    Go Home
                </a>
            </div>
        </div>
    {:else if user}
        <!-- Cover Image -->
        <div
            bind:this={coverEl}
            class="h-48 md:h-64 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 relative overflow-hidden"
            style="opacity: 0;"
        >
            {#if user.coverImage}
                <img
                    src={user.coverImage}
                    alt="Cover"
                    class="w-full h-full object-cover"
                    style="object-position: {user.coverImageOffset?.x ?? 50}% {user.coverImageOffset?.y ?? 50}%;"
                />
            {/if}
        </div>

        <!-- Profile Header -->
        <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="relative -mt-16 mb-6">
                <div class="flex flex-col sm:flex-row sm:items-end sm:gap-6">
                    <!-- Avatar -->
                    <div
                        bind:this={avatarEl}
                        class="w-32 h-32 rounded-full border-4 border-white dark:border-gray-900 bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-4xl font-bold shadow-lg overflow-hidden"
                        style="opacity: 0;"
                    >
                        {#if user.profilePicture}
                            <img
                                src={user.profilePicture}
                                alt={user.fullName}
                                class="w-full h-full object-cover"
                            />
                        {:else}
                            {user.firstName?.[0]?.toUpperCase() || '?'}
                        {/if}
                    </div>

                    <!-- User Info -->
                    <div
                        bind:this={userInfoEl}
                        class="mt-4 sm:mt-0 sm:pb-2 flex-1"
                        style="opacity: 0;"
                    >
                        <h1 class="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            {user.fullName}
                            <!-- Verification badges -->
                            <div class="flex items-center gap-1">
                                {#if user.emailVerified}
                                    <span class="inline-flex items-center justify-center w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900/30" title={$_("settings.verification.email") + " " + $_("settings.verification.verified")}>
                                        <Mail class="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                                    </span>
                                {/if}
                                {#if user.phoneVerified}
                                    <span class="inline-flex items-center justify-center w-6 h-6 rounded-full bg-green-100 dark:bg-green-900/30" title={$_("settings.verification.phone") + " " + $_("settings.verification.verified")}>
                                        <Phone class="w-3.5 h-3.5 text-green-600 dark:text-green-400" />
                                    </span>
                                {/if}
                            </div>
                        </h1>
                        <p class="text-gray-500 dark:text-gray-400 text-sm">
                            Member since {formatDate(user.createdAt)}
                        </p>
                    </div>
                </div>
            </div>

            <!-- User Info Card -->
            <div
                bind:this={userInfoCardEl}
                class="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-5 mb-6"
                style="opacity: 0;"
            >
                <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <!-- Location -->
                    {#if user.address?.city || user.address?.state || user.address?.country}
                        <div class="flex items-center gap-3">
                            <div class="w-10 h-10 rounded-full bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center flex-shrink-0">
                                <MapPin class="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                            </div>
                            <div>
                                <p class="text-xs text-gray-500 dark:text-gray-400">{$_("profile.location")}</p>
                                <p class="text-sm font-medium text-gray-900 dark:text-white">
                                    {[user.address.city, user.address.state, user.address.country].filter(Boolean).join(", ")}
                                </p>
                            </div>
                        </div>
                    {/if}

                    <!-- Member Since -->
                    <div class="flex items-center gap-3">
                        <div class="w-10 h-10 rounded-full bg-green-50 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0">
                            <Calendar class="w-5 h-5 text-green-600 dark:text-green-400" />
                        </div>
                        <div>
                            <p class="text-xs text-gray-500 dark:text-gray-400">{$_("profile.member_since")}</p>
                            <p class="text-sm font-medium text-gray-900 dark:text-white">
                                {formatDate(user.createdAt)}
                            </p>
                        </div>
                    </div>

                    <!-- Language -->
                    {#if user.language}
                        <div class="flex items-center gap-3">
                            <div class="w-10 h-10 rounded-full bg-purple-50 dark:bg-purple-900/30 flex items-center justify-center flex-shrink-0">
                                <Globe class="w-5 h-5 text-purple-600 dark:text-purple-400" />
                            </div>
                            <div>
                                <p class="text-xs text-gray-500 dark:text-gray-400">{$_("profile.language")}</p>
                                <p class="text-sm font-medium text-gray-900 dark:text-white">
                                    {user.language === "es" ? "Español" : "English"}
                                </p>
                            </div>
                        </div>
                    {/if}

                    <!-- Stats -->
                    <div class="flex items-center gap-3">
                        <div class="w-10 h-10 rounded-full bg-amber-50 dark:bg-amber-900/30 flex items-center justify-center flex-shrink-0">
                            <PawPrint class="w-5 h-5 text-amber-600 dark:text-amber-400" />
                        </div>
                        <div>
                            <p class="text-xs text-gray-500 dark:text-gray-400">{$_("profile.activity")}</p>
                            <p class="text-sm font-medium text-gray-900 dark:text-white">
                                {userPosts.length} {$_("profile.posts_label")} • {userPets.length} {$_("profile.pets_label")}
                            </p>
                        </div>
                    </div>
                </div>

                <!-- Preferred Species -->
                {#if user.preferredSpecies && user.preferredSpecies.length > 0}
                    <div class="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                        <p class="text-xs text-gray-500 dark:text-gray-400 mb-2">{$_("profile.interested_in")}</p>
                        <div class="flex flex-wrap gap-2">
                            {#each user.preferredSpecies as species}
                                <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300">
                                    <PawPrint class="w-3 h-3 mr-1.5" />
                                    {species.label}
                                </span>
                            {/each}
                        </div>
                    </div>
                {/if}
            </div>

            <!-- Tabs Navigation (sticky) -->
            <!-- Position: Nav (64px) + Support banner (28px) + Verification banner if shown (28px) -->
            <div
                bind:this={tabsEl}
                class="sticky z-10 bg-gray-50 dark:bg-gray-900 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 border-b border-gray-200 dark:border-gray-700 mb-6 {showVerificationBanner ? 'top-[120px]' : 'top-[92px]'}"
                style="opacity: 0;"
            >
                <nav class="flex space-x-4 sm:space-x-6">
                    <button
                        onclick={() => switchTab("posts")}
                        class="{activeTab === 'posts'
                            ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                            : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors flex items-center gap-2"
                    >
                        <FileText class="w-4 h-4" />
                        {$_("profile.tabs.user_posts")} ({userPosts.length})
                    </button>
                    <button
                        onclick={() => switchTab("pets")}
                        class="{activeTab === 'pets'
                            ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                            : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors flex items-center gap-2"
                    >
                        <PawPrint class="w-4 h-4" />
                        {$_("profile.tabs.user_pets")} ({userPets.length})
                    </button>
                </nav>
            </div>

            <!-- Tab Content -->
            <div bind:this={contentEl} style="opacity: 0;">
                {#if activeTab === "posts"}
                    <div in:fade={{ duration: 200 }}>
                        {#if loadingPosts}
                            <div class="flex justify-center py-12">
                                <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
                            </div>
                        {:else if userPosts.length === 0}
                            <div class="text-center py-16 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-dashed border-gray-300 dark:border-gray-600">
                                <div class="mx-auto h-16 w-16 text-gray-400 dark:text-gray-500 mb-4 bg-gray-50 dark:bg-gray-700 rounded-full flex items-center justify-center">
                                    <FileText class="w-8 h-8" />
                                </div>
                                <h3 class="text-sm font-medium text-gray-900 dark:text-white">No posts yet</h3>
                                <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                    {user.fullName} hasn't shared any posts.
                                </p>
                            </div>
                        {:else}
                            <div class="space-y-6">
                                {#each userPosts as post (post.id)}
                                    <PostCard
                                        {post}
                                        onPostDeleted={() => { userPosts = userPosts.filter(p => p.id !== post.id); }}
                                        onPostUpdated={(updatedPost) => {
                                            if (updatedPost) {
                                                userPosts = userPosts.map(p => p.id === post.id ? { ...p, ...updatedPost } : p);
                                            }
                                        }}
                                    />
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
                            <div class="text-center py-16 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-dashed border-gray-300 dark:border-gray-600">
                                <div class="mx-auto h-16 w-16 text-gray-400 dark:text-gray-500 mb-4 bg-gray-50 dark:bg-gray-700 rounded-full flex items-center justify-center">
                                    <PawPrint class="w-8 h-8" />
                                </div>
                                <h3 class="text-sm font-medium text-gray-900 dark:text-white">No pets</h3>
                                <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                    {user.fullName} hasn't added any pets yet.
                                </p>
                            </div>
                        {:else}
                            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                {#each userPets as pet}
                                    <div class="group bg-white dark:bg-gray-800 rounded-2xl shadow-sm hover:shadow-md transition-shadow border border-gray-100 dark:border-gray-700 overflow-hidden">
                                        <div class="relative h-48 bg-gray-200 dark:bg-gray-700 overflow-hidden">
                                            {#if pet.coverImage}
                                                <img
                                                    src={pet.coverImage}
                                                    alt={pet.name}
                                                    class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                                />
                                            {:else}
                                                <div class="w-full h-full flex items-center justify-center bg-indigo-50 dark:bg-indigo-900/20">
                                                    <PawPrint class="w-12 h-12 text-indigo-200 dark:text-indigo-800" />
                                                </div>
                                            {/if}
                                            <div class="absolute top-2 right-2 flex gap-1.5">
                                                <!-- Status badge -->
                                                {#if pet.status}
                                                    <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium backdrop-blur-sm shadow-sm {
                                                        pet.status === 'adopted' ? 'bg-purple-100/90 dark:bg-purple-900/90 text-purple-700 dark:text-purple-300' :
                                                        pet.status === 'available' ? 'bg-green-100/90 dark:bg-green-900/90 text-green-700 dark:text-green-300' :
                                                        pet.status === 'pending' ? 'bg-amber-100/90 dark:bg-amber-900/90 text-amber-700 dark:text-amber-300' :
                                                        'bg-gray-100/90 dark:bg-gray-800/90 text-gray-700 dark:text-gray-300'
                                                    }">
                                                        {pet.status === 'adopted' ? 'Adopted' : pet.status === 'available' ? 'Available' : pet.status === 'pending' ? 'Pending' : 'N/A'}
                                                    </span>
                                                {/if}
                                                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-white/90 dark:bg-gray-800/90 text-gray-800 dark:text-gray-200 backdrop-blur-sm shadow-sm">
                                                    {pet.species?.label || pet.customSpecies || "Unknown"}
                                                </span>
                                            </div>
                                        </div>
                                        <div class="p-5">
                                            <div class="flex items-center justify-between">
                                                <h3 class="text-lg font-bold text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                                    {pet.name}
                                                </h3>
                                                {#if pet.gender && pet.gender !== 'unknown'}
                                                    <span class="text-sm {pet.gender === 'male' ? 'text-blue-500' : 'text-pink-500'}">
                                                        {pet.gender === 'male' ? '♂' : '♀'}
                                                    </span>
                                                {/if}
                                            </div>
                                            <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                                {pet.breed?.name || pet.customBreed || "Unknown breed"}
                                            </p>
                                            <!-- Age, Size info -->
                                            <div class="flex items-center gap-2 mt-1 text-xs text-gray-400 dark:text-gray-500">
                                                {#if pet.age}
                                                    <span>{pet.age} yrs</span>
                                                {/if}
                                                {#if pet.age && pet.size}
                                                    <span>•</span>
                                                {/if}
                                                {#if pet.size}
                                                    <span class="capitalize">{pet.size}</span>
                                                {/if}
                                            </div>
                                            {#if pet.description}
                                                <p class="text-sm text-gray-600 dark:text-gray-300 mt-2 line-clamp-2">
                                                    {stripHtml(pet.description)}
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
        </div>
    {/if}
</div>
