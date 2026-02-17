<script lang="ts">
    interface Props {
        severity: string;
    }

    let { severity }: Props = $props();

    const colors: Record<string, string> = {
        low: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
        medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
        high: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
        critical: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    };

    let colorClass = $derived(colors[severity] || colors.medium);
</script>

<span class="px-2 py-1 rounded-full text-xs font-medium capitalize {colorClass}">
    {severity}
</span>
