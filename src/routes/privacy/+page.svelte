<script lang="ts">
    import SEO from "$lib/components/SEO.svelte";
    import { Shield, Mail } from "lucide-svelte";
    import { _ } from "svelte-i18n";

    const lastUpdated = "February 2026";
    const contactEmail = "pablo.cabrera.castrejon@gmail.com";
</script>

<SEO
    title={$_("privacy.seo_title")}
    description={$_("privacy.seo_desc")}
    keywords="privacy policy, data protection, personal information, adoptme privacy"
/>

<div class="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
    <!-- Hero Section -->
    <div class="bg-gradient-to-br from-indigo-600 to-purple-600 text-white">
        <div class="max-w-4xl mx-auto px-4 py-12 sm:py-16 text-center">
            <div
                class="inline-flex items-center justify-center w-16 h-16 bg-white/20 rounded-2xl mb-4 backdrop-blur-sm"
            >
                <Shield class="w-8 h-8" />
            </div>
            <h1 class="text-3xl sm:text-4xl font-extrabold mb-3">
                {$_("privacy.title")}
            </h1>
            <p class="text-lg text-white/90">
                {$_("privacy.last_updated", { values: { date: lastUpdated } })}
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
                        {$_("privacy.intro.title")}
                    </h2>
                    <p class="text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
                        {$_("privacy.intro.p1")}
                    </p>
                    <p class="text-gray-600 dark:text-gray-300 leading-relaxed">
                        {$_("privacy.intro.p2")}
                    </p>
                </section>

                <!-- Information We Collect -->
                <section class="mb-8">
                    <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-4">
                        {$_("privacy.collection.title")}
                    </h2>

                    <h3 class="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">
                        {$_("privacy.collection.subtitle1")}
                    </h3>
                    <p class="text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
                        {$_("privacy.collection.p1")}
                    </p>
                    <ul
                        class="list-disc list-inside text-gray-600 dark:text-gray-300 mb-4 space-y-1"
                    >
                        <li>{$_("privacy.collection.l1")}</li>
                        <li>{$_("privacy.collection.l2")}</li>
                        <li>{$_("privacy.collection.l3")}</li>
                        <li>{$_("privacy.collection.l4")}</li>
                        <li>{$_("privacy.collection.l5")}</li>
                    </ul>

                    <h3 class="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">
                        {$_("privacy.collection.subtitle2")}
                    </h3>
                    <p class="text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
                        {$_("privacy.collection.p2")}
                    </p>
                    <ul
                        class="list-disc list-inside text-gray-600 dark:text-gray-300 mb-4 space-y-1"
                    >
                        <li>{$_("privacy.collection.l6")}</li>
                        <li>{$_("privacy.collection.l7")}</li>
                        <li>{$_("privacy.collection.l8")}</li>
                        <li>{$_("privacy.collection.l9")}</li>
                    </ul>
                </section>

                <!-- How We Use Information -->
                <section class="mb-8">
                    <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-4">
                        {$_("privacy.usage.title")}
                    </h2>
                    <p class="text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
                        {$_("privacy.usage.p1")}
                    </p>
                    <ul
                        class="list-disc list-inside text-gray-600 dark:text-gray-300 mb-4 space-y-1"
                    >
                        <li>{$_("privacy.usage.l1")}</li>
                        <li>{$_("privacy.usage.l2")}</li>
                        <li>{$_("privacy.usage.l3")}</li>
                        <li>{$_("privacy.usage.l4")}</li>
                        <li>{$_("privacy.usage.l5")}</li>
                        <li>{$_("privacy.usage.l6")}</li>
                        <li>{$_("privacy.usage.l7")}</li>
                        <li>{$_("privacy.usage.l8")}</li>
                        <li>{$_("privacy.usage.l9")}</li>
                    </ul>
                </section>

                <!-- Cookies and Tracking -->
                <section class="mb-8">
                    <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-4">
                        {$_("privacy.cookies.title")}
                    </h2>
                    <p class="text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
                        {$_("privacy.cookies.p1")}
                    </p>
                    <ul
                        class="list-disc list-inside text-gray-600 dark:text-gray-300 mb-4 space-y-1"
                    >
                        <li>{$_("privacy.cookies.l1")}</li>
                        <li>{$_("privacy.cookies.l2")}</li>
                        <li>{$_("privacy.cookies.l3")}</li>
                    </ul>
                    <p class="text-gray-600 dark:text-gray-300 leading-relaxed">
                        {$_("privacy.cookies.p2")}
                    </p>
                </section>

                <!-- Third-Party Services -->
                <section class="mb-8">
                    <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-4">
                        {$_("privacy.third_party.title")}
                    </h2>
                    <p class="text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
                        {$_("privacy.third_party.p1")}
                    </p>
                    <ul
                        class="list-disc list-inside text-gray-600 dark:text-gray-300 mb-4 space-y-1"
                    >
                        <li>{$_("privacy.third_party.l1")}</li>
                        <li>{$_("privacy.third_party.l2")}</li>
                        <li>{$_("privacy.third_party.l3")}</li>
                        <li>{$_("privacy.third_party.l4")}</li>
                    </ul>
                </section>

                <!-- Data Sharing -->
                <section class="mb-8">
                    <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-4">
                        {$_("privacy.sharing.title")}
                    </h2>
                    <p class="text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
                        {$_("privacy.sharing.p1")}
                    </p>
                    <ul
                        class="list-disc list-inside text-gray-600 dark:text-gray-300 mb-4 space-y-1"
                    >
                        <li>{$_("privacy.sharing.l1")}</li>
                        <li>{$_("privacy.sharing.l2")}</li>
                        <li>{$_("privacy.sharing.l3")}</li>
                        <li>{$_("privacy.sharing.l4")}</li>
                    </ul>
                    <p class="text-gray-600 dark:text-gray-300 leading-relaxed">
                        {$_("privacy.sharing.p2")}
                    </p>
                </section>

                <!-- Data Security -->
                <section class="mb-8">
                    <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-4">
                        {$_("privacy.security.title")}
                    </h2>
                    <p class="text-gray-600 dark:text-gray-300 leading-relaxed">
                        {$_("privacy.security.p1")}
                    </p>
                </section>

                <!-- Data Retention -->
                <section class="mb-8">
                    <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-4">
                        {$_("privacy.retention.title")}
                    </h2>
                    <p class="text-gray-600 dark:text-gray-300 leading-relaxed">
                        {$_("privacy.retention.p1")}
                    </p>
                </section>

                <!-- Account and Data Management -->
                <section class="mb-8">
                    <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-4">
                        {$_("privacy.data_management.title")}
                    </h2>

                    <h3 class="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">
                        {$_("privacy.data_management.subtitle1")}
                    </h3>
                    <p class="text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
                        {$_("privacy.data_management.p1")}
                    </p>
                    <ul
                        class="list-disc list-inside text-gray-600 dark:text-gray-300 mb-4 space-y-1"
                    >
                        <li>{$_("privacy.data_management.l1")}</li>
                        <li>{$_("privacy.data_management.l2")}</li>
                        <li>{$_("privacy.data_management.l3")}</li>
                        <li>{$_("privacy.data_management.l4")}</li>
                    </ul>

                    <h3 class="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">
                        {$_("privacy.data_management.subtitle2")}
                    </h3>
                    <p class="text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
                        {$_("privacy.data_management.p2")}
                    </p>

                    <h3 class="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">
                        {$_("privacy.data_management.subtitle3")}
                    </h3>
                    <p class="text-gray-600 dark:text-gray-300 leading-relaxed">
                        {$_("privacy.data_management.p3")}
                    </p>
                </section>

                <!-- Your Rights -->
                <section class="mb-8">
                    <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-4">
                        {$_("privacy.rights.title")}
                    </h2>
                    <p class="text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
                        {$_("privacy.rights.p1")}
                    </p>

                    <h3 class="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">
                        {$_("privacy.rights.subtitle1")}
                    </h3>
                    <ul
                        class="list-disc list-inside text-gray-600 dark:text-gray-300 mb-4 space-y-1"
                    >
                        <li>{$_("privacy.rights.l1")}</li>
                        <li>{$_("privacy.rights.l2")}</li>
                        <li>{$_("privacy.rights.l3")}</li>
                        <li>{$_("privacy.rights.l4")}</li>
                        <li>{$_("privacy.rights.l5")}</li>
                    </ul>

                    <h3 class="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">
                        {$_("privacy.rights.subtitle2")}
                    </h3>
                    <ul
                        class="list-disc list-inside text-gray-600 dark:text-gray-300 mb-4 space-y-1"
                    >
                        <li>{$_("privacy.rights.l6")}</li>
                        <li>{$_("privacy.rights.l7")}</li>
                        <li>{$_("privacy.rights.l8")}</li>
                        <li>{$_("privacy.rights.l9")}</li>
                    </ul>

                    <h3 class="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">
                        {$_("privacy.rights.subtitle3")}
                    </h3>
                    <ul
                        class="list-disc list-inside text-gray-600 dark:text-gray-300 mb-4 space-y-1"
                    >
                        <li>{$_("privacy.rights.l10")}</li>
                        <li>{$_("privacy.rights.l11")}</li>
                        <li>{$_("privacy.rights.l12")}</li>
                    </ul>

                    <h3 class="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">
                        {$_("privacy.rights.subtitle4")}
                    </h3>
                    <ul
                        class="list-disc list-inside text-gray-600 dark:text-gray-300 mb-4 space-y-1"
                    >
                        <li>{$_("privacy.rights.l13")}</li>
                        <li>{$_("privacy.rights.l14")}</li>
                        <li>{$_("privacy.rights.l15")}</li>
                    </ul>

                    <h3 class="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">
                        {$_("privacy.rights.subtitle5")}
                    </h3>
                    <ul
                        class="list-disc list-inside text-gray-600 dark:text-gray-300 mb-4 space-y-1"
                    >
                        <li>{$_("privacy.rights.l16")}</li>
                        <li>{$_("privacy.rights.l17")}</li>
                        <li>{$_("privacy.rights.l18")}</li>
                        <li>{$_("privacy.rights.l19")}</li>
                    </ul>

                    <p class="text-gray-600 dark:text-gray-300 leading-relaxed">
                        {$_("privacy.rights.p2")}
                        <a
                            href="mailto:{contactEmail}"
                            class="text-indigo-600 dark:text-indigo-400 hover:underline"
                            >{contactEmail}</a
                        >.
                    </p>
                </section>

                <!-- Children's Privacy -->
                <section class="mb-8">
                    <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-4">
                        {$_("privacy.children.title")}
                    </h2>
                    <p class="text-gray-600 dark:text-gray-300 leading-relaxed">
                        {$_("privacy.children.p1")}
                    </p>
                </section>

                <!-- International Transfers -->
                <section class="mb-8">
                    <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-4">
                        {$_("privacy.international.title")}
                    </h2>
                    <p class="text-gray-600 dark:text-gray-300 leading-relaxed">
                        {$_("privacy.international.p1")}
                    </p>
                </section>

                <!-- Changes to Policy -->
                <section class="mb-8">
                    <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-4">
                        {$_("privacy.changes.title")}
                    </h2>
                    <p class="text-gray-600 dark:text-gray-300 leading-relaxed">
                        {$_("privacy.changes.p1")}
                    </p>
                </section>

                <!-- Contact Us -->
                <section>
                    <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-4">
                        {$_("privacy.contact.title")}
                    </h2>
                    <p class="text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
                        {$_("privacy.contact.p1")}
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
