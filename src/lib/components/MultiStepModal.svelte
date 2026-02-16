<script lang="ts">
    import Modal from "./Modal.svelte";
    import { _ } from "$lib/i18n";
    import { ChevronLeft, ChevronRight, Check } from "lucide-svelte";
    import gsap from "gsap";

    interface Step {
        id: string;
        title: string;
        icon?: any;
    }

    interface Props {
        open: boolean;
        onClose: () => void;
        title: string;
        steps: Step[];
        currentStep: number;
        onStepChange?: (step: number) => void;
        canProceed?: boolean;
        isSubmitting?: boolean;
        submitLabel?: string;
        children?: any;
    }

    let {
        open = $bindable(false),
        onClose,
        title,
        steps,
        currentStep = $bindable(0),
        onStepChange,
        canProceed = true,
        isSubmitting = false,
        submitLabel = "Submit",
        children,
    }: Props = $props();

    // GSAP animation refs
    let contentEl: HTMLElement | undefined = $state();
    let previousStep = $state(currentStep);

    // Animate content on step change
    $effect(() => {
        if (contentEl && open && previousStep !== currentStep) {
            const direction = currentStep > previousStep ? 1 : -1;

            // Animate content slide
            gsap.fromTo(
                contentEl,
                { opacity: 0, x: 60 * direction },
                { opacity: 1, x: 0, duration: 0.35, ease: "power2.out" }
            );

            previousStep = currentStep;
        }
    });

    // Animate progress bars
    $effect(() => {
        if (open && contentEl) {
            const bars = document.querySelectorAll('.step-progress-bar');
            bars.forEach((bar, index) => {
                const targetWidth = index < currentStep ? '100%' : index === currentStep ? '50%' : '0%';
                gsap.to(bar, { width: targetWidth, duration: 0.3, ease: 'power2.out' });
            });
        }
    });

    function goToStep(index: number) {
        if (index >= 0 && index < steps.length) {
            currentStep = index;
            onStepChange?.(index);
        }
    }

    function nextStep() {
        if (currentStep < steps.length - 1 && canProceed) {
            goToStep(currentStep + 1);
        }
    }

    function prevStep() {
        if (currentStep > 0) {
            goToStep(currentStep - 1);
        }
    }

    const isLastStep = $derived(currentStep === steps.length - 1);
    const isFirstStep = $derived(currentStep === 0);
</script>

<Modal {open} {onClose} {title}>
    <div class="flex flex-col h-full">
        <!-- Progress Indicator -->
        <div class="mb-6 px-2">
            <!-- Step indicators: Number on top, text below -->
            <div class="flex justify-between items-start gap-1">
                {#each steps as step, index}
                    <button
                        type="button"
                        onclick={() => index <= currentStep && goToStep(index)}
                        class="flex flex-col items-center flex-1 group {index <=
                        currentStep
                            ? 'cursor-pointer'
                            : 'cursor-not-allowed'}"
                        disabled={index > currentStep}
                    >
                        <!-- Number circle on top -->
                        <div
                            class="w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-200 mb-1.5 border-2
                            {index < currentStep
                                ? 'bg-indigo-600 text-white border-indigo-600'
                                : index === currentStep
                                  ? 'bg-indigo-600 text-white border-indigo-600 ring-4 ring-indigo-50 dark:ring-indigo-900/30'
                                  : 'bg-white dark:bg-gray-800 text-gray-400 dark:text-gray-500 border-gray-200 dark:border-gray-700'}"
                        >
                            {#if index < currentStep}
                                <Check class="w-4 h-4" />
                            {:else}
                                {index + 1}
                            {/if}
                        </div>
                        <!-- Text below -->
                        <span
                            class="text-[11px] font-medium text-center leading-tight px-1
                            {index === currentStep
                                ? 'text-indigo-600 dark:text-indigo-400'
                                : index < currentStep
                                  ? 'text-indigo-600 dark:text-indigo-400'
                                  : 'text-gray-400 dark:text-gray-500'}"
                        >
                            {step.title}
                        </span>
                        <!-- Progress bar below each step -->
                        <div
                            class="w-full h-1 bg-gray-100 dark:bg-gray-700 rounded-full mt-2 overflow-hidden"
                        >
                            <div
                                class="step-progress-bar h-full rounded-full bg-indigo-600"
                                style="width: {index < currentStep ? '100%' : index === currentStep ? '50%' : '0%'}"
                            ></div>
                        </div>
                    </button>
                {/each}
            </div>

            <!-- Progress text -->
            <p class="text-[11px] text-gray-400 text-center mt-3">
                {$_("common.step")}
                {currentStep + 1}
                {$_("common.of")}
                {steps.length}
            </p>
        </div>

        <!-- Content Area -->
        <div bind:this={contentEl} class="flex-1 overflow-y-auto min-h-[300px] max-h-[50vh]">
            {@render children?.()}
        </div>

        <!-- Navigation Buttons - Nielsen: User control and freedom -->
        <div
            class="flex justify-between items-center pt-4 mt-4 border-t border-gray-100 dark:border-gray-700"
        >
            <button
                type="button"
                onclick={prevStep}
                disabled={isFirstStep || isSubmitting}
                class="flex items-center gap-1 px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
                <ChevronLeft class="w-4 h-4" />
                {$_("common.back")}
            </button>

            <div class="flex gap-2">
                <button
                    type="button"
                    onclick={onClose}
                    disabled={isSubmitting}
                    class="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 disabled:opacity-50 transition-colors"
                >
                    {$_("common.cancel")}
                </button>

                {#if isLastStep}
                    <button
                        type="submit"
                        disabled={!canProceed || isSubmitting}
                        class="flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed shadow-md transition-all"
                    >
                        {#if isSubmitting}
                            <div
                                class="animate-spin rounded-full h-4 w-4 border-b-2 border-white"
                            ></div>
                        {/if}
                        {submitLabel}
                    </button>
                {:else}
                    <button
                        type="button"
                        onclick={nextStep}
                        disabled={!canProceed}
                        class="flex items-center gap-1 px-5 py-2.5 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed shadow-md transition-all"
                    >
                        {$_("common.next")}
                        <ChevronRight class="w-4 h-4" />
                    </button>
                {/if}
            </div>
        </div>
    </div>
</Modal>
