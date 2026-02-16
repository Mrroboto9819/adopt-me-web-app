<script lang="ts">
    import SEO from "$lib/components/SEO.svelte";
    import { FileText, Mail } from "lucide-svelte";
    import { _ } from "svelte-i18n";

    const lastUpdated = "February 2026";
    const contactEmail = "pablo.cabrera.castrejon@gmail.com";
</script>

<SEO
    title={$_("terms.seo_title")}
    description={$_("terms.seo_desc")}
    keywords="terms of service, terms and conditions, user agreement, adoptme terms"
/>

<div class="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
    <!-- Hero Section -->
    <div class="bg-gradient-to-br from-indigo-600 to-purple-600 text-white">
        <div class="max-w-4xl mx-auto px-4 py-12 sm:py-16 text-center">
            <div
                class="inline-flex items-center justify-center w-16 h-16 bg-white/20 rounded-2xl mb-4 backdrop-blur-sm"
            >
                <FileText class="w-8 h-8" />
            </div>
            <h1 class="text-3xl sm:text-4xl font-extrabold mb-3">
                {$_("terms.title")}
            </h1>
            <p class="text-lg text-white/90">
                {$_("terms.last_updated", { values: { date: lastUpdated } })}
            </p>
        </div>
    </div>

    <!-- Content -->
    <div class="max-w-4xl mx-auto px-4 py-12">
        <div
            class="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 sm:p-8 transition-colors"
        >
            <div class="prose prose-gray dark:prose-invert max-w-none">
                <!-- Introduction -->
                <section class="mb-8">
                    <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-4">
                        {$_("terms.intro.title")}
                    </h2>
                    <p class="text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
                        {$_("terms.intro.p1")}
                    </p>
                    <p class="text-gray-600 dark:text-gray-300 leading-relaxed">
                        {$_("terms.intro.p2")}
                    </p>
                </section>

                <!-- Eligibility -->
                <section class="mb-8">
                    <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-4">
                        {$_("terms.eligibility.title")}
                    </h2>
                    <p class="text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
                        {$_("terms.eligibility.p1")}
                    </p>
                    <ul
                        class="list-disc list-inside text-gray-600 dark:text-gray-300 mb-4 space-y-1"
                    >
                        <li>{$_("terms.eligibility.l1")}</li>
                        <li>{$_("terms.eligibility.l2")}</li>
                        <li>{$_("terms.eligibility.l3")}</li>
                        <li>{$_("terms.eligibility.l4")}</li>
                    </ul>
                    <p class="text-gray-600 dark:text-gray-300 leading-relaxed">
                        {$_("terms.eligibility.p2")}
                    </p>
                </section>

                <!-- Account Registration and Verification -->
                <section class="mb-8">
                    <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-4">
                        {$_("terms.registration.title")}
                    </h2>
                    <p class="text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
                        {$_("terms.registration.p1")}
                    </p>
                    <ul
                        class="list-disc list-inside text-gray-600 dark:text-gray-300 mb-4 space-y-1"
                    >
                        <li>{$_("terms.registration.l1")}</li>
                        <li>{$_("terms.registration.l2")}</li>
                        <li>{$_("terms.registration.l3")}</li>
                        <li>{$_("terms.registration.l4")}</li>
                        <li>{$_("terms.registration.l5")}</li>
                        <li>{$_("terms.registration.l6")}</li>
                    </ul>
                    <p class="text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
                        {$_("terms.registration.p2")}
                    </p>
                    <p class="text-gray-600 dark:text-gray-300 leading-relaxed">
                        {$_("terms.registration.p3")}
                    </p>
                </section>

                <!-- Services Description -->
                <section class="mb-8">
                    <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-4">
                        {$_("terms.services.title")}
                    </h2>
                    <p class="text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
                        {$_("terms.services.p1")}
                    </p>
                    <ul
                        class="list-disc list-inside text-gray-600 dark:text-gray-300 mb-4 space-y-1"
                    >
                        <li>{$_("terms.services.l1")}</li>
                        <li>{$_("terms.services.l2")}</li>
                        <li>{$_("terms.services.l3")}</li>
                        <li>{$_("terms.services.l4")}</li>
                    </ul>
                    <p class="text-gray-600 dark:text-gray-300 leading-relaxed">
                        {$_("terms.services.p2")}
                    </p>
                </section>

                <!-- User Content -->
                <section class="mb-8">
                    <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-4">
                        {$_("terms.content.title")}
                    </h2>
                    <p class="text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
                        {$_("terms.content.p1")}
                    </p>
                    <ul
                        class="list-disc list-inside text-gray-600 dark:text-gray-300 mb-4 space-y-1"
                    >
                        <li>{$_("terms.content.l1")}</li>
                        <li>{$_("terms.content.l2")}</li>
                        <li>{$_("terms.content.l3")}</li>
                        <li>{$_("terms.content.l4")}</li>
                    </ul>
                    <p class="text-gray-600 dark:text-gray-300 leading-relaxed">
                        {$_("terms.content.p2")}
                    </p>
                </section>

                <!-- Prohibited Conduct -->
                <section class="mb-8">
                    <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-4">
                        {$_("terms.prohibited.title")}
                    </h2>
                    <p class="text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
                        {$_("terms.prohibited.p1")}
                    </p>
                    <ul
                        class="list-disc list-inside text-gray-600 dark:text-gray-300 mb-4 space-y-1"
                    >
                        <li>{$_("terms.prohibited.l1")}</li>
                        <li>{$_("terms.prohibited.l2")}</li>
                        <li>{$_("terms.prohibited.l3")}</li>
                        <li>{$_("terms.prohibited.l4")}</li>
                        <li>{$_("terms.prohibited.l5")}</li>
                        <li>{$_("terms.prohibited.l6")}</li>
                        <li>{$_("terms.prohibited.l7")}</li>
                        <li>{$_("terms.prohibited.l8")}</li>
                        <li>{$_("terms.prohibited.l9")}</li>
                        <li>{$_("terms.prohibited.l10")}</li>
                        <li>{$_("terms.prohibited.l11")}</li>
                        <li>{$_("terms.prohibited.l12")}</li>
                    </ul>
                </section>

                <!-- Pet Adoption Disclaimer -->
                <section class="mb-8">
                    <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-4">
                        {$_("terms.disclaimer.title")}
                    </h2>
                    <div
                        class="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 mb-4"
                    >
                        <p class="text-amber-800 dark:text-amber-300 font-medium mb-2">
                            {$_("terms.disclaimer.notice_title")}
                        </p>
                        <p class="text-amber-700 dark:text-amber-400 text-sm">
                            {$_("terms.disclaimer.notice_text")}
                        </p>
                    </div>
                    <p class="text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
                        {$_("terms.disclaimer.p1")}
                    </p>
                    <ul
                        class="list-disc list-inside text-gray-600 dark:text-gray-300 mb-4 space-y-1"
                    >
                        <li>{$_("terms.disclaimer.l1")}</li>
                        <li>{$_("terms.disclaimer.l2")}</li>
                        <li>{$_("terms.disclaimer.l3")}</li>
                        <li>{$_("terms.disclaimer.l4")}</li>
                        <li>{$_("terms.disclaimer.l5")}</li>
                        <li>{$_("terms.disclaimer.l6")}</li>
                    </ul>
                    <p class="text-gray-600 dark:text-gray-300 leading-relaxed">
                        {$_("terms.disclaimer.p2")}
                    </p>
                </section>

                <!-- Advertisements -->
                <section class="mb-8">
                    <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-4">
                        {$_("terms.ads.title")}
                    </h2>
                    <p class="text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
                        {$_("terms.ads.p1")}
                    </p>
                    <p class="text-gray-600 dark:text-gray-300 leading-relaxed">
                        {$_("terms.ads.p2")}
                    </p>
                </section>

                <!-- Donations and Support -->
                <section class="mb-8">
                    <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-4">
                        {$_("terms.donations.title")}
                    </h2>
                    <p class="text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
                        {$_("terms.donations.p1")}
                    </p>
                    <ul
                        class="list-disc list-inside text-gray-600 dark:text-gray-300 mb-4 space-y-1"
                    >
                        <li>{$_("terms.donations.l1")}</li>
                        <li>{$_("terms.donations.l2")}</li>
                        <li>{$_("terms.donations.l3")}</li>
                        <li>{$_("terms.donations.l4")}</li>
                    </ul>
                    <p class="text-gray-600 dark:text-gray-300 leading-relaxed">
                        {$_("terms.donations.p2")}
                    </p>
                </section>

                <!-- Intellectual Property -->
                <section class="mb-8">
                    <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-4">
                        {$_("terms.ip.title")}
                    </h2>
                    <p class="text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
                        {$_("terms.ip.p1")}
                    </p>
                    <p class="text-gray-600 dark:text-gray-300 leading-relaxed">
                        {$_("terms.ip.p2")}
                    </p>
                </section>

                <!-- Disclaimer of Warranties -->
                <section class="mb-8">
                    <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-4">
                        {$_("terms.warranties.title")}
                    </h2>
                    <p
                        class="text-gray-600 dark:text-gray-400 leading-relaxed mb-4 uppercase text-sm font-semibold"
                    >
                        {$_("terms.warranties.p1")}
                    </p>
                    <ul
                        class="list-disc list-inside text-gray-600 dark:text-gray-300 mb-4 space-y-1"
                    >
                        <li>{$_("terms.warranties.l1")}</li>
                        <li>{$_("terms.warranties.l2")}</li>
                        <li>{$_("terms.warranties.l3")}</li>
                        <li>{$_("terms.warranties.l4")}</li>
                    </ul>
                </section>

                <!-- Limitation of Liability -->
                <section class="mb-8">
                    <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-4">
                        {$_("terms.liability.title")}
                    </h2>
                    <p class="text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
                        {$_("terms.liability.p1")}
                    </p>
                    <ul
                        class="list-disc list-inside text-gray-600 dark:text-gray-300 mb-4 space-y-1"
                    >
                        <li>{$_("terms.liability.l1")}</li>
                        <li>{$_("terms.liability.l2")}</li>
                        <li>{$_("terms.liability.l3")}</li>
                        <li>{$_("terms.liability.l4")}</li>
                        <li>{$_("terms.liability.l5")}</li>
                    </ul>
                    <p class="text-gray-600 dark:text-gray-300 leading-relaxed">
                        {$_("terms.liability.p2")}
                    </p>
                </section>

                <!-- Indemnification -->
                <section class="mb-8">
                    <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-4">
                        {$_("terms.indemnification.title")}
                    </h2>
                    <p class="text-gray-600 dark:text-gray-300 leading-relaxed">
                        {$_("terms.indemnification.p1")}
                    </p>
                </section>

                <!-- Governing Law -->
                <section class="mb-8">
                    <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-4">
                        {$_("terms.governing.title")}
                    </h2>
                    <p class="text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
                        {$_("terms.governing.p1")}
                    </p>
                    <p class="text-gray-600 dark:text-gray-300 leading-relaxed">
                        {$_("terms.governing.p2")}
                    </p>
                </section>

                <!-- Dispute Resolution -->
                <section class="mb-8">
                    <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-4">
                        {$_("terms.disputes.title")}
                    </h2>
                    <p class="text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
                        {$_("terms.disputes.p1")}
                    </p>
                    <p class="text-gray-600 dark:text-gray-300 leading-relaxed">
                        {$_("terms.disputes.p2")}
                    </p>
                </section>

                <!-- Enforcement and Strike System -->
                <section class="mb-8">
                    <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-4">
                        {$_("terms.enforcement.title")}
                    </h2>
                    <p class="text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
                        {$_("terms.enforcement.p1")}
                    </p>
                    <ul
                        class="list-disc list-inside text-gray-600 dark:text-gray-300 mb-4 space-y-1"
                    >
                        <li>{$_("terms.enforcement.l1")}</li>
                        <li>{$_("terms.enforcement.l2")}</li>
                        <li>{$_("terms.enforcement.l3")}</li>
                    </ul>
                    <p class="text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
                        {$_("terms.enforcement.p2")}
                    </p>
                    <ul
                        class="list-disc list-inside text-gray-600 dark:text-gray-300 mb-4 space-y-1"
                    >
                        <li>{$_("terms.enforcement.l4")}</li>
                        <li>{$_("terms.enforcement.l5")}</li>
                        <li>{$_("terms.enforcement.l6")}</li>
                        <li>{$_("terms.enforcement.l7")}</li>
                    </ul>
                    <p class="text-gray-600 dark:text-gray-300 leading-relaxed">
                        {$_("terms.enforcement.p3")}
                    </p>
                </section>

                <!-- Account Deletion and Termination -->
                <section class="mb-8">
                    <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-4">
                        {$_("terms.termination.title")}
                    </h2>
                    <p class="text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
                        {$_("terms.termination.p1")}
                    </p>
                    <ul
                        class="list-disc list-inside text-gray-600 dark:text-gray-300 mb-4 space-y-1"
                    >
                        <li>{$_("terms.termination.l1")}</li>
                        <li>{$_("terms.termination.l2")}</li>
                        <li>{$_("terms.termination.l3")}</li>
                        <li>{$_("terms.termination.l4")}</li>
                    </ul>
                    <p class="text-gray-600 dark:text-gray-300 leading-relaxed">
                        {$_("terms.termination.p2")}
                    </p>
                </section>

                <!-- Changes to Terms -->
                <section class="mb-8">
                    <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-4">
                        {$_("terms.changes.title")}
                    </h2>
                    <p class="text-gray-600 dark:text-gray-300 leading-relaxed">
                        {$_("terms.changes.p1")}
                    </p>
                </section>

                <!-- Severability -->
                <section class="mb-8">
                    <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-4">
                        {$_("terms.severability.title")}
                    </h2>
                    <p class="text-gray-600 dark:text-gray-300 leading-relaxed">
                        {$_("terms.severability.p1")}
                    </p>
                </section>

                <!-- Entire Agreement -->
                <section class="mb-8">
                    <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-4">
                        {$_("terms.agreement.title")}
                    </h2>
                    <p class="text-gray-600 dark:text-gray-300 leading-relaxed">
                        {$_("terms.agreement.p1")}
                    </p>
                </section>

                <!-- Contact Us -->
                <section>
                    <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-4">
                        {$_("terms.contact.title")}
                    </h2>
                    <p class="text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
                        {$_("terms.contact.p1")}
                    </p>
                    <div class="bg-gray-50 dark:bg-gray-700 rounded-xl p-4">
                        <p class="text-gray-700 dark:text-gray-200 flex items-center gap-2">
                            <Mail class="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                            <a
                                href="mailto:{contactEmail}"
                                class="text-indigo-600 dark:text-indigo-400 hover:underline"
                                >{contactEmail}</a
                            >
                        </p>
                    </div>
                </section>
            </div>
        </div>

        <!-- Back Link -->
        <div class="mt-8 text-center">
            <a
                href="/"
                class="text-indigo-600 dark:text-indigo-400 hover:underline text-sm font-medium"
            >
                ← {$_("common.back_to_home")}
            </a>
        </div>
    </div>
</div>
