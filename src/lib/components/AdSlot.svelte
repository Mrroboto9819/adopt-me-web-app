<script lang="ts">
    import { onMount } from "svelte";
    import { PUBLIC_ADSENSE_CLIENT_ID } from "$env/static/public";
    import { dev } from "$app/environment";

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

    // Check if AdSense is properly configured (not placeholder)
    const isConfigured = PUBLIC_ADSENSE_CLIENT_ID && !PUBLIC_ADSENSE_CLIENT_ID.includes("XXXXXXXX");

    onMount(() => {
        if (!dev && isConfigured) {
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
    {#if dev || !isConfigured}
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
    {:else}
        <!-- Real AdSense code for production -->
        <ins
            class="adsbygoogle"
            style="display:block"
            data-ad-client={PUBLIC_ADSENSE_CLIENT_ID}
            data-ad-slot={slot}
            data-ad-format={format}
            data-full-width-responsive={responsive}
        ></ins>
    {/if}
</div>

<style>
    .ad-slot {
        width: 100%;
    }
</style>
