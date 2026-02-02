<script lang="ts">
    import { fade, scale } from "svelte/transition";
    import { quintOut } from "svelte/easing";
    import { X } from "lucide-svelte";

    let { open, title, onClose, children } = $props();
</script>

{#if open}
    <div
        class="fixed inset-0 z-50 overflow-y-auto"
        aria-labelledby="modal-title"
        role="dialog"
        aria-modal="true"
    >
        <div
            class="flex items-center justify-center min-h-screen px-4 pb-20 text-center sm:block sm:p-0"
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

            <!-- This element is to trick the browser into centering the modal contents. -->
            <span
                class="hidden sm:inline-block sm:align-middle sm:h-screen"
                aria-hidden="true">&#8203;</span
            >

            <!-- 
                Modal panel 
                Using `scale` combined with `fade` (implicitly via opacity in scale) for a "pop" effect.
            -->
            <div
                class="relative inline-block align-bottom bg-white rounded-2xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg w-full"
                transition:scale={{
                    duration: 300,
                    opacity: 0,
                    start: 0.95,
                    easing: quintOut,
                }}
            >
                <!-- Header -->
                <div
                    class="flex justify-between items-center px-6 py-4 border-b border-gray-100 bg-gray-50/50"
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

                <!-- Body -->
                <div class="px-6 py-6">
                    {@render children()}
                </div>
            </div>
        </div>
    </div>
{/if}
