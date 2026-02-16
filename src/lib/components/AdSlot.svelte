<script lang="ts">
    import { onMount } from "svelte";

    interface Props {
        slot?: string;
        format?: "auto" | "rectangle" | "vertical" | "horizontal";
        responsive?: boolean;
        className?: string;
    }

    let {
        slot = "",
        format = "auto",
        responsive = true,
        className = "",
    }: Props = $props();

    let adLoaded = $state(false);
    let adElement: HTMLElement | null = $state(null);

    // AdSense client ID (same as in layout)
    const ADSENSE_CLIENT_ID = "ca-pub-XXXXXXXXXXXXXXXX";

    onMount(() => {
        // Only attempt to load ads in production or when AdSense is configured
        if (typeof window !== "undefined" && (window as any).adsbygoogle) {
            try {
                ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
                adLoaded = true;
            } catch (e) {
                console.log("AdSense not available");
            }
        }
    });
</script>

<div
    class="ad-slot {className}"
    bind:this={adElement}
>
    <!-- Placeholder for development - shows ad dimensions -->
    <div
        class="bg-gray-100 dark:bg-gray-800 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl flex items-center justify-center text-gray-400 dark:text-gray-500 text-xs font-medium transition-colors
            {format === 'rectangle' ? 'aspect-square' : ''}
            {format === 'vertical' ? 'min-h-[400px]' : ''}
            {format === 'horizontal' ? 'h-24' : ''}
            {format === 'auto' ? 'min-h-[250px]' : ''}"
    >
        <div class="text-center p-4">
            <p class="uppercase tracking-wider mb-1">Ad Space</p>
            <p class="text-[10px] text-gray-400 dark:text-gray-600">
                {format === "rectangle" ? "300x250" : ""}
                {format === "vertical" ? "160x600" : ""}
                {format === "horizontal" ? "728x90" : ""}
                {format === "auto" ? "Responsive" : ""}
            </p>
        </div>
    </div>

    <!-- Real AdSense code (uncomment in production) -->
    <!--
    <ins
        class="adsbygoogle"
        style="display:block"
        data-ad-client={ADSENSE_CLIENT_ID}
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive={responsive}
    ></ins>
    -->
</div>

<style>
    .ad-slot {
        width: 100%;
    }
</style>
