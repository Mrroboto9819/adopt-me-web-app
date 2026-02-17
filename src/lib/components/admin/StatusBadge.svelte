<script lang="ts">
    interface Props {
        status: string;
        type?: 'report' | 'bug';
    }

    let { status, type = 'report' }: Props = $props();

    const colors: Record<string, string> = {
        // Bug report statuses
        open: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
        in_progress: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
        resolved: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
        closed: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
        wont_fix: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400',
        // Post report statuses
        pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
        reviewed: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
        dismissed: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400',
    };

    const labels: Record<string, string> = {
        open: 'Open',
        in_progress: 'In Progress',
        resolved: 'Resolved',
        closed: 'Closed',
        wont_fix: "Won't Fix",
        pending: 'Pending',
        reviewed: 'Reviewed',
        dismissed: 'Dismissed',
    };

    let colorClass = $derived(colors[status] || colors.pending);
    let label = $derived(labels[status] || status);
</script>

<span class="px-2 py-1 rounded-full text-xs font-medium capitalize {colorClass}">
    {label}
</span>
