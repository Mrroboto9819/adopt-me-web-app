<script lang="ts">
    import { toast, type Toast } from "$lib/stores/toast.svelte";

    interface Props {
        toast: Toast;
    }

    let { toast: toastItem }: Props = $props();

    const typeStyles = {
        success: {
            wrapper: "border-l-4 border-green-500 bg-green-50",
            icon: "text-green-600",
        },
        error: {
            wrapper: "border-l-4 border-red-500 bg-red-50",
            icon: "text-red-600",
        },
        warning: {
            wrapper: "border-l-4 border-yellow-500 bg-yellow-50",
            icon: "text-yellow-600",
        },
        info: {
            wrapper: "border-l-4 border-blue-500 bg-blue-50",
            icon: "text-blue-600",
        },
    };

    const icons = {
        success: "M5 13l4 4L19 7",
        error: "M6 18L18 6M6 6l12 12",
        warning:
            "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z",
        info: "M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
    };
</script>

<div
    class="flex items-start gap-3 p-4 rounded-xl shadow-md
         bg-white text-slate-800
         min-w-[300px] max-w-md
         animate-slide-in
         {typeStyles[toastItem.type].wrapper}"
>
    <svg
        class="w-6 h-6 flex-shrink-0 mt-0.5 {typeStyles[toastItem.type].icon}"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
    >
        <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d={icons[toastItem.type]}
        />
    </svg>

    <p class="flex-1 text-sm font-medium leading-snug">
        {toastItem.message}
    </p>

    <button
        onclick={() => toast.remove(toastItem.id)}
        class="text-slate-400 hover:text-slate-600 transition-colors"
        aria-label="Close"
    >
        <svg
            class="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
        >
            <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M6 18L18 6M6 6l12 12"
            />
        </svg>
    </button>
</div>

<style>
    @keyframes slide-in {
        from {
            transform: translateX(16px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }

    .animate-slide-in {
        animation: slide-in 0.25s ease-out;
    }
</style>
