<script lang="ts">
    import { auth } from "$lib/stores/auth.svelte";
    import { User, LogOut, Menu, X, Settings } from "lucide-svelte";
    import { page } from "$app/stores";
    import logo from "$lib/assets/logo_text.svg";
    import { goto } from "$app/navigation";

    let isMenuOpen = $state(false);
    let isDropdownOpen = $state(false);

    function toggleMenu() {
        isMenuOpen = !isMenuOpen;
        isDropdownOpen = false;
    }

    function toggleDropdown() {
        isDropdownOpen = !isDropdownOpen;
        isMenuOpen = false;
    }

    function closeAll() {
        isMenuOpen = false;
        isDropdownOpen = false;
    }
</script>

<nav class="bg-white border-b border-gray-200 fixed w-full top-0 z-50 h-16">
    <div
        class="max-w-7xl mx-auto px-4 h-full flex items-center justify-between"
    >
        <!-- Logo -->
        <a
            href="/"
            class="flex items-center gap-2 hover:opacity-80 transition-opacity"
            onclick={closeAll}
        >
            <img src={logo} alt="AdoptMe" class="h-5 w-auto" />
        </a>

        <!-- Desktop Navigation & Search -->
        <div class="hidden md:flex items-center flex-1 ml-10 gap-8">
            <a
                href="/"
                class="text-sm font-medium text-gray-600 hover:text-indigo-600 transition-colors"
                >Feed</a
            >

            <div class="flex-1 max-w-md">
                <div class="relative">
                    <div
                        class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"
                    >
                        <svg
                            class="h-4 w-4 text-gray-400"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="2"
                                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                            />
                        </svg>
                    </div>
                    <input
                        type="text"
                        class="block w-full pl-10 pr-3 py-2 border border-gray-200 rounded-full text-sm bg-gray-50 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
                        placeholder="Search for pets..."
                    />
                </div>
            </div>
        </div>

        <!-- Right Actions -->
        <div class="hidden md:flex items-center gap-4">
            {#if auth.user}
                <div class="relative">
                    <button
                        onclick={toggleDropdown}
                        class="flex items-center gap-2 hover:bg-gray-50 rounded-full p-1 pr-3 transition-colors border border-transparent hover:border-gray-100"
                    >
                        {#if auth.user.profilePicture}
                            <img
                                src={auth.user.profilePicture}
                                alt="Avatar"
                                class="w-8 h-8 rounded-full object-cover border border-gray-200"
                            />
                        {:else}
                            <div
                                class="w-8 h-8 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center"
                            >
                                <span class="font-bold text-xs"
                                    >{auth.user.name[0].toUpperCase()}</span
                                >
                            </div>
                        {/if}
                        <span class="text-sm font-medium text-gray-700"
                            >{auth.user.name}</span
                        >
                    </button>

                    <!-- Dropdown Menu -->
                    {#if isDropdownOpen}
                        <div
                            class="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden py-1 transform origin-top-right transition-all animate-in fade-in zoom-in-95 duration-200"
                        >
                            <div class="px-4 py-3 border-b border-gray-50">
                                <p class="text-sm font-semibold text-gray-900">
                                    {auth.user.name}
                                </p>
                                <p class="text-xs text-gray-500 truncate">
                                    {auth.user.email}
                                </p>
                            </div>

                            <a
                                href="/profile"
                                onclick={closeAll}
                                class="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 hover:text-indigo-600 transition-colors"
                            >
                                <User class="w-4 h-4" />
                                My Profile
                            </a>
                            <a
                                href="/profile?tab=settings"
                                onclick={closeAll}
                                class="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 hover:text-indigo-600 transition-colors"
                            >
                                <Settings class="w-4 h-4" />
                                Settings
                            </a>

                            <div class="border-t border-gray-50 my-1"></div>

                            <button
                                onclick={() => {
                                    auth.logout();
                                    closeAll();
                                    goto("/");
                                }}
                                class="w-full text-left flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                            >
                                <LogOut class="w-4 h-4" />
                                Log Out
                            </button>
                        </div>
                        <!-- Click outside overlay -->
                        <button
                            onclick={closeAll}
                            class="fixed inset-0 z-[-1] cursor-default w-screen h-screen"
                        ></button>
                    {/if}
                </div>
            {:else}
                <a
                    href="/login"
                    class="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-full shadow-lg shadow-indigo-200 transition-all hover:scale-105"
                >
                    Sign In
                </a>
            {/if}
        </div>

        <!-- Mobile Menu Button -->
        <div class="flex items-center gap-4 md:hidden">
            {#if auth.user}
                <a
                    href="/profile"
                    class="w-8 h-8 rounded-full overflow-hidden border border-gray-200"
                >
                    {#if auth.user.profilePicture}
                        <img
                            src={auth.user.profilePicture}
                            alt="Avatar"
                            class="w-full h-full object-cover"
                        />
                    {:else}
                        <div
                            class="w-full h-full bg-indigo-100 text-indigo-600 flex items-center justify-center"
                        >
                            <span class="font-bold text-xs"
                                >{auth.user.name[0].toUpperCase()}</span
                            >
                        </div>
                    {/if}
                </a>
            {/if}
            <button
                onclick={toggleMenu}
                class="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
            >
                {#if isMenuOpen}
                    <X class="w-6 h-6" />
                {:else}
                    <Menu class="w-6 h-6" />
                {/if}
            </button>
        </div>
    </div>

    <!-- Mobile Navigation Menu -->
    {#if isMenuOpen}
        <div
            class="md:hidden bg-white border-b border-gray-200 animate-in slide-in-from-top-4 duration-200"
        >
            <div class="space-y-1 px-4 py-4">
                <a
                    href="/"
                    onclick={closeAll}
                    class="block px-3 py-2 rounded-lg text-base font-medium text-gray-700 hover:bg-gray-50 hover:text-indigo-600"
                    >Feed</a
                >
                <div class="relative mt-2 mb-4">
                    <svg
                        class="absolute left-3 top-2.5 h-4 w-4 text-gray-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                        />
                    </svg>
                    <input
                        type="text"
                        class="block w-full pl-10 pr-3 py-2 border border-gray-200 rounded-lg text-base bg-gray-50 focus:bg-white focus:border-indigo-500 outline-none"
                        placeholder="Search..."
                    />
                </div>

                <div class="border-t border-gray-100 pt-4 space-y-1">
                    {#if auth.user}
                        <div class="px-3 py-2 flex items-center gap-3 mb-2">
                            {#if auth.user.profilePicture}
                                <img
                                    src={auth.user.profilePicture}
                                    alt="Avatar"
                                    class="w-10 h-10 rounded-full object-cover shadow-sm"
                                />
                            {:else}
                                <div
                                    class="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center shadow-sm"
                                >
                                    <span class="font-bold text-lg"
                                        >{auth.user.name[0].toUpperCase()}</span
                                    >
                                </div>
                            {/if}
                            <div>
                                <p class="text-sm font-bold text-gray-900">
                                    {auth.user.name}
                                </p>
                                <p class="text-xs text-gray-500">
                                    {auth.user.email}
                                </p>
                            </div>
                        </div>
                        <a
                            href="/profile"
                            onclick={closeAll}
                            class="block px-3 py-2 rounded-lg text-base font-medium text-gray-700 hover:bg-gray-50"
                            >My Profile</a
                        >
                        <a
                            href="/profile"
                            onclick={closeAll}
                            class="block px-3 py-2 rounded-lg text-base font-medium text-gray-700 hover:bg-gray-50"
                            >Settings</a
                        >
                        <button
                            onclick={() => {
                                auth.logout();
                                closeAll();
                                goto("/");
                            }}
                            class="w-full text-left block px-3 py-2 rounded-lg text-base font-medium text-red-600 hover:bg-red-50 mt-2"
                            >Log Out</button
                        >
                    {:else}
                        <a
                            href="/login"
                            onclick={closeAll}
                            class="block w-full text-center px-5 py-3 bg-indigo-600 text-white font-bold rounded-xl shadow-md mt-4"
                        >
                            Sign In
                        </a>
                    {/if}
                </div>
            </div>
        </div>
    {/if}
</nav>

<!-- Spacer to prevent content overlap -->
<div class="h-14"></div>
