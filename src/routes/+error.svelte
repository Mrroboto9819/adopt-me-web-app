<script lang="ts">
    import { page } from "$app/stores";
    import { goto } from "$app/navigation";
    import { _ } from "$lib/i18n";
    import { Home, ArrowLeft } from "lucide-svelte";
</script>

<svelte:head>
    <title>{$page.status} - {$page.error?.message || "Error"} | AdoptMe</title>
</svelte:head>

<div class="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 px-4 py-8">
    <!-- Error Image -->
    <div class="w-full max-w-md mb-8">
        <img
            src="/error-404.png"
            alt="Error illustration"
            class="w-full h-auto object-contain"
        />
    </div>

    <!-- Error Content -->
    <div class="text-center max-w-md">
        <h1 class="text-6xl font-bold text-indigo-600 dark:text-indigo-400 mb-4">
            {$page.status}
        </h1>

        <h2 class="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
            {#if $page.status === 404}
                {$_("error.page_not_found")}
            {:else}
                {$_("error.something_wrong")}
            {/if}
        </h2>

        <p class="text-gray-600 dark:text-gray-400 mb-8">
            {#if $page.status === 404}
                {$_("error.page_not_found_desc")}
            {:else}
                {$page.error?.message || $_("error.generic_desc")}
            {/if}
        </p>

        <!-- Action Buttons -->
        <div class="flex flex-col sm:flex-row gap-3 justify-center">
            <button
                onclick={() => history.back()}
                class="inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
                <ArrowLeft class="w-4 h-4" />
                {$_("error.go_back")}
            </button>

            <button
                onclick={() => goto("/")}
                class="inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-medium text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 transition-colors shadow-md"
            >
                <Home class="w-4 h-4" />
                {$_("error.go_home")}
            </button>
        </div>
    </div>

    <!-- Decorative Elements -->
    <div class="absolute top-1/4 left-1/4 w-64 h-64 bg-indigo-200 dark:bg-indigo-900/20 rounded-full blur-3xl opacity-30 -z-10"></div>
    <div class="absolute bottom-1/4 right-1/4 w-64 h-64 bg-purple-200 dark:bg-purple-900/20 rounded-full blur-3xl opacity-30 -z-10"></div>
</div>
