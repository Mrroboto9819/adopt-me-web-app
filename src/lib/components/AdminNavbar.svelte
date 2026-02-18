<script lang="ts">
    import { auth } from "$lib/stores/auth.svelte";
    import { Menu, X, Home, Bug, Flag, Mail, LogOut, ArrowLeft, LayoutDashboard, Users, UserX } from "lucide-svelte";
    import { page } from "$app/stores";
    import logo from "$lib/assets/logo_text.svg";
    import { goto } from "$app/navigation";
    import { t } from "$lib/i18n";
    import { onMount } from "svelte";
    import gsap from "gsap";

    let isMenuOpen = $state(false);

    // Element refs for GSAP animations
    let backdropEl: HTMLButtonElement | null = $state(null);
    let offcanvasEl: HTMLDivElement | null = $state(null);
    let menuItemsEl: HTMLDivElement | null = $state(null);

    // Admin navigation items
    const adminNavItems = [
        { href: "/admin", icon: LayoutDashboard, label: "admin.dashboard" },
        { href: "/admin/users", icon: Users, label: "admin.users" },
        { href: "/admin/bugs", icon: Bug, label: "admin.bug_reports" },
        { href: "/admin/reports", icon: Flag, label: "admin.post_reports" },
        { href: "/admin/user-reports", icon: UserX, label: "admin.user_reports" },
        { href: "/admin/invite", icon: Mail, label: "admin.invites" },
    ];

    function isActive(href: string): boolean {
        if (href === "/admin") {
            return $page.url.pathname === "/admin";
        }
        return $page.url.pathname.startsWith(href);
    }

    // GSAP animation for opening menu
    function openMenu() {
        document.body.style.overflow = "hidden";
        isMenuOpen = true;

        requestAnimationFrame(() => {
            const tl = gsap.timeline();

            if (backdropEl) {
                tl.fromTo(
                    backdropEl,
                    { opacity: 0 },
                    { opacity: 1, duration: 0.3, ease: "power2.out" },
                    0
                );
            }

            if (offcanvasEl) {
                tl.fromTo(
                    offcanvasEl,
                    { x: "100%" },
                    { x: "0%", duration: 0.4, ease: "power3.out" },
                    0.1
                );
            }

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
                document.body.style.overflow = "";
            }
        });

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

        if (offcanvasEl) {
            tl.to(offcanvasEl, {
                x: "100%",
                duration: 0.3,
                ease: "power3.in"
            }, 0.1);
        }

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
    }

    // Handle escape key to close menu
    function handleKeydown(e: KeyboardEvent) {
        if (e.key === "Escape" && isMenuOpen) {
            closeMenu();
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

<nav class="bg-gray-900 border-b border-gray-800 fixed w-full top-0 z-50 h-14">
    <div class="max-w-7xl mx-auto px-4 h-full flex items-center justify-between">
        <!-- Left: Back to site + Logo -->
        <div class="flex items-center gap-4">
            <a
                href="/"
                class="flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm"
            >
                <ArrowLeft class="w-4 h-4" />
                <span class="hidden sm:inline">{$t("admin.back_to_site")}</span>
            </a>
            <div class="h-6 w-px bg-gray-700 hidden sm:block"></div>
            <a href="/admin" class="flex items-center gap-2">
                <img src={logo} alt="AdoptMe" class="h-4 w-auto brightness-0 invert" />
                <span class="text-amber-500 font-bold text-sm">Admin</span>
            </a>
        </div>

        <!-- Right: Burger Menu Button -->
        <div class="flex items-center gap-3">
            <button
                onclick={toggleMenu}
                class="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
                aria-label="Toggle menu"
            >
                <Menu class="w-5 h-5" />
            </button>
        </div>
    </div>
</nav>

<!-- Offcanvas Menu -->
{#if isMenuOpen}
    <!-- Backdrop -->
    <button
        bind:this={backdropEl}
        onclick={closeMenu}
        class="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm cursor-default border-none"
        style="opacity: 0;"
        aria-label="Close menu"
        type="button"
    ></button>

    <!-- Offcanvas Panel -->
    <div
        bind:this={offcanvasEl}
        class="fixed top-0 right-0 z-[70] h-full w-[80%] max-w-xs bg-gray-900 shadow-2xl overflow-hidden"
        style="transform: translateX(100%);"
    >
        <!-- Header -->
        <div class="flex items-center justify-between p-4 border-b border-gray-800">
            <div class="flex items-center gap-2">
                <img src={logo} alt="AdoptMe" class="h-4 w-auto brightness-0 invert" />
                <span class="text-amber-500 font-bold text-sm">Admin</span>
            </div>
            <button
                onclick={closeMenu}
                class="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
                aria-label="Close menu"
            >
                <X class="w-5 h-5" />
            </button>
        </div>

        <!-- Menu Content -->
        <div bind:this={menuItemsEl} class="flex flex-col h-[calc(100%-65px)]">
            <!-- User info -->
            <div class="menu-item p-4 border-b border-gray-800">
                <div class="flex items-center gap-3">
                    {#if auth.user?.profilePicture}
                        <img
                            src={auth.user.profilePicture}
                            alt="Avatar"
                            class="w-10 h-10 rounded-full object-cover border-2 border-amber-500/30"
                        />
                    {:else}
                        <div class="w-10 h-10 bg-amber-500/20 text-amber-400 rounded-full flex items-center justify-center font-bold">
                            {auth.user?.firstName?.[0]?.toUpperCase() || '?'}
                        </div>
                    {/if}
                    <div>
                        <p class="text-white font-medium">{auth.user?.fullName}</p>
                        <p class="text-amber-500 text-xs font-medium">Administrator</p>
                    </div>
                </div>
            </div>

            <!-- Navigation -->
            <nav class="flex-1 p-4 space-y-1">
                {#each adminNavItems as item}
                    <a
                        href={item.href}
                        onclick={closeMenu}
                        class="menu-item flex items-center gap-3 px-4 py-3 rounded-xl text-base font-medium transition-colors {isActive(item.href)
                            ? 'bg-amber-500/20 text-amber-400'
                            : 'text-gray-300 hover:bg-gray-800 hover:text-white'}"
                    >
                        <item.icon class="w-5 h-5" />
                        {$t(item.label)}
                    </a>
                {/each}

                <div class="border-t border-gray-800 my-4"></div>

                <a
                    href="/"
                    onclick={closeMenu}
                    class="menu-item flex items-center gap-3 px-4 py-3 rounded-xl text-base font-medium text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
                >
                    <Home class="w-5 h-5" />
                    {$t("admin.back_to_site")}
                </a>
            </nav>

            <!-- Logout -->
            <div class="p-4 border-t border-gray-800">
                <button
                    onclick={() => {
                        auth.logout();
                        closeMenu();
                        goto("/");
                    }}
                    class="menu-item w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-base font-semibold text-red-400 bg-red-500/10 hover:bg-red-500/20 transition-colors"
                >
                    <LogOut class="w-5 h-5" />
                    {$t("nav.logout")}
                </button>
            </div>
        </div>
    </div>
{/if}

<!-- Spacer -->
<div class="h-14"></div>
