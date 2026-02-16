<script lang="ts">
    import { _ } from "$lib/i18n";
    import {
        Mail,
        Send,
        Copy,
        Check,
        ArrowLeft,
        Users,
        Sparkles,
        ExternalLink,
        Loader2,
        Globe,
    } from "lucide-svelte";
    import { toast } from "$lib/stores/toast.svelte";
    import { auth } from "$lib/stores/auth.svelte";
    import { generateBetaInviteEmail, getBetaInviteSubject } from "$lib/email-templates";
    import { goto } from "$app/navigation";

    // Form state
    let inviteName = $state("");
    let inviteEmail = $state("");
    let language = $state<"en" | "es">("es");
    let showEmailPreview = $state(false);
    let generatedEmailHtml = $state("");
    let copied = $state(false);
    let copiedSubject = $state(false);
    let isSending = $state(false);

    // App URL for emails
    const APP_URL = "https://adoptme.app";

    // Sent invites history (stored in session)
    let sentInvites = $state<{ name: string; email: string; date: Date; language: string }[]>([]);

    // Get subject based on selected language
    let emailSubject = $derived(getBetaInviteSubject(language));

    function generatePreview() {
        if (!inviteName.trim()) {
            toast.warning("Please enter a name");
            return;
        }

        generatedEmailHtml = generateBetaInviteEmail({
            name: inviteName.trim(),
            appUrl: APP_URL,
            language,
        });
        showEmailPreview = true;
    }

    async function sendInvite() {
        if (!inviteName.trim()) {
            toast.warning("Please enter a name");
            return;
        }
        if (!inviteEmail.trim() || !inviteEmail.includes("@")) {
            toast.warning("Please enter a valid email address");
            return;
        }

        isSending = true;

        try {
            const response = await fetch("/api/admin/invite", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${auth.token}`,
                },
                body: JSON.stringify({
                    name: inviteName.trim(),
                    email: inviteEmail.trim(),
                    language,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Failed to send invite");
            }

            toast.success(
                language === "es"
                    ? `Invitación enviada a ${inviteEmail}`
                    : `Invite sent to ${inviteEmail}`
            );

            // Track the invite
            sentInvites = [
                {
                    name: inviteName,
                    email: inviteEmail,
                    date: new Date(),
                    language: language === "es" ? "Spanish" : "English",
                },
                ...sentInvites,
            ];

            // Clear form
            inviteName = "";
            inviteEmail = "";
            showEmailPreview = false;
            generatedEmailHtml = "";
        } catch (error: any) {
            console.error("Error sending invite:", error);
            toast.error(error.message || "Failed to send invite");
        } finally {
            isSending = false;
        }
    }

    async function copyEmailHtml() {
        try {
            await navigator.clipboard.writeText(generatedEmailHtml);
            copied = true;
            toast.success("Email HTML copied to clipboard!");
            setTimeout(() => (copied = false), 2000);
        } catch {
            toast.error("Failed to copy");
        }
    }

    async function copySubject() {
        try {
            await navigator.clipboard.writeText(emailSubject);
            copiedSubject = true;
            toast.success("Subject copied!");
            setTimeout(() => (copiedSubject = false), 2000);
        } catch {
            toast.error("Failed to copy");
        }
    }

    function openInMailto() {
        const subject = encodeURIComponent(emailSubject);
        const bodyText =
            language === "es"
                ? `Hola ${inviteName},\n\n¡Has sido invitado a probar AdoptMe!\n\nÚnete aquí: ${APP_URL}\n\n¡Gracias!\nPablo`
                : `Hi ${inviteName},\n\nYou've been invited to test AdoptMe!\n\nJoin here: ${APP_URL}\n\nThank you!\nPablo`;
        const body = encodeURIComponent(bodyText);
        window.open(`mailto:${inviteEmail}?subject=${subject}&body=${body}`);
    }

    function openGmail() {
        const subject = encodeURIComponent(emailSubject);
        const bodyText =
            language === "es"
                ? `Hola ${inviteName},\n\n¡Has sido invitado a probar AdoptMe!\n\nÚnete aquí: ${APP_URL}\n\n¡Gracias!\nPablo`
                : `Hi ${inviteName},\n\nYou've been invited to test AdoptMe!\n\nJoin here: ${APP_URL}\n\nThank you!\nPablo`;
        const body = encodeURIComponent(bodyText);
        window.open(
            `https://mail.google.com/mail/?view=cm&fs=1&to=${inviteEmail}&su=${subject}&body=${body}`,
            "_blank"
        );
    }
</script>

<svelte:head>
    <title>Beta Invites - Admin | AdoptMe</title>
</svelte:head>

<div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <div class="max-w-4xl mx-auto px-4 py-8">
        <!-- Header -->
        <div class="flex items-center gap-4 mb-8">
            <button
                onclick={() => goto("/admin")}
                class="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
                <ArrowLeft class="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>
            <div class="w-12 h-12 bg-amber-100 dark:bg-amber-900/30 rounded-xl flex items-center justify-center">
                <Mail class="w-6 h-6 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
                <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Beta Invites</h1>
                <p class="text-sm text-gray-500 dark:text-gray-400">
                    Invite testers to try AdoptMe
                </p>
            </div>
        </div>

        <div class="grid lg:grid-cols-3 gap-6">
            <!-- Invite Form -->
            <div class="lg:col-span-2">
                <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                    <div class="p-6 border-b border-gray-100 dark:border-gray-700">
                        <div class="flex items-center gap-3">
                            <Sparkles class="w-5 h-5 text-amber-500" />
                            <h2 class="text-lg font-semibold text-gray-900 dark:text-white">
                                Create Invitation
                            </h2>
                        </div>
                    </div>

                    <div class="p-6 space-y-5">
                        <!-- Language Selector -->
                        <div>
                            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                <Globe class="w-4 h-4 inline mr-1" />
                                Email Language
                            </label>
                            <div class="flex gap-2">
                                <button
                                    onclick={() => (language = "en")}
                                    class="flex-1 px-4 py-3 rounded-xl border-2 font-medium transition-all flex items-center justify-center gap-2 {language ===
                                    'en'
                                        ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300'
                                        : 'border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-gray-300'}"
                                >
                                    <span class="text-lg">🇺🇸</span>
                                    English
                                </button>
                                <button
                                    onclick={() => (language = "es")}
                                    class="flex-1 px-4 py-3 rounded-xl border-2 font-medium transition-all flex items-center justify-center gap-2 {language ===
                                    'es'
                                        ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300'
                                        : 'border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-gray-300'}"
                                >
                                    <span class="text-lg">🇪🇸</span>
                                    Español
                                </button>
                            </div>
                        </div>

                        <!-- Name Input -->
                        <div>
                            <label for="invite-name" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Recipient Name <span class="text-red-500">*</span>
                            </label>
                            <input
                                id="invite-name"
                                type="text"
                                bind:value={inviteName}
                                placeholder="John Doe"
                                class="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                            />
                        </div>

                        <!-- Email Input -->
                        <div>
                            <label for="invite-email" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Email Address <span class="text-red-500">*</span>
                            </label>
                            <input
                                id="invite-email"
                                type="email"
                                bind:value={inviteEmail}
                                placeholder="john@example.com"
                                class="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                            />
                        </div>

                        <!-- Email Subject -->
                        <div>
                            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Email Subject
                            </label>
                            <div class="flex items-center gap-2">
                                <div class="flex-1 px-4 py-3 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-700 dark:text-gray-300 text-sm">
                                    {emailSubject}
                                </div>
                                <button
                                    onclick={copySubject}
                                    class="p-3 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                                    title="Copy subject"
                                >
                                    {#if copiedSubject}
                                        <Check class="w-4 h-4 text-green-500" />
                                    {:else}
                                        <Copy class="w-4 h-4" />
                                    {/if}
                                </button>
                            </div>
                        </div>

                        <!-- Action Buttons -->
                        <div class="flex flex-wrap gap-3 pt-4">
                            <!-- Send Invite Button (API) -->
                            <button
                                onclick={sendInvite}
                                disabled={!inviteName.trim() || !inviteEmail.trim() || isSending}
                                class="flex-1 min-w-[160px] px-5 py-3 bg-green-600 text-white font-medium rounded-xl hover:bg-green-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                            >
                                {#if isSending}
                                    <Loader2 class="w-4 h-4 animate-spin" />
                                    Sending...
                                {:else}
                                    <Send class="w-4 h-4" />
                                    Send Invite
                                {/if}
                            </button>

                            <button
                                onclick={generatePreview}
                                disabled={!inviteName.trim()}
                                class="px-5 py-3 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Mail class="w-4 h-4" />
                                Preview
                            </button>

                            {#if inviteEmail}
                                <button
                                    onclick={openInMailto}
                                    class="px-5 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex items-center gap-2"
                                >
                                    <ExternalLink class="w-4 h-4" />
                                    Mail App
                                </button>

                                <button
                                    onclick={openGmail}
                                    class="px-5 py-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 font-medium rounded-xl hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors flex items-center gap-2"
                                >
                                    <ExternalLink class="w-4 h-4" />
                                    Gmail
                                </button>
                            {/if}
                        </div>
                    </div>
                </div>

                <!-- Email Preview -->
                {#if showEmailPreview}
                    <div class="mt-6 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                        <div class="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-700">
                            <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
                                Email Preview ({language === "es" ? "Spanish" : "English"})
                            </h3>
                            <div class="flex items-center gap-2">
                                <button
                                    onclick={copyEmailHtml}
                                    class="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
                                >
                                    {#if copied}
                                        <Check class="w-4 h-4" />
                                        Copied!
                                    {:else}
                                        <Copy class="w-4 h-4" />
                                        Copy HTML
                                    {/if}
                                </button>
                                <button
                                    onclick={() => (showEmailPreview = false)}
                                    class="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                                >
                                    ✕
                                </button>
                            </div>
                        </div>

                        <div class="p-4 bg-gray-100 dark:bg-gray-900">
                            <iframe
                                srcdoc={generatedEmailHtml}
                                class="w-full h-[500px] bg-white rounded-lg shadow-sm"
                                title="Email Preview"
                            ></iframe>
                        </div>
                    </div>
                {/if}
            </div>

            <!-- Sidebar -->
            <div class="space-y-6">
                <!-- Quick Stats -->
                <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
                    <div class="flex items-center gap-3 mb-4">
                        <Users class="w-5 h-5 text-indigo-500" />
                        <h3 class="font-semibold text-gray-900 dark:text-white">Session Stats</h3>
                    </div>
                    <div class="text-center py-4">
                        <div class="text-4xl font-bold text-indigo-600 dark:text-indigo-400">
                            {sentInvites.length}
                        </div>
                        <div class="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            Invites sent this session
                        </div>
                    </div>
                </div>

                <!-- Recent Invites -->
                {#if sentInvites.length > 0}
                    <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
                        <h3 class="font-semibold text-gray-900 dark:text-white mb-4">Recent Invites</h3>
                        <div class="space-y-3">
                            {#each sentInvites.slice(0, 5) as invite}
                                <div class="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                                    <div class="w-8 h-8 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center text-sm font-medium text-indigo-600 dark:text-indigo-400">
                                        {invite.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div class="flex-1 min-w-0">
                                        <div class="font-medium text-sm text-gray-900 dark:text-white truncate">
                                            {invite.name}
                                        </div>
                                        <div class="text-xs text-gray-500 dark:text-gray-400 truncate">
                                            {invite.email}
                                        </div>
                                    </div>
                                    <div class="text-xs text-gray-400 dark:text-gray-500">
                                        {invite.language === "Spanish" ? "🇪🇸" : "🇺🇸"}
                                    </div>
                                </div>
                            {/each}
                        </div>
                    </div>
                {/if}

                <!-- Tips -->
                <div class="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-2xl border border-amber-200 dark:border-amber-800 p-6">
                    <h3 class="font-semibold text-amber-800 dark:text-amber-300 mb-3">Tips</h3>
                    <ul class="space-y-2 text-sm text-amber-700 dark:text-amber-400">
                        <li class="flex items-start gap-2">
                            <span class="mt-1">•</span>
                            <span><strong>Send Invite</strong> sends the email directly via our server</span>
                        </li>
                        <li class="flex items-start gap-2">
                            <span class="mt-1">•</span>
                            <span>Use <strong>Preview</strong> to see the email before sending</span>
                        </li>
                        <li class="flex items-start gap-2">
                            <span class="mt-1">•</span>
                            <span>Choose the language based on the recipient's preference</span>
                        </li>
                    </ul>
                </div>
            </div>
        </div>
    </div>
</div>
