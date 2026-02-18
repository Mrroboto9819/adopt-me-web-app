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
        Flag,
        MapPin,
        Tag,
        BadgeCheck,
        AlertTriangle,
        Image as ImageIcon,
        Video,
        PawPrint,
        ChevronLeft,
        ChevronRight,
        EyeOff,
        Eye,
        Ban,
        ShieldAlert,
        Gavel,
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

    interface Props {
        open: boolean;
        report: PostReport | null;
        onClose: () => void;
        onUpdate: (report: PostReport) => void;
        onDelete: (id: string) => void;
    }

    let { open = $bindable(), report, onClose, onUpdate, onDelete }: Props = $props();

    // Form state
    let status = $state("");
    let adminNotes = $state("");
    let saving = $state(false);
    let deleting = $state(false);
    let showDeleteConfirm = $state(false);
    let currentImageIndex = $state(0);

    // Quick action modals
    let showDisablePostConfirm = $state(false);
    let showWarnUserConfirm = $state(false);
    let showBanUserConfirm = $state(false);
    let warningReason = $state("");
    let banReason = $state("");
    let disableReason = $state("");
    let actionLoading = $state(false);

    // Status options for post reports
    const statusOptions = [
        { value: "pending", label: "Pending" },
        { value: "reviewed", label: "Reviewed" },
        { value: "resolved", label: "Resolved" },
        { value: "dismissed", label: "Dismissed" },
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

    // Post type badges
    const postTypeBadges: Record<string, { label: string; color: string }> = {
        post: { label: "General", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
        adopt: { label: "Adoption", color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" },
        missing: { label: "Missing", color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" },
    };

    // Initialize form when report changes
    $effect(() => {
        if (report && open) {
            status = report.status;
            adminNotes = report.adminNotes || "";
            currentImageIndex = 0;
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

    // Strip HTML tags
    function stripHtml(html: string): string {
        return html.replace(/<[^>]*>/g, "").trim();
    }

    // Navigate images
    function nextImage() {
        if (report?.post.images) {
            currentImageIndex = (currentImageIndex + 1) % report.post.images.length;
        }
    }

    function prevImage() {
        if (report?.post.images) {
            currentImageIndex = (currentImageIndex - 1 + report.post.images.length) % report.post.images.length;
        }
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
                        mutation UpdateReport($id: ID!, $status: ReportStatus, $adminNotes: String) {
                            updateReport(id: $id, status: $status, adminNotes: $adminNotes) {
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

            const updatedData = result.data.updateReport;
            toast.success("Report updated");
            onUpdate({
                ...report,
                status,
                adminNotes,
                reviewedBy: updatedData.reviewedBy,
                reviewedAt: updatedData.reviewedAt,
            });
        } catch (error: any) {
            toast.error("Failed to update: " + error.message);
        } finally {
            saving = false;
        }
    }

    // Quick status actions
    async function quickSetStatus(newStatus: string) {
        status = newStatus;
        await handleSave();
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
                        mutation DeleteReport($id: ID!) {
                            deleteReport(id: $id)
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

    // Quick action: Disable/Hide Post
    async function handleDisablePost() {
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
                        mutation AdminDisablePost($id: ID!, $reason: String) {
                            adminDisablePost(id: $id, reason: $reason) {
                                id
                                isActive
                            }
                        }
                    `,
                    variables: {
                        id: report.post.id,
                        reason: disableReason || `Disabled due to report: ${report.reasons.join(", ")}`,
                    },
                }),
            });

            const result = await response.json();
            if (result.errors) {
                throw new Error(result.errors[0].message);
            }

            toast.success("Post has been disabled/hidden");
            showDisablePostConfirm = false;
            disableReason = "";

            // Auto-resolve the report
            status = "resolved";
            adminNotes = adminNotes ? `${adminNotes}\n[Action: Post disabled]` : "[Action: Post disabled]";
            await handleSave();
        } catch (error: any) {
            toast.error("Failed to disable post: " + error.message);
        } finally {
            actionLoading = false;
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
                        mutation AdminWarnUser($id: ID!, $reason: String!, $reportId: ID) {
                            adminWarnUser(id: $id, reason: $reason, reportId: $reportId) {
                                id
                                warningCount
                            }
                        }
                    `,
                    variables: {
                        id: report.postOwner.id,
                        reason: warningReason || `Warning issued for reported post: ${report.reasons.join(", ")}`,
                        reportId: report.id,
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
                        id: report.postOwner.id,
                        reason: banReason || `Banned due to reported content: ${report.reasons.join(", ")}`,
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

    // Combined action: Warn + Disable
    async function handleWarnAndDisable() {
        if (!report) return;
        actionLoading = true;

        try {
            // First disable the post
            await fetch("/api/graphql", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${auth.token}`,
                },
                body: JSON.stringify({
                    query: `
                        mutation AdminDisablePost($id: ID!, $reason: String) {
                            adminDisablePost(id: $id, reason: $reason) { id }
                        }
                    `,
                    variables: {
                        id: report.post.id,
                        reason: `Disabled due to report: ${report.reasons.join(", ")}`,
                    },
                }),
            });

            // Then warn the user
            const response = await fetch("/api/graphql", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${auth.token}`,
                },
                body: JSON.stringify({
                    query: `
                        mutation AdminWarnUser($id: ID!, $reason: String!, $reportId: ID) {
                            adminWarnUser(id: $id, reason: $reason, reportId: $reportId) { id warningCount }
                        }
                    `,
                    variables: {
                        id: report.postOwner.id,
                        reason: `Warning for post violation: ${report.reasons.join(", ")}`,
                        reportId: report.id,
                    },
                }),
            });

            const result = await response.json();
            if (result.errors) {
                throw new Error(result.errors[0].message);
            }

            toast.success("Post disabled and user warned");

            // Auto-resolve the report
            status = "resolved";
            adminNotes = adminNotes ? `${adminNotes}\n[Action: Post disabled + User warned]` : "[Action: Post disabled + User warned]";
            await handleSave();
        } catch (error: any) {
            toast.error("Failed: " + error.message);
        } finally {
            actionLoading = false;
        }
    }
</script>

<Modal bind:open onClose={onClose} maxWidth="max-w-4xl" hideHeader={true} noPadding={true}>
    {#if report}
        <div class="max-h-[85vh] overflow-y-auto">
            <div class="p-6">
                <!-- Header -->
                <div class="flex items-start justify-between mb-6">
                    <div>
                        <div class="flex items-center gap-2 mb-2">
                            <Flag class="w-5 h-5 text-red-500" />
                            <h2 class="text-xl font-bold text-gray-900 dark:text-white">
                                Post Report
                            </h2>
                            <StatusBadge status={report.status} type="report" />
                        </div>
                        <p class="text-sm text-gray-500">Reported on {formatDate(report.createdAt)}</p>
                    </div>
                    <button
                        onclick={onClose}
                        class="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                        <X class="w-5 h-5" />
                    </button>
                </div>

                <!-- Report Reasons -->
                <div class="mb-6">
                    <h3 class="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Report Reasons</h3>
                    <div class="flex flex-wrap gap-2">
                        {#each report.reasons as reason}
                            {@const config = reasonLabels[reason] || reasonLabels.other}
                            <span class="px-3 py-1 rounded-full text-sm font-medium {config.color}">
                                {config.label}
                            </span>
                        {/each}
                    </div>
                </div>

                <!-- Reporter Description -->
                {#if report.description}
                    <div class="mb-6">
                        <h3 class="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Reporter's Description</h3>
                        <div class="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl text-sm text-gray-700 dark:text-gray-300">
                            <div class="prose prose-sm dark:prose-invert max-w-none" style="overflow-wrap: break-word;">
                                {@html report.description}
                            </div>
                        </div>
                    </div>
                {/if}

                <!-- Reporter Info -->
                <div class="mb-6">
                    <h3 class="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Reported By</h3>
                    <div class="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
                        {#if report.reporter.profilePicture}
                            <img src={report.reporter.profilePicture} alt="" class="w-10 h-10 rounded-full object-cover" />
                        {:else}
                            <div class="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                                <User class="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                            </div>
                        {/if}
                        <div class="flex-1">
                            <div class="flex items-center gap-1">
                                <p class="font-medium text-gray-900 dark:text-white">
                                    {report.reporter.firstName} {report.reporter.lastName}
                                </p>
                                {#if report.reporter.emailVerified || report.reporter.phoneVerified}
                                    <BadgeCheck class="w-4 h-4 text-blue-500" />
                                {/if}
                            </div>
                            <p class="text-sm text-gray-500">{report.reporter.email}</p>
                        </div>
                        <a
                            href="/user/{report.reporter.id}"
                            target="_blank"
                            class="p-2 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg"
                        >
                            <ExternalLink class="w-4 h-4" />
                        </a>
                    </div>
                </div>

                <!-- Post Preview Section -->
                <div class="mb-6 border border-gray-200 dark:border-gray-700 rounded-2xl overflow-hidden">
                    <div class="p-4 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                        <h3 class="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                            <AlertTriangle class="w-4 h-4 text-amber-500" />
                            Reported Post
                        </h3>
                    </div>

                    <div class="p-4">
                        <!-- Post Author -->
                        <div class="flex items-center gap-3 mb-4">
                            {#if report.post.author.profilePicture}
                                <img src={report.post.author.profilePicture} alt="" class="w-10 h-10 rounded-full object-cover" />
                            {:else}
                                <div class="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold">
                                    {report.post.author.firstName?.[0]?.toUpperCase() || "?"}
                                </div>
                            {/if}
                            <div class="flex-1">
                                <div class="flex items-center gap-2">
                                    <span class="font-medium text-gray-900 dark:text-white">
                                        {report.post.author.firstName} {report.post.author.lastName}
                                    </span>
                                    {#if report.post.author.emailVerified || report.post.author.phoneVerified}
                                        <BadgeCheck class="w-4 h-4 text-blue-500" />
                                    {/if}
                                    {#if (report.postOwner.warningCount || 0) > 0}
                                        <span class="px-2 py-0.5 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 text-xs rounded-full">
                                            {report.postOwner.warningCount} warning{(report.postOwner.warningCount || 0) > 1 ? "s" : ""}
                                        </span>
                                    {/if}
                                </div>
                                <div class="flex items-center gap-2 text-xs text-gray-500">
                                    {#if postTypeBadges[report.post.postType]}
                                        {@const badge = postTypeBadges[report.post.postType]}
                                        <span class="px-2 py-0.5 rounded-full {badge.color}">{badge.label}</span>
                                    {:else}
                                        <span class="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">General</span>
                                    {/if}
                                    {#if report.post.reportType}
                                        <span class="capitalize">({report.post.reportType})</span>
                                    {/if}
                                    <span>•</span>
                                    <span>{formatDate(report.post.createdAt)}</span>
                                </div>
                            </div>
                            <a
                                href="/post/{report.post.id}"
                                target="_blank"
                                class="px-3 py-1.5 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 text-sm font-medium rounded-lg hover:bg-indigo-200 dark:hover:bg-indigo-900/50 flex items-center gap-1"
                            >
                                View Post
                                <ExternalLink class="w-3 h-3" />
                            </a>
                        </div>

                        <!-- Post Title & Description -->
                        <h4 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                            {report.post.title}
                        </h4>
                        <div class="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-4 prose prose-sm dark:prose-invert max-w-none">
                            {@html report.post.description}
                        </div>

                        <!-- Post Images -->
                        {#if report.post.images && report.post.images.length > 0}
                            <div class="relative mb-4">
                                <div class="aspect-video rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800">
                                    <img
                                        src={report.post.images[currentImageIndex]}
                                        alt="Post image"
                                        class="w-full h-full object-cover"
                                    />
                                </div>
                                {#if report.post.images.length > 1}
                                    <button
                                        onclick={prevImage}
                                        class="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-black/50 hover:bg-black/70 text-white rounded-full"
                                    >
                                        <ChevronLeft class="w-5 h-5" />
                                    </button>
                                    <button
                                        onclick={nextImage}
                                        class="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-black/50 hover:bg-black/70 text-white rounded-full"
                                    >
                                        <ChevronRight class="w-5 h-5" />
                                    </button>
                                    <div class="absolute bottom-2 left-1/2 -translate-x-1/2 px-2 py-1 bg-black/50 text-white text-xs rounded-full">
                                        {currentImageIndex + 1} / {report.post.images.length}
                                    </div>
                                {/if}
                            </div>
                        {/if}

                        <!-- Post Video -->
                        {#if report.post.video}
                            <div class="mb-4">
                                <video
                                    src={report.post.video}
                                    controls
                                    class="w-full rounded-xl max-h-[300px]"
                                >
                                    <track kind="captions" />
                                </video>
                            </div>
                        {/if}

                        <!-- Post Meta -->
                        <div class="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                            {#if report.post.pet}
                                <div class="flex items-center gap-1">
                                    <PawPrint class="w-4 h-4" />
                                    <span>{report.post.pet.name}</span>
                                    {#if report.post.pet.species}
                                        <span class="text-gray-400">({report.post.pet.species.label})</span>
                                    {/if}
                                </div>
                            {/if}
                            {#if report.post.location}
                                <div class="flex items-center gap-1">
                                    <MapPin class="w-4 h-4" />
                                    <span>{report.post.location}</span>
                                </div>
                            {/if}
                            {#if report.post.tags && report.post.tags.length > 0}
                                <div class="flex items-center gap-1">
                                    <Tag class="w-4 h-4" />
                                    <span>{report.post.tags.join(", ")}</span>
                                </div>
                            {/if}
                        </div>
                    </div>
                </div>

                <!-- Reviewed By -->
                {#if report.reviewedBy}
                    <div class="mb-6 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl">
                        <p class="text-sm text-blue-700 dark:text-blue-400">
                            Reviewed by <strong>{report.reviewedBy.firstName} {report.reviewedBy.lastName}</strong>
                            {#if report.reviewedAt}
                                on {formatDate(report.reviewedAt)}
                            {/if}
                        </p>
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
                                onclick={() => showDisablePostConfirm = true}
                                disabled={actionLoading}
                                class="flex items-center gap-1.5 px-3 py-1.5 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 rounded-lg hover:bg-orange-200 dark:hover:bg-orange-900/50 disabled:opacity-50 text-sm font-medium transition-colors"
                            >
                                <EyeOff class="w-3.5 h-3.5" />
                                Hide Post
                            </button>
                            <button
                                onclick={() => showWarnUserConfirm = true}
                                disabled={actionLoading}
                                class="flex items-center gap-1.5 px-3 py-1.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded-lg hover:bg-amber-200 dark:hover:bg-amber-900/50 disabled:opacity-50 text-sm font-medium transition-colors"
                            >
                                <ShieldAlert class="w-3.5 h-3.5" />
                                Warn User
                            </button>
                            <button
                                onclick={handleWarnAndDisable}
                                disabled={actionLoading}
                                class="flex items-center gap-1.5 px-3 py-1.5 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 disabled:opacity-50 text-sm font-medium transition-colors"
                            >
                                <AlertTriangle class="w-3.5 h-3.5" />
                                Warn + Hide
                            </button>
                            <button
                                onclick={() => showBanUserConfirm = true}
                                disabled={actionLoading}
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

                    <!-- Action Buttons -->
                    <div class="flex items-center justify-between">
                        <button
                            onclick={() => showDeleteConfirm = true}
                            disabled={deleting}
                            class="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        >
                            <Trash2 class="w-4 h-4" />
                            Delete Report
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
        </div>
    {/if}
</Modal>

<!-- Delete Confirmation Modal -->
{#if showDeleteConfirm}
    <div class="fixed inset-0 z-[60] flex items-center justify-center bg-black/50">
        <div class="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-sm mx-4 shadow-xl">
            <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-2">Delete Report?</h3>
            <p class="text-sm text-gray-600 dark:text-gray-400 mb-6">
                This will delete the report record. The post itself will not be affected.
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

<!-- Disable Post Confirmation Modal -->
{#if showDisablePostConfirm}
    <div class="fixed inset-0 z-[60] flex items-center justify-center bg-black/50">
        <div class="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-md mx-4 shadow-xl">
            <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                <EyeOff class="w-5 h-5 text-orange-500" />
                Hide Post?
            </h3>
            <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">
                This will hide the post from public view. The post owner will no longer see it in listings.
            </p>

            <div class="mb-4">
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Reason (optional)
                </label>
                <textarea
                    bind:value={disableReason}
                    placeholder="Enter reason for hiding post..."
                    rows="2"
                    class="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 resize-none text-sm"
                ></textarea>
            </div>

            <div class="flex gap-3 justify-end">
                <button
                    onclick={() => { showDisablePostConfirm = false; disableReason = ""; }}
                    class="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-sm font-medium"
                >
                    Cancel
                </button>
                <button
                    onclick={handleDisablePost}
                    disabled={actionLoading}
                    class="flex items-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-sm font-medium disabled:opacity-50"
                >
                    {#if actionLoading}
                        <Loader2 class="w-4 h-4 animate-spin" />
                    {:else}
                        <EyeOff class="w-4 h-4" />
                    {/if}
                    Hide Post
                </button>
            </div>
        </div>
    </div>
{/if}

<!-- Warn User Confirmation Modal -->
{#if showWarnUserConfirm}
    <div class="fixed inset-0 z-[60] flex items-center justify-center bg-black/50">
        <div class="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-md mx-4 shadow-xl">
            <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                <ShieldAlert class="w-5 h-5 text-amber-500" />
                Warn User?
            </h3>
            <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Add a warning/strike to <strong>{report?.postOwner.firstName} {report?.postOwner.lastName}</strong>'s account.
                {#if (report?.postOwner.warningCount || 0) > 0}
                    <span class="text-amber-600">(Currently has {report?.postOwner.warningCount} warning{(report?.postOwner.warningCount || 0) > 1 ? "s" : ""})</span>
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
                This will ban <strong>{report?.postOwner.firstName} {report?.postOwner.lastName}</strong> and prevent them from logging in.
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
