<script lang="ts">
    import { goto } from "$app/navigation";
    import { fade, fly } from "svelte/transition";
    import { Mail, ArrowLeft, Loader2, AlertTriangle, ExternalLink } from "lucide-svelte";
    import { toast } from "$lib/stores/toast.svelte";
    import { _ } from "svelte-i18n";
    import SEO from "$lib/components/SEO.svelte";

    let email = $state("");
    let isSubmitting = $state(false);
    let emailSent = $state(false);
    let devResetUrl = $state<string | null>(null); // For development mode when email fails

    async function handleSubmit(e: Event) {
        e.preventDefault();

        if (!email.trim()) {
            toast.error($_("forgot_password.enter_email"));
            return;
        }

        isSubmitting = true;
        devResetUrl = null;

        try {
            const res = await fetch("/api/graphql", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    query: `mutation RequestPasswordReset($email: String!) {
                        requestPasswordReset(email: $email)
                    }`,
                    variables: { email: email.trim().toLowerCase() },
                }),
            });

            const result = await res.json();

            // Check if we got a reset URL back (dev mode)
            const resetUrl = result.data?.requestPasswordReset;
            if (resetUrl) {
                devResetUrl = resetUrl;
                emailSent = true;
                return;
            }
        } catch (e: any) {
            // Silently ignore errors for security - don't reveal if email exists
            console.error("Password reset request:", e.message);
        } finally {
            isSubmitting = false;
        }

        // Always show success and redirect to login (security best practice)
        toast.success($_("forgot_password.email_sent_desc", { values: { email } }));
        goto("/login");
    }
</script>

<SEO
    title={$_("forgot_password.seo_title")}
    description={$_("forgot_password.seo_desc")}
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
            {$_("forgot_password.back_to_login")}
        </a>

        <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
            {#if emailSent && devResetUrl}
                <!-- Development Mode Only - Show Reset Link -->
                <div class="text-center" in:fade={{ duration: 300 }}>
                    <div class="w-16 h-16 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                        <AlertTriangle class="w-8 h-8 text-amber-600 dark:text-amber-400" />
                    </div>
                    <h1 class="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                        {$_("forgot_password.dev_mode_title")}
                    </h1>
                    <p class="text-gray-600 dark:text-gray-400 mb-4">
                        {$_("forgot_password.dev_mode_desc")}
                    </p>

                    <!-- Reset Link Box -->
                    <div class="bg-gray-100 dark:bg-gray-700 rounded-xl p-4 mb-6 text-left">
                        <p class="text-xs text-gray-500 dark:text-gray-400 mb-2 uppercase font-medium">
                            {$_("forgot_password.reset_link")}
                        </p>
                        <div class="flex items-center gap-2">
                            <code class="flex-1 text-xs bg-white dark:bg-gray-800 p-2 rounded border border-gray-200 dark:border-gray-600 overflow-x-auto whitespace-nowrap">
                                {devResetUrl}
                            </code>
                        </div>
                    </div>

                    <div class="space-y-3">
                        <a
                            href={devResetUrl}
                            class="w-full px-4 py-2.5 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors flex items-center justify-center gap-2"
                        >
                            <ExternalLink class="w-4 h-4" />
                            {$_("forgot_password.go_to_reset")}
                        </a>
                        <a
                            href="/login"
                            class="block w-full px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-xl transition-colors text-center"
                        >
                            {$_("forgot_password.back_to_login")}
                        </a>
                    </div>
                </div>
            {:else}
                <!-- Request Form -->
                <div class="text-center mb-8">
                    <div class="w-16 h-16 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Mail class="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <h1 class="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                        {$_("forgot_password.title")}
                    </h1>
                    <p class="text-gray-600 dark:text-gray-400">
                        {$_("forgot_password.subtitle")}
                    </p>
                </div>

                <form onsubmit={handleSubmit} class="space-y-6">
                    <div>
                        <label for="email" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            {$_("forgot_password.email_label")}
                        </label>
                        <input
                            id="email"
                            type="email"
                            bind:value={email}
                            class="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 transition-colors"
                            placeholder={$_("forgot_password.email_placeholder")}
                            required
                            disabled={isSubmitting}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={isSubmitting || !email.trim()}
                        class="w-full px-4 py-3 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 dark:disabled:bg-indigo-800 disabled:cursor-not-allowed rounded-xl transition-colors flex items-center justify-center gap-2"
                    >
                        {#if isSubmitting}
                            <Loader2 class="w-4 h-4 animate-spin" />
                            {$_("forgot_password.sending")}
                        {:else}
                            <Mail class="w-4 h-4" />
                            {$_("forgot_password.send_link")}
                        {/if}
                    </button>
                </form>
            {/if}
        </div>

        <!-- Footer -->
        <p class="text-center text-sm text-gray-500 dark:text-gray-400 mt-6">
            {$_("forgot_password.remember_password")}
            <a href="/login" class="text-indigo-600 dark:text-indigo-400 hover:underline font-medium">
                {$_("forgot_password.sign_in")}
            </a>
        </p>
    </div>
</div>
