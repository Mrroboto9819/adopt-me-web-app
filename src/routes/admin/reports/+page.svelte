<script lang="ts">
    import { auth } from "$lib/stores/auth.svelte";
    import { onMount } from "svelte";
    import { goto } from "$app/navigation";
    import { _ } from "$lib/i18n";
    import StatusBadge from "$lib/components/admin/StatusBadge.svelte";
    import PostReportDetailModal from "$lib/components/admin/PostReportDetailModal.svelte";
    import {
        ArrowLeft,
        Flag,
        Filter,
        RefreshCw,
        Loader2,
        User,
        Calendar,
        ChevronRight,
        Inbox,
        Image as ImageIcon,
        BadgeCheck,
        AlertTriangle,
    } from "lucide-svelte";

    interface PostReport {
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
            email: string;
            profilePicture?: string;
            emailVerified?: boolean;
            phoneVerified?: boolean;
        };
        post: {
            id: string;
            title: string;
            description: string;
            postType: string;
            reportType?: string;
            images: string[];
            video?: string;
            location?: string;
            tags: string[];
            createdAt: string;
            author: {
                id: string;
                firstName: string;
                lastName: string;
                email: string;
                profilePicture?: string;
                emailVerified?: boolean;
                phoneVerified?: boolean;
                warningCount?: number;
            };
            pet?: {
                id: string;
                name: string;
                species?: { label: string };
                breed?: { name: string };
            };
        };
        postOwner: {
            id: string;
            firstName: string;
            lastName: string;
            warningCount?: number;
        };
        reviewedBy?: {
            id: string;
            firstName: string;
            lastName: string;
        };
        reviewedAt?: string;
    }

    // State
    let reports = $state<PostReport[]>([]);
    let loading = $state(true);
    let selectedReport = $state<PostReport | null>(null);
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
        { value: "spam", label: "Spam" },
        { value: "inappropriate", label: "Inappropriate" },
        { value: "harassment", label: "Harassment" },
        { value: "scam", label: "Scam" },
        { value: "animal_abuse", label: "Animal Abuse" },
        { value: "fake_listing", label: "Fake Listing" },
        { value: "other", label: "Other" },
    ];

    // Reason labels
    const reasonLabels: Record<string, { label: string; color: string }> = {
        spam: { label: "Spam", color: "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300" },
        inappropriate: { label: "Inappropriate", color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" },
        harassment: { label: "Harassment", color: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400" },
        scam: { label: "Scam", color: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400" },
        animal_abuse: { label: "Animal Abuse", color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" },
        fake_listing: { label: "Fake Listing", color: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400" },
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
                        query AdminReports($status: ReportStatus, $reason: ReportReason, $limit: Int) {
                            adminReports(status: $status, reason: $reason, limit: $limit) {
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
                                    email
                                    profilePicture
                                    emailVerified
                                    phoneVerified
                                }
                                post {
                                    id
                                    title
                                    description
                                    postType
                                    reportType
                                    images
                                    video
                                    location
                                    tags
                                    createdAt
                                    author {
                                        id
                                        firstName
                                        lastName
                                        email
                                        profilePicture
                                        emailVerified
                                        phoneVerified
                                    }
                                    pet {
                                        id
                                        name
                                        species { label }
                                        breed { name }
                                    }
                                    pets {
                                        id
                                        name
                                        species { label }
                                        breed { name }
                                    }
                                }
                                postOwner {
                                    id
                                    firstName
                                    lastName
                                    warningCount
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
                console.error("Failed to fetch reports:", result.errors);
                return;
            }

            reports = result.data.adminReports;
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

    // Strip HTML
    function stripHtml(html: string): string {
        return html.replace(/<[^>]*>/g, "").trim();
    }

    // Open report detail
    function openReport(report: PostReport) {
        selectedReport = report;
        showDetail = true;
    }

    // Handle report update
    function handleUpdate(updatedReport: PostReport) {
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
    <title>Post Reports - Admin - AdoptMe</title>
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
            <div class="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-xl flex items-center justify-center">
                <Flag class="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
            <div>
                <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Post Reports</h1>
                <p class="text-sm text-gray-500 dark:text-gray-400">
                    Review reported posts and take action
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
                <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-1">No reports found</h3>
                <p class="text-gray-500 dark:text-gray-400">Try adjusting your filters</p>
            </div>
        {:else}
            <div class="space-y-3">
                {#each reports as report}
                    <button
                        onclick={() => openReport(report)}
                        class="w-full text-left bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md hover:border-gray-200 dark:hover:border-gray-600 transition-all group"
                    >
                        <div class="flex">
                            <!-- Post Thumbnail -->
                            {#if report.post.images && report.post.images.length > 0}
                                <div class="w-24 sm:w-32 flex-shrink-0 bg-gray-100 dark:bg-gray-700">
                                    <img
                                        src={report.post.images[0]}
                                        alt=""
                                        class="w-full h-full object-cover"
                                    />
                                </div>
                            {:else}
                                <div class="w-24 sm:w-32 flex-shrink-0 bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                                    <ImageIcon class="w-8 h-8 text-gray-400" />
                                </div>
                            {/if}

                            <!-- Content -->
                            <div class="flex-1 p-4 min-w-0">
                                <div class="flex items-start justify-between gap-2">
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

                                        <!-- Post Title -->
                                        <h3 class="font-semibold text-gray-900 dark:text-white mb-1 truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                                            {report.post.title}
                                        </h3>

                                        <!-- Post Author -->
                                        <div class="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-2">
                                            <span>Post by</span>
                                            <span class="font-medium text-gray-900 dark:text-white flex items-center gap-1">
                                                {report.post.author.firstName} {report.post.author.lastName}
                                                {#if report.post.author.emailVerified || report.post.author.phoneVerified}
                                                    <BadgeCheck class="w-3.5 h-3.5 text-blue-500" />
                                                {/if}
                                            </span>
                                            {#if (report.postOwner.warningCount || 0) > 0}
                                                <span class="flex items-center gap-0.5 text-amber-600 dark:text-amber-400">
                                                    <AlertTriangle class="w-3 h-3" />
                                                    <span class="text-xs">{report.postOwner.warningCount}</span>
                                                </span>
                                            {/if}
                                        </div>

                                        <!-- Report Info -->
                                        <div class="flex flex-wrap items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                                            <div class="flex items-center gap-1">
                                                <User class="w-3 h-3" />
                                                <span>Reported by {report.reporter.firstName}</span>
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
                            </div>
                        </div>
                    </button>
                {/each}
            </div>
        {/if}
    </div>
</div>

<!-- Detail Modal -->
<PostReportDetailModal
    bind:open={showDetail}
    report={selectedReport}
    onClose={() => {
        showDetail = false;
        selectedReport = null;
    }}
    onUpdate={handleUpdate}
    onDelete={handleDelete}
/>
