<script lang="ts">
    import { auth } from "$lib/stores/auth.svelte";
    import { User, LogOut, Menu, X, Settings, Search, Home, Globe, Bell, AlertTriangle, Mail, Phone, Shield } from "lucide-svelte";
    import { page } from "$app/stores";
    import logo from "$lib/assets/logo_text.svg";
    import { goto } from "$app/navigation";
    import { t, locale } from "$lib/i18n";
    import { onMount } from "svelte";
    import gsap from "gsap";

    let isMenuOpen = $state(false);
    let isDropdownOpen = $state(false);
    let searchQuery = $state("");

    // Notification count placeholder (disabled for now)
    let notificationCount = $state(0);
    let isNotificationOpen = $state(false);
    let notificationDropdownEl: HTMLDivElement | null = $state(null);

    // Element refs for GSAP animations
    let backdropEl: HTMLButtonElement | null = $state(null);
    let offcanvasEl: HTMLDivElement | null = $state(null);
    let menuItemsEl: HTMLDivElement | null = $state(null);
    let desktopDropdownEl: HTMLDivElement | null = $state(null);

    // Verification status checks - only email verification required
    let needsEmailVerification = $derived(auth.user && (!auth.user.email || !auth.user.emailVerified));
    let showVerificationBanner = $derived(needsEmailVerification);

    // Support banner state - closable with 25% chance to reappear after 20 navigations
    let showSupportBanner = $state(true);
    let navigationCount = $state(0);
    const NAVIGATIONS_BEFORE_RETRY = 20;
    const RESHOW_CHANCE = 0.25; // 25%

    // Initialize support banner state from localStorage
    onMount(() => {
        const stored = localStorage.getItem('support_banner_state');
        if (stored) {
            try {
                const data = JSON.parse(stored);
                showSupportBanner = data.show ?? true;
                navigationCount = data.navCount ?? 0;
            } catch {
                // Invalid data, use defaults
            }
        }
    });

    // Track page navigations for support banner logic
    let lastPathname = $state('');
    $effect(() => {
        const currentPath = $page.url.pathname;
        if (lastPathname && lastPathname !== currentPath) {
            // Navigation occurred
            if (!showSupportBanner) {
                navigationCount++;

                // After 20 navigations, 25% chance to show again
                if (navigationCount >= NAVIGATIONS_BEFORE_RETRY) {
                    if (Math.random() < RESHOW_CHANCE) {
                        showSupportBanner = true;
                        navigationCount = 0;
                    }
                }

                // Save state
                localStorage.setItem('support_banner_state', JSON.stringify({
                    show: showSupportBanner,
                    navCount: navigationCount
                }));
            }
        }
        lastPathname = currentPath;
    });

    function closeSupportBanner() {
        showSupportBanner = false;
        navigationCount = 0;
        localStorage.setItem('support_banner_state', JSON.stringify({
            show: false,
            navCount: 0
        }));
    }

    // Sync search query with URL parameter (only when URL changes externally)
    let lastUrlSearch = $state<string | null>(null);
    $effect(() => {
        const urlSearch = $page.url.searchParams.get("search");
        // Only update if URL changed externally (not from our navigation)
        if (urlSearch !== lastUrlSearch) {
            lastUrlSearch = urlSearch;
            if (urlSearch !== null) {
                searchQuery = urlSearch;
            } else if ($page.url.pathname === "/") {
                searchQuery = "";
            }
        }
    });

    // GSAP animation for opening menu
    function openMenu() {
        // Prevent scroll BEFORE rendering elements
        document.body.style.overflow = "hidden";
        isMenuOpen = true;

        // Wait for elements to be in DOM
        requestAnimationFrame(() => {
            const tl = gsap.timeline();

            // Animate backdrop - fade in with blur effect
            if (backdropEl) {
                tl.fromTo(
                    backdropEl,
                    { opacity: 0 },
                    { opacity: 1, duration: 0.3, ease: "power2.out" },
                    0
                );
            }

            // Animate offcanvas panel - slide from right
            if (offcanvasEl) {
                tl.fromTo(
                    offcanvasEl,
                    { x: "100%" },
                    { x: "0%", duration: 0.4, ease: "power3.out" },
                    0.1
                );
            }

            // Animate menu items - staggered fade up
            if (menuItemsEl) {
                const items = menuItemsEl.querySelectorAll(".menu-item");
                tl.fromTo(
                    items,
                    { opacity: 0, y: 20 },
                    { opacity: 1, y: 0, duration: 0.3, stagger: 0.05, ease: "power2.out" },
                    0.2
                );
            }
        });
    }

    // GSAP animation for closing menu
    function closeMenu() {
        const tl = gsap.timeline({
            onComplete: () => {
                isMenuOpen = false;
                document.body.style.overflow = ""; // Restore scroll
            }
        });

        // Animate menu items out first
        if (menuItemsEl) {
            const items = menuItemsEl.querySelectorAll(".menu-item");
            tl.to(items, {
                opacity: 0,
                y: -10,
                duration: 0.15,
                stagger: 0.02,
                ease: "power2.in"
            }, 0);
        }

        // Slide offcanvas out
        if (offcanvasEl) {
            tl.to(offcanvasEl, {
                x: "100%",
                duration: 0.3,
                ease: "power3.in"
            }, 0.1);
        }

        // Fade backdrop out
        if (backdropEl) {
            tl.to(backdropEl, {
                opacity: 0,
                duration: 0.25,
                ease: "power2.in"
            }, 0.15);
        }
    }

    function toggleMenu() {
        if (isMenuOpen) {
            closeMenu();
        } else {
            openMenu();
        }
        isDropdownOpen = false;
    }

    function openDropdown() {
        isDropdownOpen = true;
        isNotificationOpen = false;
        requestAnimationFrame(() => {
            if (desktopDropdownEl) {
                const items = desktopDropdownEl.querySelectorAll(".dropdown-item");
                gsap.fromTo(
                    desktopDropdownEl,
                    { opacity: 0, scale: 0.95, y: -10 },
                    { opacity: 1, scale: 1, y: 0, duration: 0.2, ease: "power2.out" }
                );
                gsap.fromTo(
                    items,
                    { opacity: 0, x: -10 },
                    { opacity: 1, x: 0, duration: 0.2, stagger: 0.03, ease: "power2.out", delay: 0.1 }
                );
            }
        });
    }

    function closeDropdown() {
        if (desktopDropdownEl) {
            gsap.to(desktopDropdownEl, {
                opacity: 0,
                scale: 0.95,
                y: -10,
                duration: 0.15,
                ease: "power2.in",
                onComplete: () => {
                    isDropdownOpen = false;
                }
            });
        } else {
            isDropdownOpen = false;
        }
    }

    function toggleDropdown() {
        if (isDropdownOpen) {
            closeDropdown();
        } else {
            openDropdown();
        }
    }

    function openNotificationDropdown() {
        isNotificationOpen = true;
        isDropdownOpen = false;
        requestAnimationFrame(() => {
            if (notificationDropdownEl) {
                gsap.fromTo(
                    notificationDropdownEl,
                    { opacity: 0, scale: 0.95, y: -10 },
                    { opacity: 1, scale: 1, y: 0, duration: 0.2, ease: "power2.out" }
                );
            }
        });
    }

    function closeNotificationDropdown() {
        if (notificationDropdownEl) {
            gsap.to(notificationDropdownEl, {
                opacity: 0,
                scale: 0.95,
                y: -10,
                duration: 0.15,
                ease: "power2.in",
                onComplete: () => {
                    isNotificationOpen = false;
                }
            });
        } else {
            isNotificationOpen = false;
        }
    }

    function toggleNotification() {
        if (isNotificationOpen) {
            closeNotificationDropdown();
        } else {
            openNotificationDropdown();
        }
    }

    function closeAll() {
        if (isMenuOpen) {
            closeMenu();
        }
        if (isDropdownOpen) {
            closeDropdown();
        }
        if (isNotificationOpen) {
            closeNotificationDropdown();
        }
    }

    function executeSearch() {
        const trimmedQuery = searchQuery.trim();
        lastUrlSearch = trimmedQuery || null;
        if (trimmedQuery) {
            goto(`/?search=${encodeURIComponent(trimmedQuery)}`);
        } else {
            goto("/");
        }
        closeAll();
    }

    function handleSearch(e: Event) {
        e.preventDefault();
        executeSearch();
    }

    function handleSearchKeydown(e: KeyboardEvent) {
        if (e.key === "Enter") {
            handleSearch(e);
        } else if (e.key === "Escape") {
            searchQuery = "";
        }
    }

    // Handle escape key to close menus
    function handleKeydown(e: KeyboardEvent) {
        if (e.key === "Escape") {
            if (isMenuOpen) {
                closeMenu();
            }
            if (isDropdownOpen) {
                closeDropdown();
            }
            if (isNotificationOpen) {
                closeNotificationDropdown();
            }
        }
    }

    onMount(() => {
        window.addEventListener("keydown", handleKeydown);
        return () => {
            window.removeEventListener("keydown", handleKeydown);
            document.body.style.overflow = "";
        };
    });
</script>

<nav class="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 fixed w-full top-0 z-50 h-16 transition-colors">
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
                class="text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                >{$t("nav.feed")}</a
            >

            <form class="flex-1 max-w-md flex gap-2" onsubmit={handleSearch}>
                <div class="relative flex-1">
                    <input
                        type="text"
                        bind:value={searchQuery}
                        onkeydown={handleSearchKeydown}
                        class="block w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-full text-sm bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:bg-white dark:focus:bg-gray-600 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900/50 outline-none transition-all"
                        placeholder={$t("nav.search_placeholder")}
                    />
                </div>
                <button
                    type="submit"
                    class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full transition-colors flex items-center justify-center active:scale-95"
                    aria-label="Search"
                >
                    <Search class="w-4 h-4" />
                </button>
            </form>
        </div>

        <!-- Right Actions -->
        <div class="hidden md:flex items-center gap-4">
            <!-- Language Switcher -->
            <div class="relative group">
                <button
                    class="flex items-center gap-2 px-3 py-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors border border-transparent hover:border-gray-200 dark:hover:border-gray-600"
                >
                    <img
                        src={$locale === "en" ? "/usa.svg" : "/mx.svg"}
                        alt={$locale === "en" ? "English" : "Español"}
                        class="w-5 h-5 rounded-full object-cover shadow-sm"
                    />
                    <span class="text-xs font-medium text-gray-600 dark:text-gray-300 uppercase"
                        >{$locale}</span
                    >
                </button>

                <!-- Dropdown -->
                <div
                    class="absolute right-0 top-full mt-2 w-32 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden py-1 invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-all duration-200 transform origin-top-right"
                >
                    <button
                        class="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-3 {$locale ===
                        'en'
                            ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400'
                            : 'text-gray-700 dark:text-gray-300'}"
                        onclick={() => locale.set("en")}
                    >
                        <img
                            src="/usa.svg"
                            alt="English"
                            class="w-4 h-4 rounded-full object-cover"
                        />
                        English
                    </button>
                    <button
                        class="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-3 {$locale ===
                        'es'
                            ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400'
                            : 'text-gray-700 dark:text-gray-300'}"
                        onclick={() => locale.set("es")}
                    >
                        <img
                            src="/mx.svg"
                            alt="Español"
                            class="w-4 h-4 rounded-full object-cover"
                        />
                        Español
                    </button>
                </div>
            </div>

            {#if auth.user}
                <!-- Notifications Bell -->
                <div class="relative">
                    <button
                        onclick={toggleNotification}
                        class="relative p-2 text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                        aria-label="Notifications"
                    >
                        <Bell class="w-5 h-5" />
                        {#if notificationCount > 0}
                            <span class="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
                                {notificationCount > 9 ? '9+' : notificationCount}
                            </span>
                        {/if}
                    </button>

                    <!-- Notification Dropdown -->
                    {#if isNotificationOpen}
                        <div
                            bind:this={notificationDropdownEl}
                            class="absolute right-0 top-full mt-2 w-72 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden transform origin-top-right"
                            style="opacity: 0;"
                        >
                            <div class="p-4 text-center">
                                <div class="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-3">
                                    <Bell class="w-6 h-6 text-gray-400 dark:text-gray-500" />
                                </div>
                                <p class="text-sm font-medium text-gray-900 dark:text-white mb-1">
                                    {$t("nav.notifications_coming_soon")}
                                </p>
                                <p class="text-xs text-gray-500 dark:text-gray-400">
                                    {$t("nav.notifications_coming_soon_desc")}
                                </p>
                            </div>
                        </div>
                        <!-- Click outside overlay -->
                        <button
                            onclick={closeAll}
                            class="fixed inset-0 z-[-1] cursor-default w-screen h-screen"
                            aria-label="Close notifications"
                        ></button>
                    {/if}
                </div>

                <div class="relative">
                    <button
                        onclick={toggleDropdown}
                        class="flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-full p-1 pr-3 transition-colors border border-transparent hover:border-gray-100 dark:hover:border-gray-600"
                    >
                        {#if auth.user.profilePicture}
                            <img
                                src={auth.user.profilePicture}
                                alt="Avatar"
                                class="w-8 h-8 rounded-full object-cover border border-gray-200 dark:border-gray-600"
                            />
                        {:else}
                            <div
                                class="w-8 h-8 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 rounded-full flex items-center justify-center"
                            >
                                <span class="font-bold text-xs"
                                    >{auth.user.firstName?.[0]?.toUpperCase() || '?'}</span
                                >
                            </div>
                        {/if}
                        <span class="text-sm font-medium text-gray-700 dark:text-gray-300"
                            >{auth.user.fullName}</span
                        >
                    </button>

                    <!-- Dropdown Menu -->
                    {#if isDropdownOpen}
                        <div
                            bind:this={desktopDropdownEl}
                            class="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden py-1 transform origin-top-right"
                            style="opacity: 0;"
                        >
                            <div class="px-4 py-3 border-b border-gray-50 dark:border-gray-700">
                                <p class="text-sm font-semibold text-gray-900 dark:text-white">
                                    {auth.user.fullName}
                                </p>
                                <p class="text-xs text-gray-500 dark:text-gray-400 truncate">
                                    {auth.user.email}
                                </p>
                            </div>

                            <a
                                href="/profile"
                                onclick={closeAll}
                                class="dropdown-item flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                            >
                                <User class="w-4 h-4" />
                                {$t("nav.profile")}
                            </a>
                            <a
                                href="/profile?tab=settings"
                                onclick={closeAll}
                                class="dropdown-item flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                            >
                                <Settings class="w-4 h-4" />
                                {$t("nav.settings")}
                            </a>

                            {#if auth.isAdmin}
                                <a
                                    href="/admin"
                                    onclick={closeAll}
                                    class="dropdown-item flex items-center gap-3 px-4 py-2.5 text-sm text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors"
                                >
                                    <Shield class="w-4 h-4" />
                                    {$t("nav.admin_panel")}
                                </a>
                            {/if}

                            <div class="border-t border-gray-50 dark:border-gray-700 my-1"></div>

                            <button
                                onclick={() => {
                                    auth.logout();
                                    closeAll();
                                    goto("/");
                                }}
                                class="dropdown-item w-full text-left flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                            >
                                <LogOut class="w-4 h-4" />
                                {$t("nav.logout")}
                            </button>
                        </div>
                        <!-- Click outside overlay -->
                        <button
                            onclick={closeAll}
                            class="fixed inset-0 z-[-1] cursor-default w-screen h-screen"
                            aria-label="Close menu"
                        ></button>
                    {/if}
                </div>
            {:else}
                <a
                    href="/login"
                    class="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-full shadow-lg shadow-indigo-200 dark:shadow-indigo-900/30 transition-all hover:scale-105"
                >
                    {$t("nav.signin")}
                </a>
            {/if}
        </div>

        <!-- Mobile Menu Button -->
        <div class="flex items-center gap-4 md:hidden">
            {#if auth.user}
                <a
                    href="/profile"
                    class="w-8 h-8 rounded-full overflow-hidden border border-gray-200 dark:border-gray-600"
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
                                >{auth.user.firstName?.[0]?.toUpperCase() || '?'}</span
                            >
                        </div>
                    {/if}
                </a>
            {/if}
            <button
                onclick={toggleMenu}
                class="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                aria-label="Toggle menu"
            >
                <Menu class="w-6 h-6" />
            </button>
        </div>
    </div>
</nav>

<!-- Notification Banners Area -->
<div class="fixed top-16 left-0 right-0 z-40">
    <!-- Verification Warning Banner -->
    {#if showVerificationBanner}
        <div class="bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm border-b border-gray-100 dark:border-gray-700">
            <div class="max-w-7xl mx-auto px-4 py-1.5">
                <a
                    href="/profile?tab=settings"
                    class="flex items-center justify-center gap-2 group"
                >
                    <span class="relative flex h-2 w-2">
                        <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                        <span class="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                    </span>
                    <span class="text-xs text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white transition-colors">
                        {#if !auth.user?.email}
                            {$t("nav.add_email")}
                        {:else}
                            {$t("nav.verify_email")}
                        {/if}
                    </span>
                    <span class="text-xs font-medium text-indigo-600 dark:text-indigo-400 group-hover:underline">
                        {$t("nav.verify_now")}
                    </span>
                </a>
            </div>
        </div>
    {/if}

    <!-- Support Us Banner -->
    {#if showSupportBanner}
        <div class="bg-gradient-to-r from-yellow-400/95 to-orange-500/95 backdrop-blur-sm border-b border-orange-300 dark:border-orange-600">
            <div class="max-w-7xl mx-auto px-4 py-1.5 flex items-center justify-center">
                <a
                    href="/support"
                    class="flex items-center justify-center gap-3 group flex-1"
                >
                    <span class="text-white text-xs font-medium">
                        ☕ {$t("nav.support_message")}
                    </span>
                    <span class="text-xs font-bold text-white/90 group-hover:text-white transition-colors underline underline-offset-2">
                        {$t("nav.buy_coffee")}
                    </span>
                </a>
                <button
                    type="button"
                    onclick={closeSupportBanner}
                    class="ml-2 p-1 text-white/70 hover:text-white hover:bg-white/20 rounded-full transition-colors"
                    aria-label="Close banner"
                >
                    <X class="w-3.5 h-3.5" />
                </button>
            </div>
        </div>
    {/if}
</div>

<!-- Mobile Offcanvas Menu -->
{#if isMenuOpen}
    <!-- Backdrop - separate element for independent animation -->
    <button
        bind:this={backdropEl}
        onclick={closeMenu}
        class="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm hidden max-md:block cursor-default border-none"
        style="opacity: 0;"
        aria-label="Close menu"
        type="button"
    ></button>

    <!-- Offcanvas Panel - slides from right -->
    <div
        bind:this={offcanvasEl}
        class="fixed top-0 right-0 z-[70] h-full w-[85%] max-w-sm bg-white dark:bg-gray-900 shadow-2xl hidden max-md:block overflow-hidden"
        style="transform: translateX(100%);"
    >
        <!-- Header -->
        <div class="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            <img src={logo} alt="AdoptMe" class="h-5 w-auto" />
            <button
                onclick={closeMenu}
                class="p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                aria-label="Close menu"
            >
                <X class="w-5 h-5" />
            </button>
        </div>

        <!-- Menu Content -->
        <div bind:this={menuItemsEl} class="flex flex-col h-[calc(100%-65px)] overflow-hidden">
            <!-- Search -->
            <div class="p-4 menu-item">
                <form class="flex gap-2" onsubmit={handleSearch}>
                    <input
                        type="text"
                        bind:value={searchQuery}
                        onkeydown={handleSearchKeydown}
                        class="flex-1 px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl text-base bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:bg-white dark:focus:bg-gray-700 focus:border-indigo-500 outline-none transition-all"
                        placeholder={$t("nav.search_placeholder")}
                    />
                    <button
                        type="submit"
                        class="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-colors flex items-center justify-center"
                        aria-label="Search"
                    >
                        <Search class="w-5 h-5" />
                    </button>
                </form>
            </div>

            <!-- Navigation Links -->
            <nav class="flex-1 px-4 py-2">
                <a
                    href="/"
                    onclick={closeAll}
                    class="menu-item flex items-center gap-3 px-4 py-3 rounded-xl text-base font-medium text-gray-700 dark:text-gray-200 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                >
                    <Home class="w-5 h-5" />
                    {$t("nav.feed")}
                </a>

                {#if auth.user}
                    <!-- Notifications (Coming Soon) -->
                    <div class="menu-item flex items-center gap-3 px-4 py-3 rounded-xl text-base font-medium text-gray-400 dark:text-gray-500 opacity-60 cursor-not-allowed w-full">
                        <Bell class="w-5 h-5" />
                        <div class="flex-1">
                            <span>{$t("nav.notifications")}</span>
                            <span class="ml-2 text-xs bg-gray-200 dark:bg-gray-700 px-1.5 py-0.5 rounded text-gray-500 dark:text-gray-400">{$t("common.coming_soon")}</span>
                        </div>
                    </div>
                    <a
                        href="/profile"
                        onclick={closeAll}
                        class="menu-item flex items-center gap-3 px-4 py-3 rounded-xl text-base font-medium text-gray-700 dark:text-gray-200 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                    >
                        <User class="w-5 h-5" />
                        {$t("nav.profile")}
                    </a>
                    <a
                        href="/profile?tab=settings"
                        onclick={closeAll}
                        class="menu-item flex items-center gap-3 px-4 py-3 rounded-xl text-base font-medium text-gray-700 dark:text-gray-200 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                    >
                        <Settings class="w-5 h-5" />
                        {$t("nav.settings")}
                    </a>
                    {#if auth.isAdmin}
                        <a
                            href="/admin"
                            onclick={closeAll}
                            class="menu-item flex items-center gap-3 px-4 py-3 rounded-xl text-base font-medium text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors"
                        >
                            <Shield class="w-5 h-5" />
                            {$t("nav.admin_panel")}
                        </a>
                    {/if}
                {/if}

                <!-- Language Section -->
                <div class="menu-item mt-4">
                    <p class="px-4 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-2">
                        <Globe class="w-4 h-4" />
                        {$t("auth.language")}
                    </p>
                    <div class="grid grid-cols-2 gap-2 mt-2">
                        <button
                            class="flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-medium transition-colors {$locale ===
                            'en'
                                ? 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 ring-2 ring-indigo-500'
                                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'}"
                            onclick={() => locale.set("en")}
                        >
                            <img
                                src="/usa.svg"
                                alt="English"
                                class="w-5 h-5 rounded-full object-cover"
                            />
                            English
                        </button>
                        <button
                            class="flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-medium transition-colors {$locale ===
                            'es'
                                ? 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 ring-2 ring-indigo-500'
                                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'}"
                            onclick={() => locale.set("es")}
                        >
                            <img
                                src="/mx.svg"
                                alt="Español"
                                class="w-5 h-5 rounded-full object-cover"
                            />
                            Español
                        </button>
                    </div>
                </div>
            </nav>

            <!-- User Section at Bottom -->
            <div class="mt-auto border-t border-gray-200 dark:border-gray-700 p-4">
                {#if auth.user}
                    <div class="menu-item flex items-center gap-3 mb-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
                        {#if auth.user.profilePicture}
                            <img
                                src={auth.user.profilePicture}
                                alt="Avatar"
                                class="w-12 h-12 rounded-full object-cover ring-2 ring-indigo-200 dark:ring-indigo-800"
                            />
                        {:else}
                            <div
                                class="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-full flex items-center justify-center ring-2 ring-indigo-200 dark:ring-indigo-800"
                            >
                                <span class="font-bold text-lg"
                                    >{auth.user.firstName?.[0]?.toUpperCase() || '?'}</span
                                >
                            </div>
                        {/if}
                        <div class="flex-1 min-w-0">
                            <p class="text-sm font-bold text-gray-900 dark:text-white truncate">
                                {auth.user.fullName}
                            </p>
                            <p class="text-xs text-gray-500 dark:text-gray-400 truncate">
                                {auth.user.email}
                            </p>
                        </div>
                    </div>
                    <button
                        onclick={() => {
                            auth.logout();
                            closeAll();
                            goto("/");
                        }}
                        class="menu-item w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-base font-semibold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                    >
                        <LogOut class="w-5 h-5" />
                        {$t("nav.logout")}
                    </button>
                {:else}
                    <a
                        href="/login"
                        onclick={closeAll}
                        class="menu-item block w-full text-center px-5 py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-200 dark:shadow-indigo-900/30 transition-all"
                    >
                        {$t("nav.signin")}
                    </a>
                {/if}
            </div>
        </div>
    </div>
{/if}

<!-- Spacer to prevent content overlap -->
<!-- Nav (64px) + Support banner if shown (28px) + Verification banner if shown (28px) -->
<div class="{showVerificationBanner && showSupportBanner ? 'h-[120px]' : (showVerificationBanner || showSupportBanner) ? 'h-[92px]' : 'h-16'}"></div>
