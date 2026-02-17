<script lang="ts">
    interface Segment {
        value: number;
        color: string;
        label: string;
    }

    interface Props {
        segments: Segment[];
        size?: number;
        thickness?: number;
        centerLabel?: string;
        centerValue?: string;
    }

    let { segments, size = 160, thickness = 24, centerLabel = "", centerValue = "" }: Props = $props();

    // Calculate total
    let total = $derived(segments.reduce((sum, s) => sum + s.value, 0));

    // Calculate SVG paths
    let paths = $derived(() => {
        const result: { d: string; color: string; label: string; percent: number }[] = [];
        let currentAngle = -90; // Start from top

        const radius = (size - thickness) / 2;
        const centerX = size / 2;
        const centerY = size / 2;

        for (const segment of segments) {
            if (segment.value <= 0) continue;

            const percent = (segment.value / total) * 100;
            const angle = (segment.value / total) * 360;

            // Calculate arc
            const startAngle = currentAngle;
            const endAngle = currentAngle + angle;

            const startRad = (startAngle * Math.PI) / 180;
            const endRad = (endAngle * Math.PI) / 180;

            const x1 = centerX + radius * Math.cos(startRad);
            const y1 = centerY + radius * Math.sin(startRad);
            const x2 = centerX + radius * Math.cos(endRad);
            const y2 = centerY + radius * Math.sin(endRad);

            const largeArc = angle > 180 ? 1 : 0;

            // Create arc path
            const d = `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}`;

            result.push({
                d,
                color: segment.color,
                label: segment.label,
                percent: Math.round(percent * 10) / 10
            });

            currentAngle = endAngle;
        }

        return result;
    });
</script>

<div class="inline-flex flex-col items-center">
    <div class="relative" style="width: {size}px; height: {size}px;">
        <svg width={size} height={size} class="transform -rotate-0">
            <!-- Background circle -->
            <circle
                cx={size / 2}
                cy={size / 2}
                r={(size - thickness) / 2}
                fill="none"
                stroke="currentColor"
                stroke-width={thickness}
                class="text-gray-100 dark:text-gray-700"
            />

            <!-- Segments -->
            {#each paths() as path}
                <path
                    d={path.d}
                    fill="none"
                    stroke={path.color}
                    stroke-width={thickness}
                    stroke-linecap="round"
                    class="transition-all duration-500"
                />
            {/each}
        </svg>

        <!-- Center text -->
        {#if centerLabel || centerValue}
            <div class="absolute inset-0 flex flex-col items-center justify-center">
                {#if centerValue}
                    <span class="text-2xl font-bold text-gray-900 dark:text-white">{centerValue}</span>
                {/if}
                {#if centerLabel}
                    <span class="text-xs text-gray-500 dark:text-gray-400">{centerLabel}</span>
                {/if}
            </div>
        {/if}
    </div>

    <!-- Legend -->
    {#if segments.length > 0}
        <div class="mt-4 flex flex-wrap justify-center gap-4">
            {#each paths() as path, i}
                <div class="flex items-center gap-2">
                    <div class="w-3 h-3 rounded-full" style="background-color: {path.color}"></div>
                    <span class="text-xs text-gray-600 dark:text-gray-400">
                        {segments[i].label} ({path.percent}%)
                    </span>
                </div>
            {/each}
        </div>
    {/if}
</div>
