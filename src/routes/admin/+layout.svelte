<script lang="ts">
    import { auth } from "$lib/stores/auth.svelte";
    import { onMount } from "svelte";
    import { goto } from "$app/navigation";
    import { Home, ArrowLeft } from "lucide-svelte";
    import { _ } from "$lib/i18n";

    let { children } = $props();

    // Admin protection state
    let isLoading = $state(true);
    let show404 = $state(false);

    onMount(() => {
        // Wait a tick for auth to hydrate from localStorage
        setTimeout(() => {
            if (!auth.isAdmin) {
                show404 = true;
            }
            isLoading = false;
        }, 100);
    });

    // Watch for auth changes (e.g., logout)
    $effect(() => {
        if (!isLoading && !auth.isAdmin) {
            show404 = true;
        }
    });
</script>

<svelte:head>
    <title>{show404 ? '404 - Page Not Found' : 'Admin'} | AdoptMe</title>
</svelte:head>

{#if isLoading}
    <!-- Loading state -->
    <div class="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
    </div>
{:else if show404}
    <!-- 404 Page for non-admins -->
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
                404
            </h1>

            <h2 class="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
                {$_("error.page_not_found")}
            </h2>

            <p class="text-gray-600 dark:text-gray-400 mb-8">
                {$_("error.page_not_found_desc")}
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
{:else}
    <!-- Admin content - render child pages -->
    {@render children()}
{/if}
