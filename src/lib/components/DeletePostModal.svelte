<script lang="ts">
    import Modal from "./Modal.svelte";
    import { auth } from "$lib/stores/auth.svelte";
    import { toast } from "$lib/stores/toast.svelte";
    import { _ } from "$lib/i18n";
    import { AlertTriangle } from "lucide-svelte";

    interface Post {
        id: string;
        title: string;
        postType: string;
        images?: string[];
    }

    interface Props {
        open: boolean;
        post: Post | null;
        onClose: () => void;
        onPostDeleted?: () => void;
    }

    let { open = $bindable(false), post, onClose, onPostDeleted }: Props = $props();

    let deleting = $state(false);

    async function handleDeletePost() {
        if (!post) return;

        deleting = true;
        try {
            const mutation = `
                mutation DeletePost($id: ID!) {
                    deletePost(id: $id)
                }
            `;

            const res = await fetch("/api/graphql", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${auth.token}`,
                },
                body: JSON.stringify({
                    query: mutation,
                    variables: { id: post.id },
                }),
            });

            const result = await res.json();
            if (result.errors) throw new Error(result.errors[0].message);

            toast.success($_("delete_post.post_deleted"));
            onClose();
            if (onPostDeleted) {
                onPostDeleted();
            }
        } catch (e: any) {
            toast.error($_("delete_post.failed_delete") + ": " + e.message);
        } finally {
            deleting = false;
        }
    }

    function getPostTypeLabel(postType: string): string {
        switch (postType) {
            case 'adopt':
                return $_("post.adoption");
            case 'missing':
                return $_("post.missing_pet");
            default:
                return $_("post.general_post");
        }
    }
</script>

<Modal {open} {onClose} title={$_("delete_post.title")}>
    <div class="space-y-6">
        <!-- Warning Icon and Message -->
        <div class="flex flex-col items-center text-center">
            <div class="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-4">
                <AlertTriangle class="w-8 h-8 text-red-600 dark:text-red-400" />
            </div>
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                {$_("delete_post.confirm_title")}
            </h3>
            <p class="text-gray-600 dark:text-gray-400">
                {$_("delete_post.confirm_message")}
            </p>
        </div>

        <!-- Post Preview -->
        {#if post}
            <div class="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 flex items-center gap-4">
                {#if post.images && post.images.length > 0}
                    <img
                        src={post.images[0]}
                        alt={post.title}
                        class="w-16 h-16 rounded-lg object-cover"
                    />
                {:else}
                    <div class="w-16 h-16 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-2xl">
                        📝
                    </div>
                {/if}
                <div class="flex-1 min-w-0">
                    <h4 class="font-semibold text-gray-900 dark:text-white truncate">{post.title}</h4>
                    <p class="text-sm text-gray-500 dark:text-gray-400">{getPostTypeLabel(post.postType)}</p>
                </div>
            </div>
        {/if}

        <!-- Warning Box -->
        <div class="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-xl p-4">
            <p class="text-sm text-amber-800 dark:text-amber-200">
                <strong>{$_("delete_post.warning_title")}:</strong>
                {$_("delete_post.warning_message")}
            </p>
        </div>

        <!-- Action Buttons -->
        <div class="flex gap-3 justify-end pt-2">
            <button
                type="button"
                onclick={onClose}
                class="px-5 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
                disabled={deleting}
            >
                {$_("common.cancel")}
            </button>
            <button
                type="button"
                onclick={handleDeletePost}
                class="px-5 py-2.5 text-sm font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                disabled={deleting}
            >
                {#if deleting}
                    <div
                        class="animate-spin rounded-full h-4 w-4 border-b-2 border-white"
                    ></div>
                    {$_("delete_post.deleting")}
                {:else}
                    {$_("delete_post.confirm_button")}
                {/if}
            </button>
        </div>
    </div>
</Modal>
