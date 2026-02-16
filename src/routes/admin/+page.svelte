<script lang="ts">
    import { auth } from "$lib/stores/auth.svelte";
    import { _ } from "$lib/i18n";
    import {
        Shield,
        Users,
        FileText,
        PawPrint,
        Mail,
        BarChart3,
        Settings,
        Flag,
        ChevronRight,
    } from "lucide-svelte";
    import { toast } from "$lib/stores/toast.svelte";

    // Placeholder stats (you can connect these to real data later)
    const stats = [
        { label: "Total Users", value: "—", icon: Users, color: "text-blue-500" },
        { label: "Total Pets", value: "—", icon: PawPrint, color: "text-green-500" },
        { label: "Total Posts", value: "—", icon: FileText, color: "text-purple-500" },
        { label: "Reports", value: "—", icon: Flag, color: "text-red-500" },
    ];
</script>

<svelte:head>
    <title>Admin Dashboard - AdoptMe</title>
</svelte:head>

<!-- Admin Dashboard -->
    <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div class="max-w-7xl mx-auto px-4 py-8">
            <!-- Header -->
            <div class="flex items-center gap-4 mb-8">
                <div class="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl flex items-center justify-center">
                    <Shield class="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div>
                    <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Admin Dashboard</h1>
                    <p class="text-sm text-gray-500 dark:text-gray-400">
                        Welcome back, {auth.user?.firstName}
                    </p>
                </div>
            </div>

            <!-- Stats Grid -->
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                {#each stats as stat}
                    <div class="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
                        <div class="flex items-center gap-3">
                            <div class="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                                <stat.icon class="w-5 h-5 {stat.color}" />
                            </div>
                            <div>
                                <p class="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
                                <p class="text-xs text-gray-500 dark:text-gray-400">{stat.label}</p>
                            </div>
                        </div>
                    </div>
                {/each}
            </div>

            <!-- Main Content Grid -->
            <div class="grid md:grid-cols-2 gap-6">
                <!-- Beta Invite Tool Card -->
                <a
                    href="/admin/invite"
                    class="group bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden hover:shadow-md hover:border-indigo-200 dark:hover:border-indigo-800 transition-all"
                >
                    <div class="p-6">
                        <div class="flex items-center justify-between">
                            <div class="flex items-center gap-4">
                                <div class="w-12 h-12 bg-amber-100 dark:bg-amber-900/30 rounded-xl flex items-center justify-center">
                                    <Mail class="w-6 h-6 text-amber-600 dark:text-amber-400" />
                                </div>
                                <div>
                                    <h2 class="text-lg font-semibold text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                        Beta Invites
                                    </h2>
                                    <p class="text-sm text-gray-500 dark:text-gray-400">
                                        Generate & send invitation emails
                                    </p>
                                </div>
                            </div>
                            <ChevronRight class="w-5 h-5 text-gray-400 group-hover:text-indigo-500 group-hover:translate-x-1 transition-all" />
                        </div>

                        <div class="mt-6 pt-6 border-t border-gray-100 dark:border-gray-700">
                            <div class="flex items-center gap-4 text-sm">
                                <div class="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                                    <Users class="w-4 h-4" />
                                    <span>Invite testers</span>
                                </div>
                                <div class="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                                    <FileText class="w-4 h-4" />
                                    <span>Email templates</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </a>

                <!-- Quick Actions -->
                <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                    <div class="p-6 border-b border-gray-100 dark:border-gray-700">
                        <div class="flex items-center gap-3">
                            <div class="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                                <Settings class="w-5 h-5 text-green-600 dark:text-green-400" />
                            </div>
                            <div>
                                <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Quick Actions</h2>
                                <p class="text-sm text-gray-500 dark:text-gray-400">Common admin tasks</p>
                            </div>
                        </div>
                    </div>

                    <div class="p-6 space-y-3">
                        <a
                            href="/profile?tab=settings"
                            class="flex items-center gap-3 p-3 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                        >
                            <Users class="w-5 h-5 text-gray-500" />
                            <span class="text-sm text-gray-700 dark:text-gray-300">My Profile Settings</span>
                        </a>

                        <button
                            onclick={() => toast.info("Coming soon!")}
                            class="w-full flex items-center gap-3 p-3 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors text-left"
                        >
                            <BarChart3 class="w-5 h-5 text-gray-500" />
                            <span class="text-sm text-gray-700 dark:text-gray-300">View Analytics</span>
                        </button>

                        <button
                            onclick={() => toast.info("Coming soon!")}
                            class="w-full flex items-center gap-3 p-3 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors text-left"
                        >
                            <Flag class="w-5 h-5 text-gray-500" />
                            <span class="text-sm text-gray-700 dark:text-gray-300">Review Reports</span>
                        </button>

                        <button
                            onclick={() => toast.info("Coming soon!")}
                            class="w-full flex items-center gap-3 p-3 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors text-left"
                        >
                            <PawPrint class="w-5 h-5 text-gray-500" />
                            <span class="text-sm text-gray-700 dark:text-gray-300">Manage Species/Breeds</span>
                        </button>
                    </div>
                </div>
            </div>

        </div>
    </div>
