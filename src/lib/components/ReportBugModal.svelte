<script lang="ts">
    import Modal from "./Modal.svelte";
    import { auth } from "$lib/stores/auth.svelte";
    import { toast } from "$lib/stores/toast.svelte";
    import { _ } from "$lib/i18n";
    import { Bug, AlertTriangle, Lightbulb, Sparkles, HelpCircle, CheckCircle } from "lucide-svelte";
    import { page } from "$app/stores";

    interface Props {
        open: boolean;
        onClose: () => void;
    }

    let { open = $bindable(false), onClose }: Props = $props();

    let title = $state("");
    let description = $state("");
    let category = $state<'bug' | 'feature' | 'improvement' | 'other'>('bug');
    let severity = $state<'low' | 'medium' | 'high' | 'critical'>('medium');
    let reporterEmail = $state("");
    let submitting = $state(false);

    // Auto-detect browser and device info
    let browserInfo = $state("");
    let deviceInfo = $state("");

    $effect(() => {
        if (open && typeof window !== 'undefined') {
            browserInfo = navigator.userAgent;
            deviceInfo = `${navigator.platform} - ${window.innerWidth}x${window.innerHeight}`;
        }
    });

    const categories = [
        { id: 'bug', icon: Bug, color: 'text-red-500', bgActive: 'bg-red-50 dark:bg-red-900/30 border-red-300 dark:border-red-700' },
        { id: 'feature', icon: Lightbulb, color: 'text-yellow-500', bgActive: 'bg-yellow-50 dark:bg-yellow-900/30 border-yellow-300 dark:border-yellow-700' },
        { id: 'improvement', icon: Sparkles, color: 'text-blue-500', bgActive: 'bg-blue-50 dark:bg-blue-900/30 border-blue-300 dark:border-blue-700' },
        { id: 'other', icon: HelpCircle, color: 'text-gray-500', bgActive: 'bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600' },
    ] as const;

    const severities = ['low', 'medium', 'high', 'critical'] as const;
    const severityColors = {
        low: 'bg-green-100 text-green-700 border-green-300 dark:bg-green-900/30 dark:text-green-300 dark:border-green-700',
        medium: 'bg-yellow-100 text-yellow-700 border-yellow-300 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-700',
        high: 'bg-orange-100 text-orange-700 border-orange-300 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-700',
        critical: 'bg-red-100 text-red-700 border-red-300 dark:bg-red-900/30 dark:text-red-300 dark:border-red-700',
    };

    const isValid = $derived(
        title.trim().length > 0 &&
        description.trim().length > 0 &&
        (auth.isAuthenticated || reporterEmail.trim().length > 0)
    );

    async function handleSubmit(e: Event) {
        e.preventDefault();

        if (!isValid) return;

        submitting = true;
        try {
            const mutation = `
                mutation SubmitBugReport(
                    $title: String!,
                    $description: String!,
                    $category: BugReportCategory!,
                    $severity: BugReportSeverity!,
                    $page: String,
                    $browser: String,
                    $device: String,
                    $reporterEmail: String
                ) {
                    submitBugReport(
                        title: $title,
                        description: $description,
                        category: $category,
                        severity: $severity,
                        page: $page,
                        browser: $browser,
                        device: $device,
                        reporterEmail: $reporterEmail
                    ) {
                        id
                    }
                }
            `;

            const headers: Record<string, string> = {
                "Content-Type": "application/json",
            };

            if (auth.token) {
                headers["Authorization"] = `Bearer ${auth.token}`;
            }

            const res = await fetch("/api/graphql", {
                method: "POST",
                headers,
                body: JSON.stringify({
                    query: mutation,
                    variables: {
                        title: title.trim(),
                        description: description.trim(),
                        category,
                        severity,
                        page: $page.url.pathname,
                        browser: browserInfo,
                        device: deviceInfo,
                        reporterEmail: auth.isAuthenticated ? null : reporterEmail.trim(),
                    },
                }),
            });

            const result = await res.json();
            if (result.errors) throw new Error(result.errors[0].message);

            toast.success($_("bug_report.success"));
            resetForm();
            onClose();
        } catch (e: any) {
            toast.error($_("bug_report.failed") + ": " + e.message);
        } finally {
            submitting = false;
        }
    }

    function resetForm() {
        title = "";
        description = "";
        category = "bug";
        severity = "medium";
        reporterEmail = "";
    }

    function handleClose() {
        resetForm();
        onClose();
    }
</script>

<Modal {open} onClose={handleClose} title={$_("bug_report.title")}>
    <form onsubmit={handleSubmit} class="space-y-5">
        <!-- Category Selection -->
        <div role="group" aria-labelledby="category-label">
            <span id="category-label" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {$_("bug_report.category")}
            </span>
            <div class="grid grid-cols-4 gap-2">
                {#each categories as cat}
                    {@const isActive = category === cat.id}
                    {@const Icon = cat.icon}
                    <button
                        type="button"
                        onclick={() => category = cat.id}
                        class="flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all
                            {isActive
                                ? cat.bgActive
                                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800'}"
                    >
                        <Icon class="w-5 h-5 {cat.color} mb-1" />
                        <span class="text-xs font-medium text-gray-700 dark:text-gray-300">
                            {$_(`bug_report.category_${cat.id}`)}
                        </span>
                    </button>
                {/each}
            </div>
        </div>

        <!-- Title -->
        <div>
            <label for="bugTitle" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {$_("bug_report.bug_title")} <span class="text-red-500">*</span>
            </label>
            <input
                id="bugTitle"
                type="text"
                bind:value={title}
                class="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 transition-colors"
                placeholder={$_("bug_report.title_placeholder")}
                required
            />
        </div>

        <!-- Description -->
        <div>
            <label for="bugDescription" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {$_("bug_report.description")} <span class="text-red-500">*</span>
            </label>
            <textarea
                id="bugDescription"
                bind:value={description}
                rows="4"
                class="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 transition-colors"
                placeholder={$_("bug_report.description_placeholder")}
                required
            ></textarea>
        </div>

        <!-- Severity (only show for bugs) -->
        {#if category === 'bug'}
            <div role="group" aria-labelledby="severity-label">
                <span id="severity-label" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {$_("bug_report.severity")}
                </span>
                <div class="flex gap-2">
                    {#each severities as sev}
                        <button
                            type="button"
                            onclick={() => severity = sev}
                            class="flex-1 py-2 px-3 text-sm font-medium rounded-xl border-2 transition-all
                                {severity === sev
                                    ? severityColors[sev]
                                    : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'}"
                        >
                            {$_(`bug_report.severity_${sev}`)}
                        </button>
                    {/each}
                </div>
            </div>
        {/if}

        <!-- Reporter Info Section -->
        <div class="p-4 rounded-xl border-2 {auth.isAuthenticated
            ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
            : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700'}">
            {#if auth.isAuthenticated}
                <!-- Logged-in user info -->
                <div class="flex items-center gap-3">
                    {#if auth.user?.profilePicture}
                        <img
                            src={auth.user.profilePicture}
                            alt={auth.user.fullName}
                            class="w-10 h-10 rounded-full object-cover border-2 border-green-300 dark:border-green-700"
                        />
                    {:else}
                        <div class="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                            <span class="text-white font-bold">
                                {auth.user?.firstName?.charAt(0).toUpperCase() || '?'}
                            </span>
                        </div>
                    {/if}
                    <div class="flex-1">
                        <p class="text-sm font-medium text-gray-900 dark:text-white">
                            {auth.user?.fullName || auth.user?.firstName}
                        </p>
                        <p class="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                            <CheckCircle class="w-3 h-3" />
                            {$_("bug_report.reporting_as_user")}
                        </p>
                    </div>
                </div>
            {:else}
                <!-- Anonymous user -->
                <div class="space-y-3">
                    <div class="flex items-center gap-2">
                        <div class="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                            <HelpCircle class="w-4 h-4 text-gray-500 dark:text-gray-400" />
                        </div>
                        <p class="text-sm text-gray-600 dark:text-gray-400">
                            {$_("bug_report.reporting_anonymous")}
                        </p>
                    </div>
                    <div>
                        <label for="reporterEmail" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            {$_("bug_report.email")} <span class="text-red-500">*</span>
                        </label>
                        <input
                            id="reporterEmail"
                            type="email"
                            bind:value={reporterEmail}
                            class="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 transition-colors"
                            placeholder={$_("bug_report.email_placeholder")}
                            required
                        />
                        <p class="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
                            {$_("bug_report.email_hint")}
                        </p>
                    </div>
                </div>
            {/if}
        </div>

        <!-- Info Note -->
        <div class="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800">
            <div class="flex items-start gap-2">
                <AlertTriangle class="w-4 h-4 text-blue-500 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                <p class="text-xs text-blue-700 dark:text-blue-300">
                    {$_("bug_report.auto_info_note")}
                </p>
            </div>
        </div>

        <!-- Submit Button -->
        <div class="flex justify-end gap-3 pt-2">
            <button
                type="button"
                onclick={handleClose}
                class="px-5 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-xl transition-colors"
            >
                {$_("common.cancel")}
            </button>
            <button
                type="submit"
                disabled={!isValid || submitting}
                class="px-6 py-2.5 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 dark:disabled:bg-indigo-800 disabled:cursor-not-allowed rounded-xl transition-colors shadow-sm hover:shadow-md"
            >
                {submitting ? $_("bug_report.submitting") : $_("bug_report.submit")}
            </button>
        </div>
    </form>
</Modal>
