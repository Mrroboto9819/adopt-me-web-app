<script lang="ts">
    import { Bug, Lightbulb, Wrench, HelpCircle } from "lucide-svelte";

    interface Props {
        category: string;
    }

    let { category }: Props = $props();

    const configs: Record<string, { color: string; icon: any; label: string }> = {
        bug: {
            color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
            icon: Bug,
            label: 'Bug'
        },
        feature: {
            color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
            icon: Lightbulb,
            label: 'Feature'
        },
        improvement: {
            color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
            icon: Wrench,
            label: 'Improvement'
        },
        other: {
            color: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
            icon: HelpCircle,
            label: 'Other'
        },
    };

    let config = $derived(configs[category] || configs.other);
</script>

<span class="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium {config.color}">
    <svelte:component this={config.icon} class="w-3 h-3" />
    {config.label}
</span>
