<script lang="ts">
    import { auth } from "$lib/stores/auth.svelte";
    import { _ } from "$lib/i18n";
    import { onMount } from "svelte";
    import {
        Shield,
        Users,
        FileText,
        PawPrint,
        Mail,
        BarChart3,
        Settings,
        Flag,
        Bug,
        ChevronRight,
        Loader2,
        HardDrive,
        Image as ImageIcon,
        RefreshCw,
    } from "lucide-svelte";
    import { toast } from "$lib/stores/toast.svelte";
    import DonutChart from "$lib/components/admin/DonutChart.svelte";

    // Report counts state
    let reportCounts = $state({
        pendingBugReports: 0,
        totalBugReports: 0,
        pendingPostReports: 0,
        totalPostReports: 0
    });

    // Disk stats state
    let diskStats = $state({
        uploadsSize: 0,
        uploadsSizeFormatted: "0 B",
        uploadsFileCount: 0,
        diskTotal: 0,
        diskFree: 0,
        diskUsed: 0,
        diskUsedPercent: 0,
        diskTotalFormatted: "0 B",
        diskFreeFormatted: "0 B",
        diskUsedFormatted: "0 B",
    });

    let loading = $state(true);
    let loadingDisk = $state(true);

    // Fetch report counts
    async function fetchReportCounts() {
        try {
            const response = await fetch("/api/graphql", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${auth.token}`,
                },
                body: JSON.stringify({
                    query: `
                        query AdminReportCounts {
                            adminReportCounts {
                                pendingBugReports
                                totalBugReports
                                pendingPostReports
                                totalPostReports
                            }
                        }
                    `,
                }),
            });

            const result = await response.json();
            if (result.errors) {
                console.error("Failed to fetch report counts:", result.errors);
                return;
            }

            reportCounts = result.data.adminReportCounts;
        } catch (error) {
            console.error("Failed to fetch report counts:", error);
        } finally {
            loading = false;
        }
    }

    // Fetch disk stats
    async function fetchDiskStats() {
        loadingDisk = true;
        try {
            const response = await fetch("/api/graphql", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${auth.token}`,
                },
                body: JSON.stringify({
                    query: `
                        query AdminDiskStats {
                            adminDiskStats {
                                uploadsSize
                                uploadsSizeFormatted
                                uploadsFileCount
                                diskTotal
                                diskFree
                                diskUsed
                                diskUsedPercent
                                diskTotalFormatted
                                diskFreeFormatted
                                diskUsedFormatted
                            }
                        }
                    `,
                }),
            });

            const result = await response.json();
            if (result.errors) {
                console.error("Failed to fetch disk stats:", result.errors);
                return;
            }

            diskStats = result.data.adminDiskStats;
        } catch (error) {
            console.error("Failed to fetch disk stats:", error);
        } finally {
            loadingDisk = false;
        }
    }

    onMount(() => {
        if (auth.token) {
            fetchReportCounts();
            fetchDiskStats();
        }
    });

    // Dynamic stats based on report counts
    let stats = $derived([
        { label: "Bug Reports", value: loading ? "..." : `${reportCounts.pendingBugReports}/${reportCounts.totalBugReports}`, icon: Bug, color: "text-orange-500", sublabel: "pending/total" },
        { label: "Post Reports", value: loading ? "..." : `${reportCounts.pendingPostReports}/${reportCounts.totalPostReports}`, icon: Flag, color: "text-red-500", sublabel: "pending/total" },
        { label: "Total Pets", value: "—", icon: PawPrint, color: "text-green-500", sublabel: "" },
        { label: "Total Posts", value: "—", icon: FileText, color: "text-purple-500", sublabel: "" },
    ]);

    // Disk usage chart segments
    let diskChartSegments = $derived([
        { value: diskStats.uploadsSize, color: "#8b5cf6", label: "Uploads" },
        { value: diskStats.diskUsed - diskStats.uploadsSize, color: "#6366f1", label: "Other Used" },
        { value: diskStats.diskFree, color: "#e5e7eb", label: "Free" },
    ]);
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
                                {#if stat.sublabel}
                                    <p class="text-[10px] text-gray-400 dark:text-gray-500">{stat.sublabel}</p>
                                {/if}
                            </div>
                        </div>
                    </div>
                {/each}
            </div>

            <!-- Main Content Grid -->
            <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                <!-- Bug Reports Card -->
                <a
                    href="/admin/bugs"
                    class="group bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden hover:shadow-md hover:border-orange-200 dark:hover:border-orange-800 transition-all"
                >
                    <div class="p-6">
                        <div class="flex items-center justify-between">
                            <div class="flex items-center gap-4">
                                <div class="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-xl flex items-center justify-center">
                                    <Bug class="w-6 h-6 text-orange-600 dark:text-orange-400" />
                                </div>
                                <div>
                                    <h2 class="text-lg font-semibold text-gray-900 dark:text-white group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">
                                        Bug Reports
                                    </h2>
                                    <p class="text-sm text-gray-500 dark:text-gray-400">
                                        Review user-submitted bugs
                                    </p>
                                </div>
                            </div>
                            <div class="flex items-center gap-2">
                                {#if reportCounts.pendingBugReports > 0}
                                    <span class="px-2 py-1 bg-orange-100 dark:bg-orange-900/50 text-orange-700 dark:text-orange-300 text-xs font-semibold rounded-full">
                                        {reportCounts.pendingBugReports} open
                                    </span>
                                {/if}
                                <ChevronRight class="w-5 h-5 text-gray-400 group-hover:text-orange-500 group-hover:translate-x-1 transition-all" />
                            </div>
                        </div>
                    </div>
                </a>

                <!-- Post Reports Card -->
                <a
                    href="/admin/reports"
                    class="group bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden hover:shadow-md hover:border-red-200 dark:hover:border-red-800 transition-all"
                >
                    <div class="p-6">
                        <div class="flex items-center justify-between">
                            <div class="flex items-center gap-4">
                                <div class="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-xl flex items-center justify-center">
                                    <Flag class="w-6 h-6 text-red-600 dark:text-red-400" />
                                </div>
                                <div>
                                    <h2 class="text-lg font-semibold text-gray-900 dark:text-white group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors">
                                        Post Reports
                                    </h2>
                                    <p class="text-sm text-gray-500 dark:text-gray-400">
                                        Review reported posts
                                    </p>
                                </div>
                            </div>
                            <div class="flex items-center gap-2">
                                {#if reportCounts.pendingPostReports > 0}
                                    <span class="px-2 py-1 bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300 text-xs font-semibold rounded-full">
                                        {reportCounts.pendingPostReports} pending
                                    </span>
                                {/if}
                                <ChevronRight class="w-5 h-5 text-gray-400 group-hover:text-red-500 group-hover:translate-x-1 transition-all" />
                            </div>
                        </div>
                    </div>
                </a>

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
                                        Send invitation emails
                                    </p>
                                </div>
                            </div>
                            <ChevronRight class="w-5 h-5 text-gray-400 group-hover:text-indigo-500 group-hover:translate-x-1 transition-all" />
                        </div>
                    </div>
                </a>
            </div>

            <!-- Disk Usage Section -->
            <div class="mt-6 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                <div class="p-6 border-b border-gray-100 dark:border-gray-700">
                    <div class="flex items-center justify-between">
                        <div class="flex items-center gap-3">
                            <div class="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                                <HardDrive class="w-5 h-5 text-purple-600 dark:text-purple-400" />
                            </div>
                            <div>
                                <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Disk Usage</h2>
                                <p class="text-sm text-gray-500 dark:text-gray-400">Storage and uploads overview</p>
                            </div>
                        </div>
                        <button
                            onclick={fetchDiskStats}
                            disabled={loadingDisk}
                            class="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                        >
                            <RefreshCw class="w-4 h-4 {loadingDisk ? 'animate-spin' : ''}" />
                        </button>
                    </div>
                </div>

                <div class="p-6">
                    {#if loadingDisk}
                        <div class="flex items-center justify-center py-12">
                            <Loader2 class="w-8 h-8 text-indigo-500 animate-spin" />
                        </div>
                    {:else}
                        <div class="grid md:grid-cols-2 gap-8 items-center">
                            <!-- Chart -->
                            <div class="flex justify-center">
                                <DonutChart
                                    segments={diskChartSegments}
                                    size={180}
                                    thickness={28}
                                    centerValue="{diskStats.diskUsedPercent}%"
                                    centerLabel="Used"
                                />
                            </div>

                            <!-- Stats -->
                            <div class="space-y-4">
                                <!-- Total Disk -->
                                <div class="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                                    <div class="flex items-center gap-3">
                                        <HardDrive class="w-5 h-5 text-gray-500" />
                                        <div class="flex-1">
                                            <p class="text-sm text-gray-500 dark:text-gray-400">Total Disk Space</p>
                                            <p class="text-lg font-semibold text-gray-900 dark:text-white">{diskStats.diskTotalFormatted}</p>
                                        </div>
                                    </div>
                                </div>

                                <!-- Used Space -->
                                <div class="p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl">
                                    <div class="flex items-center gap-3">
                                        <div class="w-3 h-3 rounded-full bg-indigo-500"></div>
                                        <div class="flex-1">
                                            <p class="text-sm text-gray-500 dark:text-gray-400">Used Space</p>
                                            <p class="text-lg font-semibold text-gray-900 dark:text-white">{diskStats.diskUsedFormatted}</p>
                                        </div>
                                    </div>
                                </div>

                                <!-- Free Space -->
                                <div class="p-4 bg-green-50 dark:bg-green-900/20 rounded-xl">
                                    <div class="flex items-center gap-3">
                                        <div class="w-3 h-3 rounded-full bg-gray-300 dark:bg-gray-600"></div>
                                        <div class="flex-1">
                                            <p class="text-sm text-gray-500 dark:text-gray-400">Free Space</p>
                                            <p class="text-lg font-semibold text-gray-900 dark:text-white">{diskStats.diskFreeFormatted}</p>
                                        </div>
                                    </div>
                                </div>

                                <!-- Uploads Folder -->
                                <div class="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl border-2 border-purple-200 dark:border-purple-800">
                                    <div class="flex items-center gap-3">
                                        <ImageIcon class="w-5 h-5 text-purple-600 dark:text-purple-400" />
                                        <div class="flex-1">
                                            <p class="text-sm text-gray-500 dark:text-gray-400">Uploads Folder</p>
                                            <p class="text-lg font-semibold text-purple-700 dark:text-purple-300">{diskStats.uploadsSizeFormatted}</p>
                                            <p class="text-xs text-gray-500 dark:text-gray-400">{diskStats.uploadsFileCount} files</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    {/if}
                </div>
            </div>

            <!-- Quick Actions -->
            <div class="mt-6 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
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

                <div class="p-6 grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    <a
                        href="/profile?tab=settings"
                        class="flex items-center gap-3 p-3 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                    >
                        <Users class="w-5 h-5 text-gray-500" />
                        <span class="text-sm text-gray-700 dark:text-gray-300">My Profile Settings</span>
                    </a>

                    <button
                        onclick={() => toast.info("Coming soon!")}
                        class="flex items-center gap-3 p-3 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors text-left"
                    >
                        <BarChart3 class="w-5 h-5 text-gray-500" />
                        <span class="text-sm text-gray-700 dark:text-gray-300">View Analytics</span>
                    </button>

                    <button
                        onclick={() => toast.info("Coming soon!")}
                        class="flex items-center gap-3 p-3 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors text-left"
                    >
                        <PawPrint class="w-5 h-5 text-gray-500" />
                        <span class="text-sm text-gray-700 dark:text-gray-300">Manage Species/Breeds</span>
                    </button>

                    <a
                        href="/"
                        class="flex items-center gap-3 p-3 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                    >
                        <FileText class="w-5 h-5 text-gray-500" />
                        <span class="text-sm text-gray-700 dark:text-gray-300">View Public Feed</span>
                    </a>
                </div>
            </div>

        </div>
    </div>
