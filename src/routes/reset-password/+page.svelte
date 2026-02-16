<script lang="ts">
    import { goto } from "$app/navigation";
    import { page } from "$app/stores";
    import { onMount } from "svelte";
    import { fade, fly } from "svelte/transition";
    import { Lock, Eye, EyeOff, ArrowLeft, Loader2, CheckCircle, AlertTriangle, Check, X } from "lucide-svelte";
    import { toast } from "$lib/stores/toast.svelte";
    import { _ } from "svelte-i18n";
    import SEO from "$lib/components/SEO.svelte";

    let token = $state("");
    let newPassword = $state("");
    let confirmPassword = $state("");
    let showPassword = $state(false);
    let showConfirmPassword = $state(false);
    let isSubmitting = $state(false);
    let resetSuccess = $state(false);
    let tokenError = $state(false);

    // Password validation
    let hasMinLength = $derived(newPassword.length >= 8);
    let hasUppercase = $derived(/[A-Z]/.test(newPassword));
    let hasLowercase = $derived(/[a-z]/.test(newPassword));
    let hasNumber = $derived(/[0-9]/.test(newPassword));
    let hasSpecial = $derived(/[!@#$%^&*(),.?":{}|<>]/.test(newPassword));
    let passwordsMatch = $derived(newPassword === confirmPassword && newPassword.length > 0);
    let isValidPassword = $derived(hasMinLength && hasUppercase && hasLowercase && hasNumber && hasSpecial);

    onMount(() => {
        const urlToken = $page.url.searchParams.get("token");
        if (!urlToken) {
            tokenError = true;
        } else {
            token = urlToken;
        }
    });

    async function handleSubmit(e: Event) {
        e.preventDefault();

        if (!isValidPassword) {
            toast.error($_("reset_password.invalid_password"));
            return;
        }

        if (!passwordsMatch) {
            toast.error($_("reset_password.passwords_not_match"));
            return;
        }

        isSubmitting = true;

        try {
            const res = await fetch("/api/graphql", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    query: `mutation ResetPassword($token: String!, $newPassword: String!) {
                        resetPassword(token: $token, newPassword: $newPassword)
                    }`,
                    variables: { token, newPassword },
                }),
            });

            const result = await res.json();

            if (result.errors) {
                throw new Error(result.errors[0].message);
            }

            resetSuccess = true;
        } catch (e: any) {
            if (e.message.includes("expired") || e.message.includes("Invalid")) {
                tokenError = true;
            }
            toast.error(e.message || $_("reset_password.error"));
        } finally {
            isSubmitting = false;
        }
    }
</script>

<SEO
    title={$_("reset_password.seo_title")}
    description={$_("reset_password.seo_desc")}
/>

<div class="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
    <div
        class="w-full max-w-md"
        in:fly={{ y: 20, duration: 400 }}
    >
        <!-- Back to Login -->
        <a
            href="/login"
            class="inline-flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 mb-6 transition-colors"
        >
            <ArrowLeft class="w-4 h-4" />
            {$_("reset_password.back_to_login")}
        </a>

        <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
            {#if tokenError}
                <!-- Token Error State -->
                <div class="text-center" in:fade={{ duration: 300 }}>
                    <div class="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                        <AlertTriangle class="w-8 h-8 text-red-600 dark:text-red-400" />
                    </div>
                    <h1 class="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                        {$_("reset_password.link_expired")}
                    </h1>
                    <p class="text-gray-600 dark:text-gray-400 mb-6">
                        {$_("reset_password.link_expired_desc")}
                    </p>
                    <a
                        href="/forgot-password"
                        class="block w-full px-4 py-2.5 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors text-center"
                    >
                        {$_("reset_password.request_new_link")}
                    </a>
                </div>
            {:else if resetSuccess}
                <!-- Success State -->
                <div class="text-center" in:fade={{ duration: 300 }}>
                    <div class="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircle class="w-8 h-8 text-green-600 dark:text-green-400" />
                    </div>
                    <h1 class="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                        {$_("reset_password.success_title")}
                    </h1>
                    <p class="text-gray-600 dark:text-gray-400 mb-6">
                        {$_("reset_password.success_desc")}
                    </p>
                    <a
                        href="/login"
                        class="block w-full px-4 py-2.5 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors text-center"
                    >
                        {$_("reset_password.go_to_login")}
                    </a>
                </div>
            {:else}
                <!-- Reset Form -->
                <div class="text-center mb-8">
                    <div class="w-16 h-16 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Lock class="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <h1 class="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                        {$_("reset_password.title")}
                    </h1>
                    <p class="text-gray-600 dark:text-gray-400">
                        {$_("reset_password.subtitle")}
                    </p>
                </div>

                <form onsubmit={handleSubmit} class="space-y-5">
                    <!-- New Password -->
                    <div>
                        <label for="newPassword" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            {$_("reset_password.new_password")}
                        </label>
                        <div class="relative">
                            <input
                                id="newPassword"
                                type={showPassword ? "text" : "password"}
                                bind:value={newPassword}
                                class="w-full px-4 py-3 pr-12 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 transition-colors"
                                placeholder={$_("reset_password.new_password_placeholder")}
                                required
                                disabled={isSubmitting}
                            />
                            <button
                                type="button"
                                onclick={() => showPassword = !showPassword}
                                class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                            >
                                {#if showPassword}
                                    <EyeOff class="w-5 h-5" />
                                {:else}
                                    <Eye class="w-5 h-5" />
                                {/if}
                            </button>
                        </div>
                    </div>

                    <!-- Password Requirements -->
                    {#if newPassword.length > 0}
                        <div class="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 space-y-2" in:fade={{ duration: 200 }}>
                            <p class="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
                                {$_("reset_password.requirements")}
                            </p>
                            <div class="grid grid-cols-2 gap-2 text-xs">
                                <div class="flex items-center gap-1.5 {hasMinLength ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}">
                                    {#if hasMinLength}<Check class="w-3.5 h-3.5" />{:else}<X class="w-3.5 h-3.5" />{/if}
                                    {$_("auth.req_length")}
                                </div>
                                <div class="flex items-center gap-1.5 {hasUppercase ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}">
                                    {#if hasUppercase}<Check class="w-3.5 h-3.5" />{:else}<X class="w-3.5 h-3.5" />{/if}
                                    {$_("auth.req_upper")}
                                </div>
                                <div class="flex items-center gap-1.5 {hasLowercase ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}">
                                    {#if hasLowercase}<Check class="w-3.5 h-3.5" />{:else}<X class="w-3.5 h-3.5" />{/if}
                                    {$_("auth.req_lower")}
                                </div>
                                <div class="flex items-center gap-1.5 {hasNumber ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}">
                                    {#if hasNumber}<Check class="w-3.5 h-3.5" />{:else}<X class="w-3.5 h-3.5" />{/if}
                                    {$_("auth.req_number")}
                                </div>
                                <div class="flex items-center gap-1.5 {hasSpecial ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}">
                                    {#if hasSpecial}<Check class="w-3.5 h-3.5" />{:else}<X class="w-3.5 h-3.5" />{/if}
                                    {$_("auth.req_special")}
                                </div>
                            </div>
                        </div>
                    {/if}

                    <!-- Confirm Password -->
                    <div>
                        <label for="confirmPassword" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            {$_("reset_password.confirm_password")}
                        </label>
                        <div class="relative">
                            <input
                                id="confirmPassword"
                                type={showConfirmPassword ? "text" : "password"}
                                bind:value={confirmPassword}
                                class="w-full px-4 py-3 pr-12 border rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 transition-colors {confirmPassword.length > 0 ? (passwordsMatch ? 'border-green-500' : 'border-red-500') : 'border-gray-300 dark:border-gray-600'}"
                                placeholder={$_("reset_password.confirm_password_placeholder")}
                                required
                                disabled={isSubmitting}
                            />
                            <button
                                type="button"
                                onclick={() => showConfirmPassword = !showConfirmPassword}
                                class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                            >
                                {#if showConfirmPassword}
                                    <EyeOff class="w-5 h-5" />
                                {:else}
                                    <Eye class="w-5 h-5" />
                                {/if}
                            </button>
                        </div>
                        {#if confirmPassword.length > 0 && !passwordsMatch}
                            <p class="mt-1.5 text-xs text-red-600 dark:text-red-400">
                                {$_("reset_password.passwords_not_match")}
                            </p>
                        {/if}
                    </div>

                    <button
                        type="submit"
                        disabled={isSubmitting || !isValidPassword || !passwordsMatch}
                        class="w-full px-4 py-3 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 dark:disabled:bg-indigo-800 disabled:cursor-not-allowed rounded-xl transition-colors flex items-center justify-center gap-2"
                    >
                        {#if isSubmitting}
                            <Loader2 class="w-4 h-4 animate-spin" />
                            {$_("reset_password.resetting")}
                        {:else}
                            <Lock class="w-4 h-4" />
                            {$_("reset_password.reset_button")}
                        {/if}
                    </button>
                </form>
            {/if}
        </div>
    </div>
</div>
