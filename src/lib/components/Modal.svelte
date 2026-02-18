<script lang="ts">
    import { X } from "lucide-svelte";
    import { type Snippet } from "svelte";
    import gsap from "gsap";

    let {
        open = $bindable(),
        title,
        onClose,
        children,
        footer,
        maxWidth = "sm:max-w-lg",
        hideHeader = false,
        noPadding = false,
    }: {
        open: boolean;
        title?: string;
        onClose: () => void;
        children: Snippet;
        footer?: Snippet;
        maxWidth?: string;
        hideHeader?: boolean;
        noPadding?: boolean;
    } = $props();

    // Element refs for GSAP animations
    let backdropEl: HTMLButtonElement | null = $state(null);
    let modalPanelEl: HTMLDivElement | null = $state(null);
    let modalContentEl: HTMLDivElement | null = $state(null);

    // Internal visibility state for animation control
    let isVisible = $state(false);
    let isAnimating = $state(false);

    // Watch for open prop changes
    $effect(() => {
        if (open && !isVisible && !isAnimating) {
            openModal();
        } else if (!open && isVisible && !isAnimating) {
            closeModal();
        }
    });

    function openModal() {
        // Lock body scroll before showing modal
        document.body.style.overflow = "hidden";
        isVisible = true;
        isAnimating = true;

        requestAnimationFrame(() => {
            const tl = gsap.timeline({
                onComplete: () => {
                    isAnimating = false;
                },
            });

            // Backdrop fade in
            if (backdropEl) {
                tl.fromTo(
                    backdropEl,
                    { opacity: 0 },
                    { opacity: 1, duration: 0.25, ease: "power2.out" },
                    0
                );
            }

            // Modal panel scale and fade in
            if (modalPanelEl) {
                tl.fromTo(
                    modalPanelEl,
                    { opacity: 0, scale: 0.95, y: 20 },
                    { opacity: 1, scale: 1, y: 0, duration: 0.35, ease: "power3.out" },
                    0.1
                );
            }

            // Content items stagger animation
            if (modalContentEl) {
                const contentItems = modalContentEl.querySelectorAll(".modal-animate-item");
                if (contentItems.length > 0) {
                    tl.fromTo(
                        contentItems,
                        { opacity: 0, y: 10 },
                        { opacity: 1, y: 0, duration: 0.25, stagger: 0.05, ease: "power2.out" },
                        0.2
                    );
                }
            }
        });
    }

    function closeModal() {
        isAnimating = true;

        const tl = gsap.timeline({
            onComplete: () => {
                isVisible = false;
                isAnimating = false;
                document.body.style.overflow = "";
            },
        });

        // Modal panel scale and fade out
        if (modalPanelEl) {
            tl.to(
                modalPanelEl,
                { opacity: 0, scale: 0.95, y: 10, duration: 0.2, ease: "power2.in" },
                0
            );
        }

        // Backdrop fade out
        if (backdropEl) {
            tl.to(
                backdropEl,
                { opacity: 0, duration: 0.2, ease: "power2.in" },
                0.05
            );
        }
    }

    function handleClose() {
        if (isAnimating) return;
        // Call onClose immediately to set open = false
        // The $effect will then trigger closeModal()
        onClose();
    }

    function handleKeydown(e: KeyboardEvent) {
        if (e.key === "Escape" && isVisible && !isAnimating) {
            handleClose();
        }
    }
</script>

<svelte:window onkeydown={handleKeydown} />

{#if isVisible}
    <div
        class="fixed inset-0 z-50 overflow-y-auto"
        aria-labelledby="modal-title"
        role="dialog"
        aria-modal="true"
    >
        <div
            class="flex items-center justify-center min-h-screen px-4 p-4 text-center"
        >
            <!-- Background overlay (separate for GSAP animation) -->
            <button
                bind:this={backdropEl}
                type="button"
                class="fixed inset-0 bg-gray-900/60 backdrop-blur-sm cursor-default"
                style="opacity: 0;"
                aria-label="Close modal"
                onclick={handleClose}
            ></button>

            <!-- Modal panel (separate for GSAP animation) -->
            <div
                bind:this={modalPanelEl}
                class="relative bg-white dark:bg-gray-800 rounded-2xl text-left shadow-2xl sm:my-8 {maxWidth} w-full max-h-[90vh] flex flex-col overflow-hidden"
                style="opacity: 0;"
            >
                <!-- Header (fixed) - only show if not hidden -->
                {#if !hideHeader}
                    <div
                        class="flex justify-between items-center px-6 py-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-700/50 flex-shrink-0"
                    >
                        {#if title}
                            <h3
                                class="text-lg font-bold text-gray-900 dark:text-white"
                                id="modal-title"
                            >
                                {title}
                            </h3>
                        {:else}
                            <div></div>
                        {/if}
                        <button
                            onclick={handleClose}
                            class="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 p-1 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            aria-label="Close modal"
                        >
                            <X class="w-5 h-5" />
                        </button>
                    </div>
                {/if}

                <!-- Body (scrollable) -->
                <div bind:this={modalContentEl} class="{noPadding ? '' : 'px-6 py-6'} overflow-y-auto flex-1">
                    {@render children()}
                </div>

                <!-- Footer (fixed) -->
                {#if footer}
                    <div
                        class="px-6 py-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-700/50 flex-shrink-0"
                    >
                        {@render footer()}
                    </div>
                {/if}
            </div>
        </div>
    </div>
{/if}
