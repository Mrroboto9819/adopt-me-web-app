<script lang="ts">
    import { auth } from "$lib/stores/auth.svelte";
    import { onMount } from "svelte";
    import { goto } from "$app/navigation";
    import { _ } from "$lib/i18n";
    import StatusBadge from "$lib/components/admin/StatusBadge.svelte";
    import UserReportDetailModal from "$lib/components/admin/UserReportDetailModal.svelte";
    import {
        ArrowLeft,
        UserX,
        Filter,
        RefreshCw,
        Loader2,
        User,
        Calendar,
        ChevronRight,
        Inbox,
        BadgeCheck,
        AlertTriangle,
        Ban,
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

    // State
    let reports = $state<UserReport[]>([]);
    let loading = $state(true);
    let selectedReport = $state<UserReport | null>(null);
    let showDetail = $state(false);

    // Filters
    let statusFilter = $state("");
    let reasonFilter = $state("");

    // Filter options
    const statusOptions = [
        { value: "", label: "All Statuses" },
        { value: "pending", label: "Pending" },
        { value: "reviewed", label: "Reviewed" },
        { value: "resolved", label: "Resolved" },
        { value: "dismissed", label: "Dismissed" },
    ];

    const reasonOptions = [
        { value: "", label: "All Reasons" },
        { value: "harassment", label: "Harassment" },
        { value: "spam", label: "Spam" },
        { value: "scam", label: "Scam" },
        { value: "fake_profile", label: "Fake Profile" },
        { value: "impersonation", label: "Impersonation" },
        { value: "inappropriate_content", label: "Inappropriate" },
        { value: "animal_abuse", label: "Animal Abuse" },
        { value: "threats", label: "Threats" },
        { value: "other", label: "Other" },
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

    // Fetch reports
    async function fetchReports() {
        loading = true;
        try {
            const variables: any = { limit: 100 };
            if (statusFilter) variables.status = statusFilter;
            if (reasonFilter) variables.reason = reasonFilter;

            const response = await fetch("/api/graphql", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${auth.token}`,
                },
                body: JSON.stringify({
                    query: `
                        query AdminUserReports($status: ReportStatus, $reason: UserReportReason, $limit: Int) {
                            adminUserReports(status: $status, reason: $reason, limit: $limit) {
                                id
                                reasons
                                description
                                status
                                adminNotes
                                createdAt
                                reporter {
                                    id
                                    firstName
                                    lastName
                                    fullName
                                    email
                                    profilePicture
                                    emailVerified
                                    phoneVerified
                                }
                                reportedUser {
                                    id
                                    firstName
                                    lastName
                                    fullName
                                    email
                                    profilePicture
                                    emailVerified
                                    phoneVerified
                                    isBanned
                                    warningCount
                                    createdAt
                                }
                                reviewedBy {
                                    id
                                    firstName
                                    lastName
                                }
                                reviewedAt
                            }
                        }
                    `,
                    variables,
                }),
            });

            const result = await response.json();
            if (result.errors) {
                console.error("Failed to fetch user reports:", result.errors);
                return;
            }

            reports = result.data.adminUserReports;
        } catch (error) {
            console.error("Failed to fetch user reports:", error);
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
    function openReport(report: UserReport) {
        selectedReport = report;
        showDetail = true;
    }

    // Handle report update
    function handleUpdate(updatedReport: UserReport) {
        reports = reports.map((r) => (r.id === updatedReport.id ? { ...r, ...updatedReport } : r));
    }

    // Handle report delete
    function handleDelete(id: string) {
        reports = reports.filter((r) => r.id !== id);
    }

    // Watch filters
    $effect(() => {
        statusFilter;
        reasonFilter;
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
    <title>User Reports - Admin - AdoptMe</title>
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
                <UserX class="w-6 h-6 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
                <h1 class="text-2xl font-bold text-gray-900 dark:text-white">User Reports</h1>
                <p class="text-sm text-gray-500 dark:text-gray-400">
                    Review reported users and take action
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
                    bind:value={reasonFilter}
                    class="px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-700 dark:text-gray-300 focus:ring-2 focus:ring-indigo-500"
                >
                    {#each reasonOptions as option}
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
                <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-1">No user reports found</h3>
                <p class="text-gray-500 dark:text-gray-400">Try adjusting your filters</p>
            </div>
        {:else}
            <div class="space-y-3">
                {#each reports as report}
                    <button
                        onclick={() => openReport(report)}
                        class="w-full text-left bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md hover:border-gray-200 dark:hover:border-gray-600 transition-all group"
                    >
                        <div class="flex items-center gap-4">
                            <!-- Reported User Avatar -->
                            {#if report.reportedUser.profilePicture}
                                <img
                                    src={report.reportedUser.profilePicture}
                                    alt=""
                                    class="w-14 h-14 rounded-full object-cover ring-2 ring-gray-100 dark:ring-gray-700"
                                />
                            {:else}
                                <div class="w-14 h-14 rounded-full bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center text-white font-bold text-lg">
                                    {report.reportedUser.firstName?.[0]?.toUpperCase() || "?"}
                                </div>
                            {/if}

                            <!-- Content -->
                            <div class="flex-1 min-w-0">
                                <!-- Reasons & Status -->
                                <div class="flex flex-wrap items-center gap-2 mb-2">
                                    {#each report.reasons.slice(0, 2) as reason}
                                        {@const config = reasonLabels[reason] || reasonLabels.other}
                                        <span class="px-2 py-0.5 rounded-full text-xs font-medium {config.color}">
                                            {config.label}
                                        </span>
                                    {/each}
                                    {#if report.reasons.length > 2}
                                        <span class="text-xs text-gray-500">+{report.reasons.length - 2}</span>
                                    {/if}
                                    <StatusBadge status={report.status} type="report" />
                                </div>

                                <!-- Reported User Name -->
                                <div class="flex items-center gap-2 mb-1">
                                    <h3 class="font-semibold text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                                        {report.reportedUser.fullName}
                                    </h3>
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
                                            {report.reportedUser.warningCount} warning{(report.reportedUser.warningCount || 0) > 1 ? "s" : ""}
                                        </span>
                                    {/if}
                                </div>

                                <!-- Email -->
                                <p class="text-sm text-gray-500 dark:text-gray-400 mb-2">
                                    {report.reportedUser.email}
                                </p>

                                <!-- Report Info -->
                                <div class="flex flex-wrap items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                                    <div class="flex items-center gap-1">
                                        <User class="w-3 h-3" />
                                        <span>Reported by {report.reporter.firstName} {report.reporter.lastName}</span>
                                    </div>
                                    <div class="flex items-center gap-1">
                                        <Calendar class="w-3 h-3" />
                                        <span>{formatRelativeTime(report.createdAt)}</span>
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
<UserReportDetailModal
    bind:open={showDetail}
    report={selectedReport}
    onClose={() => {
        showDetail = false;
        selectedReport = null;
    }}
    onUpdate={handleUpdate}
    onDelete={handleDelete}
/>
