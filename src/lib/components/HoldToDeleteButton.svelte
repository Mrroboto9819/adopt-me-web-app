<script lang="ts">
    import { Trash2 } from "lucide-svelte";

    interface Props {
        onConfirm: () => void;
        holdDuration?: number; // in milliseconds
        disabled?: boolean;
        label?: string;
        confirmLabel?: string;
    }

    let {
        onConfirm,
        holdDuration = 2000,
        disabled = false,
        label = "Delete Account",
        confirmLabel = "Keep holding to confirm..."
    }: Props = $props();

    let isHolding = $state(false);
    let progress = $state(0);
    let holdInterval: ReturnType<typeof setInterval> | null = null;
    let holdStartTime = $state(0);

    function startHold() {
        if (disabled) return;

        isHolding = true;
        progress = 0;
        holdStartTime = Date.now();

        holdInterval = setInterval(() => {
            const elapsed = Date.now() - holdStartTime;
            progress = Math.min((elapsed / holdDuration) * 100, 100);

            if (progress >= 100) {
                stopHold();
                onConfirm();
            }
        }, 16); // ~60fps
    }

    function stopHold() {
        isHolding = false;
        progress = 0;
        if (holdInterval) {
            clearInterval(holdInterval);
            holdInterval = null;
        }
    }

    function handleMouseDown(e: MouseEvent) {
        e.preventDefault();
        startHold();
    }

    function handleMouseUp() {
        stopHold();
    }

    function handleMouseLeave() {
        stopHold();
    }

    function handleTouchStart(e: TouchEvent) {
        e.preventDefault();
        startHold();
    }

    function handleTouchEnd() {
        stopHold();
    }
</script>

<div class="w-full">
    <button
        type="button"
        onmousedown={handleMouseDown}
        onmouseup={handleMouseUp}
        onmouseleave={handleMouseLeave}
        ontouchstart={handleTouchStart}
        ontouchend={handleTouchEnd}
        ontouchcancel={handleTouchEnd}
        disabled={disabled}
        class="relative overflow-hidden w-full px-6 py-3 bg-red-50 dark:bg-red-900/30 border-2 border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 font-semibold rounded-xl hover:bg-red-100 dark:hover:bg-red-900/50 hover:border-red-300 dark:hover:border-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed select-none touch-none"
    >
        <!-- Progress fill -->
        <div
            class="absolute inset-0 bg-red-500 transition-none"
            style="width: {progress}%; opacity: {isHolding ? 0.3 : 0}"
        ></div>

        <!-- Button content -->
        <span class="relative z-10 flex items-center justify-center gap-2">
            <Trash2 class="w-5 h-5 {isHolding ? 'animate-pulse' : ''}" />
            {#if isHolding}
                {confirmLabel}
            {:else}
                {label}
            {/if}
        </span>
    </button>

    {#if !isHolding}
        <p class="text-xs text-gray-400 dark:text-gray-500 mt-2 text-center">
            Press and hold for {holdDuration / 1000} seconds to confirm
        </p>
    {/if}
</div>
