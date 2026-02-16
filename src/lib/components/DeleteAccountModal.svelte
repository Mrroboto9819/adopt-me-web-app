<script lang="ts">
    import Modal from "./Modal.svelte";
    import HoldToDeleteButton from "./HoldToDeleteButton.svelte";
    import { _ } from "$lib/i18n";
    import { AlertTriangle, UserX, FileText, MessageSquare } from "lucide-svelte";

    interface Props {
        open: boolean;
        onClose: () => void;
        onConfirm: () => void;
        isDeleting?: boolean;
    }

    let { open = $bindable(false), onClose, onConfirm, isDeleting = false }: Props = $props();
</script>

<Modal {open} {onClose} title={$_("delete_account.modal_title")}>
    <div class="space-y-6">
        <!-- Warning Header -->
        <div class="flex flex-col items-center text-center">
            <div class="w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-4">
                <AlertTriangle class="w-10 h-10 text-red-600 dark:text-red-400" />
            </div>
            <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-2">
                {$_("delete_account.confirm_title")}
            </h3>
            <p class="text-gray-600 dark:text-gray-300">
                {$_("delete_account.confirm_subtitle")}
            </p>
        </div>

        <!-- What will be deleted -->
        <div class="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 space-y-3">
            <p class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                {$_("delete_account.what_happens")}
            </p>
            <div class="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                <div class="w-8 h-8 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                    <UserX class="w-4 h-4 text-red-500 dark:text-red-400" />
                </div>
                <span>{$_("delete_account.item_profile")}</span>
            </div>
            <div class="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                <div class="w-8 h-8 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                    🐾
                </div>
                <span>{$_("delete_account.item_pets")}</span>
            </div>
            <div class="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                <div class="w-8 h-8 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                    <FileText class="w-4 h-4 text-red-500 dark:text-red-400" />
                </div>
                <span>{$_("delete_account.item_posts")}</span>
            </div>
            <div class="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                <div class="w-8 h-8 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                    <MessageSquare class="w-4 h-4 text-red-500 dark:text-red-400" />
                </div>
                <span>{$_("delete_account.item_comments")}</span>
            </div>
        </div>

        <!-- Warning Box -->
        <div class="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
            <p class="text-sm text-amber-800 dark:text-amber-300">
                <strong>{$_("delete_account.warning_title")}:</strong>
                {$_("delete_account.warning_message")}
            </p>
        </div>

        <!-- Action Buttons -->
        <div class="flex flex-col gap-3 pt-2">
            <HoldToDeleteButton
                onConfirm={onConfirm}
                holdDuration={3000}
                disabled={isDeleting}
                label={isDeleting
                    ? $_("delete_account.button_deleting")
                    : $_("delete_account.button_delete")}
                confirmLabel={$_("delete_account.button_confirm")}
            />
            <button
                type="button"
                onclick={onClose}
                class="w-full px-5 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 dark:focus:ring-offset-gray-900 transition-colors"
                disabled={isDeleting}
            >
                {$_("delete_account.button_cancel")}
            </button>
        </div>
    </div>
</Modal>
