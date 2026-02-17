<script lang="ts">
    import { auth } from "$lib/stores/auth.svelte";
    import { onMount } from "svelte";
    import { goto } from "$app/navigation";
    import { _ } from "$lib/i18n";
    import StatusBadge from "$lib/components/admin/StatusBadge.svelte";
    import SeverityBadge from "$lib/components/admin/SeverityBadge.svelte";
    import CategoryBadge from "$lib/components/admin/CategoryBadge.svelte";
    import BugReportDetailModal from "$lib/components/admin/BugReportDetailModal.svelte";
    import {
        ArrowLeft,
        Bug,
        Filter,
        RefreshCw,
        Loader2,
        User,
        Mail,
        Calendar,
        ChevronRight,
        Inbox,
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

    // State
    let reports = $state<BugReport[]>([]);
    let loading = $state(true);
    let selectedReport = $state<BugReport | null>(null);
    let showDetail = $state(false);

    // Filters
    let statusFilter = $state("");
    let categoryFilter = $state("");
    let severityFilter = $state("");

    // Filter options
    const statusOptions = [
        { value: "", label: "All Statuses" },
        { value: "open", label: "Open" },
        { value: "in_progress", label: "In Progress" },
        { value: "resolved", label: "Resolved" },
        { value: "closed", label: "Closed" },
        { value: "wont_fix", label: "Won't Fix" },
    ];

    const categoryOptions = [
        { value: "", label: "All Categories" },
        { value: "bug", label: "Bug" },
        { value: "feature", label: "Feature" },
        { value: "improvement", label: "Improvement" },
        { value: "other", label: "Other" },
    ];

    const severityOptions = [
        { value: "", label: "All Severities" },
        { value: "critical", label: "Critical" },
        { value: "high", label: "High" },
        { value: "medium", label: "Medium" },
        { value: "low", label: "Low" },
    ];

    // Fetch bug reports
    async function fetchReports() {
        loading = true;
        try {
            const variables: any = { limit: 100 };
            if (statusFilter) variables.status = statusFilter;
            if (categoryFilter) variables.category = categoryFilter;
            if (severityFilter) variables.severity = severityFilter;

            const response = await fetch("/api/graphql", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${auth.token}`,
                },
                body: JSON.stringify({
                    query: `
                        query AdminBugReports($status: BugReportStatus, $category: BugReportCategory, $severity: BugReportSeverity, $limit: Int) {
                            adminBugReports(status: $status, category: $category, severity: $severity, limit: $limit) {
                                id
                                title
                                description
                                category
                                severity
                                status
                                page
                                browser
                                device
                                screenshot
                                reporter {
                                    id
                                    firstName
                                    lastName
                                    email
                                    profilePicture
                                }
                                reporterEmail
                                adminNotes
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
                console.error("Failed to fetch reports:", result.errors);
                return;
            }

            reports = result.data.adminBugReports;
        } catch (error) {
            console.error("Failed to fetch reports:", error);
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

    // Open report detail
    function openReport(report: BugReport) {
        selectedReport = report;
        showDetail = true;
    }

    // Handle report update
    function handleUpdate(updatedReport: BugReport) {
        reports = reports.map((r) => (r.id === updatedReport.id ? { ...r, ...updatedReport } : r));
    }

    // Handle report delete
    function handleDelete(id: string) {
        reports = reports.filter((r) => r.id !== id);
    }

    // Watch filters
    $effect(() => {
        statusFilter;
        categoryFilter;
        severityFilter;
        if (auth.token) {
            fetchReports();
        }
    });

    onMount(() => {
        if (auth.token) {
            fetchReports();
        }
    });
</script>

<svelte:head>
    <title>Bug Reports - Admin - AdoptMe</title>
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
            <div class="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-xl flex items-center justify-center">
                <Bug class="w-6 h-6 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
                <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Bug Reports</h1>
                <p class="text-sm text-gray-500 dark:text-gray-400">
                    Manage user-submitted bug reports and feature requests
                </p>
            </div>
        </div>

        <!-- Filters -->
        <div class="bg-white dark:bg-gray-800 rounded-2xl p-4 mb-6 shadow-sm border border-gray-100 dark:border-gray-700">
            <div class="flex flex-wrap items-center gap-4">
                <div class="flex items-center gap-2 text-gray-500">
                    <Filter class="w-4 h-4" />
                    <span class="text-sm font-medium">Filters:</span>
                </div>

                <select
                    bind:value={statusFilter}
                    class="px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-700 dark:text-gray-300 focus:ring-2 focus:ring-indigo-500"
                >
                    {#each statusOptions as option}
                        <option value={option.value}>{option.label}</option>
                    {/each}
                </select>

                <select
                    bind:value={categoryFilter}
                    class="px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-700 dark:text-gray-300 focus:ring-2 focus:ring-indigo-500"
                >
                    {#each categoryOptions as option}
                        <option value={option.value}>{option.label}</option>
                    {/each}
                </select>

                <select
                    bind:value={severityFilter}
                    class="px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-700 dark:text-gray-300 focus:ring-2 focus:ring-indigo-500"
                >
                    {#each severityOptions as option}
                        <option value={option.value}>{option.label}</option>
                    {/each}
                </select>

                <button
                    onclick={fetchReports}
                    disabled={loading}
                    class="ml-auto flex items-center gap-2 px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                >
                    <RefreshCw class="w-4 h-4 {loading ? 'animate-spin' : ''}" />
                    Refresh
                </button>
            </div>
        </div>

        <!-- Reports List -->
        {#if loading}
            <div class="flex items-center justify-center py-20">
                <Loader2 class="w-8 h-8 text-indigo-500 animate-spin" />
            </div>
        {:else if reports.length === 0}
            <div class="text-center py-20">
                <div class="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
                    <Inbox class="w-8 h-8 text-gray-400" />
                </div>
                <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-1">No bug reports found</h3>
                <p class="text-gray-500 dark:text-gray-400">Try adjusting your filters</p>
            </div>
        {:else}
            <div class="space-y-3">
                {#each reports as report}
                    <button
                        onclick={() => openReport(report)}
                        class="w-full text-left bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md hover:border-gray-200 dark:hover:border-gray-600 transition-all group"
                    >
                        <div class="flex items-start gap-4">
                            <!-- Content -->
                            <div class="flex-1 min-w-0">
                                <div class="flex flex-wrap items-center gap-2 mb-2">
                                    <CategoryBadge category={report.category} />
                                    <SeverityBadge severity={report.severity} />
                                    <StatusBadge status={report.status} type="bug" />
                                </div>

                                <h3 class="font-semibold text-gray-900 dark:text-white mb-1 truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                                    {report.title}
                                </h3>

                                <p class="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mb-3">
                                    {report.description}
                                </p>

                                <div class="flex flex-wrap items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                                    <!-- Reporter -->
                                    <div class="flex items-center gap-1">
                                        {#if report.reporter}
                                            <User class="w-3 h-3" />
                                            <span>{report.reporter.firstName} {report.reporter.lastName}</span>
                                        {:else if report.reporterEmail}
                                            <Mail class="w-3 h-3" />
                                            <span>{report.reporterEmail}</span>
                                        {:else}
                                            <User class="w-3 h-3" />
                                            <span>Anonymous</span>
                                        {/if}
                                    </div>

                                    <!-- Date -->
                                    <div class="flex items-center gap-1">
                                        <Calendar class="w-3 h-3" />
                                        <span>{formatRelativeTime(report.createdAt)}</span>
                                    </div>

                                    <!-- Page -->
                                    {#if report.page}
                                        <div class="hidden sm:flex items-center gap-1 truncate max-w-[200px]">
                                            <span class="truncate">{report.page}</span>
                                        </div>
                                    {/if}
                                </div>
                            </div>

                            <!-- Arrow -->
                            <ChevronRight class="w-5 h-5 text-gray-400 group-hover:text-indigo-500 group-hover:translate-x-1 transition-all flex-shrink-0 mt-2" />
                        </div>
                    </button>
                {/each}
            </div>
        {/if}
    </div>
</div>

<!-- Detail Modal -->
<BugReportDetailModal
    bind:open={showDetail}
    report={selectedReport}
    onClose={() => {
        showDetail = false;
        selectedReport = null;
    }}
    onUpdate={handleUpdate}
    onDelete={handleDelete}
/>
