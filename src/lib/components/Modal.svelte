<script lang="ts">
    import { fade, scale } from "svelte/transition";
    import { quintOut } from "svelte/easing";
    import { X } from "lucide-svelte";

    import { type Snippet } from "svelte";

    let {
        open,
        title,
        onClose,
        children,
        footer,
    }: {
        open: boolean;
        title?: string;
        onClose: () => void;
        children: Snippet;
        footer?: Snippet;
    } = $props();
</script>

{#if open}
    <div
        class="fixed inset-0 z-50 overflow-y-auto"
        aria-labelledby="modal-title"
        role="dialog"
        aria-modal="true"
    >
        <div
            class="flex items-center justify-center min-h-screen px-4 p-4 text-center"
        >
            <!-- 
                Background overlay 
                Using `fade` for smooth appearance.
            -->
            <div
                class="fixed inset-0 bg-gray-900/60 backdrop-blur-sm transition-opacity"
                aria-hidden="true"
                onclick={onClose}
                transition:fade={{ duration: 200 }}
            ></div>

            <!--
                Modal panel
                Using `scale` combined with `fade` (implicitly via opacity in scale) for a "pop" effect.
            -->
            <div
                class="relative bg-white rounded-2xl text-left shadow-2xl transform transition-all sm:my-8 sm:max-w-lg w-full max-h-[90vh] flex flex-col overflow-hidden"
                transition:scale={{
                    duration: 300,
                    opacity: 0,
                    start: 0.95,
                    easing: quintOut,
                }}
            >
                <!-- Header (fixed) -->
                <div
                    class="flex justify-between items-center px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex-shrink-0"
                >
                    {#if title}
                        <h3
                            class="text-lg font-bold text-gray-900"
                            id="modal-title"
                        >
                            {title}
                        </h3>
                    {:else}
                        <div></div>
                    {/if}
                    <button
                        onclick={onClose}
                        class="text-gray-400 hover:text-gray-500 hover:bg-gray-100 p-1 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        aria-label="Close modal"
                    >
                        <X class="w-5 h-5" />
                    </button>
                </div>

                <!-- Body (scrollable) -->
                <div class="px-6 py-6 overflow-y-auto flex-1">
                    {@render children()}
                </div>

                <!-- Footer (fixed) -->
                {#if footer}
                    <div
                        class="px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex-shrink-0"
                    >
                        {@render footer()}
                    </div>
                {/if}
            </div>
        </div>
    </div>
{/if}
