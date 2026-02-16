<script lang="ts">
    import SEO from "$lib/components/SEO.svelte";
    import { Coffee, Heart, ExternalLink } from "lucide-svelte";
    import { _ } from "$lib/i18n";

    const qrCode = "/qr-code.png";
    const BUYMEACOFFEE_URL = "https://buymeacoffee.com/pablocabre4";
</script>

<SEO
    title={$_("support.seo_title")}
    description={$_("support.seo_description")}
    keywords="support adoptme, donate, buy me a coffee, pet adoption donation"
/>

<div class="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
    <!-- Hero Section -->
    <div class="bg-gradient-to-br from-amber-500 via-orange-500 to-rose-500 text-white">
        <div class="max-w-4xl mx-auto px-4 py-12 sm:py-16 text-center">
            <div class="inline-flex items-center justify-center w-20 h-20 bg-white/20 rounded-full mb-6 backdrop-blur-sm">
                <Coffee class="w-10 h-10" />
            </div>
            <h1 class="text-4xl sm:text-5xl font-extrabold mb-4">{$_("support.title")}</h1>
            <p class="text-xl text-white/90 max-w-2xl mx-auto leading-relaxed">
                {$_("support.hero_subtitle")}
            </p>
        </div>
    </div>

    <!-- Main Content -->
    <div class="max-w-2xl mx-auto px-4 py-12">
        <!-- Buy Me a Coffee Section -->
        <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden transition-colors">
            <div class="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 p-6 sm:p-8">
                <div class="flex flex-col items-center text-center">
                    <!-- QR Code -->
                    <div class="bg-white dark:bg-gray-700 p-4 rounded-2xl shadow-md mb-6">
                        <img src={qrCode} alt="Scan to support" class="w-48 h-48 object-contain" />
                    </div>
                    <p class="text-sm text-gray-500 dark:text-gray-400 mb-6">{$_("support.scan_qr")}</p>

                    <Coffee class="w-12 h-12 text-amber-600 dark:text-amber-400 mb-4" />
                    <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-2">{$_("support.buy_coffee")}</h2>
                    <p class="text-gray-600 dark:text-gray-300 mb-6 max-w-md">
                        {$_("support.coffee_desc")}
                    </p>

                    <a
                        href={BUYMEACOFFEE_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        class="inline-flex items-center gap-2 px-8 py-4 bg-amber-500 text-white font-bold text-lg rounded-xl hover:bg-amber-600 transition-colors shadow-lg shadow-amber-200 dark:shadow-amber-900/30"
                    >
                        <Coffee class="w-6 h-6" />
                        {$_("support.buy_coffee")}
                        <ExternalLink class="w-5 h-5" />
                    </a>
                </div>
            </div>

            <!-- Thank You Message -->
            <div class="p-6 text-center border-t border-gray-100 dark:border-gray-700">
                <p class="text-gray-500 dark:text-gray-400 flex items-center justify-center gap-2">
                    <Heart class="w-5 h-5 text-rose-500" />
                    {$_("support.thank_you")}
                </p>
            </div>
        </div>

        <!-- Creator Info -->
        <div class="mt-8 text-center">
            <p class="text-sm text-gray-400 dark:text-gray-500">
                {$_("support.created_by")} <span class="font-medium text-gray-600 dark:text-gray-300">Pablo</span>
            </p>
        </div>
    </div>
</div>
