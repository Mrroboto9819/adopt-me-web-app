<script lang="ts">
    import Modal from "./Modal.svelte";
    import { Flag, AlertTriangle, Loader2 } from "lucide-svelte";
    import { auth } from "$lib/stores/auth.svelte";
    import { toast } from "$lib/stores/toast.svelte";
    import { _ } from "$lib/i18n";
    import RichTextEditor from "./RichTextEditor.svelte";

    interface Props {
        open: boolean;
        postId: string;
        onClose: () => void;
        onReported?: () => void;
    }

    let { open = $bindable(false), postId, onClose, onReported }: Props = $props();

    type ReportReason = 'spam' | 'inappropriate' | 'harassment' | 'scam' | 'animal_abuse' | 'fake_listing' | 'other';

    const reportReasonKeys: { value: ReportReason; labelKey: string; descKey: string }[] = [
        { value: 'spam', labelKey: 'report.reason_spam', descKey: 'report.reason_spam_desc' },
        { value: 'inappropriate', labelKey: 'report.reason_inappropriate', descKey: 'report.reason_inappropriate_desc' },
        { value: 'harassment', labelKey: 'report.reason_harassment', descKey: 'report.reason_harassment_desc' },
        { value: 'scam', labelKey: 'report.reason_scam', descKey: 'report.reason_scam_desc' },
        { value: 'animal_abuse', labelKey: 'report.reason_animal_abuse', descKey: 'report.reason_animal_abuse_desc' },
        { value: 'fake_listing', labelKey: 'report.reason_fake_listing', descKey: 'report.reason_fake_listing_desc' },
        { value: 'other', labelKey: 'report.reason_other', descKey: 'report.reason_other_desc' },
    ];

    let selectedReasons = $state<ReportReason[]>([]);
    let description = $state("");
    let isSubmitting = $state(false);

    function toggleReason(reason: ReportReason) {
        if (selectedReasons.includes(reason)) {
            selectedReasons = selectedReasons.filter(r => r !== reason);
        } else {
            selectedReasons = [...selectedReasons, reason];
        }
    }

    function resetForm() {
        selectedReasons = [];
        description = "";
    }

    function handleClose() {
        if (!isSubmitting) {
            resetForm();
            onClose();
        }
    }

    async function handleSubmit() {
        if (selectedReasons.length === 0) {
            toast.error($_("report.select_reason"));
            return;
        }

        if (!auth.token) {
            toast.error($_("report.must_login"));
            return;
        }

        isSubmitting = true;

        try {
            const mutation = `
                mutation ReportPost($postId: ID!, $reasons: [ReportReason!]!, $description: String) {
                    reportPost(postId: $postId, reasons: $reasons, description: $description) {
                        id
                        reasons
                        status
                    }
                }
            `;

            const response = await fetch("/api/graphql", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${auth.token}`,
                },
                body: JSON.stringify({
                    query: mutation,
                    variables: {
                        postId,
                        reasons: selectedReasons,
                        description: description.trim() || null,
                    },
                }),
            });

            const result = await response.json();

            if (result.errors) {
                throw new Error(result.errors[0].message);
            }

            toast.success($_("report.success"));
            resetForm();
            onClose();
            onReported?.();
        } catch (e: any) {
            toast.error(e.message || $_("report.failed"));
        } finally {
            isSubmitting = false;
        }
    }
</script>

<Modal {open} {onClose} title={$_("report.title")}>
    <div class="space-y-5">
        <!-- Header Info -->
        <div class="flex items-center gap-3 pb-4 border-b border-gray-100 dark:border-gray-700">
            <div class="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-xl flex items-center justify-center">
                <Flag class="w-5 h-5 text-red-600 dark:text-red-400" />
            </div>
            <p class="text-sm text-gray-500 dark:text-gray-400">{$_("report.subtitle")}</p>
        </div>

        <!-- Reason Selection -->
        <div role="group" aria-labelledby="report-reasons-label">
            <span id="report-reasons-label" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                {$_("report.why_reporting")} <span class="text-red-500">*</span>
                <span class="font-normal text-gray-500 dark:text-gray-400 ml-1">({$_("report.select_all")})</span>
            </span>
            <div class="space-y-2">
                {#each reportReasonKeys as reason}
                    <label
                        class="flex items-start gap-3 p-3 border rounded-xl cursor-pointer transition-all {selectedReasons.includes(reason.value) ? 'border-red-500 bg-red-50 dark:bg-red-900/20 dark:border-red-700' : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700/50'}"
                    >
                        <input
                            type="checkbox"
                            checked={selectedReasons.includes(reason.value)}
                            onchange={() => toggleReason(reason.value)}
                            class="mt-0.5 w-4 h-4 text-red-600 border-gray-300 dark:border-gray-500 rounded focus:ring-red-500 dark:bg-gray-700"
                        />
                        <div class="flex-1">
                            <span class="block font-medium text-gray-900 dark:text-white text-sm">{$_(reason.labelKey)}</span>
                            <span class="block text-xs text-gray-500 dark:text-gray-400">{$_(reason.descKey)}</span>
                        </div>
                    </label>
                {/each}
            </div>
        </div>

        <!-- Description -->
        <div role="group" aria-labelledby="report-description-label">
            <span id="report-description-label" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {$_("report.additional_details")} ({$_("common.optional")})
            </span>
            <RichTextEditor
                content={description}
                placeholder={$_("report.additional_placeholder")}
                maxLength={1000}
                minHeight="100px"
                onUpdate={(html) => description = html}
                disabled={isSubmitting}
            />
        </div>

        <!-- Warning Notice -->
        <div class="flex items-start gap-3 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl text-sm">
            <AlertTriangle class="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
            <p class="text-amber-800 dark:text-amber-300">
                {$_("report.warning")}
            </p>
        </div>

        <!-- Action Buttons -->
        <div class="flex gap-3 justify-end pt-4 border-t border-gray-100 dark:border-gray-700">
            <button
                type="button"
                onclick={handleClose}
                disabled={isSubmitting}
                class="px-5 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 dark:focus:ring-offset-gray-800 transition-colors disabled:opacity-50"
            >
                {$_("common.cancel")}
            </button>
            <button
                type="button"
                onclick={handleSubmit}
                disabled={isSubmitting || selectedReasons.length === 0}
                class="px-5 py-2.5 text-sm font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
                {#if isSubmitting}
                    <Loader2 class="w-4 h-4 animate-spin" />
                    {$_("common.submitting")}
                {:else}
                    <Flag class="w-4 h-4" />
                    {$_("report.submit_report")}
                {/if}
            </button>
        </div>
    </div>
</Modal>
