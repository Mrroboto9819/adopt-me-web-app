<script lang="ts">
    import Modal from "$lib/components/Modal.svelte";
    import { auth } from "$lib/stores/auth.svelte";
    import { toast } from "$lib/stores/toast.svelte";
    import {
        X,
        User,
        Mail,
        Calendar,
        ExternalLink,
        Save,
        Loader2,
        Shield,
        ShieldAlert,
        ShieldOff,
        BadgeCheck,
        AlertTriangle,
        Ban,
        UserCheck,
        Plus,
        Trash2,
        Phone,
        MapPin,
    } from "lucide-svelte";

    interface UserWarning {
        id: string;
        reason: string;
        reportId?: string;
        issuedAt: string;
        acknowledged: boolean;
    }

    interface UserData {
        id: string;
        email: string;
        firstName: string;
        lastName: string;
        fullName: string;
        profilePicture?: string;
        coverImage?: string;
        isActive: boolean;
        isBanned: boolean;
        banReason?: string;
        emailVerified: boolean;
        phoneVerified: boolean;
        phone?: string;
        warningCount: number;
        warnings?: UserWarning[];
        role: string;
        createdAt: string;
        updatedAt: string;
        address?: {
            city?: string;
            state?: string;
            country?: string;
        };
    }

    interface Props {
        open: boolean;
        user: UserData | null;
        onClose: () => void;
        onUpdate: (user: UserData) => void;
    }

    let { open = $bindable(), user, onClose, onUpdate }: Props = $props();

    // State
    let loading = $state(false);
    let banReason = $state("");
    let showBanConfirm = $state(false);
    let showUnbanConfirm = $state(false);
    let showAddWarning = $state(false);
    let warningReason = $state("");
    let fullUserData = $state<UserData | null>(null);

    // Fetch full user data with warnings
    async function fetchFullUser() {
        if (!user) return;

        try {
            const response = await fetch("/api/graphql", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${auth.token}`,
                },
                body: JSON.stringify({
                    query: `
                        query AdminUser($id: ID!) {
                            adminUser(id: $id) {
                                id
                                email
                                firstName
                                lastName
                                fullName
                                profilePicture
                                coverImage
                                isActive
                                isBanned
                                banReason
                                emailVerified
                                phoneVerified
                                phone
                                warningCount
                                warnings {
                                    id
                                    reason
                                    reportId
                                    issuedAt
                                    acknowledged
                                }
                                role
                                createdAt
                                updatedAt
                                address {
                                    city
                                    state
                                    country
                                }
                            }
                        }
                    `,
                    variables: { id: user.id },
                }),
            });

            const result = await response.json();
            if (result.data?.adminUser) {
                fullUserData = result.data.adminUser;
            }
        } catch (error) {
            console.error("Failed to fetch user details:", error);
        }
    }

    // Watch for user changes
    $effect(() => {
        if (user && open) {
            fullUserData = null;
            fetchFullUser();
        }
    });

    // Format date
    function formatDate(dateStr: string): string {
        const date = new Date(dateStr);
        return date.toLocaleDateString(undefined, {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    }

    // Ban user
    async function handleBan() {
        if (!user) return;
        loading = true;

        try {
            const response = await fetch("/api/graphql", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${auth.token}`,
                },
                body: JSON.stringify({
                    query: `
                        mutation AdminBanUser($id: ID!, $reason: String) {
                            adminBanUser(id: $id, reason: $reason) {
                                id
                                isBanned
                                banReason
                            }
                        }
                    `,
                    variables: {
                        id: user.id,
                        reason: banReason || undefined,
                    },
                }),
            });

            const result = await response.json();
            if (result.errors) {
                throw new Error(result.errors[0].message);
            }

            toast.success("User banned successfully");
            onUpdate({ ...user, isBanned: true, banReason });
            showBanConfirm = false;
            banReason = "";

            // Refresh full data
            fetchFullUser();
        } catch (error: any) {
            toast.error("Failed to ban user: " + error.message);
        } finally {
            loading = false;
        }
    }

    // Unban user
    async function handleUnban() {
        if (!user) return;
        loading = true;

        try {
            const response = await fetch("/api/graphql", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${auth.token}`,
                },
                body: JSON.stringify({
                    query: `
                        mutation AdminUnbanUser($id: ID!) {
                            adminUnbanUser(id: $id) {
                                id
                                isBanned
                                banReason
                            }
                        }
                    `,
                    variables: { id: user.id },
                }),
            });

            const result = await response.json();
            if (result.errors) {
                throw new Error(result.errors[0].message);
            }

            toast.success("User unbanned successfully");
            onUpdate({ ...user, isBanned: false, banReason: undefined });
            showUnbanConfirm = false;

            // Refresh full data
            fetchFullUser();
        } catch (error: any) {
            toast.error("Failed to unban user: " + error.message);
        } finally {
            loading = false;
        }
    }

    // Add warning
    async function handleAddWarning() {
        if (!user || !warningReason.trim()) return;
        loading = true;

        try {
            const response = await fetch("/api/graphql", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${auth.token}`,
                },
                body: JSON.stringify({
                    query: `
                        mutation AdminWarnUser($id: ID!, $reason: String!) {
                            adminWarnUser(id: $id, reason: $reason) {
                                id
                                warningCount
                                warnings {
                                    id
                                    reason
                                    issuedAt
                                    acknowledged
                                }
                            }
                        }
                    `,
                    variables: {
                        id: user.id,
                        reason: warningReason,
                    },
                }),
            });

            const result = await response.json();
            if (result.errors) {
                throw new Error(result.errors[0].message);
            }

            toast.success("Warning added successfully");
            const updatedData = result.data.adminWarnUser;
            onUpdate({ ...user, warningCount: updatedData.warningCount });
            showAddWarning = false;
            warningReason = "";

            // Refresh full data
            fetchFullUser();
        } catch (error: any) {
            toast.error("Failed to add warning: " + error.message);
        } finally {
            loading = false;
        }
    }

    // Remove warning
    async function handleRemoveWarning(warningId: string) {
        if (!user) return;
        loading = true;

        try {
            const response = await fetch("/api/graphql", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${auth.token}`,
                },
                body: JSON.stringify({
                    query: `
                        mutation AdminRemoveWarning($userId: ID!, $warningId: ID!) {
                            adminRemoveWarning(userId: $userId, warningId: $warningId) {
                                id
                                warningCount
                                warnings {
                                    id
                                    reason
                                    issuedAt
                                    acknowledged
                                }
                            }
                        }
                    `,
                    variables: {
                        userId: user.id,
                        warningId,
                    },
                }),
            });

            const result = await response.json();
            if (result.errors) {
                throw new Error(result.errors[0].message);
            }

            toast.success("Warning removed");
            const updatedData = result.data.adminRemoveWarning;
            onUpdate({ ...user, warningCount: updatedData.warningCount });

            // Refresh full data
            fetchFullUser();
        } catch (error: any) {
            toast.error("Failed to remove warning: " + error.message);
        } finally {
            loading = false;
        }
    }

    // Get display user data (prefer full data if available)
    let displayUser = $derived(fullUserData || user);
</script>

<Modal bind:open onClose={onClose} maxWidth="max-w-2xl" hideHeader={true} noPadding={true}>
    {#if displayUser}
        <div class="max-h-[85vh] overflow-y-auto">
            <!-- Cover/Header -->
            <div class="relative h-32 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500">
                {#if displayUser.coverImage}
                    <img
                        src={displayUser.coverImage}
                        alt=""
                        class="w-full h-full object-cover"
                    />
                {/if}
                <button
                    onclick={onClose}
                    class="absolute top-4 right-4 p-2 bg-black/30 hover:bg-black/50 rounded-full text-white transition-colors"
                >
                    <X class="w-5 h-5" />
                </button>
            </div>

            <!-- Profile Section -->
            <div class="px-6 pb-6">
                <!-- Avatar -->
                <div class="relative -mt-12 mb-4">
                    {#if displayUser.profilePicture}
                        <img
                            src={displayUser.profilePicture}
                            alt=""
                            class="w-24 h-24 rounded-full object-cover border-4 border-white dark:border-gray-800"
                        />
                    {:else}
                        <div class="w-24 h-24 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-3xl border-4 border-white dark:border-gray-800">
                            {displayUser.firstName?.[0]?.toUpperCase() || "?"}
                        </div>
                    {/if}
                </div>

                <!-- Name & Status -->
                <div class="mb-6">
                    <div class="flex flex-wrap items-center gap-2 mb-2">
                        <h2 class="text-xl font-bold text-gray-900 dark:text-white">
                            {displayUser.fullName}
                        </h2>

                        {#if displayUser.isBanned}
                            <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                                <Ban class="w-3 h-3" />
                                Banned
                            </span>
                        {:else if !displayUser.isActive}
                            <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400">
                                Deactivated
                            </span>
                        {:else}
                            <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                                <UserCheck class="w-3 h-3" />
                                Active
                            </span>
                        {/if}

                        {#if displayUser.emailVerified || displayUser.phoneVerified}
                            <BadgeCheck class="w-5 h-5 text-blue-500" />
                        {/if}

                        {#if displayUser.role === "admin"}
                            <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
                                <Shield class="w-3 h-3" />
                                Admin
                            </span>
                        {/if}
                    </div>

                    {#if displayUser.isBanned && displayUser.banReason}
                        <div class="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-700 dark:text-red-400 mb-4">
                            <strong>Ban Reason:</strong> {displayUser.banReason}
                        </div>
                    {/if}

                    <!-- Contact Info -->
                    <div class="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                        <div class="flex items-center gap-2">
                            <Mail class="w-4 h-4" />
                            <span>{displayUser.email}</span>
                            {#if displayUser.emailVerified}
                                <span class="text-xs text-green-600 dark:text-green-400">(Verified)</span>
                            {/if}
                        </div>

                        {#if displayUser.phone}
                            <div class="flex items-center gap-2">
                                <Phone class="w-4 h-4" />
                                <span>{displayUser.phone}</span>
                                {#if displayUser.phoneVerified}
                                    <span class="text-xs text-green-600 dark:text-green-400">(Verified)</span>
                                {/if}
                            </div>
                        {/if}

                        {#if displayUser.address?.city || displayUser.address?.country}
                            <div class="flex items-center gap-2">
                                <MapPin class="w-4 h-4" />
                                <span>
                                    {[displayUser.address?.city, displayUser.address?.state, displayUser.address?.country]
                                        .filter(Boolean)
                                        .join(", ")}
                                </span>
                            </div>
                        {/if}

                        <div class="flex items-center gap-2">
                            <Calendar class="w-4 h-4" />
                            <span>Joined {formatDate(displayUser.createdAt)}</span>
                        </div>
                    </div>
                </div>

                <!-- View Profile Link -->
                <a
                    href="/user/{displayUser.id}"
                    target="_blank"
                    class="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 text-sm font-medium transition-colors mb-6"
                >
                    <ExternalLink class="w-4 h-4" />
                    View Public Profile
                </a>

                <!-- Warnings Section -->
                <div class="mb-6">
                    <div class="flex items-center justify-between mb-3">
                        <h3 class="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                            <AlertTriangle class="w-4 h-4 text-amber-500" />
                            Warnings ({displayUser.warningCount || 0})
                        </h3>
                        {#if displayUser.role !== "admin"}
                            <button
                                onclick={() => showAddWarning = true}
                                class="flex items-center gap-1 px-3 py-1 text-xs font-medium text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/30 rounded-lg hover:bg-amber-200 dark:hover:bg-amber-900/50 transition-colors"
                            >
                                <Plus class="w-3 h-3" />
                                Add Warning
                            </button>
                        {/if}
                    </div>

                    {#if fullUserData?.warnings && fullUserData.warnings.length > 0}
                        <div class="space-y-2">
                            {#each fullUserData.warnings as warning}
                                <div class="flex items-start gap-3 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                                    <AlertTriangle class="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                                    <div class="flex-1 min-w-0">
                                        <p class="text-sm text-gray-700 dark:text-gray-300">{warning.reason}</p>
                                        <p class="text-xs text-gray-500 mt-1">{formatDate(warning.issuedAt)}</p>
                                    </div>
                                    <button
                                        onclick={() => handleRemoveWarning(warning.id)}
                                        disabled={loading}
                                        class="p-1 text-gray-400 hover:text-red-500 transition-colors"
                                    >
                                        <Trash2 class="w-4 h-4" />
                                    </button>
                                </div>
                            {/each}
                        </div>
                    {:else}
                        <p class="text-sm text-gray-500 dark:text-gray-400 italic">No warnings</p>
                    {/if}
                </div>

                <!-- Admin Actions -->
                {#if displayUser.role !== "admin"}
                    <div class="border-t border-gray-200 dark:border-gray-700 pt-6">
                        <h3 class="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Admin Actions</h3>

                        <div class="flex flex-wrap gap-3">
                            {#if displayUser.isBanned}
                                <button
                                    onclick={() => showUnbanConfirm = true}
                                    disabled={loading}
                                    class="flex items-center gap-2 px-4 py-2 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-lg hover:bg-green-200 dark:hover:bg-green-900/50 text-sm font-medium transition-colors disabled:opacity-50"
                                >
                                    <UserCheck class="w-4 h-4" />
                                    Unban User
                                </button>
                            {:else}
                                <button
                                    onclick={() => showBanConfirm = true}
                                    disabled={loading}
                                    class="flex items-center gap-2 px-4 py-2 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 text-sm font-medium transition-colors disabled:opacity-50"
                                >
                                    <Ban class="w-4 h-4" />
                                    Ban User
                                </button>
                            {/if}
                        </div>
                    </div>
                {/if}
            </div>
        </div>
    {/if}
</Modal>

<!-- Ban Confirmation Modal -->
{#if showBanConfirm}
    <div class="fixed inset-0 z-[60] flex items-center justify-center bg-black/50">
        <div class="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-md mx-4 shadow-xl">
            <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-2">Ban User?</h3>
            <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">
                This will prevent {displayUser?.firstName} from logging in. They can be unbanned later.
            </p>

            <div class="mb-4">
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Reason (optional)
                </label>
                <textarea
                    bind:value={banReason}
                    placeholder="Enter reason for ban..."
                    rows="2"
                    class="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-red-500 focus:border-red-500 resize-none text-sm"
                ></textarea>
            </div>

            <div class="flex gap-3 justify-end">
                <button
                    onclick={() => { showBanConfirm = false; banReason = ""; }}
                    class="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-sm font-medium"
                >
                    Cancel
                </button>
                <button
                    onclick={handleBan}
                    disabled={loading}
                    class="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium disabled:opacity-50"
                >
                    {#if loading}
                        <Loader2 class="w-4 h-4 animate-spin" />
                    {:else}
                        <Ban class="w-4 h-4" />
                    {/if}
                    Ban User
                </button>
            </div>
        </div>
    </div>
{/if}

<!-- Unban Confirmation Modal -->
{#if showUnbanConfirm}
    <div class="fixed inset-0 z-[60] flex items-center justify-center bg-black/50">
        <div class="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-sm mx-4 shadow-xl">
            <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-2">Unban User?</h3>
            <p class="text-sm text-gray-600 dark:text-gray-400 mb-6">
                This will restore {displayUser?.firstName}'s access to their account.
            </p>
            <div class="flex gap-3 justify-end">
                <button
                    onclick={() => showUnbanConfirm = false}
                    class="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-sm font-medium"
                >
                    Cancel
                </button>
                <button
                    onclick={handleUnban}
                    disabled={loading}
                    class="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium disabled:opacity-50"
                >
                    {#if loading}
                        <Loader2 class="w-4 h-4 animate-spin" />
                    {:else}
                        <UserCheck class="w-4 h-4" />
                    {/if}
                    Unban User
                </button>
            </div>
        </div>
    </div>
{/if}

<!-- Add Warning Modal -->
{#if showAddWarning}
    <div class="fixed inset-0 z-[60] flex items-center justify-center bg-black/50">
        <div class="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-md mx-4 shadow-xl">
            <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-2">Add Warning</h3>
            <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Add a warning/strike to {displayUser?.firstName}'s account.
            </p>

            <div class="mb-4">
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Reason <span class="text-red-500">*</span>
                </label>
                <textarea
                    bind:value={warningReason}
                    placeholder="Enter reason for warning..."
                    rows="3"
                    class="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 resize-none text-sm"
                ></textarea>
            </div>

            <div class="flex gap-3 justify-end">
                <button
                    onclick={() => { showAddWarning = false; warningReason = ""; }}
                    class="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-sm font-medium"
                >
                    Cancel
                </button>
                <button
                    onclick={handleAddWarning}
                    disabled={loading || !warningReason.trim()}
                    class="flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-sm font-medium disabled:opacity-50"
                >
                    {#if loading}
                        <Loader2 class="w-4 h-4 animate-spin" />
                    {:else}
                        <AlertTriangle class="w-4 h-4" />
                    {/if}
                    Add Warning
                </button>
            </div>
        </div>
    </div>
{/if}
