<script lang="ts">
    import { auth } from "$lib/stores/auth.svelte";
    import { toast } from "$lib/stores/toast.svelte";
    import { goto } from "$app/navigation";
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
        Image,
        ChevronLeft,
        Upload,
        Check,
        X,
    } from "lucide-svelte";
    // import tzlookup // Removed to avoid build issues

    let email = $state("");
    let password = $state("");
    let name = $state("");
    let error = $state("");
    let showPassword = $state(false);
    let isRegistering = $state(false);
    let isLoading = $state(false);
    let isSubmitting = $state(false);

    // Password Validation
    let passwordCriteria = $derived({
        length: password.length >= 8,
        upper: /[A-Z]/.test(password),
        lower: /[a-z]/.test(password),
        number: /[0-9]/.test(password),
        special: /[^A-Za-z0-9]/.test(password),
    });
    let canSubmit = $derived(() => {
        if (isLoading) return false;
        if (!isRegistering) {
            return !!email && !!password;
        }

        if (step === 1) {
            return (
                !!name &&
                !!email &&
                !!password &&
                Object.values(passwordCriteria).every(Boolean)
            );
        }
        if (step === 2) {
            return !!street && !!city && !!country;
        }
        return true;
    });

    // Multi-step Registration State
    let step = $state(1); // 1: Basic, 2: Address, 3: Profile/Timezone
    let searchQuery = $state("");
    let searchResults: any[] = $state([]);
    let isSearching = $state(false);
    let selectedAddress: any = $state(null);
    let searchTimeout: any;

    // Additional fields
    let profilePicture = $state("");
    let timezone = $state("UTC");
    let street = $state("");
    let city = $state("");
    let stateAddress = $state(""); // Renamed to avoid confusion with $state
    let zipCode = $state("");
    let country = $state("");
    let profileFile: File | null = null;

    // Redirect if already logged in
    $effect(() => {
        if (auth.user) goto("/");
    });

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
            // using Photon API (Komoot) which is free, based on OSM, and great for autocomplete
            const res = await fetch(
                `https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=5`,
            );
            const data = await res.json();
            searchResults = (data.features || []).map((feature: any) => {
                const p = feature.properties;
                // De-duplicate name and street if they are the same
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
        // Clear search immediately
        searchQuery = result.display_name;
        searchResults = [];

        // Photon returns GeoJSON
        selectedAddress = result;
        const props = result.properties;
        const geometry = result.geometry;

        street = props.street || props.name || "";
        city = props.city || props.town || props.village || props.hamlet || "";
        stateAddress = props.state || "";
        zipCode = props.postcode || "";
        country = props.country || "";

        // Auto-detect timezone from coordinates using free API to avoid build issues with libraries
        if (geometry && geometry.coordinates) {
            try {
                const [lon, lat] = geometry.coordinates;
                // Using timeapi.io public API
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
        // Create local preview
        profilePicture = URL.createObjectURL(profileFile);
    }

    function nextStep() {
        if (step === 1) {
            if (!name || !email || !password) {
                error = "Please fill in all fields";
                return;
            }
            // Validate password complexity
            if (!Object.values(passwordCriteria).every(Boolean)) {
                error = "Password does not meet all requirements";
                return;
            }
        }
        if (step === 2) {
            if (!street || !city || !country) {
                error = "Please select a valid address";
                return;
            }
        }
        error = "";
        step++;
    }

    function prevStep() {
        if (step > 1) step--;
    }

    async function handleSubmit() {
        error = "";
        isLoading = true;
        isSubmitting = true;

        try {
            if (isRegistering) {
                // 1. Create User (without profile picture)
                const registerMutation = `
          mutation CreateUser($email: String!, $name: String!, $password: String!, $address: AddressInput, $timezone: String) {
            createUser(email: $email, name: $name, password: $password, address: $address, timezone: $timezone) {
              id
            }
          }
        `;
                const res = await apiCall(registerMutation, {
                    email,
                    name,
                    password,
                    address: {
                        street,
                        city,
                        state: stateAddress,
                        zipCode,
                        country,
                    },
                    timezone,
                });
                if (res.errors) throw new Error(res.errors[0].message);
            }

            // 2. Login to get token
            const loginMutation = `
            mutation Login($email: String!, $password: String!) {
            login(email: $email, password: $password) {
                token
                user {
                name
                email
                profilePicture
                }
            }
            }
        `;

            const result = await apiCall(loginMutation, { email, password });
            if (result.errors) throw new Error(result.errors[0].message);

            const token = result.data.login.token;
            const user = result.data.login.user;

            // 3. Upload Profile Picture (if exists) using the new token
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

                    // 4. Update User with the new URL
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

            if (isRegistering) {
                toast.success(
                    `Welcome to AdoptMe, ${user.name}! Account created.`,
                );
            } else {
                toast.success(`Welcome back, ${user.name}!`);
            }

            await goto("/"); // Redirect to home
        } catch (e: any) {
            error = e.message;
        } finally {
            isLoading = false;
            isSubmitting = false;
        }
    }
</script>

<div class="min-h-screen grid grid-cols-1 md:grid-cols-2">
    <!-- Left Column: Art/Branding -->
    <div
        class="hidden md:flex flex-col justify-center items-center bg-indigo-600 text-white p-12 relative overflow-hidden"
    >
        <div
            class="absolute inset-0 opacity-70 bg-[url('https://media.king5.com/assets/KING/images/38a4d478-0066-4f52-8e96-7d4fc1209435/38a4d478-0066-4f52-8e96-7d4fc1209435_1920x1080.jpg')] bg-cover bg-center"
        ></div>
        <div class="relative z-10 text-center max-w-lg">
            <h1 class="text-5xl font-extrabold mb-6 tracking-tight">
                Welcome to AdoptMe
            </h1>
            <p class="text-xl opacity-90 leading-relaxed">
                Join a community of thousands of pet lovers. Find your new best
                friend or help one find a home today.
            </p>
        </div>
    </div>

    <!-- Right Column: Form -->
    <div class="flex items-center justify-center p-8 bg-white">
        <div class="w-full max-w-md space-y-8">
            <div class="text-center md:text-left">
                <h2 class="text-3xl font-bold text-gray-900">
                    {isRegistering ? "Create Account" : "Welcome Back"}
                </h2>
                <p class="mt-2 text-gray-500">
                    {isRegistering
                        ? "Already have an account?"
                        : "New to AdoptMe?"}
                    <button
                        class="text-indigo-600 font-semibold hover:underline bg-transparent border-none cursor-pointer"
                        onclick={() => (isRegistering = !isRegistering)}
                    >
                        {isRegistering ? "Log in" : "Sign up"}
                    </button>
                </p>
            </div>

            {#if error}
                <div
                    class="p-4 bg-red-50 text-red-600 rounded-lg text-sm font-medium border border-red-100 flex items-center"
                    role="alert"
                >
                    <svg
                        class="w-5 h-5 mr-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        ><path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        ></path></svg
                    >
                    <span class="flex-1">{error}</span>
                    <button
                        type="button"
                        class="ml-3 text-red-600 hover:text-red-700 p-1"
                        onclick={() => (error = "")}
                        aria-label="Dismiss error"
                    >
                        <X class="w-4 h-4" />
                    </button>
                </div>
            {/if}

            <form
                class="space-y-6"
                onsubmit={(e) => {
                    e.preventDefault();
                    if (!isLoading) {
                        if (!isRegistering) {
                            handleSubmit();
                        } else {
                            if (step === 3) handleSubmit();
                            else nextStep();
                        }
                    }
                }}
            >
                <div class="flex items-center justify-between text-xs text-gray-500">
                    <span>
                        {isRegistering
                            ? `Step ${step} of 3`
                            : "Sign in to continue"}
                    </span>
                    <span>
                        {isSubmitting
                            ? "Submitting..."
                            : isRegistering
                              ? "All fields required"
                              : "Use your email and password"}
                    </span>
                </div>

                {#if isRegistering}
                    <!-- Step Indicator -->
                    <div class="flex justify-between items-center mb-6 px-2">
                        {#each [1, 2, 3] as s}
                            <div class="flex flex-col items-center">
                                <div
                                    class={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                                        step >= s
                                            ? "bg-indigo-600 text-white"
                                            : "bg-gray-100 text-gray-400"
                                    }`}
                                >
                                    {s}
                                </div>
                                <span class="text-xs mt-1 text-gray-500"
                                    >{s === 1
                                        ? "Account"
                                        : s === 2
                                          ? "Address"
                                          : "Profile"}</span
                                >
                            </div>
                            {#if s < 3}
                                <div
                                    class={`h-0.5 w-16 transition-colors ${step > s ? "bg-indigo-600" : "bg-gray-100"}`}
                                ></div>
                            {/if}
                        {/each}
                    </div>

                    {#if step === 1}
                        <div>
                            <label
                                for="name"
                                class="block text-sm font-medium text-gray-700 mb-1"
                                >Full Name</label
                            >
                            <div class="relative">
                                <div
                                    class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400"
                                >
                                    <User class="h-5 w-5" />
                                </div>
                                <input
                                    id="name"
                                    type="text"
                                    bind:value={name}
                                    required
                                    class="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all duration-200"
                                    placeholder="John Doe"
                                />
                            </div>
                        </div>
                    {/if}

                    {#if step === 2}
                        <div>
                            <label
                                for="address-search"
                                class="block text-sm font-medium text-gray-700 mb-1"
                                >Search Address</label
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
                                    class="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all duration-200"
                                    placeholder="Search your address..."
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

                            <!-- Search Results -->
                            {#if searchResults.length > 0}
                                <div
                                    class="mt-2 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden z-10"
                                >
                                    {#each searchResults as result}
                                        <button
                                            type="button"
                                            class="w-full text-left px-4 py-3 hover:bg-indigo-50 text-sm text-gray-700 flex items-center gap-2 transition-colors border-b last:border-0 border-gray-50"
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

                            <!-- Selected Address Preview -->
                            {#if street || city || country}
                                <div
                                    class="mt-4 p-4 bg-indigo-50 rounded-xl border border-indigo-100"
                                >
                                    <h4
                                        class="text-xs font-semibold text-indigo-900 uppercase tracking-wider mb-2"
                                    >
                                        Selected Address
                                    </h4>
                                    <p class="text-sm text-indigo-700">
                                        {street}
                                    </p>
                                    <p class="text-sm text-indigo-700">
                                        {city}, {stateAddress}
                                        {zipCode}
                                    </p>
                                    <p class="text-sm text-indigo-700">
                                        {country}
                                    </p>
                                </div>
                            {/if}
                        </div>
                    {/if}

                    {#if step === 3}
                        <!-- Timezone is auto-detected and hidden from user -->
                        <div class="hidden">
                            <input type="hidden" bind:value={timezone} />
                        </div>

                        <div>
                            <label
                                for="profilePicture"
                                class="block text-sm font-medium text-gray-700 mb-1"
                                >Profile Picture</label
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
                                            class="w-full h-full rounded-full bg-gray-100 flex items-center justify-center border-2 border-dashed border-gray-300 group-hover:border-indigo-400 transition-colors"
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
                                    <p class="text-sm text-gray-500">
                                        Click to upload users avatar.
                                    </p>
                                    <p
                                        class="text-xs text-xs text-gray-400 mt-1"
                                    >
                                        JPG, PNG or GIF. Max 5MB.
                                    </p>
                                </div>
                            </div>
                        </div>
                    {/if}
                {/if}

                <!-- Email/Password fields for Step 1 (or Login mode) -->
                {#if !isRegistering || (isRegistering && step === 1)}
                    <div>
                        <label
                            for="email"
                            class="block text-sm font-medium text-gray-700 mb-1"
                            >Email Address</label
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
                                class="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all duration-200"
                                placeholder="you@example.com"
                            />
                        </div>
                    </div>

                    <div>
                        <label
                            for="password"
                            class="block text-sm font-medium text-gray-700 mb-1"
                            >Password</label
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
                                class="w-full pl-10 pr-12 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all duration-200"
                                placeholder="••••••••"
                            />
                            <button
                                type="button"
                                onclick={() => (showPassword = !showPassword)}
                                class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors bg-transparent border-none cursor-pointer p-1"
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
                                class="mt-3 p-3 bg-gray-50 rounded-xl space-y-2 text-xs"
                            >
                                <p class="font-semibold text-gray-500 mb-2">
                                    Password must contain:
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
                                    <span>At least 8 characters</span>
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
                                    <span>One uppercase letter</span>
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
                                    <span>One lowercase letter</span>
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
                                    <span>One number</span>
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
                                    <span>One special character</span>
                                </div>
                            </div>
                        {/if}
                    </div>
                {/if}

                <!-- Buttons -->
                <div class="flex gap-3">
                    {#if isRegistering && step > 1}
                        <button
                            type="button"
                            onclick={prevStep}
                            class="px-6 py-3.5 rounded-xl border border-gray-200 text-gray-600 font-semibold hover:bg-gray-50 transition-colors flex items-center gap-2"
                        >
                            <ChevronLeft class="w-5 h-5" />
                            Back
                        </button>
                    {/if}

                    <button
                        type="submit"
                        disabled={!canSubmit || isLoading}
                        class="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-70 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-indigo-200 flex justify-center items-center gap-2 group"
                    >
                        {#if isLoading}
                            <Loader2 class="w-5 h-5 animate-spin" />
                        {:else}
                            {isRegistering
                                ? step === 3
                                    ? "Complete Registration"
                                    : "Next Step"
                                : "Sign In"}
                            <ArrowRight
                                class="w-5 h-5 group-hover:translate-x-1 transition-transform"
                            />
                        {/if}
                    </button>
                </div>

                {#if !canSubmit && !isLoading}
                    <p class="text-xs text-gray-500">
                        Fill in the required fields to continue.
                    </p>
                {/if}
            </form>
        </div>
    </div>
</div>
