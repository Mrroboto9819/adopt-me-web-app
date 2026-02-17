<script lang="ts">
    import Modal from "$lib/components/Modal.svelte";
    import StatusBadge from "./StatusBadge.svelte";
    import SeverityBadge from "./SeverityBadge.svelte";
    import CategoryBadge from "./CategoryBadge.svelte";
    import { auth } from "$lib/stores/auth.svelte";
    import { toast } from "$lib/stores/toast.svelte";
    import { _ } from "$lib/i18n";
    import {
        X,
        Monitor,
        Smartphone,
        Globe,
        User,
        Mail,
        Calendar,
        ExternalLink,
        Save,
        Trash2,
        Loader2,
        Image as ImageIcon,
    } from "lucide-svelte";

    interface BugReport {
        id: string;
        title: string;
        description: string;
        category: string;
        severity: string;
        status: string;
        page?: string;
        browser?: string;
        device?: string;
        screenshot?: string;
        reporter?: {
            id: string;
            firstName: string;
            lastName: string;
            email: string;
            profilePicture?: string;
        };
        reporterEmail?: string;
        adminNotes?: string;
        createdAt: string;
        updatedAt: string;
    }

    interface Props {
        open: boolean;
        report: BugReport | null;
        onClose: () => void;
        onUpdate: (report: BugReport) => void;
        onDelete: (id: string) => void;
    }

    let { open = $bindable(), report, onClose, onUpdate, onDelete }: Props = $props();

    // Form state
    let status = $state("");
    let adminNotes = $state("");
    let saving = $state(false);
    let deleting = $state(false);
    let showDeleteConfirm = $state(false);
    let showScreenshot = $state(false);

    // Status options for bug reports
    const statusOptions = [
        { value: "open", label: "Open" },
        { value: "in_progress", label: "In Progress" },
        { value: "resolved", label: "Resolved" },
        { value: "closed", label: "Closed" },
        { value: "wont_fix", label: "Won't Fix" },
    ];

    // Initialize form when report changes
    $effect(() => {
        if (report && open) {
            status = report.status;
            adminNotes = report.adminNotes || "";
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

    // Save changes
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
                        mutation UpdateBugReport($id: ID!, $status: BugReportStatus, $adminNotes: String) {
                            updateBugReport(id: $id, status: $status, adminNotes: $adminNotes) {
                                id
                                status
                                adminNotes
                                updatedAt
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

            toast.success("Bug report updated");
            onUpdate({ ...report, status, adminNotes, updatedAt: result.data.updateBugReport.updatedAt });
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
                        mutation DeleteBugReport($id: ID!) {
                            deleteBugReport(id: $id)
                        }
                    `,
                    variables: { id: report.id },
                }),
            });

            const result = await response.json();
            if (result.errors) {
                throw new Error(result.errors[0].message);
            }

            toast.success("Bug report deleted");
            onDelete(report.id);
            onClose();
        } catch (error: any) {
            toast.error("Failed to delete: " + error.message);
        } finally {
            deleting = false;
            showDeleteConfirm = false;
        }
    }
</script>

<Modal bind:open onClose={onClose} maxWidth="max-w-3xl">
    {#if report}
        <div class="p-6">
            <!-- Header -->
            <div class="flex items-start justify-between mb-6">
                <div class="flex-1">
                    <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-2">
                        {report.title}
                    </h2>
                    <div class="flex flex-wrap items-center gap-2">
                        <CategoryBadge category={report.category} />
                        <SeverityBadge severity={report.severity} />
                        <StatusBadge status={report.status} type="bug" />
                    </div>
                </div>
                <button
                    onclick={onClose}
                    class="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                    <X class="w-5 h-5" />
                </button>
            </div>

            <!-- Description -->
            <div class="mb-6">
                <h3 class="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Description</h3>
                <div class="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                    {report.description}
                </div>
            </div>

            <!-- Technical Info -->
            {#if report.page || report.browser || report.device}
                <div class="mb-6">
                    <h3 class="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Technical Info</h3>
                    <div class="grid sm:grid-cols-3 gap-3">
                        {#if report.page}
                            <div class="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                <Globe class="w-4 h-4 text-gray-500" />
                                <div class="flex-1 min-w-0">
                                    <p class="text-xs text-gray-500">Page</p>
                                    <p class="text-sm text-gray-700 dark:text-gray-300 truncate">{report.page}</p>
                                </div>
                            </div>
                        {/if}
                        {#if report.browser}
                            <div class="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                <Monitor class="w-4 h-4 text-gray-500" />
                                <div class="flex-1 min-w-0">
                                    <p class="text-xs text-gray-500">Browser</p>
                                    <p class="text-sm text-gray-700 dark:text-gray-300 truncate">{report.browser}</p>
                                </div>
                            </div>
                        {/if}
                        {#if report.device}
                            <div class="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                <Smartphone class="w-4 h-4 text-gray-500" />
                                <div class="flex-1 min-w-0">
                                    <p class="text-xs text-gray-500">Device</p>
                                    <p class="text-sm text-gray-700 dark:text-gray-300 truncate">{report.device}</p>
                                </div>
                            </div>
                        {/if}
                    </div>
                </div>
            {/if}

            <!-- Screenshot -->
            {#if report.screenshot}
                <div class="mb-6">
                    <h3 class="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Screenshot</h3>
                    <button
                        onclick={() => showScreenshot = true}
                        class="relative group w-full max-w-xs rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700"
                    >
                        <img src={report.screenshot} alt="Bug screenshot" class="w-full h-auto" />
                        <div class="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <ImageIcon class="w-8 h-8 text-white" />
                        </div>
                    </button>
                </div>
            {/if}

            <!-- Reporter Info -->
            <div class="mb-6">
                <h3 class="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Reporter</h3>
                <div class="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
                    {#if report.reporter}
                        {#if report.reporter.profilePicture}
                            <img src={report.reporter.profilePicture} alt="" class="w-10 h-10 rounded-full object-cover" />
                        {:else}
                            <div class="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                                <User class="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                            </div>
                        {/if}
                        <div class="flex-1">
                            <p class="font-medium text-gray-900 dark:text-white">
                                {report.reporter.firstName} {report.reporter.lastName}
                            </p>
                            <p class="text-sm text-gray-500">{report.reporter.email}</p>
                        </div>
                        <a
                            href="/user/{report.reporter.id}"
                            class="p-2 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg"
                        >
                            <ExternalLink class="w-4 h-4" />
                        </a>
                    {:else if report.reporterEmail}
                        <div class="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                            <Mail class="w-5 h-5 text-gray-500" />
                        </div>
                        <div class="flex-1">
                            <p class="font-medium text-gray-900 dark:text-white">Anonymous</p>
                            <p class="text-sm text-gray-500">{report.reporterEmail}</p>
                        </div>
                    {:else}
                        <div class="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                            <User class="w-5 h-5 text-gray-500" />
                        </div>
                        <div class="flex-1">
                            <p class="font-medium text-gray-500">Unknown Reporter</p>
                        </div>
                    {/if}
                </div>
            </div>

            <!-- Dates -->
            <div class="mb-6 flex gap-4 text-sm text-gray-500">
                <div class="flex items-center gap-1">
                    <Calendar class="w-4 h-4" />
                    <span>Created: {formatDate(report.createdAt)}</span>
                </div>
                {#if report.updatedAt !== report.createdAt}
                    <div class="flex items-center gap-1">
                        <Calendar class="w-4 h-4" />
                        <span>Updated: {formatDate(report.updatedAt)}</span>
                    </div>
                {/if}
            </div>

            <!-- Admin Actions -->
            <div class="border-t border-gray-200 dark:border-gray-700 pt-6">
                <h3 class="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Admin Actions</h3>

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

                <!-- Action Buttons -->
                <div class="flex items-center justify-between">
                    <button
                        onclick={() => showDeleteConfirm = true}
                        disabled={deleting}
                        class="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                    >
                        <Trash2 class="w-4 h-4" />
                        Delete
                    </button>

                    <button
                        onclick={handleSave}
                        disabled={saving}
                        class="flex items-center gap-2 px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors disabled:opacity-50"
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
        </div>
    {/if}
</Modal>

<!-- Delete Confirmation Modal -->
{#if showDeleteConfirm}
    <div class="fixed inset-0 z-[60] flex items-center justify-center bg-black/50">
        <div class="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-sm mx-4 shadow-xl">
            <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-2">Delete Bug Report?</h3>
            <p class="text-sm text-gray-600 dark:text-gray-400 mb-6">
                This action cannot be undone. The bug report will be permanently deleted.
            </p>
            <div class="flex gap-3 justify-end">
                <button
                    onclick={() => showDeleteConfirm = false}
                    class="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                >
                    Cancel
                </button>
                <button
                    onclick={handleDelete}
                    disabled={deleting}
                    class="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg disabled:opacity-50"
                >
                    {#if deleting}
                        <Loader2 class="w-4 h-4 animate-spin" />
                    {/if}
                    Delete
                </button>
            </div>
        </div>
    </div>
{/if}

<!-- Screenshot Lightbox -->
{#if showScreenshot && report?.screenshot}
    <div
        class="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 p-4"
        onclick={() => showScreenshot = false}
        onkeydown={(e) => e.key === 'Escape' && (showScreenshot = false)}
        role="button"
        tabindex="0"
    >
        <img src={report.screenshot} alt="Bug screenshot" class="max-w-full max-h-full object-contain" />
        <button
            onclick={() => showScreenshot = false}
            class="absolute top-4 right-4 p-2 text-white/80 hover:text-white bg-black/30 rounded-full"
        >
            <X class="w-6 h-6" />
        </button>
    </div>
{/if}
