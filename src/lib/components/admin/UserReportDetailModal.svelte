<script lang="ts">
    import Modal from "$lib/components/Modal.svelte";
    import StatusBadge from "./StatusBadge.svelte";
    import { auth } from "$lib/stores/auth.svelte";
    import { toast } from "$lib/stores/toast.svelte";
    import { _ } from "$lib/i18n";
    import {
        X,
        User,
        Calendar,
        ExternalLink,
        Save,
        Trash2,
        Loader2,
        UserX,
        Mail,
        BadgeCheck,
        AlertTriangle,
        Ban,
        ShieldAlert,
        Gavel,
        Clock,
    } from "lucide-svelte";

    interface UserReport {
        id: string;
        reasons: string[];
        description?: string;
        status: string;
        adminNotes?: string;
        createdAt: string;
        reporter: {
            id: string;
            firstName: string;
            lastName: string;
            fullName: string;
            email: string;
            profilePicture?: string;
            emailVerified?: boolean;
            phoneVerified?: boolean;
        };
        reportedUser: {
            id: string;
            firstName: string;
            lastName: string;
            fullName: string;
            email: string;
            profilePicture?: string;
            emailVerified?: boolean;
            phoneVerified?: boolean;
            isBanned?: boolean;
            warningCount?: number;
            createdAt: string;
        };
        reviewedBy?: {
            id: string;
            firstName: string;
            lastName: string;
        };
        reviewedAt?: string;
    }

    interface Props {
        open: boolean;
        report: UserReport | null;
        onClose: () => void;
        onUpdate: (report: UserReport) => void;
        onDelete: (id: string) => void;
    }

    let { open = $bindable(), report, onClose, onUpdate, onDelete }: Props = $props();

    // Form state
    let status = $state("");
    let adminNotes = $state("");
    let saving = $state(false);
    let deleting = $state(false);
    let showDeleteConfirm = $state(false);

    // Quick action modals
    let showWarnUserConfirm = $state(false);
    let showBanUserConfirm = $state(false);
    let warningReason = $state("");
    let banReason = $state("");
    let actionLoading = $state(false);

    // Status options
    const statusOptions = [
        { value: "pending", label: "Pending" },
        { value: "reviewed", label: "Reviewed" },
        { value: "resolved", label: "Resolved" },
        { value: "dismissed", label: "Dismissed" },
    ];

    // Reason labels
    const reasonLabels: Record<string, { label: string; color: string }> = {
        harassment: { label: "Harassment", color: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400" },
        spam: { label: "Spam", color: "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300" },
        scam: { label: "Scam", color: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400" },
        fake_profile: { label: "Fake Profile", color: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400" },
        impersonation: { label: "Impersonation", color: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400" },
        inappropriate_content: { label: "Inappropriate", color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" },
        animal_abuse: { label: "Animal Abuse", color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" },
        threats: { label: "Threats", color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" },
        other: { label: "Other", color: "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300" },
    };

    // Initialize form when report changes
    $effect(() => {
        if (report) {
            status = report.status;
            adminNotes = report.adminNotes || "";
        }
    });

    // Format date
    function formatDate(dateStr: string): string {
        return new Date(dateStr).toLocaleDateString(undefined, {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    }

    // Strip HTML
    function stripHtml(html: string): string {
        return html.replace(/<[^>]*>/g, "").trim();
    }

    // Quick status set
    async function quickSetStatus(newStatus: string) {
        status = newStatus;
        await handleSave();
    }

    // Save report
    async function handleSave() {
        if (!report) return;
        saving = true;

        try {
            const response = await fetch("/api/graphql", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${auth.token}`,
                },
                body: JSON.stringify({
                    query: `
                        mutation UpdateUserReport($id: ID!, $status: ReportStatus, $adminNotes: String) {
                            updateUserReport(id: $id, status: $status, adminNotes: $adminNotes) {
                                id
                                status
                                adminNotes
                                reviewedBy {
                                    id
                                    firstName
                                    lastName
                                }
                                reviewedAt
                            }
                        }
                    `,
                    variables: {
                        id: report.id,
                        status,
                        adminNotes,
                    },
                }),
            });

            const result = await response.json();
            if (result.errors) {
                throw new Error(result.errors[0].message);
            }

            toast.success("Report updated successfully");
            onUpdate({ ...report, ...result.data.updateUserReport });
        } catch (error: any) {
            toast.error("Failed to update: " + error.message);
        } finally {
            saving = false;
        }
    }

    // Delete report
    async function handleDelete() {
        if (!report) return;
        deleting = true;

        try {
            const response = await fetch("/api/graphql", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${auth.token}`,
                },
                body: JSON.stringify({
                    query: `
                        mutation DeleteUserReport($id: ID!) {
                            deleteUserReport(id: $id)
                        }
                    `,
                    variables: { id: report.id },
                }),
            });

            const result = await response.json();
            if (result.errors) {
                throw new Error(result.errors[0].message);
            }

            toast.success("Report deleted");
            onDelete(report.id);
            onClose();
        } catch (error: any) {
            toast.error("Failed to delete: " + error.message);
        } finally {
            deleting = false;
            showDeleteConfirm = false;
        }
    }

    // Quick action: Warn User
    async function handleWarnUser() {
        if (!report) return;
        actionLoading = true;

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
                            }
                        }
                    `,
                    variables: {
                        id: report.reportedUser.id,
                        reason: warningReason || `Warning issued for user report: ${report.reasons.join(", ")}`,
                    },
                }),
            });

            const result = await response.json();
            if (result.errors) {
                throw new Error(result.errors[0].message);
            }

            toast.success("Warning added to user");
            showWarnUserConfirm = false;
            warningReason = "";

            // Auto-resolve the report
            status = "resolved";
            adminNotes = adminNotes ? `${adminNotes}\n[Action: User warned]` : "[Action: User warned]";
            await handleSave();
        } catch (error: any) {
            toast.error("Failed to warn user: " + error.message);
        } finally {
            actionLoading = false;
        }
    }

    // Quick action: Ban User
    async function handleBanUser() {
        if (!report) return;
        actionLoading = true;

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
                            }
                        }
                    `,
                    variables: {
                        id: report.reportedUser.id,
                        reason: banReason || `Banned due to user report: ${report.reasons.join(", ")}`,
                    },
                }),
            });

            const result = await response.json();
            if (result.errors) {
                throw new Error(result.errors[0].message);
            }

            toast.success("User has been banned");
            showBanUserConfirm = false;
            banReason = "";

            // Auto-resolve the report
            status = "resolved";
            adminNotes = adminNotes ? `${adminNotes}\n[Action: User banned]` : "[Action: User banned]";
            await handleSave();
        } catch (error: any) {
            toast.error("Failed to ban user: " + error.message);
        } finally {
            actionLoading = false;
        }
    }
</script>

<Modal bind:open onClose={onClose} maxWidth="max-w-3xl" hideHeader={true} noPadding={true}>
    {#if report}
        <div class="max-h-[85vh] overflow-y-auto">
            <div class="p-6">
                <!-- Header -->
                <div class="flex items-start justify-between mb-6">
                    <div>
                        <div class="flex items-center gap-2 mb-2">
                            <UserX class="w-5 h-5 text-orange-500" />
                            <h2 class="text-xl font-bold text-gray-900 dark:text-white">User Report</h2>
                            <StatusBadge status={report.status} type="report" />
                        </div>
                        <p class="text-sm text-gray-500 dark:text-gray-400">
                            Reported {formatDate(report.createdAt)}
                        </p>
                    </div>
                    <button
                        onclick={onClose}
                        class="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    >
                        <X class="w-5 h-5" />
                    </button>
                </div>

                <!-- Reasons -->
                <div class="flex flex-wrap gap-2 mb-6">
                    {#each report.reasons as reason}
                        {@const config = reasonLabels[reason] || reasonLabels.other}
                        <span class="px-3 py-1 rounded-full text-sm font-medium {config.color}">
                            {config.label}
                        </span>
                    {/each}
                </div>

                <!-- Reported User Card -->
                <div class="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-xl p-4 mb-6">
                    <h3 class="text-sm font-semibold text-orange-800 dark:text-orange-300 mb-3 flex items-center gap-2">
                        <User class="w-4 h-4" />
                        Reported User
                    </h3>
                    <div class="flex items-center gap-4">
                        {#if report.reportedUser.profilePicture}
                            <img
                                src={report.reportedUser.profilePicture}
                                alt=""
                                class="w-14 h-14 rounded-full object-cover ring-2 ring-white dark:ring-gray-700"
                            />
                        {:else}
                            <div class="w-14 h-14 rounded-full bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center text-white font-bold text-lg">
                                {report.reportedUser.firstName?.[0]?.toUpperCase() || "?"}
                            </div>
                        {/if}
                        <div class="flex-1">
                            <div class="flex items-center gap-2 mb-1">
                                <span class="font-semibold text-gray-900 dark:text-white">
                                    {report.reportedUser.fullName}
                                </span>
                                {#if report.reportedUser.emailVerified || report.reportedUser.phoneVerified}
                                    <BadgeCheck class="w-4 h-4 text-blue-500" />
                                {/if}
                                {#if report.reportedUser.isBanned}
                                    <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                                        <Ban class="w-3 h-3" />
                                        Banned
                                    </span>
                                {/if}
                                {#if (report.reportedUser.warningCount || 0) > 0}
                                    <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                                        <AlertTriangle class="w-3 h-3" />
                                        {report.reportedUser.warningCount}
                                    </span>
                                {/if}
                            </div>
                            <div class="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                                <div class="flex items-center gap-1">
                                    <Mail class="w-3 h-3" />
                                    {report.reportedUser.email}
                                </div>
                            </div>
                            <div class="flex items-center gap-1 text-xs text-gray-500 mt-1">
                                <Clock class="w-3 h-3" />
                                Joined {formatDate(report.reportedUser.createdAt)}
                            </div>
                        </div>
                        <a
                            href="/profile/{report.reportedUser.id}"
                            target="_blank"
                            class="p-2 text-gray-400 hover:text-indigo-600 transition-colors"
                            title="View profile"
                        >
                            <ExternalLink class="w-5 h-5" />
                        </a>
                    </div>
                </div>

                <!-- Reporter Info -->
                <div class="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 mb-6">
                    <h3 class="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Reported By</h3>
                    <div class="flex items-center gap-3">
                        {#if report.reporter.profilePicture}
                            <img
                                src={report.reporter.profilePicture}
                                alt=""
                                class="w-10 h-10 rounded-full object-cover"
                            />
                        {:else}
                            <div class="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold">
                                {report.reporter.firstName?.[0]?.toUpperCase() || "?"}
                            </div>
                        {/if}
                        <div>
                            <div class="flex items-center gap-2">
                                <span class="font-medium text-gray-900 dark:text-white">
                                    {report.reporter.fullName}
                                </span>
                                {#if report.reporter.emailVerified || report.reporter.phoneVerified}
                                    <BadgeCheck class="w-3.5 h-3.5 text-blue-500" />
                                {/if}
                            </div>
                            <span class="text-sm text-gray-500 dark:text-gray-400">{report.reporter.email}</span>
                        </div>
                    </div>
                </div>

                <!-- Description -->
                {#if report.description}
                    <div class="mb-6">
                        <h3 class="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Additional Details</h3>
                        <div class="prose prose-sm dark:prose-invert max-w-none text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                            {@html report.description}
                        </div>
                    </div>
                {/if}

                <!-- Admin Actions -->
                <div class="border-t border-gray-200 dark:border-gray-700 pt-6">
                    <h3 class="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Admin Actions</h3>

                    <!-- Status Quick Actions -->
                    <div class="mb-4">
                        <p class="text-xs text-gray-500 dark:text-gray-400 mb-2">Status Actions:</p>
                        <div class="flex flex-wrap gap-2">
                            <button
                                onclick={() => quickSetStatus("dismissed")}
                                disabled={saving || status === "dismissed"}
                                class="px-3 py-1.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 text-sm font-medium"
                            >
                                Dismiss
                            </button>
                            <button
                                onclick={() => quickSetStatus("reviewed")}
                                disabled={saving || status === "reviewed"}
                                class="px-3 py-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/50 disabled:opacity-50 text-sm font-medium"
                            >
                                Mark Reviewed
                            </button>
                            <button
                                onclick={() => quickSetStatus("resolved")}
                                disabled={saving || status === "resolved"}
                                class="px-3 py-1.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-lg hover:bg-green-200 dark:hover:bg-green-900/50 disabled:opacity-50 text-sm font-medium"
                            >
                                Resolve
                            </button>
                        </div>
                    </div>

                    <!-- Moderation Quick Actions -->
                    <div class="mb-4 p-4 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 rounded-xl">
                        <p class="text-xs font-medium text-amber-700 dark:text-amber-400 mb-3 flex items-center gap-1">
                            <Gavel class="w-3 h-3" />
                            Moderation Actions:
                        </p>
                        <div class="flex flex-wrap gap-2">
                            <button
                                onclick={() => showWarnUserConfirm = true}
                                disabled={actionLoading}
                                class="flex items-center gap-1.5 px-3 py-1.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded-lg hover:bg-amber-200 dark:hover:bg-amber-900/50 disabled:opacity-50 text-sm font-medium transition-colors"
                            >
                                <ShieldAlert class="w-3.5 h-3.5" />
                                Warn User
                            </button>
                            <button
                                onclick={() => showBanUserConfirm = true}
                                disabled={actionLoading || report.reportedUser.isBanned}
                                class="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 text-sm font-medium transition-colors"
                            >
                                <Ban class="w-3.5 h-3.5" />
                                Ban User
                            </button>
                        </div>
                        <p class="text-xs text-gray-500 dark:text-gray-400 mt-2 italic">
                            These actions auto-resolve the report
                        </p>
                    </div>

                    <!-- Status Dropdown -->
                    <div class="mb-4">
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Status
                        </label>
                        <select
                            bind:value={status}
                            class="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        >
                            {#each statusOptions as option}
                                <option value={option.value}>{option.label}</option>
                            {/each}
                        </select>
                    </div>

                    <!-- Admin Notes -->
                    <div class="mb-4">
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Admin Notes
                        </label>
                        <textarea
                            bind:value={adminNotes}
                            placeholder="Add internal notes about this report..."
                            rows="3"
                            class="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
                        ></textarea>
                    </div>

                    <!-- Review Info -->
                    {#if report.reviewedBy}
                        <div class="text-sm text-gray-500 dark:text-gray-400 mb-4">
                            Last reviewed by <span class="font-medium">{report.reviewedBy.firstName} {report.reviewedBy.lastName}</span>
                            {#if report.reviewedAt}
                                on {formatDate(report.reviewedAt)}
                            {/if}
                        </div>
                    {/if}
                </div>
            </div>

            <!-- Footer Actions -->
            <div class="sticky bottom-0 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between">
                {#if showDeleteConfirm}
                    <div class="flex items-center gap-2">
                        <span class="text-sm text-gray-600 dark:text-gray-400">Delete this report?</span>
                        <button
                            onclick={handleDelete}
                            disabled={deleting}
                            class="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg disabled:opacity-50 flex items-center gap-1"
                        >
                            {#if deleting}
                                <Loader2 class="w-4 h-4 animate-spin" />
                            {/if}
                            Yes, Delete
                        </button>
                        <button
                            onclick={() => showDeleteConfirm = false}
                            class="px-3 py-1.5 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 text-sm font-medium rounded-lg"
                        >
                            Cancel
                        </button>
                    </div>
                {:else}
                    <button
                        onclick={() => showDeleteConfirm = true}
                        class="flex items-center gap-2 px-3 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-sm font-medium transition-colors"
                    >
                        <Trash2 class="w-4 h-4" />
                        Delete
                    </button>
                {/if}

                <button
                    onclick={handleSave}
                    disabled={saving}
                    class="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium disabled:opacity-50 transition-colors"
                >
                    {#if saving}
                        <Loader2 class="w-4 h-4 animate-spin" />
                    {:else}
                        <Save class="w-4 h-4" />
                    {/if}
                    Save Changes
                </button>
            </div>
        </div>
    {/if}
</Modal>

<!-- Warn User Confirmation Modal -->
{#if showWarnUserConfirm}
    <div class="fixed inset-0 z-[60] flex items-center justify-center bg-black/50">
        <div class="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-md mx-4 shadow-xl">
            <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                <ShieldAlert class="w-5 h-5 text-amber-500" />
                Warn User?
            </h3>
            <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Add a warning/strike to <strong>{report?.reportedUser.fullName}</strong>'s account.
                {#if (report?.reportedUser.warningCount || 0) > 0}
                    <span class="text-amber-600">(Currently has {report?.reportedUser.warningCount} warning{(report?.reportedUser.warningCount || 0) > 1 ? "s" : ""})</span>
                {/if}
            </p>

            <div class="mb-4">
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Warning Reason (optional)
                </label>
                <textarea
                    bind:value={warningReason}
                    placeholder="Enter reason for warning..."
                    rows="2"
                    class="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 resize-none text-sm"
                ></textarea>
            </div>

            <div class="flex gap-3 justify-end">
                <button
                    onclick={() => { showWarnUserConfirm = false; warningReason = ""; }}
                    class="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-sm font-medium"
                >
                    Cancel
                </button>
                <button
                    onclick={handleWarnUser}
                    disabled={actionLoading}
                    class="flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-sm font-medium disabled:opacity-50"
                >
                    {#if actionLoading}
                        <Loader2 class="w-4 h-4 animate-spin" />
                    {:else}
                        <ShieldAlert class="w-4 h-4" />
                    {/if}
                    Warn User
                </button>
            </div>
        </div>
    </div>
{/if}

<!-- Ban User Confirmation Modal -->
{#if showBanUserConfirm}
    <div class="fixed inset-0 z-[60] flex items-center justify-center bg-black/50">
        <div class="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-md mx-4 shadow-xl">
            <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                <Ban class="w-5 h-5 text-red-500" />
                Ban User?
            </h3>
            <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">
                This will ban <strong>{report?.reportedUser.fullName}</strong> and prevent them from logging in.
                This action can be reversed later.
            </p>

            <div class="mb-4">
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Ban Reason (optional)
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
                    onclick={() => { showBanUserConfirm = false; banReason = ""; }}
                    class="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-sm font-medium"
                >
                    Cancel
                </button>
                <button
                    onclick={handleBanUser}
                    disabled={actionLoading}
                    class="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium disabled:opacity-50"
                >
                    {#if actionLoading}
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
