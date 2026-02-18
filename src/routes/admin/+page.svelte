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
        MessageSquare,
        TrendingUp,
        Calendar,
        UserX,
    } from "lucide-svelte";
    import { toast } from "$lib/stores/toast.svelte";
    import DonutChart from "$lib/components/admin/DonutChart.svelte";

    // Stats state
    interface StatCount {
        label: string;
        value: number;
        color?: string;
    }

    let adminStats = $state({
        totalUsers: 0,
        totalPosts: 0,
        totalPets: 0,
        totalComments: 0,
        postsByType: [] as StatCount[],
        petsByStatus: [] as StatCount[],
        petsBySpecies: [] as StatCount[],
        recentUsers: 0,
        recentPosts: 0,
        recentPets: 0,
        usersLast30Days: 0,
        postsLast30Days: 0,
    });

    // Report counts state
    let reportCounts = $state({
        pendingBugReports: 0,
        totalBugReports: 0,
        pendingPostReports: 0,
        totalPostReports: 0,
        pendingUserReports: 0,
        totalUserReports: 0
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
    let loadingStats = $state(true);
    let loadingDisk = $state(true);

    // Fetch admin stats
    async function fetchAdminStats() {
        loadingStats = true;
        try {
            const response = await fetch("/api/graphql", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${auth.token}`,
                },
                body: JSON.stringify({
                    query: `
                        query AdminStats {
                            adminStats {
                                totalUsers
                                totalPosts
                                totalPets
                                totalComments
                                postsByType { label value color }
                                petsByStatus { label value color }
                                petsBySpecies { label value color }
                                recentUsers
                                recentPosts
                                recentPets
                                usersLast30Days
                                postsLast30Days
                            }
                        }
                    `,
                }),
            });

            const result = await response.json();
            if (result.errors) {
                console.error("Failed to fetch admin stats:", result.errors);
                return;
            }

            adminStats = result.data.adminStats;
        } catch (error) {
            console.error("Failed to fetch admin stats:", error);
        } finally {
            loadingStats = false;
        }
    }

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
                                pendingUserReports
                                totalUserReports
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

    async function refreshAll() {
        await Promise.all([fetchAdminStats(), fetchReportCounts(), fetchDiskStats()]);
    }

    onMount(() => {
        if (auth.token) {
            refreshAll();
        }
    });

    // Disk usage chart segments
    let diskChartSegments = $derived([
        { value: diskStats.uploadsSize, color: "#8b5cf6", label: "Uploads" },
        { value: diskStats.diskUsed - diskStats.uploadsSize, color: "#6366f1", label: "Other Used" },
        { value: diskStats.diskFree, color: "#374151", label: "Free" },
    ]);
</script>

<svelte:head>
    <title>Admin Dashboard - AdoptMe</title>
</svelte:head>

<div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
        <div class="flex items-center gap-4">
            <div class="w-12 h-12 bg-amber-500/20 rounded-xl flex items-center justify-center">
                <Shield class="w-6 h-6 text-amber-400" />
            </div>
            <div>
                <h1 class="text-2xl font-bold text-white">Dashboard</h1>
                <p class="text-sm text-gray-400">
                    Welcome back, {auth.user?.firstName}
                </p>
            </div>
        </div>
        <button
            onclick={refreshAll}
            disabled={loadingStats}
            class="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition-colors"
        >
            <RefreshCw class="w-4 h-4 {loadingStats ? 'animate-spin' : ''}" />
            <span class="hidden sm:inline">Refresh</span>
        </button>
    </div>

    <!-- Main Stats Grid -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div class="bg-gray-800/50 rounded-xl p-4 border border-gray-700/50">
            <div class="flex items-center gap-3">
                <div class="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                    <Users class="w-5 h-5 text-blue-400" />
                </div>
                <div>
                    <p class="text-2xl font-bold text-white">
                        {loadingStats ? "..." : adminStats.totalUsers}
                    </p>
                    <p class="text-xs text-gray-400">Total Users</p>
                </div>
            </div>
        </div>

        <div class="bg-gray-800/50 rounded-xl p-4 border border-gray-700/50">
            <div class="flex items-center gap-3">
                <div class="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                    <FileText class="w-5 h-5 text-purple-400" />
                </div>
                <div>
                    <p class="text-2xl font-bold text-white">
                        {loadingStats ? "..." : adminStats.totalPosts}
                    </p>
                    <p class="text-xs text-gray-400">Total Posts</p>
                </div>
            </div>
        </div>

        <div class="bg-gray-800/50 rounded-xl p-4 border border-gray-700/50">
            <div class="flex items-center gap-3">
                <div class="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                    <PawPrint class="w-5 h-5 text-green-400" />
                </div>
                <div>
                    <p class="text-2xl font-bold text-white">
                        {loadingStats ? "..." : adminStats.totalPets}
                    </p>
                    <p class="text-xs text-gray-400">Total Pets</p>
                </div>
            </div>
        </div>

        <div class="bg-gray-800/50 rounded-xl p-4 border border-gray-700/50">
            <div class="flex items-center gap-3">
                <div class="w-10 h-10 bg-pink-500/20 rounded-lg flex items-center justify-center">
                    <MessageSquare class="w-5 h-5 text-pink-400" />
                </div>
                <div>
                    <p class="text-2xl font-bold text-white">
                        {loadingStats ? "..." : adminStats.totalComments}
                    </p>
                    <p class="text-xs text-gray-400">Comments</p>
                </div>
            </div>
        </div>
    </div>

    <!-- Admin Quick Actions Row -->
    <div class="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <!-- Users -->
        <a
            href="/admin/users"
            class="group bg-gray-800/50 rounded-xl p-4 border border-gray-700/50 hover:border-indigo-500/50 transition-all"
        >
            <div class="flex items-center justify-between">
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 bg-indigo-500/20 rounded-lg flex items-center justify-center">
                        <Users class="w-5 h-5 text-indigo-400" />
                    </div>
                    <div>
                        <p class="text-lg font-semibold text-white group-hover:text-indigo-400 transition-colors">{$_("admin.users")}</p>
                        <p class="text-xs text-gray-400">{loadingStats ? "..." : adminStats.totalUsers} total users</p>
                    </div>
                </div>
                <ChevronRight class="w-5 h-5 text-gray-600 group-hover:text-indigo-400 transition-colors" />
            </div>
        </a>

        <!-- Bug Reports -->
        <a
            href="/admin/bugs"
            class="group bg-gray-800/50 rounded-xl p-4 border border-gray-700/50 hover:border-orange-500/50 transition-all"
        >
            <div class="flex items-center justify-between">
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 bg-orange-500/20 rounded-lg flex items-center justify-center">
                        <Bug class="w-5 h-5 text-orange-400" />
                    </div>
                    <div>
                        <p class="text-lg font-semibold text-white group-hover:text-orange-400 transition-colors">{$_("admin.bug_reports")}</p>
                        <p class="text-xs text-gray-400">{reportCounts.pendingBugReports} pending / {reportCounts.totalBugReports} total</p>
                    </div>
                </div>
                {#if reportCounts.pendingBugReports > 0}
                    <span class="px-2 py-1 bg-orange-500/20 text-orange-400 text-xs font-semibold rounded-full">
                        {reportCounts.pendingBugReports}
                    </span>
                {/if}
            </div>
        </a>

        <!-- Post Reports -->
        <a
            href="/admin/reports"
            class="group bg-gray-800/50 rounded-xl p-4 border border-gray-700/50 hover:border-red-500/50 transition-all"
        >
            <div class="flex items-center justify-between">
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 bg-red-500/20 rounded-lg flex items-center justify-center">
                        <Flag class="w-5 h-5 text-red-400" />
                    </div>
                    <div>
                        <p class="text-lg font-semibold text-white group-hover:text-red-400 transition-colors">{$_("admin.post_reports")}</p>
                        <p class="text-xs text-gray-400">{reportCounts.pendingPostReports} pending / {reportCounts.totalPostReports} total</p>
                    </div>
                </div>
                {#if reportCounts.pendingPostReports > 0}
                    <span class="px-2 py-1 bg-red-500/20 text-red-400 text-xs font-semibold rounded-full">
                        {reportCounts.pendingPostReports}
                    </span>
                {/if}
            </div>
        </a>

        <!-- User Reports -->
        <a
            href="/admin/user-reports"
            class="group bg-gray-800/50 rounded-xl p-4 border border-gray-700/50 hover:border-amber-500/50 transition-all"
        >
            <div class="flex items-center justify-between">
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 bg-amber-500/20 rounded-lg flex items-center justify-center">
                        <UserX class="w-5 h-5 text-amber-400" />
                    </div>
                    <div>
                        <p class="text-lg font-semibold text-white group-hover:text-amber-400 transition-colors">{$_("admin.user_reports")}</p>
                        <p class="text-xs text-gray-400">{reportCounts.pendingUserReports} pending / {reportCounts.totalUserReports} total</p>
                    </div>
                </div>
                {#if reportCounts.pendingUserReports > 0}
                    <span class="px-2 py-1 bg-amber-500/20 text-amber-400 text-xs font-semibold rounded-full">
                        {reportCounts.pendingUserReports}
                    </span>
                {/if}
            </div>
        </a>
    </div>

    <!-- Charts Section -->
    <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        <!-- Posts by Type -->
        <div class="bg-gray-800/50 rounded-xl border border-gray-700/50 overflow-hidden">
            <div class="p-4 border-b border-gray-700/50">
                <h3 class="text-sm font-semibold text-white flex items-center gap-2">
                    <FileText class="w-4 h-4 text-purple-400" />
                    Posts by Type
                </h3>
            </div>
            <div class="p-4">
                {#if loadingStats}
                    <div class="flex justify-center py-8">
                        <Loader2 class="w-6 h-6 text-purple-400 animate-spin" />
                    </div>
                {:else}
                    <div class="flex justify-center mb-4">
                        <DonutChart
                            segments={adminStats.postsByType.map(p => ({ value: p.value, color: p.color || '#8b5cf6', label: p.label }))}
                            size={140}
                            thickness={24}
                            centerValue={adminStats.totalPosts.toString()}
                            centerLabel="Total"
                        />
                    </div>
                    <div class="space-y-2">
                        {#each adminStats.postsByType as item}
                            <div class="flex items-center justify-between text-sm">
                                <div class="flex items-center gap-2">
                                    <div class="w-3 h-3 rounded-full" style="background-color: {item.color}"></div>
                                    <span class="text-gray-300">{item.label}</span>
                                </div>
                                <span class="text-white font-medium">{item.value}</span>
                            </div>
                        {/each}
                    </div>
                {/if}
            </div>
        </div>

        <!-- Pets by Status -->
        <div class="bg-gray-800/50 rounded-xl border border-gray-700/50 overflow-hidden">
            <div class="p-4 border-b border-gray-700/50">
                <h3 class="text-sm font-semibold text-white flex items-center gap-2">
                    <PawPrint class="w-4 h-4 text-green-400" />
                    Pets by Status
                </h3>
            </div>
            <div class="p-4">
                {#if loadingStats}
                    <div class="flex justify-center py-8">
                        <Loader2 class="w-6 h-6 text-green-400 animate-spin" />
                    </div>
                {:else}
                    <div class="flex justify-center mb-4">
                        <DonutChart
                            segments={adminStats.petsByStatus.map(p => ({ value: p.value, color: p.color || '#22c55e', label: p.label }))}
                            size={140}
                            thickness={24}
                            centerValue={adminStats.totalPets.toString()}
                            centerLabel="Total"
                        />
                    </div>
                    <div class="space-y-2">
                        {#each adminStats.petsByStatus as item}
                            <div class="flex items-center justify-between text-sm">
                                <div class="flex items-center gap-2">
                                    <div class="w-3 h-3 rounded-full" style="background-color: {item.color}"></div>
                                    <span class="text-gray-300">{item.label}</span>
                                </div>
                                <span class="text-white font-medium">{item.value}</span>
                            </div>
                        {/each}
                    </div>
                {/if}
            </div>
        </div>

        <!-- Pets by Species -->
        <div class="bg-gray-800/50 rounded-xl border border-gray-700/50 overflow-hidden">
            <div class="p-4 border-b border-gray-700/50">
                <h3 class="text-sm font-semibold text-white flex items-center gap-2">
                    <BarChart3 class="w-4 h-4 text-pink-400" />
                    Top Species
                </h3>
            </div>
            <div class="p-4">
                {#if loadingStats}
                    <div class="flex justify-center py-8">
                        <Loader2 class="w-6 h-6 text-pink-400 animate-spin" />
                    </div>
                {:else if adminStats.petsBySpecies.length === 0}
                    <p class="text-center text-gray-500 py-8 text-sm">No data yet</p>
                {:else}
                    <div class="space-y-3">
                        {#each adminStats.petsBySpecies as item}
                            {@const maxValue = Math.max(...adminStats.petsBySpecies.map(s => s.value))}
                            {@const percentage = maxValue > 0 ? (item.value / maxValue) * 100 : 0}
                            <div>
                                <div class="flex items-center justify-between text-sm mb-1">
                                    <span class="text-gray-300">{item.label}</span>
                                    <span class="text-white font-medium">{item.value}</span>
                                </div>
                                <div class="h-2 bg-gray-700 rounded-full overflow-hidden">
                                    <div
                                        class="h-full rounded-full transition-all duration-500"
                                        style="width: {percentage}%; background-color: {item.color}"
                                    ></div>
                                </div>
                            </div>
                        {/each}
                    </div>
                {/if}
            </div>
        </div>
    </div>

    <!-- Recent Activity & Disk Usage -->
    <div class="grid md:grid-cols-2 gap-6">
        <!-- Recent Activity -->
        <div class="bg-gray-800/50 rounded-xl border border-gray-700/50 overflow-hidden">
            <div class="p-4 border-b border-gray-700/50">
                <h3 class="text-sm font-semibold text-white flex items-center gap-2">
                    <TrendingUp class="w-4 h-4 text-cyan-400" />
                    Recent Activity
                </h3>
            </div>
            <div class="p-4">
                {#if loadingStats}
                    <div class="flex justify-center py-8">
                        <Loader2 class="w-6 h-6 text-cyan-400 animate-spin" />
                    </div>
                {:else}
                    <div class="grid grid-cols-3 gap-4 mb-6">
                        <div class="text-center">
                            <p class="text-2xl font-bold text-cyan-400">{adminStats.recentUsers}</p>
                            <p class="text-xs text-gray-400">New Users</p>
                            <p class="text-[10px] text-gray-500">Last 7 days</p>
                        </div>
                        <div class="text-center">
                            <p class="text-2xl font-bold text-purple-400">{adminStats.recentPosts}</p>
                            <p class="text-xs text-gray-400">New Posts</p>
                            <p class="text-[10px] text-gray-500">Last 7 days</p>
                        </div>
                        <div class="text-center">
                            <p class="text-2xl font-bold text-green-400">{adminStats.recentPets}</p>
                            <p class="text-xs text-gray-400">New Pets</p>
                            <p class="text-[10px] text-gray-500">Last 7 days</p>
                        </div>
                    </div>

                    <div class="border-t border-gray-700/50 pt-4">
                        <div class="flex items-center gap-2 text-sm text-gray-400 mb-2">
                            <Calendar class="w-4 h-4" />
                            Last 30 Days Growth
                        </div>
                        <div class="grid grid-cols-2 gap-4">
                            <div class="bg-gray-700/30 rounded-lg p-3">
                                <p class="text-lg font-bold text-white">{adminStats.usersLast30Days}</p>
                                <p class="text-xs text-gray-400">New Users</p>
                            </div>
                            <div class="bg-gray-700/30 rounded-lg p-3">
                                <p class="text-lg font-bold text-white">{adminStats.postsLast30Days}</p>
                                <p class="text-xs text-gray-400">New Posts</p>
                            </div>
                        </div>
                    </div>
                {/if}
            </div>
        </div>

        <!-- Disk Usage -->
        <div class="bg-gray-800/50 rounded-xl border border-gray-700/50 overflow-hidden">
            <div class="p-4 border-b border-gray-700/50 flex items-center justify-between">
                <h3 class="text-sm font-semibold text-white flex items-center gap-2">
                    <HardDrive class="w-4 h-4 text-purple-400" />
                    Storage Overview
                </h3>
                <button
                    onclick={fetchDiskStats}
                    disabled={loadingDisk}
                    class="p-1.5 text-gray-400 hover:bg-gray-700 rounded transition-colors"
                >
                    <RefreshCw class="w-3.5 h-3.5 {loadingDisk ? 'animate-spin' : ''}" />
                </button>
            </div>
            <div class="p-4">
                {#if loadingDisk}
                    <div class="flex justify-center py-8">
                        <Loader2 class="w-6 h-6 text-purple-400 animate-spin" />
                    </div>
                {:else}
                    <!-- Main Usage Display -->
                    <div class="flex items-center justify-center mb-6">
                        <DonutChart
                            segments={diskChartSegments}
                            size={140}
                            thickness={16}
                            centerValue="{diskStats.diskUsedPercent}%"
                            centerLabel="Used"
                        />
                    </div>

                    <!-- Overall Progress Bar -->
                    <div class="mb-6">
                        <div class="flex items-center justify-between text-xs mb-2">
                            <span class="text-gray-400">Disk Space</span>
                            <span class="text-white font-medium">{diskStats.diskUsedFormatted} / {diskStats.diskTotalFormatted}</span>
                        </div>
                        <div class="h-3 bg-gray-700/50 rounded-full overflow-hidden relative">
                            <!-- Gradient progress bar -->
                            <div
                                class="h-full rounded-full transition-all duration-700 ease-out relative overflow-hidden"
                                style="width: {diskStats.diskUsedPercent}%; background: linear-gradient(90deg, #8b5cf6 0%, #6366f1 50%, #4f46e5 100%);"
                            >
                                <!-- Shine effect -->
                                <div class="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse"></div>
                            </div>
                            <!-- Warning threshold markers -->
                            <div class="absolute top-0 bottom-0 left-[75%] w-px bg-yellow-500/50"></div>
                            <div class="absolute top-0 bottom-0 left-[90%] w-px bg-red-500/50"></div>
                        </div>
                        <div class="flex justify-between mt-1">
                            <span class="text-[10px] text-gray-500">0%</span>
                            <span class="text-[10px] text-yellow-500/70">75%</span>
                            <span class="text-[10px] text-red-500/70">90%</span>
                            <span class="text-[10px] text-gray-500">100%</span>
                        </div>
                    </div>

                    <!-- Stats Grid -->
                    <div class="grid grid-cols-3 gap-3 mb-4">
                        <div class="bg-purple-500/10 border border-purple-500/20 rounded-xl p-3 text-center">
                            <div class="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center mx-auto mb-2">
                                <ImageIcon class="w-4 h-4 text-purple-400" />
                            </div>
                            <p class="text-sm font-bold text-purple-400">{diskStats.uploadsSizeFormatted}</p>
                            <p class="text-[10px] text-gray-400">Uploads</p>
                        </div>
                        <div class="bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-3 text-center">
                            <div class="w-8 h-8 bg-indigo-500/20 rounded-lg flex items-center justify-center mx-auto mb-2">
                                <HardDrive class="w-4 h-4 text-indigo-400" />
                            </div>
                            <p class="text-sm font-bold text-indigo-400">{diskStats.diskUsedFormatted}</p>
                            <p class="text-[10px] text-gray-400">Total Used</p>
                        </div>
                        <div class="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 text-center">
                            <div class="w-8 h-8 bg-emerald-500/20 rounded-lg flex items-center justify-center mx-auto mb-2">
                                <HardDrive class="w-4 h-4 text-emerald-400" />
                            </div>
                            <p class="text-sm font-bold text-emerald-400">{diskStats.diskFreeFormatted}</p>
                            <p class="text-[10px] text-gray-400">Free Space</p>
                        </div>
                    </div>

                    <!-- Footer Info -->
                    <div class="flex items-center justify-between pt-3 border-t border-gray-700/50">
                        <div class="flex items-center gap-2">
                            <div class="w-6 h-6 bg-gray-700/50 rounded-lg flex items-center justify-center">
                                <ImageIcon class="w-3 h-3 text-gray-400" />
                            </div>
                            <span class="text-xs text-gray-400">{diskStats.uploadsFileCount} files uploaded</span>
                        </div>
                        <div class="px-2 py-1 rounded-lg text-xs font-medium {diskStats.diskUsedPercent > 90 ? 'bg-red-500/20 text-red-400' : diskStats.diskUsedPercent > 75 ? 'bg-yellow-500/20 text-yellow-400' : 'bg-emerald-500/20 text-emerald-400'}">
                            {diskStats.diskUsedPercent > 90 ? 'Critical' : diskStats.diskUsedPercent > 75 ? 'Warning' : 'Healthy'}
                        </div>
                    </div>
                {/if}
            </div>
        </div>
    </div>

    <!-- Quick Actions -->
    <div class="bg-gray-800/50 rounded-xl border border-gray-700/50 overflow-hidden">
        <div class="p-4 border-b border-gray-700/50">
            <h3 class="text-sm font-semibold text-white flex items-center gap-2">
                <Settings class="w-4 h-4 text-gray-400" />
                Quick Actions
            </h3>
        </div>
        <div class="p-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
            <a
                href="/admin/invite"
                class="flex items-center gap-3 p-3 rounded-lg bg-gray-700/30 hover:bg-gray-700/50 transition-colors"
            >
                <Mail class="w-5 h-5 text-amber-400" />
                <span class="text-sm text-gray-300">Send Invites</span>
            </a>
            <a
                href="/"
                class="flex items-center gap-3 p-3 rounded-lg bg-gray-700/30 hover:bg-gray-700/50 transition-colors"
            >
                <FileText class="w-5 h-5 text-purple-400" />
                <span class="text-sm text-gray-300">View Feed</span>
            </a>
            <a
                href="/profile?tab=settings"
                class="flex items-center gap-3 p-3 rounded-lg bg-gray-700/30 hover:bg-gray-700/50 transition-colors"
            >
                <Users class="w-5 h-5 text-blue-400" />
                <span class="text-sm text-gray-300">My Profile</span>
            </a>
            <button
                onclick={() => toast.info("Coming soon!")}
                class="flex items-center gap-3 p-3 rounded-lg bg-gray-700/30 hover:bg-gray-700/50 transition-colors text-left"
            >
                <BarChart3 class="w-5 h-5 text-cyan-400" />
                <span class="text-sm text-gray-300">Analytics</span>
            </button>
        </div>
    </div>
</div>
