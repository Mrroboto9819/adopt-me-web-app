<script lang="ts">
    import { Heart, Coffee, Mail } from "lucide-svelte";
    import logo from "$lib/assets/favicon.svg";
    import { auth } from "$lib/stores/auth.svelte";
</script>

<footer class="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 mt-auto transition-colors">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div class="grid grid-cols-1 md:grid-cols-4 gap-8">
            <!-- Brand -->
            <div class="md:col-span-1">
                <a href="/" class="flex items-center gap-2 mb-4">
                    <img src={logo} alt="AdoptMe" class="w-8 h-8" />
                    <span class="text-xl font-bold text-gray-900 dark:text-white">AdoptMe</span>
                </a>
                <p class="text-sm text-gray-500 dark:text-gray-400">
                    Connecting loving families with pets in need. Find your perfect companion today.
                </p>
            </div>

            <!-- Quick Links -->
            <div>
                <h3 class="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider mb-4">Quick Links</h3>
                <ul class="space-y-3">
                    <li>
                        <a href="/" class="text-sm text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                            Browse Pets
                        </a>
                    </li>
                    <li>
                        <a href="/about" class="text-sm text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                            About Us
                        </a>
                    </li>
                    <li>
                        <a href="/support" class="text-sm text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors flex items-center gap-1">
                            <Coffee class="w-4 h-4" />
                            Support Us
                        </a>
                    </li>
                </ul>
            </div>

            <!-- Resources -->
            <div>
                <h3 class="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider mb-4">Resources</h3>
                <ul class="space-y-3">
                    {#if !auth.user}
                        <li>
                            <a href="/login" class="text-sm text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                                Login / Register
                            </a>
                        </li>
                    {:else}
                        <li>
                            <a href="/profile" class="text-sm text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                                My Profile
                            </a>
                        </li>
                    {/if}
                    <li>
                        <span class="text-sm text-gray-400 dark:text-gray-500">FAQ (Coming Soon)</span>
                    </li>
                    <li>
                        <span class="text-sm text-gray-400 dark:text-gray-500">Blog (Coming Soon)</span>
                    </li>
                </ul>
            </div>

            <!-- Contact -->
            <div>
                <h3 class="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider mb-4">Get in Touch</h3>
                <ul class="space-y-3">
                    <li>
                        <a href="mailto:pablo.cabrera.castrejon@gmail.com" class="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                            <Mail class="w-4 h-4" />
                            pablo.cabrera.castrejon@gmail.com
                        </a>
                    </li>
                </ul>
                <div class="mt-6">
                    <a
                        href="/support"
                        class="inline-flex items-center gap-2 px-4 py-2 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-sm font-medium rounded-lg hover:bg-amber-200 dark:hover:bg-amber-900/50 transition-colors"
                    >
                        <Coffee class="w-4 h-4" />
                        Buy us a coffee
                    </a>
                </div>
            </div>
        </div>

        <!-- Bottom Bar -->
        <div class="mt-12 pt-8 border-t border-gray-100 dark:border-gray-700">
            <div class="flex flex-col sm:flex-row justify-between items-center gap-4">
                <p class="text-sm text-gray-400 dark:text-gray-500">
                    &copy; 2026 AdoptMe. All rights reserved.
                </p>
                <div class="flex items-center gap-6 text-sm text-gray-400 dark:text-gray-500">
                    <a href="/privacy" class="hover:text-gray-600 dark:hover:text-gray-300 transition-colors">Privacy Policy</a>
                    <a href="/terms" class="hover:text-gray-600 dark:hover:text-gray-300 transition-colors">Terms of Service</a>
                </div>
                <p class="text-sm text-gray-400 dark:text-gray-500 flex items-center gap-1">
                    Made with <Heart class="w-4 h-4 text-rose-500" /> for pets everywhere
                </p>
            </div>
        </div>
    </div>
</footer>
