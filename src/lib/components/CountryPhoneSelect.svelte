<script lang="ts">
    import { ChevronDown, Search, X } from "lucide-svelte";
    import { _ } from "svelte-i18n";
    import { fly, fade } from "svelte/transition";
    import { cubicOut } from "svelte/easing";
    import { onMount, onDestroy, tick } from "svelte";
    import IMask from "imask";

    interface Country {
        id: string;
        name: string;
        alpha2: string;
        phoneCode: string;
        flag: string;
    }

    let {
        countries = [],
        selectedCountry = $bindable<Country | null>(null),
        phoneNumber = $bindable(""),
        placeholder = "",
        disabled = false,
    }: {
        countries: Country[];
        selectedCountry?: Country | null;
        phoneNumber?: string;
        placeholder?: string;
        disabled?: boolean;
    } = $props();

    let isOpen = $state(false);
    let searchQuery = $state("");
    let containerRef: HTMLDivElement | undefined = $state();
    let dropdownRef: HTMLDivElement | undefined = $state();
    let buttonRef: HTMLButtonElement | undefined = $state();
    let inputRef: HTMLInputElement | undefined = $state();
    let maskInstance: ReturnType<typeof IMask> | null = null;

    // Dropdown positioning state
    let openDirection = $state<"up" | "down">("down");

    const DROPDOWN_HEIGHT = 280;

    function calculateDropdownPosition() {
        if (!buttonRef) return;

        const buttonRect = buttonRef.getBoundingClientRect();
        const viewportHeight = window.innerHeight;

        // Calculate available space above and below
        const spaceAbove = buttonRect.top;
        const spaceBelow = viewportHeight - buttonRect.bottom;

        // Determine direction: prefer down if enough space or more space below
        if (spaceBelow >= DROPDOWN_HEIGHT || spaceBelow > spaceAbove) {
            openDirection = "down";
        } else {
            openDirection = "up";
        }
    }

    // Phone mask patterns based on country
    // Default pattern works for most countries
    const getPhoneMask = (countryCode: string): string => {
        const masks: Record<string, string> = {
            US: "(000) 000-0000",
            CA: "(000) 000-0000",
            MX: "(00) 0000-0000",
            GB: "0000 000 0000",
            DE: "000 00000000",
            FR: "0 00 00 00 00",
            ES: "000 00 00 00",
            IT: "000 000 0000",
            BR: "(00) 00000-0000",
            AR: "(00) 0000-0000",
            AU: "0000 000 000",
            JP: "00-0000-0000",
            CN: "000 0000 0000",
            IN: "00000-00000",
            RU: "(000) 000-00-00",
        };
        return masks[countryCode] || "000 000 0000"; // Default pattern
    };

    // Initialize mask
    function initMask() {
        if (!inputRef) return;

        // Destroy existing mask if any
        if (maskInstance) {
            maskInstance.destroy();
        }

        const pattern = selectedCountry
            ? getPhoneMask(selectedCountry.alpha2)
            : "000 000 0000";

        maskInstance = IMask(inputRef, {
            mask: pattern,
            lazy: true, // Don't show placeholder until user starts typing
        });

        // Sync mask value with phoneNumber
        maskInstance.on("accept", () => {
            phoneNumber = maskInstance?.unmaskedValue || "";
        });

        // If there's already a value, update the mask
        if (phoneNumber) {
            maskInstance.unmaskedValue = phoneNumber;
        }
    }

    // Update mask when country changes
    $effect(() => {
        if (selectedCountry && inputRef) {
            initMask();
        }
    });

    onMount(() => {
        if (inputRef) {
            initMask();
        }
    });

    onDestroy(() => {
        if (maskInstance) {
            maskInstance.destroy();
        }
    });

    // Filter countries based on search
    let filteredCountries = $derived(
        searchQuery
            ? countries.filter(
                  (c) =>
                      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      c.phoneCode.includes(searchQuery) ||
                      c.alpha2.toLowerCase().includes(searchQuery.toLowerCase())
              )
            : countries
    );

    function selectCountry(country: Country) {
        selectedCountry = country;
        isOpen = false;
        searchQuery = "";
        // Focus the phone input after selection and reinitialize mask
        setTimeout(() => {
            inputRef?.focus();
        }, 100);
    }

    function handleClickOutside(event: MouseEvent) {
        const target = event.target as Node;
        // Check if click is outside both container and dropdown (since dropdown is fixed)
        const isOutsideContainer = containerRef && !containerRef.contains(target);
        const isOutsideDropdown = dropdownRef && !dropdownRef.contains(target);

        if (isOutsideContainer && isOutsideDropdown) {
            isOpen = false;
            searchQuery = "";
        }
    }

    async function toggleDropdown() {
        if (disabled) return;
        isOpen = !isOpen;
        if (isOpen) {
            searchQuery = "";
            // Wait for DOM to update, then calculate position
            await tick();
            calculateDropdownPosition();
        }
    }

    // Recalculate on scroll/resize
    function handleScrollOrResize() {
        if (isOpen) {
            calculateDropdownPosition();
        }
    }
</script>

<svelte:window onclick={handleClickOutside} onscroll={handleScrollOrResize} onresize={handleScrollOrResize} />

<div class="relative" bind:this={containerRef}>
    <div class="flex">
        <!-- Country Selector Button -->
        <button
            type="button"
            bind:this={buttonRef}
            onclick={toggleDropdown}
            {disabled}
            class="flex items-center gap-2 px-3 py-2.5 border border-r-0 border-gray-300 dark:border-gray-600 rounded-l-lg bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
            {#if selectedCountry}
                <span class="text-sm font-semibold text-gray-700 dark:text-gray-300">
                    {selectedCountry.alpha2}
                </span>
                <span class="text-sm text-gray-600 dark:text-gray-400">
                    +{selectedCountry.phoneCode}
                </span>
            {:else}
                <span class="text-sm text-gray-500 dark:text-gray-400">--</span>
                <span class="text-sm text-gray-500 dark:text-gray-400">+--</span>
            {/if}
            <ChevronDown class="w-4 h-4 text-gray-400 dark:text-gray-500" />
        </button>

        <!-- Phone Number Input (masked with IMask) -->
        <input
            type="tel"
            bind:this={inputRef}
            placeholder={placeholder || (selectedCountry ? getPhoneMask(selectedCountry.alpha2).replace(/0/g, "_") : "___-___-____")}
            {disabled}
            class="flex-1 px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-r-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:cursor-not-allowed"
        />
    </div>

    <!-- Dropdown (absolute positioning) -->
    {#if isOpen}
        <div
            bind:this={dropdownRef}
            class="absolute left-0 right-0 z-[100] bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-600 overflow-hidden {openDirection === 'up' ? 'bottom-full mb-1' : 'top-full mt-1'}"
            in:fly={{ y: openDirection === "up" ? 10 : -10, duration: 200, easing: cubicOut }}
            out:fade={{ duration: 150 }}
        >
            <!-- Search Input -->
            <div class="p-2 border-b border-gray-100 dark:border-gray-700">
                <div class="relative">
                    <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
                    <input
                        type="text"
                        bind:value={searchQuery}
                        placeholder={$_("common.search") || "Search..."}
                        class="w-full pl-9 pr-8 py-2 text-sm border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                    />
                    {#if searchQuery}
                        <button
                            type="button"
                            onclick={() => (searchQuery = "")}
                            class="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 dark:hover:bg-gray-600 rounded"
                        >
                            <X class="w-3 h-3 text-gray-400 dark:text-gray-500" />
                        </button>
                    {/if}
                </div>
            </div>

            <!-- Countries List -->
            <div class="max-h-60 overflow-y-auto">
                {#if filteredCountries.length === 0}
                    <div class="p-4 text-center text-sm text-gray-500 dark:text-gray-400">
                        {$_("common.no_results") || "No results found"}
                    </div>
                {:else}
                    {#each filteredCountries as country}
                        <button
                            type="button"
                            onclick={() => selectCountry(country)}
                            class="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-indigo-50 dark:hover:bg-gray-700 transition-colors text-left
                                {selectedCountry?.alpha2 === country.alpha2 ? 'bg-indigo-50 dark:bg-indigo-900/30' : ''}"
                        >
                            <span class="w-8 h-6 flex items-center justify-center bg-gray-100 dark:bg-gray-700 rounded text-xs font-bold text-gray-600 dark:text-gray-300">
                                {country.alpha2}
                            </span>
                            <div class="flex-1 min-w-0">
                                <p class="text-sm font-medium text-gray-900 dark:text-white truncate">
                                    {country.name}
                                </p>
                            </div>
                            <span class="text-sm text-indigo-600 dark:text-indigo-400 font-medium tabular-nums">
                                +{country.phoneCode}
                            </span>
                        </button>
                    {/each}
                {/if}
            </div>
        </div>
    {/if}
</div>
