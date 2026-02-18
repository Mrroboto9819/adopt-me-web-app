<script lang="ts">
    import { auth } from "$lib/stores/auth.svelte";
    import { onMount } from "svelte";
    import { goto } from "$app/navigation";
    import { _ } from "$lib/i18n";
    import {
        ArrowLeft,
        Users,
        Search,
        Filter,
        RefreshCw,
        Loader2,
        User,
        Mail,
        Calendar,
        ChevronRight,
        Inbox,
        Shield,
        ShieldAlert,
        ShieldOff,
        BadgeCheck,
        AlertTriangle,
        Ban,
    } from "lucide-svelte";
    import UserDetailModal from "$lib/components/admin/UserDetailModal.svelte";

    interface UserData {
        id: string;
        email: string;
        firstName: string;
        lastName: string;
        fullName: string;
        profilePicture?: string;
        isActive: boolean;
        isBanned: boolean;
        banReason?: string;
        emailVerified: boolean;
        phoneVerified: boolean;
        warningCount: number;
        role: string;
        createdAt: string;
        updatedAt: string;
    }

    // State
    let users = $state<UserData[]>([]);
    let loading = $state(true);
    let selectedUser = $state<UserData | null>(null);
    let showDetail = $state(false);

    // Filters
    let searchQuery = $state("");
    let statusFilter = $state<"all" | "active" | "banned">("all");

    // Filter options
    const statusOptions = [
        { value: "all", label: "All Users" },
        { value: "active", label: "Active Only" },
        { value: "banned", label: "Banned Only" },
    ];

    // Fetch users
    async function fetchUsers() {
        loading = true;
        try {
            const variables: any = { limit: 100 };

            if (statusFilter === "banned") {
                variables.isBanned = true;
            } else if (statusFilter === "active") {
                variables.isActive = true;
                variables.isBanned = false;
            }

            if (searchQuery.trim()) {
                variables.search = searchQuery.trim();
            }

            const response = await fetch("/api/graphql", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${auth.token}`,
                },
                body: JSON.stringify({
                    query: `
                        query AdminUsers($search: String, $isBanned: Boolean, $isActive: Boolean, $limit: Int) {
                            adminUsers(search: $search, isBanned: $isBanned, isActive: $isActive, limit: $limit) {
                                id
                                email
                                firstName
                                lastName
                                fullName
                                profilePicture
                                isActive
                                isBanned
                                banReason
                                emailVerified
                                phoneVerified
                                warningCount
                                role
                                createdAt
                                updatedAt
                            }
                        }
                    `,
                    variables,
                }),
            });

            const result = await response.json();
            if (result.errors) {
                console.error("Failed to fetch users:", result.errors);
                return;
            }

            users = result.data.adminUsers;
        } catch (error) {
            console.error("Failed to fetch users:", error);
        } finally {
            loading = false;
        }
    }

    // Format relative time
    function formatRelativeTime(dateStr: string): string {
        const date = new Date(dateStr);
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 1) return "Just now";
        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        if (days < 7) return `${days}d ago`;
        return date.toLocaleDateString();
    }

    // Open user detail
    function openUser(user: UserData) {
        selectedUser = user;
        showDetail = true;
    }

    // Handle user update
    function handleUpdate(updatedUser: UserData) {
        users = users.map((u) => (u.id === updatedUser.id ? { ...u, ...updatedUser } : u));
    }

    // Debounced search
    let searchTimeout: ReturnType<typeof setTimeout>;
    function handleSearch() {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            fetchUsers();
        }, 300);
    }

    // Watch filters
    $effect(() => {
        statusFilter;
        if (auth.token) {
            fetchUsers();
        }
    });

    onMount(() => {
        if (auth.token) {
            fetchUsers();
        }
    });
</script>

<svelte:head>
    <title>Users - Admin - AdoptMe</title>
</svelte:head>

<div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <div class="max-w-7xl mx-auto px-4 py-8">
        <!-- Header -->
        <div class="flex items-center gap-4 mb-8">
            <button
                onclick={() => goto("/admin")}
                class="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
                <ArrowLeft class="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>
            <div class="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl flex items-center justify-center">
                <Users class="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
                <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Users</h1>
                <p class="text-sm text-gray-500 dark:text-gray-400">
                    Manage user accounts, warnings, and bans
                </p>
            </div>
        </div>

        <!-- Filters -->
        <div class="bg-white dark:bg-gray-800 rounded-2xl p-4 mb-6 shadow-sm border border-gray-100 dark:border-gray-700">
            <div class="flex flex-wrap items-center gap-4">
                <!-- Search -->
                <div class="flex-1 min-w-[200px] max-w-md relative">
                    <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search by name or email..."
                        bind:value={searchQuery}
                        oninput={handleSearch}
                        class="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-700 dark:text-gray-300 placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                </div>

                <div class="flex items-center gap-2 text-gray-500">
                    <Filter class="w-4 h-4" />
                    <span class="text-sm font-medium">Status:</span>
                </div>

                <select
                    bind:value={statusFilter}
                    class="px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-700 dark:text-gray-300 focus:ring-2 focus:ring-indigo-500"
                >
                    {#each statusOptions as option}
                        <option value={option.value}>{option.label}</option>
                    {/each}
                </select>

                <button
                    onclick={fetchUsers}
                    disabled={loading}
                    class="ml-auto flex items-center gap-2 px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                >
                    <RefreshCw class="w-4 h-4 {loading ? 'animate-spin' : ''}" />
                    Refresh
                </button>
            </div>
        </div>

        <!-- Users List -->
        {#if loading}
            <div class="flex items-center justify-center py-20">
                <Loader2 class="w-8 h-8 text-indigo-500 animate-spin" />
            </div>
        {:else if users.length === 0}
            <div class="text-center py-20">
                <div class="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
                    <Inbox class="w-8 h-8 text-gray-400" />
                </div>
                <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-1">No users found</h3>
                <p class="text-gray-500 dark:text-gray-400">Try adjusting your search or filters</p>
            </div>
        {:else}
            <div class="space-y-3">
                {#each users as user}
                    <button
                        onclick={() => openUser(user)}
                        class="w-full text-left bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md hover:border-gray-200 dark:hover:border-gray-600 transition-all group"
                    >
                        <div class="flex items-center gap-4">
                            <!-- Avatar -->
                            {#if user.profilePicture}
                                <img
                                    src={user.profilePicture}
                                    alt=""
                                    class="w-12 h-12 rounded-full object-cover ring-2 ring-gray-100 dark:ring-gray-700"
                                />
                            {:else}
                                <div class="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg">
                                    {user.firstName?.[0]?.toUpperCase() || "?"}
                                </div>
                            {/if}

                            <!-- Content -->
                            <div class="flex-1 min-w-0">
                                <div class="flex flex-wrap items-center gap-2 mb-1">
                                    <span class="font-semibold text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                                        {user.fullName}
                                    </span>

                                    <!-- Status badges -->
                                    {#if user.isBanned}
                                        <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                                            <Ban class="w-3 h-3" />
                                            Banned
                                        </span>
                                    {:else if !user.isActive}
                                        <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400">
                                            Deactivated
                                        </span>
                                    {/if}

                                    {#if user.emailVerified || user.phoneVerified}
                                        <BadgeCheck class="w-4 h-4 text-blue-500" />
                                    {/if}

                                    {#if user.warningCount > 0}
                                        <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                                            <AlertTriangle class="w-3 h-3" />
                                            {user.warningCount} warning{user.warningCount > 1 ? "s" : ""}
                                        </span>
                                    {/if}

                                    {#if user.role === "admin"}
                                        <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
                                            <Shield class="w-3 h-3" />
                                            Admin
                                        </span>
                                    {/if}
                                </div>

                                <div class="flex flex-wrap items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                                    <!-- Email -->
                                    <div class="flex items-center gap-1">
                                        <Mail class="w-3 h-3" />
                                        <span>{user.email}</span>
                                    </div>

                                    <!-- Date -->
                                    <div class="flex items-center gap-1">
                                        <Calendar class="w-3 h-3" />
                                        <span>Joined {formatRelativeTime(user.createdAt)}</span>
                                    </div>
                                </div>
                            </div>

                            <!-- Arrow -->
                            <ChevronRight class="w-5 h-5 text-gray-400 group-hover:text-indigo-500 group-hover:translate-x-1 transition-all flex-shrink-0" />
                        </div>
                    </button>
                {/each}
            </div>
        {/if}
    </div>
</div>

<!-- Detail Modal -->
<UserDetailModal
    bind:open={showDetail}
    user={selectedUser}
    onClose={() => {
        showDetail = false;
        selectedUser = null;
    }}
    onUpdate={handleUpdate}
/>
