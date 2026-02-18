<script lang="ts">
    import { auth } from "$lib/stores/auth.svelte";
    import { theme } from "$lib/stores/theme.svelte";
    import { toast } from "$lib/stores/toast.svelte";
    import { getCountryFlag } from "$lib/utils/countryFlag";
    import { goto } from "$app/navigation";
    import { locale, t } from "$lib/i18n";
    import SEO from "$lib/components/SEO.svelte";
    import { onMount } from "svelte";
    import gsap from "gsap";
    import {
        Mail,
        Lock,
        User,
        Eye,
        EyeOff,
        Loader2,
        ArrowRight,
        MapPin,
        Globe,
        ChevronLeft,
        ChevronDown,
        Home,
        Upload,
        Check,
        X,
        Dog,
        Cat,
        Bird,
        Rabbit,
        Fish,
        Heart,
        PawPrint,
        Search,
        KeyRound,
    } from "lucide-svelte";

    let email = $state("");
    let password = $state("");
    let firstName = $state("");
    let lastName = $state("");
    let secondLastName = $state("");
    let showPassword = $state(false);
    let isRegistering = $state(false);
    let isForgotPassword = $state(false);
    let forgotPasswordSent = $state(false);
    let devResetUrl = $state("");
    let isLoading = $state(false);
    let isSubmitting = $state(false);

    // Carousel state
    let loginImages = $state<{ id: string; url: string; alt: string }[]>([]);
    let currentImageIndex = $state(0);
    let isLoadingImages = $state(true);
    let carouselInterval: ReturnType<typeof setInterval> | null = null;

    // GSAP refs
    let formContainerRef: HTMLDivElement;
    let carouselRef: HTMLDivElement;
    let imageRefs: HTMLDivElement[] = [];

    // Password Validation
    let passwordCriteria = $derived({
        length: password.length >= 8,
        upper: /[A-Z]/.test(password),
        lower: /[a-z]/.test(password),
        number: /[0-9]/.test(password),
        special: /[^A-Za-z0-9]/.test(password),
    });
    let canSubmit = $derived.by(() => {
        if (isLoading) return false;
        if (!isRegistering) {
            // Login only requires email and password
            return !!email && !!password;
        }

        if (step === 1) {
            return (
                !!firstName &&
                !!lastName &&
                !!email &&
                !!password &&
                Object.values(passwordCriteria).every(Boolean) &&
                agreedToTerms
            );
        }
        if (step === 2) {
            return !!street && !!city && !!country;
        }
        if (step === 3) {
            return true;
        }
        if (step === 4) {
            return true;
        }
        return true;
    });

    // Multi-step Registration State
    let step = $state(1);
    let searchQuery = $state("");
    let searchResults: any[] = $state([]);
    let isSearching = $state(false);
    let selectedAddress: any = $state(null);
    let searchTimeout: any;

    // Species preferences
    let speciesList = $state<any[]>([]);
    let selectedSpecies = $state<string[]>([]);
    let showAllSpecies = $state(true);
    let isLoadingSpecies = $state(false);

    // Countries for address
    let countriesList = $state<any[]>([]);
    let selectedCountryObj = $state<any>(null);
    let isLoadingCountries = $state(false);
    let showCountryDropdown = $state(false);
    let countrySearchQuery = $state("");

    // Additional fields
    let profilePicture = $state("");
    let timezone = $state("UTC");
    let street = $state("");
    let city = $state("");
    let stateAddress = $state("");
    let zipCode = $state("");
    let country = $state("");
    let language = $state("en");
    let profileFile: File | null = null;
    let agreedToTerms = $state(false);

    // Redirect if already logged in
    $effect(() => {
        if (auth.user) goto("/");
    });

    // Close country dropdown on outside click
    $effect(() => {
        if (showCountryDropdown) {
            const handler = (e: MouseEvent) => handleCountryClickOutside(e);
            document.addEventListener("click", handler);
            return () => document.removeEventListener("click", handler);
        }
    });

    // Fetch login images on mount
    onMount(async () => {
        // Initial animations
        if (formContainerRef) {
            gsap.fromTo(
                formContainerRef,
                { opacity: 0, x: 30 },
                { opacity: 1, x: 0, duration: 0.6, ease: "power2.out" }
            );
        }

        // Fetch login images for carousel
        await fetchLoginImages();

        // Start carousel
        startCarousel();

        return () => {
            if (carouselInterval) clearInterval(carouselInterval);
        };
    });

    async function fetchLoginImages() {
        isLoadingImages = true;
        try {
            const result = await apiCall(`query { loginImages { id url alt } }`);
            if (result.data?.loginImages && result.data.loginImages.length > 0) {
                loginImages = result.data.loginImages;
            } else {
                // Fallback to default images if none in DB
                loginImages = [
                    { id: "1", url: "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=1920&q=80", alt: "Happy golden retriever" },
                    { id: "2", url: "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=1920&q=80", alt: "Cute orange cat" },
                    { id: "3", url: "https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=1920&q=80", alt: "Adorable dalmatian puppy" },
                ];
            }
        } catch (e) {
            console.error("Failed to fetch login images:", e);
            // Use fallback images
            loginImages = [
                { id: "1", url: "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=1920&q=80", alt: "Happy golden retriever" },
            ];
        } finally {
            isLoadingImages = false;
        }
    }

    function startCarousel() {
        if (loginImages.length <= 1) return;

        carouselInterval = setInterval(() => {
            nextImage();
        }, 5000); // Change image every 5 seconds
    }

    function nextImage() {
        const nextIndex = (currentImageIndex + 1) % loginImages.length;
        animateImageTransition(nextIndex);
    }

    function animateImageTransition(newIndex: number) {
        if (!carouselRef) return;

        // Animate out current image
        const currentImage = carouselRef.querySelector('.carousel-image.active');
        const nextImage = carouselRef.querySelectorAll('.carousel-image')[newIndex];

        if (currentImage && nextImage) {
            gsap.to(currentImage, {
                opacity: 0,
                scale: 1.1,
                duration: 1,
                ease: "power2.inOut",
            });

            gsap.fromTo(
                nextImage,
                { opacity: 0, scale: 1.05 },
                { opacity: 1, scale: 1, duration: 1, ease: "power2.inOut" }
            );
        }

        currentImageIndex = newIndex;
    }

    async function apiCall(query: string, variables: any = {}, token?: string) {
        const headers: any = { "Content-Type": "application/json" };
        if (token) headers["Authorization"] = `Bearer ${token}`;

        const response = await fetch("/api/graphql", {
            method: "POST",
            headers,
            body: JSON.stringify({ query, variables }),
        });
        return response.json();
    }

    function handleSearchInput(value: string) {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            searchAddress(value);
        }, 500);
    }

    async function searchAddress(query: string) {
        if (!query || query.length < 3) return;
        isSearching = true;
        try {
            const res = await fetch(
                `https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=5`,
            );
            const data = await res.json();
            searchResults = (data.features || []).map((feature: any) => {
                const p = feature.properties;
                const name = p.name;
                const street = p.street;
                const city = p.city || p.town || p.village || p.hamlet;

                const parts = [
                    name,
                    street && street !== name ? street : null,
                    p.housenumber,
                    city,
                    p.state,
                    p.postcode,
                    p.country,
                ].filter(Boolean);

                return {
                    ...feature,
                    display_name: parts.join(", "),
                };
            });
        } catch (e) {
            console.error(e);
        } finally {
            isSearching = false;
        }
    }

    async function selectAddress(result: any) {
        searchQuery = result.display_name;
        searchResults = [];

        selectedAddress = result;
        const props = result.properties;
        const geometry = result.geometry;

        street = props.street || props.name || "";
        city = props.city || props.town || props.village || props.hamlet || "";
        stateAddress = props.state || "";
        zipCode = props.postcode || "";

        const photonCountry = props.country || "";
        const matchedCountry = matchCountryFromName(photonCountry);
        if (matchedCountry) {
            selectedCountryObj = matchedCountry;
            country = matchedCountry.name;
        } else {
            country = photonCountry;
            selectedCountryObj = null;
        }

        if (geometry && geometry.coordinates) {
            try {
                const [lon, lat] = geometry.coordinates;
                const tzRes = await fetch(
                    `https://timeapi.io/api/TimeZone/coordinate?latitude=${lat}&longitude=${lon}`,
                );
                const tzData = await tzRes.json();
                if (tzData && tzData.timeZone) {
                    timezone = tzData.timeZone;
                }
            } catch (e) {
                console.error("Timezone lookup failed:", e);
                timezone = "UTC";
            }
        }
    }

    async function handleFileUpload(e: Event) {
        const input = e.target as HTMLInputElement;
        if (!input.files || input.files.length === 0) return;

        profileFile = input.files[0];
        profilePicture = URL.createObjectURL(profileFile);
    }

    async function fetchSpecies() {
        if (speciesList.length > 0) return;
        isLoadingSpecies = true;
        try {
            const result = await apiCall(`query { species { id name label } }`);
            if (result.data?.species) {
                speciesList = result.data.species;
            }
        } catch (e) {
            console.error("Failed to fetch species:", e);
        } finally {
            isLoadingSpecies = false;
        }
    }

    async function fetchCountries() {
        if (countriesList.length > 0) return;
        isLoadingCountries = true;
        try {
            const result = await apiCall(
                `query { countries { id name alpha2 phoneCode flag } }`,
            );
            if (result.data?.countries) {
                countriesList = result.data.countries;
            }
        } catch (e) {
            console.error("Failed to fetch countries:", e);
        } finally {
            isLoadingCountries = false;
        }
    }

    let filteredCountries = $derived(
        countrySearchQuery
            ? countriesList.filter(
                  (c) =>
                      c.name
                          .toLowerCase()
                          .includes(countrySearchQuery.toLowerCase()) ||
                      c.alpha2
                          .toLowerCase()
                          .includes(countrySearchQuery.toLowerCase()),
              )
            : countriesList,
    );

    function matchCountryFromName(countryName: string) {
        if (!countryName || countriesList.length === 0) return null;
        const normalized = countryName.toLowerCase().trim();
        return countriesList.find(
            (c) =>
                c.name.toLowerCase() === normalized ||
                c.alpha2.toLowerCase() === normalized,
        );
    }

    function selectCountryFromList(countryObj: any) {
        selectedCountryObj = countryObj;
        country = countryObj.name;
        showCountryDropdown = false;
        countrySearchQuery = "";
    }

    let countryDropdownRef: HTMLDivElement;

    function handleCountryClickOutside(event: MouseEvent) {
        if (
            countryDropdownRef &&
            !countryDropdownRef.contains(event.target as Node)
        ) {
            showCountryDropdown = false;
            countrySearchQuery = "";
        }
    }

    function toggleShowAll() {
        showAllSpecies = true;
        selectedSpecies = [];
    }

    function toggleSpeciesSelection(speciesId: string) {
        showAllSpecies = false;

        if (selectedSpecies.includes(speciesId)) {
            selectedSpecies = selectedSpecies.filter((id) => id !== speciesId);
            if (selectedSpecies.length === 0) {
                showAllSpecies = true;
            }
        } else {
            selectedSpecies = [...selectedSpecies, speciesId];
        }
    }

    function isSpeciesSelected(speciesId: string): boolean {
        return selectedSpecies.includes(speciesId);
    }

    function nextStep() {
        if (step === 1) {
            if (!firstName || !lastName || !email || !password) {
                toast.error($t("auth.fill_required"));
                return;
            }
            if (!Object.values(passwordCriteria).every(Boolean)) {
                toast.error($t("auth.password_requirements"));
                return;
            }
            fetchCountries();
        }
        if (step === 2) {
            if (!street || !city || !country) {
                toast.error($t("auth.address_required") || "Please select a valid address");
                return;
            }
        }
        if (step === 3) {
            fetchSpecies();
        }

        // Animate step transition
        if (formContainerRef) {
            gsap.fromTo(
                formContainerRef.querySelector('.step-content'),
                { opacity: 0, x: 20 },
                { opacity: 1, x: 0, duration: 0.3, ease: "power2.out" }
            );
        }

        step++;
    }

    function prevStep() {
        if (step > 1) {
            // Animate step transition
            if (formContainerRef) {
                gsap.fromTo(
                    formContainerRef.querySelector('.step-content'),
                    { opacity: 0, x: -20 },
                    { opacity: 1, x: 0, duration: 0.3, ease: "power2.out" }
                );
            }
            step--;
        }
    }

    async function handleSubmit() {
        isLoading = true;
        isSubmitting = true;

        try {
            if (isRegistering) {
                const registerMutation = `
          mutation CreateUser($email: String!, $firstName: String!, $lastName: String!, $secondLastName: String, $password: String!, $address: AddressInput, $timezone: String, $preferredSpecies: [ID!], $language: String) {
            createUser(email: $email, firstName: $firstName, lastName: $lastName, secondLastName: $secondLastName, password: $password, address: $address, timezone: $timezone, preferredSpecies: $preferredSpecies, language: $language) {
              id
            }
          }
        `;
                const res = await apiCall(registerMutation, {
                    email,
                    firstName,
                    lastName,
                    secondLastName: secondLastName || null,
                    password,
                    address: {
                        street,
                        city,
                        state: stateAddress,
                        zipCode,
                        country,
                    },
                    timezone,
                    preferredSpecies: showAllSpecies ? [] : selectedSpecies,
                    language,
                });
                if (res.errors) throw new Error(res.errors[0].message);
            }

            const loginMutation = `
            mutation Login($email: String!, $password: String!) {
            login(email: $email, password: $password) {
                token
                user {
                id
                firstName
                lastName
                secondLastName
                fullName
                email
                profilePicture
                language
                theme
                phone
                phoneCountryCode
                phoneVerified
                emailVerified
                isAdmin
                }
            }
            }
        `;

            const result = await apiCall(loginMutation, { email, password });
            if (result.errors) throw new Error(result.errors[0].message);

            const token = result.data.login.token;
            const user = result.data.login.user;

            if (isRegistering && profileFile) {
                const formData = new FormData();
                formData.append("file", profileFile);

                const upRes = await fetch("/api/upload", {
                    method: "POST",
                    body: formData,
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });
                const upData = await upRes.json();

                if (upData.files && upData.files.length > 0) {
                    const pictureUrl = upData.files[0];

                    const updateMutation = `
                        mutation UpdateUser($profilePicture: String!) {
                            updateUser(profilePicture: $profilePicture) {
                                id
                                profilePicture
                            }
                        }
                    `;
                    await apiCall(
                        updateMutation,
                        { profilePicture: pictureUrl },
                        token,
                    );

                    user.profilePicture = pictureUrl;
                }
            }

            auth.login(token, user);

            if (user.language) {
                locale.set(user.language);
            }

            if (user.theme) {
                theme.loadFromUser(user.theme);
            }

            if (isRegistering) {
                toast.success(
                    $t("auth.success_created", {
                        values: { name: user.fullName },
                    }),
                );
            } else {
                toast.success(
                    $t("auth.success_back", {
                        values: { name: user.fullName },
                    }),
                );
            }

            await goto("/");
        } catch (e: any) {
            toast.error(e.message);
        } finally {
            isLoading = false;
            isSubmitting = false;
        }
    }

    async function handleForgotPassword() {
        if (!email) {
            toast.error($t("forgot_password.enter_email"));
            return;
        }

        isLoading = true;

        try {
            const result = await apiCall(
                `mutation RequestPasswordReset($email: String!) {
                    requestPasswordReset(email: $email)
                }`,
                { email }
            );

            if (result.data?.requestPasswordReset) {
                devResetUrl = result.data.requestPasswordReset;
                forgotPasswordSent = true;
                return;
            }
        } catch (e: any) {
            console.error("Password reset request:", e.message);
        } finally {
            isLoading = false;
        }

        toast.success($t("forgot_password.email_sent_desc", { values: { email } }));
        resetForgotPassword();
    }

    function resetForgotPassword() {
        isForgotPassword = false;
        forgotPasswordSent = false;
        devResetUrl = "";
        email = "";
    }
</script>

<SEO
    title="Login or Sign Up"
    description="Join AdoptMe to find your perfect pet companion. Create an account or sign in to browse pets for adoption, post listings, and connect with animal lovers."
    keywords="login, sign up, register, pet adoption account, adoptme login"
    noindex={false}
/>

<div
    class="min-h-screen grid grid-cols-1 md:grid-cols-2 bg-white dark:bg-gray-900 transition-colors"
>
    <!-- Left Column: Image Carousel -->
    <div
        bind:this={carouselRef}
        class="hidden md:flex flex-col justify-center items-center bg-indigo-600 text-white relative overflow-hidden"
    >
        <!-- Skeleton loader while images load -->
        {#if isLoadingImages}
            <div class="absolute inset-0 bg-gradient-to-br from-indigo-500 to-purple-600 animate-pulse">
                <div class="absolute inset-0 flex items-center justify-center">
                    <div class="text-center">
                        <Loader2 class="w-12 h-12 animate-spin mx-auto mb-4 text-white/50" />
                        <div class="h-8 w-48 bg-white/20 rounded-lg mx-auto mb-4"></div>
                        <div class="h-4 w-64 bg-white/10 rounded mx-auto"></div>
                    </div>
                </div>
            </div>
        {:else}
            <!-- Carousel Images -->
            {#each loginImages as image, index}
                <div
                    class="carousel-image absolute inset-0 bg-cover bg-center transition-opacity duration-1000 {index === currentImageIndex ? 'active opacity-100' : 'opacity-0'}"
                    style="background-image: url('{image.url}')"
                >
                    <div class="absolute inset-0 bg-gradient-to-t from-indigo-900/80 via-indigo-800/40 to-transparent"></div>
                </div>
            {/each}

            <!-- Carousel Indicators -->
            {#if loginImages.length > 1}
                <div class="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2 z-20">
                    {#each loginImages as _, index}
                        <button
                            type="button"
                            class="w-2 h-2 rounded-full transition-all duration-300 {index === currentImageIndex ? 'bg-white w-6' : 'bg-white/50 hover:bg-white/70'}"
                            onclick={() => animateImageTransition(index)}
                            aria-label="Go to image {index + 1}"
                        ></button>
                    {/each}
                </div>
            {/if}
        {/if}

        <!-- Content Overlay -->
        <div class="relative z-10 text-center max-w-lg p-12">
            <h1 class="text-5xl font-extrabold mb-6 tracking-tight drop-shadow-lg">
                {$t("auth.welcome")}
            </h1>
            <p class="text-xl opacity-90 leading-relaxed drop-shadow-md">
                {$t("auth.subtitle")}
            </p>
        </div>
    </div>

    <!-- Right Column: Form -->
    <div
        bind:this={formContainerRef}
        class="flex items-center justify-center p-8 bg-white dark:bg-gray-900 relative transition-colors"
    >
        <!-- Back to Home Button -->
        <a
            href="/"
            class="absolute top-6 left-6 flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors group"
        >
            <Home class="w-4 h-4" />
            <span class="hidden sm:inline">{$t("nav.home") || "Home"}</span>
        </a>

        <div class="w-full max-w-md space-y-8">
            {#if isForgotPassword}
                <!-- Forgot Password Header -->
                <div class="text-center md:text-left">
                    {#if forgotPasswordSent && devResetUrl}
                        <div class="flex flex-col items-center md:items-start">
                            <div class="w-16 h-16 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center mb-4">
                                <KeyRound class="w-8 h-8 text-amber-600 dark:text-amber-400" />
                            </div>
                            <h2 class="text-3xl font-bold text-gray-900 dark:text-white">
                                {$t("forgot_password.dev_mode_title")}
                            </h2>
                            <p class="mt-2 text-gray-500 dark:text-gray-400">
                                {$t("forgot_password.dev_mode_desc")}
                            </p>
                        </div>
                    {:else}
                        <div class="flex flex-col items-center md:items-start">
                            <div class="w-16 h-16 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center mb-4">
                                <KeyRound class="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
                            </div>
                            <h2 class="text-3xl font-bold text-gray-900 dark:text-white">
                                {$t("forgot_password.title")}
                            </h2>
                            <p class="mt-2 text-gray-500 dark:text-gray-400">
                                {$t("forgot_password.subtitle")}
                            </p>
                        </div>
                    {/if}
                </div>
            {:else}
                <div class="text-center md:text-left">
                    <h2 class="text-3xl font-bold text-gray-900 dark:text-white">
                        {isRegistering
                            ? $t("auth.create_account")
                            : $t("auth.welcome_back")}
                    </h2>
                    <p class="mt-2 text-gray-500 dark:text-gray-400">
                        {isRegistering
                            ? $t("auth.already_have_account")
                            : $t("auth.new_to_adoptme")}
                        <button
                            class="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline bg-transparent border-none cursor-pointer"
                            onclick={() => (isRegistering = !isRegistering)}
                        >
                            {isRegistering ? $t("auth.login") : $t("auth.signup")}
                        </button>
                    </p>
                </div>
            {/if}

            {#if isForgotPassword}
                <!-- Forgot Password Form -->
                {#if forgotPasswordSent && devResetUrl}
                    <div class="space-y-6">
                        <div class="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl">
                            <p class="text-sm font-semibold text-amber-800 dark:text-amber-300 mb-2">
                                {$t("forgot_password.dev_mode_title")}
                            </p>
                            <p class="text-xs text-amber-700 dark:text-amber-400 mb-3">
                                {$t("forgot_password.dev_mode_desc")}
                            </p>
                            <p class="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                                {$t("forgot_password.reset_link")}:
                            </p>
                            <a
                                href={devResetUrl}
                                class="text-xs text-indigo-600 dark:text-indigo-400 break-all hover:underline block mb-3"
                            >
                                {devResetUrl}
                            </a>
                            <a
                                href={devResetUrl}
                                class="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg transition-colors"
                            >
                                <KeyRound class="w-4 h-4" />
                                {$t("forgot_password.go_to_reset")}
                            </a>
                        </div>

                        <button
                            type="button"
                            onclick={resetForgotPassword}
                            class="w-full px-4 py-3 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors"
                        >
                            {$t("forgot_password.back_to_login")}
                        </button>
                    </div>
                {:else}
                    <form
                        class="space-y-6"
                        onsubmit={(e) => {
                            e.preventDefault();
                            handleForgotPassword();
                        }}
                    >
                        <div>
                            <label
                                for="forgot-email"
                                class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                            >
                                {$t("auth.email")}
                            </label>
                            <div class="relative">
                                <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                    <Mail class="h-5 w-5" />
                                </div>
                                <input
                                    id="forgot-email"
                                    type="email"
                                    bind:value={email}
                                    required
                                    class="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:bg-white dark:focus:bg-gray-700 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all duration-200"
                                    placeholder="you@example.com"
                                    disabled={isLoading}
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading || !email}
                            class="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-70 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-indigo-200 dark:shadow-indigo-900/30 flex justify-center items-center gap-2"
                        >
                            {#if isLoading}
                                <Loader2 class="w-5 h-5 animate-spin" />
                                {$t("forgot_password.sending")}
                            {:else}
                                <Mail class="w-5 h-5" />
                                {$t("forgot_password.send_link")}
                            {/if}
                        </button>

                        <p class="text-center text-sm text-gray-500 dark:text-gray-400">
                            {$t("forgot_password.remember_password")}
                            <button
                                type="button"
                                onclick={resetForgotPassword}
                                class="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline bg-transparent border-none cursor-pointer ml-1"
                            >
                                {$t("forgot_password.sign_in")}
                            </button>
                        </p>
                    </form>
                {/if}
            {:else}
                <form
                    class="space-y-6"
                    onsubmit={(e) => {
                        e.preventDefault();
                        if (!isLoading) {
                            if (!isRegistering) {
                                handleSubmit();
                            } else {
                                if (step === 4) handleSubmit();
                                else nextStep();
                            }
                        }
                    }}
                >
                    <div
                        class="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400"
                    >
                        <span>
                            {isRegistering
                                ? `${$t("auth.step")} ${step} of 4`
                                : $t("auth.signin_continue")}
                        </span>
                        <span>
                            {isSubmitting
                                ? $t("auth.submitting")
                                : isRegistering
                                  ? $t("auth.all_fields_required")
                                  : $t("auth.use_email_password")}
                        </span>
                    </div>

                    <div class="step-content">
                    {#if isRegistering}
                    <!-- Step Indicator -->
                    <div class="mb-6 px-2">
                        <div class="flex justify-between items-start gap-1">
                            {#each [1, 2, 3, 4] as s}
                                <div class="flex flex-col items-center flex-1">
                                    <div
                                        class={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-200 mb-1.5 border-2 ${
                                            step > s
                                                ? "bg-indigo-600 text-white border-indigo-600"
                                                : step === s
                                                  ? "bg-indigo-600 text-white border-indigo-600 ring-4 ring-indigo-50 dark:ring-indigo-900/50"
                                                  : "bg-white dark:bg-gray-800 text-gray-400 border-gray-200 dark:border-gray-600"
                                        }`}
                                    >
                                        {#if step > s}
                                            <Check class="w-4 h-4" />
                                        {:else}
                                            {s}
                                        {/if}
                                    </div>
                                    <span
                                        class={`text-[11px] font-medium text-center leading-tight px-1 ${
                                            step >= s
                                                ? "text-indigo-600 dark:text-indigo-400"
                                                : "text-gray-400"
                                        }`}
                                    >
                                        {s === 1
                                            ? $t("auth.account")
                                            : s === 2
                                              ? $t("auth.address")
                                              : s === 3
                                                ? $t("auth.profile")
                                                : $t("auth.pets")}
                                    </span>
                                    <div
                                        class="w-full h-1 bg-gray-100 dark:bg-gray-700 rounded-full mt-2 overflow-hidden"
                                    >
                                        <div
                                            class={`h-full rounded-full transition-all duration-300 ease-out ${
                                                step > s
                                                    ? "bg-indigo-600 w-full"
                                                    : step === s
                                                      ? "bg-indigo-400 w-1/2"
                                                      : "w-0"
                                            }`}
                                        ></div>
                                    </div>
                                </div>
                            {/each}
                        </div>
                    </div>

                    {#if step === 1}
                        <div class="space-y-4">
                            <div>
                                <label
                                    for="firstName"
                                    class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                                    >{$t("auth.first_name")}
                                    <span class="text-red-500">*</span></label
                                >
                                <div class="relative">
                                    <div
                                        class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400"
                                    >
                                        <User class="h-5 w-5" />
                                    </div>
                                    <input
                                        id="firstName"
                                        type="text"
                                        bind:value={firstName}
                                        required
                                        class="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:bg-white dark:focus:bg-gray-700 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all duration-200"
                                        placeholder={$t(
                                            "auth.first_name_placeholder",
                                        )}
                                    />
                                </div>
                            </div>

                            <div class="grid grid-cols-2 gap-3">
                                <div>
                                    <label
                                        for="lastName"
                                        class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                                        >{$t("auth.last_name")}
                                        <span class="text-red-500">*</span
                                        ></label
                                    >
                                    <input
                                        id="lastName"
                                        type="text"
                                        bind:value={lastName}
                                        required
                                        class="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:bg-white dark:focus:bg-gray-700 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all duration-200"
                                        placeholder={$t(
                                            "auth.last_name_placeholder",
                                        )}
                                    />
                                </div>
                                <div>
                                    <label
                                        for="secondLastName"
                                        class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                                        >{$t("auth.second_last_name")}</label
                                    >
                                    <input
                                        id="secondLastName"
                                        type="text"
                                        bind:value={secondLastName}
                                        class="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:bg-white dark:focus:bg-gray-700 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all duration-200"
                                        placeholder={$t(
                                            "auth.second_last_name_placeholder",
                                        )}
                                    />
                                </div>
                            </div>
                        </div>
                    {/if}

                    {#if step === 2}
                        <div class="space-y-4">
                            <div>
                                <label
                                    for="address-search"
                                    class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                                    >{$t("auth.search_address")}</label
                                >
                                <div class="relative">
                                    <div
                                        class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400"
                                    >
                                        <MapPin class="h-5 w-5" />
                                    </div>
                                    <input
                                        id="address-search"
                                        type="text"
                                        bind:value={searchQuery}
                                        oninput={(e) =>
                                            handleSearchInput(
                                                e.currentTarget.value,
                                            )}
                                        class="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:bg-white dark:focus:bg-gray-700 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all duration-200"
                                        placeholder={$t(
                                            "auth.search_address_placeholder",
                                        )}
                                    />
                                    {#if isSearching}
                                        <div
                                            class="absolute right-3 top-1/2 -translate-y-1/2"
                                        >
                                            <Loader2
                                                class="w-4 h-4 text-indigo-500 animate-spin"
                                            />
                                        </div>
                                    {/if}
                                </div>

                                {#if searchResults.length > 0}
                                    <div
                                        class="mt-2 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden z-10"
                                    >
                                        {#each searchResults as result}
                                            <button
                                                type="button"
                                                class="w-full text-left px-4 py-3 hover:bg-indigo-50 dark:hover:bg-gray-700 text-sm text-gray-700 dark:text-gray-300 flex items-center gap-2 transition-colors border-b last:border-0 border-gray-50 dark:border-gray-700"
                                                onclick={() =>
                                                    selectAddress(result)}
                                            >
                                                <MapPin
                                                    class="w-4 h-4 text-gray-400 shrink-0"
                                                />
                                                <span class="truncate"
                                                    >{result.display_name}</span
                                                >
                                            </button>
                                        {/each}
                                    </div>
                                {/if}
                            </div>

                            <!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
                            <div
                                bind:this={countryDropdownRef}
                                onclick={(e) => e.stopPropagation()}
                            >
                                <label
                                    for="country-select"
                                    class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                                    >{$t("auth.country") || "Country"}</label
                                >
                                <div class="relative">
                                    <button
                                        type="button"
                                        onclick={() =>
                                            (showCountryDropdown =
                                                !showCountryDropdown)}
                                        class="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 hover:bg-white dark:hover:bg-gray-700 focus:bg-white dark:focus:bg-gray-700 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all duration-200 text-left"
                                    >
                                        {#if selectedCountryObj}
                                            <span class="text-xl"
                                                >{getCountryFlag(
                                                    selectedCountryObj.flag,
                                                    selectedCountryObj.alpha2,
                                                )}</span
                                            >
                                            <span
                                                class="flex-1 text-gray-900 dark:text-white"
                                                >{selectedCountryObj.name}</span
                                            >
                                        {:else if country}
                                            <Globe
                                                class="w-5 h-5 text-gray-400"
                                            />
                                            <span
                                                class="flex-1 text-gray-900 dark:text-white"
                                                >{country}</span
                                            >
                                        {:else}
                                            <Globe
                                                class="w-5 h-5 text-gray-400"
                                            />
                                            <span class="flex-1 text-gray-400"
                                                >{$t("auth.select_country") ||
                                                    "Select a country"}</span
                                            >
                                        {/if}
                                        <ChevronDown
                                            class="w-5 h-5 text-gray-400"
                                        />
                                    </button>

                                    {#if showCountryDropdown}
                                        <div
                                            class="absolute z-50 mt-2 w-full bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden"
                                        >
                                            <div
                                                class="p-2 border-b border-gray-100 dark:border-gray-700"
                                            >
                                                <div class="relative">
                                                    <Search
                                                        class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
                                                    />
                                                    <input
                                                        type="text"
                                                        bind:value={
                                                            countrySearchQuery
                                                        }
                                                        placeholder={$t(
                                                            "common.search",
                                                        ) || "Search..."}
                                                        class="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                                                    />
                                                </div>
                                            </div>
                                            <div
                                                class="max-h-48 overflow-y-auto"
                                            >
                                                {#if isLoadingCountries}
                                                    <div
                                                        class="p-4 text-center"
                                                    >
                                                        <Loader2
                                                            class="w-5 h-5 animate-spin text-indigo-600 mx-auto"
                                                        />
                                                    </div>
                                                {:else if filteredCountries.length === 0}
                                                    <div
                                                        class="p-4 text-center text-sm text-gray-500 dark:text-gray-400"
                                                    >
                                                        {$t(
                                                            "common.no_results",
                                                        ) || "No results found"}
                                                    </div>
                                                {:else}
                                                    {#each filteredCountries as c}
                                                        <button
                                                            type="button"
                                                            onclick={() =>
                                                                selectCountryFromList(
                                                                    c,
                                                                )}
                                                            class="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-indigo-50 dark:hover:bg-gray-700 transition-colors text-left
                                                                {selectedCountryObj?.alpha2 ===
                                                            c.alpha2
                                                                ? 'bg-indigo-50 dark:bg-indigo-900/30'
                                                                : ''}"
                                                        >
                                                            <span
                                                                class="text-xl"
                                                                >{getCountryFlag(
                                                                    c.flag,
                                                                    c.alpha2,
                                                                )}</span
                                                            >
                                                            <span
                                                                class="flex-1 text-sm font-medium text-gray-900 dark:text-white truncate"
                                                                >{c.name}</span
                                                            >
                                                        </button>
                                                    {/each}
                                                {/if}
                                            </div>
                                        </div>
                                    {/if}
                                </div>
                            </div>

                            {#if street || city || country}
                                <div
                                    class="p-4 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl border border-indigo-100 dark:border-indigo-800"
                                >
                                    <h4
                                        class="text-xs font-semibold text-indigo-900 dark:text-indigo-300 uppercase tracking-wider mb-2"
                                    >
                                        {$t("auth.selected_address")}
                                    </h4>
                                    <div class="space-y-1">
                                        {#if street}
                                            <p
                                                class="text-sm text-indigo-700 dark:text-indigo-300"
                                            >
                                                {street}
                                            </p>
                                        {/if}
                                        <p
                                            class="text-sm text-indigo-700 dark:text-indigo-300"
                                        >
                                            {city}{stateAddress
                                                ? `, ${stateAddress}`
                                                : ""}
                                            {zipCode}
                                        </p>
                                        {#if country}
                                            <p
                                                class="text-sm text-indigo-700 dark:text-indigo-300 flex items-center gap-2"
                                            >
                                                {#if selectedCountryObj}
                                                    <span class="text-base"
                                                        >{getCountryFlag(
                                                            selectedCountryObj.flag,
                                                            selectedCountryObj.alpha2,
                                                        )}</span
                                                    >
                                                {/if}
                                                {country}
                                            </p>
                                        {/if}
                                    </div>
                                </div>
                            {/if}
                        </div>
                    {/if}

                    {#if step === 3}
                        <div class="hidden">
                            <input type="hidden" bind:value={timezone} />
                        </div>

                        <div>
                            <label
                                for="profilePicture"
                                class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                                >{$t("auth.profile_picture")}</label
                            >
                            <div class="mt-1 flex items-center gap-4">
                                <div
                                    class="relative group cursor-pointer w-20 h-20 shrink-0"
                                >
                                    {#if profilePicture}
                                        <img
                                            src={profilePicture}
                                            alt="Avatar Preview"
                                            class="w-full h-full rounded-full object-cover border-4 border-white shadow-md bg-gray-100"
                                        />
                                    {:else}
                                        <div
                                            class="w-full h-full rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-600 group-hover:border-indigo-400 transition-colors"
                                        >
                                            <Upload
                                                class="w-8 h-8 text-gray-400 group-hover:text-indigo-500 transition-colors"
                                            />
                                        </div>
                                    {/if}

                                    <input
                                        id="profilePicture"
                                        type="file"
                                        accept="image/*"
                                        onchange={handleFileUpload}
                                        class="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                    />
                                    {#if isLoading}
                                        <div
                                            class="absolute inset-0 bg-white/80 flex items-center justify-center rounded-full"
                                        >
                                            <Loader2
                                                class="w-6 h-6 animate-spin text-indigo-600"
                                            />
                                        </div>
                                    {/if}
                                </div>
                                <div class="flex-1">
                                    <p
                                        class="text-sm text-gray-500 dark:text-gray-400"
                                    >
                                        {$t("auth.upload_avatar_text")}
                                    </p>
                                    <p
                                        class="text-xs text-gray-400 dark:text-gray-500 mt-1"
                                    >
                                        {$t("auth.upload_avatar_hint")}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div class="mt-6">
                            <label
                                class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                                >{$t("auth.language")}</label
                            >
                            <div class="grid grid-cols-2 gap-3">
                                <button
                                    type="button"
                                    class={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${
                                        language === "en"
                                            ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300"
                                            : "border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-500"
                                    }`}
                                    onclick={() => {
                                        language = "en";
                                        locale.set("en");
                                    }}
                                >
                                    <img
                                        src="/usa.svg"
                                        alt="English"
                                        class="w-6 h-6 rounded-full object-cover shadow-sm"
                                    />
                                    <span class="font-medium">English</span>
                                    {#if language === "en"}
                                        <Check class="w-4 h-4 ml-auto" />
                                    {/if}
                                </button>
                                <button
                                    type="button"
                                    class={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${
                                        language === "es"
                                            ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300"
                                            : "border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-500"
                                    }`}
                                    onclick={() => {
                                        language = "es";
                                        locale.set("es");
                                    }}
                                >
                                    <img
                                        src="/mx.svg"
                                        alt="Espanol"
                                        class="w-6 h-6 rounded-full object-cover shadow-sm"
                                    />
                                    <span class="font-medium">Espanol</span>
                                    {#if language === "es"}
                                        <Check class="w-4 h-4 ml-auto" />
                                    {/if}
                                </button>
                            </div>
                        </div>
                    {/if}

                    {#if step === 4}
                        <div>
                            <div class="text-center mb-4">
                                <div
                                    class="inline-flex items-center justify-center w-16 h-16 bg-indigo-100 dark:bg-indigo-900/30 rounded-full mb-3"
                                >
                                    <Heart
                                        class="w-8 h-8 text-indigo-600 dark:text-indigo-400"
                                    />
                                </div>
                                <h3
                                    class="text-lg font-semibold text-gray-900 dark:text-white"
                                >
                                    {$t("auth.what_pets_love")}
                                </h3>
                                <p
                                    class="text-sm text-gray-500 dark:text-gray-400 mt-1"
                                >
                                    {$t("auth.select_animals_interest")}
                                </p>
                            </div>

                            {#if isLoadingSpecies}
                                <div class="flex justify-center py-8">
                                    <Loader2
                                        class="w-8 h-8 animate-spin text-indigo-600"
                                    />
                                </div>
                            {:else}
                                <div class="grid grid-cols-2 gap-3">
                                    <button
                                        type="button"
                                        onclick={toggleShowAll}
                                        class={`relative flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                                            showAllSpecies
                                                ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 shadow-md"
                                                : "border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-500 hover:shadow-sm"
                                        }`}
                                    >
                                        {#if showAllSpecies}
                                            <div class="absolute top-2 right-2">
                                                <Check
                                                    class="w-5 h-5 text-indigo-600 dark:text-indigo-400"
                                                />
                                            </div>
                                        {/if}
                                        <div
                                            class={`w-12 h-12 rounded-full flex items-center justify-center ${
                                                showAllSpecies
                                                    ? "bg-indigo-200 dark:bg-indigo-800"
                                                    : "bg-gray-100 dark:bg-gray-700"
                                            }`}
                                        >
                                            <Heart
                                                class={`w-6 h-6 ${showAllSpecies ? "text-indigo-700 dark:text-indigo-300" : "text-gray-500"}`}
                                            />
                                        </div>
                                        <span
                                            class={`font-medium text-sm ${
                                                showAllSpecies
                                                    ? "text-indigo-700 dark:text-indigo-300"
                                                    : "text-gray-700 dark:text-gray-300"
                                            }`}
                                        >
                                            {$t("auth.all_pets") || "All Pets"}
                                        </span>
                                    </button>

                                    {#each speciesList as species}
                                        <button
                                            type="button"
                                            onclick={() =>
                                                toggleSpeciesSelection(
                                                    species.id,
                                                )}
                                            class={`relative flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                                                isSpeciesSelected(species.id)
                                                    ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 shadow-md"
                                                    : "border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-500 hover:shadow-sm"
                                            }`}
                                        >
                                            {#if isSpeciesSelected(species.id)}
                                                <div
                                                    class="absolute top-2 right-2"
                                                >
                                                    <Check
                                                        class="w-5 h-5 text-indigo-600"
                                                    />
                                                </div>
                                            {/if}
                                            <div
                                                class={`w-12 h-12 rounded-full flex items-center justify-center ${
                                                    isSpeciesSelected(
                                                        species.id,
                                                    )
                                                        ? "bg-indigo-200 dark:bg-indigo-800"
                                                        : "bg-gray-100 dark:bg-gray-700"
                                                }`}
                                            >
                                                {#if species.name === "dog"}
                                                    <Dog
                                                        class={`w-6 h-6 ${isSpeciesSelected(species.id) ? "text-indigo-700 dark:text-indigo-300" : "text-gray-500"}`}
                                                    />
                                                {:else if species.name === "cat"}
                                                    <Cat
                                                        class={`w-6 h-6 ${isSpeciesSelected(species.id) ? "text-indigo-700 dark:text-indigo-300" : "text-gray-500"}`}
                                                    />
                                                {:else if species.name === "bird"}
                                                    <Bird
                                                        class={`w-6 h-6 ${isSpeciesSelected(species.id) ? "text-indigo-700 dark:text-indigo-300" : "text-gray-500"}`}
                                                    />
                                                {:else if species.name === "rabbit"}
                                                    <Rabbit
                                                        class={`w-6 h-6 ${isSpeciesSelected(species.id) ? "text-indigo-700 dark:text-indigo-300" : "text-gray-500"}`}
                                                    />
                                                {:else if species.name === "fish"}
                                                    <Fish
                                                        class={`w-6 h-6 ${isSpeciesSelected(species.id) ? "text-indigo-700 dark:text-indigo-300" : "text-gray-500"}`}
                                                    />
                                                {:else}
                                                    <PawPrint
                                                        class={`w-6 h-6 ${isSpeciesSelected(species.id) ? "text-indigo-700 dark:text-indigo-300" : "text-gray-500"}`}
                                                    />
                                                {/if}
                                            </div>
                                            <span
                                                class={`font-medium text-sm ${
                                                    isSpeciesSelected(
                                                        species.id,
                                                    )
                                                        ? "text-indigo-700 dark:text-indigo-300"
                                                        : "text-gray-700 dark:text-gray-300"
                                                }`}
                                            >
                                                {species.label}
                                            </span>
                                        </button>
                                    {/each}
                                </div>

                                <p
                                    class="text-center text-sm mt-4 font-medium {showAllSpecies
                                        ? 'text-indigo-600 dark:text-indigo-400'
                                        : selectedSpecies.length > 0
                                          ? 'text-indigo-600 dark:text-indigo-400'
                                          : 'text-gray-400'}"
                                >
                                    {#if showAllSpecies}
                                        {$t("auth.all_pets_selected") ||
                                            "You'll see all pets in your feed"}
                                    {:else if selectedSpecies.length > 0}
                                        {selectedSpecies.length}
                                        {$t("auth.species_selected") ||
                                            "selected"}
                                    {:else}
                                        {$t("auth.select_preference") ||
                                            "Select your preference"}
                                    {/if}
                                </p>
                            {/if}
                        </div>
                    {/if}
                {/if}

                {#if !isRegistering || (isRegistering && step === 1)}
                    <div>
                        <label
                            for="email"
                            class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                            >{$t("auth.email")}</label
                        >
                        <div class="relative">
                            <div
                                class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400"
                            >
                                <Mail class="h-5 w-5" />
                            </div>
                            <input
                                id="email"
                                type="email"
                                bind:value={email}
                                required
                                class="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:bg-white dark:focus:bg-gray-700 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all duration-200"
                                placeholder="you@example.com"
                            />
                        </div>
                    </div>

                    <div>
                        <label
                            for="password"
                            class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                            >{$t("auth.password")}</label
                        >
                        <div class="relative">
                            <div
                                class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400"
                            >
                                <Lock class="h-5 w-5" />
                            </div>
                            <input
                                id="password"
                                type={showPassword ? "text" : "password"}
                                bind:value={password}
                                required
                                class="w-full pl-10 pr-12 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:bg-white dark:focus:bg-gray-700 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all duration-200"
                                placeholder="********"
                            />
                            <button
                                type="button"
                                onclick={() => (showPassword = !showPassword)}
                                class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors bg-transparent border-none cursor-pointer p-1"
                            >
                                {#if showPassword}
                                    <EyeOff class="h-5 w-5" />
                                {:else}
                                    <Eye class="h-5 w-5" />
                                {/if}
                            </button>
                        </div>

                        {#if isRegistering}
                            <div
                                class="mt-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-xl space-y-2 text-xs"
                            >
                                <p
                                    class="font-semibold text-gray-500 dark:text-gray-400 mb-2"
                                >
                                    {$t("auth.password_requirements")}
                                </p>

                                <div
                                    class="flex items-center gap-2 {passwordCriteria.length
                                        ? 'text-green-600'
                                        : 'text-gray-400'}"
                                >
                                    {#if passwordCriteria.length}<Check
                                            class="w-3 h-3"
                                        />{:else}<div
                                            class="w-3 h-3 rounded-full border border-gray-300"
                                        ></div>{/if}
                                    <span>{$t("auth.req_length")}</span>
                                </div>
                                <div
                                    class="flex items-center gap-2 {passwordCriteria.upper
                                        ? 'text-green-600'
                                        : 'text-gray-400'}"
                                >
                                    {#if passwordCriteria.upper}<Check
                                            class="w-3 h-3"
                                        />{:else}<div
                                            class="w-3 h-3 rounded-full border border-gray-300"
                                        ></div>{/if}
                                    <span>{$t("auth.req_upper")}</span>
                                </div>
                                <div
                                    class="flex items-center gap-2 {passwordCriteria.lower
                                        ? 'text-green-600'
                                        : 'text-gray-400'}"
                                >
                                    {#if passwordCriteria.lower}<Check
                                            class="w-3 h-3"
                                        />{:else}<div
                                            class="w-3 h-3 rounded-full border border-gray-300"
                                        ></div>{/if}
                                    <span>{$t("auth.req_lower")}</span>
                                </div>
                                <div
                                    class="flex items-center gap-2 {passwordCriteria.number
                                        ? 'text-green-600'
                                        : 'text-gray-400'}"
                                >
                                    {#if passwordCriteria.number}<Check
                                            class="w-3 h-3"
                                        />{:else}<div
                                            class="w-3 h-3 rounded-full border border-gray-300"
                                        ></div>{/if}
                                    <span>{$t("auth.req_number")}</span>
                                </div>
                                <div
                                    class="flex items-center gap-2 {passwordCriteria.special
                                        ? 'text-green-600'
                                        : 'text-gray-400'}"
                                >
                                    {#if passwordCriteria.special}<Check
                                            class="w-3 h-3"
                                        />{:else}<div
                                            class="w-3 h-3 rounded-full border border-gray-300"
                                        ></div>{/if}
                                    <span>{$t("auth.req_special")}</span>
                                </div>
                            </div>
                        {:else}
                            <div class="mt-2 text-right">
                                <button
                                    type="button"
                                    onclick={() => (isForgotPassword = true)}
                                    class="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors bg-transparent border-none cursor-pointer"
                                >
                                    {$t("auth.forgot_password")}
                                </button>
                            </div>
                        {/if}

                        <!-- Terms Agreement Checkbox - only visible during registration -->
                        {#if isRegistering}
                            <div class="mt-4 p-4 rounded-xl border-2 transition-all duration-200 {agreedToTerms
                                ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-500'
                                : 'bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700'}">
                                <label class="flex items-start gap-3 cursor-pointer select-none">
                                    <div class="relative flex items-center justify-center shrink-0">
                                        <input
                                            type="checkbox"
                                            bind:checked={agreedToTerms}
                                            class="peer sr-only"
                                        />
                                        <div class="w-6 h-6 rounded-lg border-2 transition-all duration-200 flex items-center justify-center {agreedToTerms
                                            ? 'bg-indigo-600 border-indigo-600'
                                            : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-500 hover:border-indigo-400'}">
                                            {#if agreedToTerms}
                                                <Check class="w-4 h-4 text-white" />
                                            {/if}
                                        </div>
                                    </div>
                                    <span class="text-sm leading-relaxed {agreedToTerms ? 'text-indigo-900 dark:text-indigo-200' : 'text-gray-600 dark:text-gray-300'}">
                                        {$t("auth.agree_terms")}
                                        <a href="/terms" target="_blank" class="text-indigo-600 dark:text-indigo-400 hover:underline font-semibold">{$t("auth.terms_of_service")}</a>
                                        {$t("auth.and")}
                                        <a href="/privacy" target="_blank" class="text-indigo-600 dark:text-indigo-400 hover:underline font-semibold">{$t("auth.privacy_policy")}</a>
                                    </span>
                                </label>
                            </div>
                        {/if}
                    </div>
                {/if}
                </div>

                <div class="flex gap-3">
                    {#if isRegistering && step > 1}
                        <button
                            type="button"
                            onclick={prevStep}
                            class="px-6 py-3.5 rounded-xl border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 font-semibold hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors flex items-center gap-2"
                        >
                            <ChevronLeft class="w-5 h-5" />
                            {$t("auth.back")}
                        </button>
                    {/if}

                    <button
                        type="submit"
                        disabled={!canSubmit || isLoading}
                        class="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-70 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-indigo-200 dark:shadow-indigo-900/30 flex justify-center items-center gap-2 group"
                    >
                        {#if isLoading}
                            <Loader2 class="w-5 h-5 animate-spin" />
                        {:else}
                            {isRegistering
                                ? step === 4
                                    ? $t("auth.complete_registration")
                                    : $t("auth.next_step")
                                : $t("nav.signin")}
                            <ArrowRight
                                class="w-5 h-5 group-hover:translate-x-1 transition-transform"
                            />
                        {/if}
                    </button>
                </div>

                {#if !canSubmit && !isLoading}
                    <p class="text-xs text-gray-500 dark:text-gray-400">
                        {$t("auth.fill_required")}
                    </p>
                {/if}
            </form>
            {/if}
        </div>
    </div>
</div>
