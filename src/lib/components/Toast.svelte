<script lang="ts">
    import { toast, type Toast } from "$lib/stores/toast.svelte";
    import { CheckCircle, XCircle, AlertTriangle, Info, X } from "lucide-svelte";

    interface Props {
        toast: Toast;
    }

    let { toast: toastItem }: Props = $props();

    const typeConfig = {
        success: {
            wrapper: "bg-white dark:bg-gray-800 border-l-4 border-green-500",
            iconBg: "bg-green-100 dark:bg-green-900/30",
            iconColor: "text-green-600 dark:text-green-400",
            Icon: CheckCircle,
        },
        error: {
            wrapper: "bg-white dark:bg-gray-800 border-l-4 border-red-500",
            iconBg: "bg-red-100 dark:bg-red-900/30",
            iconColor: "text-red-600 dark:text-red-400",
            Icon: XCircle,
        },
        warning: {
            wrapper: "bg-white dark:bg-gray-800 border-l-4 border-yellow-500",
            iconBg: "bg-yellow-100 dark:bg-yellow-900/30",
            iconColor: "text-yellow-600 dark:text-yellow-400",
            Icon: AlertTriangle,
        },
        info: {
            wrapper: "bg-white dark:bg-gray-800 border-l-4 border-blue-500",
            iconBg: "bg-blue-100 dark:bg-blue-900/30",
            iconColor: "text-blue-600 dark:text-blue-400",
            Icon: Info,
        },
    };

    const config = $derived(typeConfig[toastItem.type]);
</script>

<div
    class="flex items-start gap-3 p-4 rounded-xl shadow-lg
         {config.wrapper}
         min-w-[320px] max-w-md
         animate-slide-in
         border border-gray-100 dark:border-gray-700"
    role="alert"
>
    <!-- Icon with background -->
    <div class="flex-shrink-0 w-8 h-8 rounded-full {config.iconBg} flex items-center justify-center">
        <config.Icon class="w-5 h-5 {config.iconColor}" />
    </div>

    <!-- Message -->
    <p class="flex-1 text-sm font-medium leading-snug text-gray-800 dark:text-gray-200 pt-1">
        {toastItem.message}
    </p>

    <!-- Close button -->
    <button
        onclick={() => toast.remove(toastItem.id)}
        class="flex-shrink-0 p-1 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
        aria-label="Close notification"
    >
        <X class="w-4 h-4" />
    </button>
</div>

<style>
    @keyframes slide-in {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }

    .animate-slide-in {
        animation: slide-in 0.3s cubic-bezier(0.21, 1.02, 0.73, 1) forwards;
    }
</style>
