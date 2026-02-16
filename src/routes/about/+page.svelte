<script lang="ts">
    import SEO from "$lib/components/SEO.svelte";
    import {
        Heart,
        Users,
        Shield,
        Award,
        Target,
        Sparkles,
    } from "lucide-svelte";
    import logo from "$lib/assets/favicon.svg";
    import { _ } from "$lib/i18n";
</script>

<SEO
    title={$_("about.seo_title")}
    description={$_("about.seo_description")}
    keywords="about adoptme, pet adoption mission, animal welfare, pet rescue platform"
/>

<div class="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
    <!-- Hero Section -->
    <div
        class="bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 text-white"
    >
        <div class="max-w-4xl mx-auto px-4 py-16 sm:py-24 text-center">
            <div
                class="inline-flex items-center justify-center w-20 h-20 bg-white/20 rounded-2xl mb-6 backdrop-blur-sm"
            >
                <img src={logo} alt="AdoptMe" class="w-12 h-12" />
            </div>
            <h1 class="text-4xl sm:text-5xl font-extrabold mb-4">
                {$_("about.title")}
            </h1>
            <p class="text-xl text-white/90 max-w-2xl mx-auto leading-relaxed">
                {$_("about.hero_subtitle")}
            </p>
        </div>
    </div>

    <!-- Main Content -->
    <div class="max-w-4xl mx-auto px-4 py-12">
        <!-- Our Story -->
        <section class="mb-16">
            <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-6">{$_("about.our_story")}</h2>
            <div
                class="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 sm:p-8 transition-colors"
            >
                <p class="text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
                    {$_("about.story_p1")}
                </p>
                <p class="text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
                    {$_("about.story_p2")}
                </p>
                <p class="text-gray-600 dark:text-gray-300 leading-relaxed">
                    {$_("about.story_p3")}
                </p>
            </div>
        </section>

        <!-- Our Values -->
        <section class="mb-16">
            <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-6">{$_("about.our_values")}</h2>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div
                    class="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 transition-colors"
                >
                    <div
                        class="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/50 rounded-xl flex items-center justify-center mb-4"
                    >
                        <Heart class="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <h3 class="font-semibold text-gray-900 dark:text-white mb-2">
                        {$_("about.compassion_first")}
                    </h3>
                    <p class="text-gray-600 dark:text-gray-300 text-sm">
                        {$_("about.compassion_desc")}
                    </p>
                </div>
                <div
                    class="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 transition-colors"
                >
                    <div
                        class="w-12 h-12 bg-green-100 dark:bg-green-900/50 rounded-xl flex items-center justify-center mb-4"
                    >
                        <Shield class="w-6 h-6 text-green-600 dark:text-green-400" />
                    </div>
                    <h3 class="font-semibold text-gray-900 dark:text-white mb-2">
                        {$_("about.trust_safety")}
                    </h3>
                    <p class="text-gray-600 dark:text-gray-300 text-sm">
                        {$_("about.trust_desc")}
                    </p>
                </div>
                <div
                    class="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 transition-colors"
                >
                    <div
                        class="w-12 h-12 bg-purple-100 dark:bg-purple-900/50 rounded-xl flex items-center justify-center mb-4"
                    >
                        <Users class="w-6 h-6 text-purple-600 dark:text-purple-400" />
                    </div>
                    <h3 class="font-semibold text-gray-900 dark:text-white mb-2">
                        {$_("about.community_driven")}
                    </h3>
                    <p class="text-gray-600 dark:text-gray-300 text-sm">
                        {$_("about.community_desc")}
                    </p>
                </div>
                <div
                    class="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 transition-colors"
                >
                    <div
                        class="w-12 h-12 bg-orange-100 dark:bg-orange-900/50 rounded-xl flex items-center justify-center mb-4"
                    >
                        <Sparkles class="w-6 h-6 text-orange-600 dark:text-orange-400" />
                    </div>
                    <h3 class="font-semibold text-gray-900 dark:text-white mb-2">{$_("about.innovation")}</h3>
                    <p class="text-gray-600 dark:text-gray-300 text-sm">
                        {$_("about.innovation_desc")}
                    </p>
                </div>
            </div>
        </section>

        <!-- Our Mission -->
        <section class="mb-16">
            <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-6">{$_("about.our_mission")}</h2>
            <div
                class="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/30 dark:to-purple-900/30 rounded-2xl border border-indigo-100 dark:border-indigo-800 p-6 sm:p-8 transition-colors"
            >
                <div class="flex items-start gap-4">
                    <div
                        class="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center flex-shrink-0"
                    >
                        <Target class="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h3 class="font-semibold text-gray-900 dark:text-white mb-2">
                            {$_("about.mission_title")}
                        </h3>
                        <p class="text-gray-600 dark:text-gray-300 leading-relaxed">
                            {$_("about.mission_desc")}
                        </p>
                    </div>
                </div>
            </div>
        </section>

        <!-- CTA -->
        <section class="text-center">
            <div
                class="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-8 transition-colors"
            >
                <Award class="w-12 h-12 text-indigo-600 dark:text-indigo-400 mx-auto mb-4" />
                <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-2">
                    {$_("about.join_mission")}
                </h2>
                <p class="text-gray-600 dark:text-gray-300 mb-6">
                    {$_("about.join_desc")}
                </p>
                <div class="flex flex-col sm:flex-row gap-3 justify-center">
                    <a
                        href="/"
                        class="px-6 py-3 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition-colors"
                    >
                        {$_("about.find_pet")}
                    </a>
                    <!-- <a href="/contact" class="px-6 py-3 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition-colors">
                        Contact Us
                    </a> -->
                </div>
            </div>
        </section>
    </div>
</div>
