<script lang="ts">
    import { auth } from "$lib/stores/auth.svelte";
    import { goto } from "$app/navigation";
    import { onMount } from "svelte";
    import { fade, fly } from "svelte/transition";
    import {
        Plus,
        Trash2,
        Edit2,
        User,
        MapPin,
        Camera,
        Clock,
    } from "lucide-svelte";
    import AddPetModal from "$lib/components/AddPetModal.svelte";
    import { toast } from "$lib/stores/toast.svelte";

    let pets = $state<any[]>([]);
    let loadingPets = $state(true);
    let activeTab = $state("settings"); // 'pets' | 'settings' | 'favorites'
    let isSaving = $state(false);
    let isDirty = $state(false);

    // Form State
    let showAddModal = $state(false);

    // Profile Update State
    // Initialize from auth store immediately to prevent flashing
    let userAddress = $state({
        street: "",
        city: "",
        state: "",
        zipCode: "",
        country: "USA",
    });
    let userTimezone = $state("");
    let userProfilePicture = $state("");
    let userCoverImage = $state("");
    let userName = $state(auth.user?.name || "");
    let lastSavedProfile = $state({
        name: "",
        address: {
            street: "",
            city: "",
            state: "",
            zipCode: "",
            country: "USA",
        },
        timezone: "",
        profilePicture: "",
        coverImage: "",
    });

    let profileInput: HTMLInputElement;
    let coverInput: HTMLInputElement;

    // Sync if auth user changes and we haven't loaded from DB yet/overwritten
    $effect(() => {
        if (auth.user?.name && !userName) {
            userName = auth.user.name;
        }
    });

    function snapshotProfile() {
        lastSavedProfile = {
            name: userName,
            address: { ...userAddress },
            timezone: userTimezone,
            profilePicture: userProfilePicture,
            coverImage: userCoverImage,
        };
    }

    function resetProfile() {
        userName = lastSavedProfile.name;
        userAddress = { ...lastSavedProfile.address };
        userTimezone = lastSavedProfile.timezone;
        userProfilePicture = lastSavedProfile.profilePicture;
        userCoverImage = lastSavedProfile.coverImage;
    }

    function isProfileDifferent() {
        return (
            userName !== lastSavedProfile.name ||
            userTimezone !== lastSavedProfile.timezone ||
            userProfilePicture !== lastSavedProfile.profilePicture ||
            userCoverImage !== lastSavedProfile.coverImage ||
            userAddress.street !== lastSavedProfile.address.street ||
            userAddress.city !== lastSavedProfile.address.city ||
            userAddress.state !== lastSavedProfile.address.state ||
            userAddress.zipCode !== lastSavedProfile.address.zipCode ||
            userAddress.country !== lastSavedProfile.address.country
        );
    }

    $effect(() => {
        isDirty = isProfileDifferent();
    });

    let searchTimeout: any;
    let searchQuery = $state("");
    let searchResults: any[] = $state([]);
    let isSearching = $state(false);

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
        // Clear search immediately
        searchQuery = "";
        searchResults = [];

        const props = result.properties;
        const geometry = result.geometry;

        userAddress = {
            street: props.street || props.name || "",
            city:
                props.city || props.town || props.village || props.hamlet || "",
            state: props.state || "",
            zipCode: props.postcode || "",
            country: props.country || "USA",
        };

        if (geometry && geometry.coordinates) {
            try {
                const [lon, lat] = geometry.coordinates;
                const tzRes = await fetch(
                    `https://timeapi.io/api/TimeZone/coordinate?latitude=${lat}&longitude=${lon}`,
                );
                const tzData = await tzRes.json();
                if (tzData && tzData.timeZone) {
                    userTimezone = tzData.timeZone;
                }
            } catch (e) {
                console.error("Timezone lookup failed:", e);
                // Keep existing timezone or default to UTC if failing?
                // Best to leave it if API fails to avoid overriding with bad data
                if (!userTimezone) userTimezone = "UTC";
            }
        }
    }

    // Redirect if already logged in

    // Helper for API calls
    async function apiCall(query: string, variables: any = {}) {
        const response = await fetch("/api/graphql", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${auth.token}`,
            },
            body: JSON.stringify({ query, variables }),
        });
        return response.json();
    }

    async function fetchMyPets() {
        loadingPets = true;
        const query = `
      query GetMyPets {
        pets {
          id
          name
          species {
            label
          }
          customSpecies
          breed {
            label
          }
          customBreed
          coverImage
          owner {
            id
          }
        }
        me {
           name
           address {
             street
             city
             state
             zipCode
             country
           }
           timezone
           profilePicture
           coverImage
        }
      }
    `;

        try {
            const res = await apiCall(query);
            if (res.errors) throw new Error(res.errors[0].message);

            const allPets = res.data.pets;
            if (res.data.me) {
                // Update with fresh data from DB
                userName = res.data.me.name;
                if (res.data.me.address)
                    userAddress = { ...res.data.me.address };
                if (res.data.me.timezone) userTimezone = res.data.me.timezone;
                if (res.data.me.profilePicture)
                    userProfilePicture = res.data.me.profilePicture;
                if (res.data.me.coverImage)
                    userCoverImage = res.data.me.coverImage;
                snapshotProfile();

                // Client-side filter
                pets = allPets.filter(
                    (p: any) => p.owner && p.owner.id === auth.user?.id,
                );
            }
        } catch (e: any) {
            console.error(e.message);
        } finally {
            loadingPets = false;
        }
    }

    async function uploadFile(file: File): Promise<string> {
        const formData = new FormData();
        formData.append("file", file);

        const res = await fetch("/api/upload", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${auth.token}`,
            },
            body: formData,
        });

        if (!res.ok) throw new Error("Upload failed");
        const data = await res.json();
        return data.files[0];
    }

    async function handleProfileUpload(e: Event) {
        const input = e.target as HTMLInputElement;
        if (input.files && input.files.length > 0) {
            try {
                const url = await uploadFile(input.files[0]);
                userProfilePicture = url;
                await handleUpdateProfile();
            } catch (error) {
                toast.error(`Error uploading profile picture`);
            }
        }
    }

    async function handleCoverUpload(e: Event) {
        const input = e.target as HTMLInputElement;
        if (input.files && input.files.length > 0) {
            try {
                const url = await uploadFile(input.files[0]);
                userCoverImage = url;
                await handleUpdateProfile(); // Auto-save
            } catch (error) {
                toast.error("Error uploading cover image");
            }
        }
    }

    async function handleUpdateProfile() {
        try {
            isSaving = true;
            const mutation = `
            mutation UpdateUser($name: String, $address: AddressInput, $timezone: String, $profilePicture: String, $coverImage: String) {
                updateUser(name: $name, address: $address, timezone: $timezone, profilePicture: $profilePicture, coverImage: $coverImage) {
                    id
                    name
                    timezone
                    profilePicture
                    coverImage
                }
            }
          `;
            const res = await apiCall(mutation, {
                name: userName,
                address: userAddress,
                timezone: userTimezone,
                profilePicture: userProfilePicture,
                coverImage: userCoverImage,
            });
            if (res.errors) throw new Error(res.errors[0].message);
            // Ideally notify success with a toast
            // alert("Profile updated successfully!");
            snapshotProfile();
            toast.success("Profile updated successfully!");
        } catch (e: any) {
            // alert("Error updating profile: " + e.message);
            toast.error("Error updating profile: " + e.message);
        } finally {
            isSaving = false;
        }
    }

    onMount(fetchMyPets);
</script>

<div class="min-h-screen bg-gray-50 pb-20">
    <!-- Profile Header -->
    <div class="relative">
        <div class="relative h-56 md:h-72 lg:h-80">
            <div class="absolute inset-0 overflow-hidden">
                {#if userCoverImage}
                    <img
                        src={userCoverImage}
                        alt="Cover"
                        class="w-full h-full object-cover"
                    />
                    <div class="absolute inset-0 bg-black/10"></div>
                {:else}
                    <div
                        class="w-full h-full bg-gradient-to-r from-purple-600 to-indigo-600"
                    ></div>
                {/if}
                <!-- Edit Cover Button -->
                <button
                    class="absolute top-4 right-4 bg-black/30 hover:bg-black/50 text-white p-2 rounded-full backdrop-blur-sm transition-colors cursor-pointer"
                    onclick={() => coverInput.click()}
                    aria-label="Change Cover Photo"
                >
                    <Camera class="w-5 h-5" />
                </button>
                <input
                    type="file"
                    bind:this={coverInput}
                    onchange={handleCoverUpload}
                    hidden
                    accept="image/*"
                />
            </div>
        </div>

        <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="relative -mt-14 md:-mt-16">
                <div class="flex flex-col items-center sm:items-start">
                    <!-- Avatar -->
                    <div class="relative -mt-10 sm:-mt-12">
                        <div
                            class="group w-28 h-28 sm:w-32 sm:h-32 rounded-full border-4 border-white bg-white shadow-xl overflow-hidden flex items-center justify-center text-4xl font-bold text-indigo-600 cursor-pointer"
                            onclick={() => profileInput.click()}
                        >
                            {#if userProfilePicture}
                                <img
                                    src={userProfilePicture}
                                    alt={userName}
                                    class="w-full h-full object-cover"
                                />
                            {:else if auth.user?.name}
                                {auth.user.name.charAt(0).toUpperCase()}
                            {:else}
                                <User class="w-16 h-16 text-indigo-400" />
                            {/if}

                            <!-- Hover Overlay -->
                            <div
                                class="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                            >
                                <Camera class="text-white w-8 h-8" />
                            </div>
                        </div>
                        <input
                            type="file"
                            bind:this={profileInput}
                            onchange={handleProfileUpload}
                            hidden
                            accept="image/*"
                        />
                    </div>

                    <!-- User Info (no container) -->
                    <div class="mt-4 text-center sm:text-left">
                        <h1 class="text-2xl md:text-3xl font-bold text-gray-900">
                            {userName || "My Profile"}
                        </h1>
                        <p class="text-gray-500 font-medium">
                            {auth.user?.email}
                        </p>

                        <div class="mt-3 flex flex-wrap justify-center sm:justify-start gap-2">
                            <span
                                class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium bg-white border border-gray-100 shadow-sm"
                            >
                                <MapPin class="w-4 h-4 text-gray-500" />
                                {userAddress.city
                                    ? `${userAddress.city}, ${userAddress.state}`
                                    : "No location"}
                            </span>

                            <span
                                class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium bg-white border border-gray-100 shadow-sm"
                            >
                                <Clock class="w-4 h-4 text-gray-500" />
                                {userTimezone || "Timezone not set"}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>


    <!-- Main Content -->
    <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        <!-- Tabs Navigation -->
        <div class="flex justify-center border-b border-gray-200 mb-8">
            <nav class="-mb-px flex space-x-8" aria-label="Tabs">
                <button
                    onclick={() => (activeTab = "settings")}
                    class="{activeTab === 'settings'
                        ? 'border-indigo-500 text-indigo-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors"
                >
                    Profile
                </button>
                <button
                    onclick={() => (activeTab = "pets")}
                    class="{activeTab === 'pets'
                        ? 'border-indigo-500 text-indigo-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors"
                >
                    My Pets
                </button>
            </nav>
        </div>

        <!-- Tab Content -->

        <!-- Pets Tab -->
        {#if activeTab === "pets"}
            <div in:fade={{ duration: 200 }}>
                <div class="flex justify-between items-center mb-6">
                    <h2 class="text-xl font-bold text-gray-900">Manage Pets</h2>
                    <button
                        onclick={() => (showAddModal = true)}
                        class="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-full text-sm font-semibold shadow-md transition-all flex items-center gap-2 transform hover:scale-105 active:scale-95"
                    >
                        <Plus class="w-5 h-5" />
                        Add New Pet
                    </button>
                </div>

                {#if loadingPets}
                    <div class="flex justify-center py-12">
                        <div
                            class="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"
                        ></div>
                    </div>
                {:else if pets.length === 0}
                    <div
                        class="text-center py-16 bg-white rounded-2xl shadow-sm border border-dashed border-gray-300"
                    >
                        <div
                            class="mx-auto h-16 w-16 text-gray-400 mb-4 bg-gray-50 rounded-full flex items-center justify-center"
                        >
                            🐾
                        </div>
                        <h3 class="mt-2 text-sm font-medium text-gray-900">
                            No pets added
                        </h3>
                        <p class="mt-1 text-sm text-gray-500">
                            Get started by creating a listing for your furry
                            friend.
                        </p>
                        <div class="mt-6">
                            <button
                                onclick={() => (showAddModal = true)}
                                class="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none"
                            >
                                <Plus class="-ml-1 mr-2 h-5 w-5" />
                                Add Pet
                            </button>
                        </div>
                    </div>
                {:else}
                    <div
                        class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
                    >
                        {#each pets as pet}
                            <div
                                class="group bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-300 border border-gray-100 overflow-hidden"
                            >
                                <div
                                    class="relative h-48 bg-gray-200 overflow-hidden"
                                >
                                    {#if pet.coverImage}
                                        <img
                                            src={pet.coverImage}
                                            alt={pet.name}
                                            class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                        />
                                    {:else}
                                        <div
                                            class="w-full h-full flex items-center justify-center text-4xl bg-indigo-50 text-indigo-200"
                                        >
                                            🐾
                                        </div>
                                    {/if}
                                    <div class="absolute top-2 right-2">
                                        <span
                                            class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-white/90 text-gray-800 backdrop-blur-sm shadow-sm"
                                        >
                                            {pet.species?.label ||
                                                pet.customSpecies ||
                                                "Unknown"}
                                        </span>
                                    </div>
                                </div>
                                <div class="p-5">
                                    <h3
                                        class="text-lg font-bold text-gray-900 group-hover:text-indigo-600 transition-colors"
                                    >
                                        {pet.name}
                                    </h3>
                                    <p class="text-sm text-gray-500 mt-1">
                                        {pet.breed?.label ||
                                            pet.customBreed ||
                                            "Unknown breed"}
                                    </p>

                                    <div
                                        class="mt-4 flex justify-between items-center"
                                    >
                                        <button
                                            class="text-indigo-600 hover:text-indigo-800 text-sm font-medium flex items-center gap-1"
                                            aria-label="Edit pet details"
                                        >
                                            <Edit2 class="w-4 h-4" />
                                            Edit Details
                                        </button>
                                        <button
                                            class="text-gray-400 hover:text-red-500 transition-colors"
                                            aria-label="Delete pet"
                                        >
                                            <Trash2 class="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        {/each}
                    </div>
                {/if}
            </div>
        {/if}

        <!-- Settings Tab -->
        {#if activeTab === "settings"}
            <div in:fade={{ duration: 200 }} class="max-w-2xl mx-auto">
                <div
                    class="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden"
                >
                    <div class="p-6 md:p-8 space-y-8">
                        <!-- Personal Info -->
                        <div class="space-y-6">
                            <h2
                                class="text-xl font-bold text-gray-900 flex items-center gap-2"
                            >
                                <User class="w-5 h-5 text-indigo-500" />
                                Personal Information
                            </h2>
                            <div class="grid grid-cols-1 gap-y-6 gap-x-4">
                                <div>
                                    <label
                                        for="name"
                                        class="block text-sm font-medium text-gray-700 mb-1"
                                        >Display Name</label
                                    >
                                    <input
                                        type="text"
                                        id="name"
                                        bind:value={userName}
                                        class="block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 transition-shadow py-2.5 px-3 border"
                                        placeholder="Your name"
                                    />
                                </div>

                                <div>
                                    <label
                                        for="email"
                                        class="block text-sm font-medium text-gray-700 mb-1"
                                        >Email</label
                                    >
                                    <input
                                        type="email"
                                        id="email"
                                        value={auth.user?.email || ""}
                                        class="block w-full rounded-lg border-gray-200 bg-gray-50 text-gray-600 shadow-sm py-2.5 px-3 border cursor-not-allowed"
                                        readonly
                                    />
                                </div>

                                <div>
                                    <label
                                        for="timezone"
                                        class="block text-sm font-medium text-gray-700 mb-1"
                                        >Timezone</label
                                    >
                                    <input
                                        type="text"
                                        id="timezone"
                                        bind:value={userTimezone}
                                        class="block w-full rounded-lg border-gray-200 bg-gray-50 text-gray-600 shadow-sm py-2.5 px-3 border cursor-not-allowed"
                                        placeholder="Auto-set from location"
                                        readonly
                                    />
                                </div>

                                <!-- Hidden input kept to ensure value is submitted consistently -->
                                <input type="hidden" bind:value={userTimezone} />
                            </div>
                        </div>

                        <div class="border-t border-gray-100"></div>

                        <!-- Address -->
                        <div class="space-y-6">
                            <h2
                                class="text-xl font-bold text-gray-900 flex items-center gap-2"
                            >
                                <MapPin class="w-5 h-5 text-indigo-500" />
                                Location Details
                            </h2>
                            <div class="space-y-4">
                                <div>
                                    <label
                                        for="address-search"
                                        class="block text-sm font-medium text-gray-700 mb-1"
                                        >Search Address to Auto-fill</label
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
                                            class="block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 transition-shadow py-2.5 pl-10 pr-4 border"
                                            placeholder="Type to search..."
                                        />
                                        <!-- Search Results Dropdown -->
                                        {#if searchResults.length > 0}
                                            <div
                                                class="absolute z-10 w-full mt-1 bg-white rounded-md shadow-lg border border-gray-200"
                                            >
                                                {#each searchResults as result}
                                                    <button
                                                        type="button"
                                                        class="w-full text-left px-4 py-2 hover:bg-indigo-50 text-sm text-gray-700 flex items-center gap-2"
                                                        onclick={() =>
                                                            selectAddress(
                                                                result,
                                                            )}
                                                    >
                                                        <MapPin
                                                            class="w-4 h-4 text-gray-400"
                                                        />
                                                        <span class="truncate"
                                                            >{result.display_name}</span
                                                        >
                                                    </button>
                                                {/each}
                                            </div>
                                        {/if}
                                    </div>
                                </div>

                                <div>
                                    <label
                                        for="street"
                                        class="block text-sm font-medium text-gray-700 mb-1"
                                        >Street Address</label
                                    >
                                    <input
                                        type="text"
                                        id="street"
                                        bind:value={userAddress.street}
                                        class="block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 transition-shadow py-2.5 px-3 border"
                                    />
                                </div>
                                <div class="grid grid-cols-2 gap-4">
                                    <div>
                                        <label
                                            for="city"
                                            class="block text-sm font-medium text-gray-700 mb-1"
                                            >City</label
                                        >
                                        <input
                                            type="text"
                                            id="city"
                                            bind:value={userAddress.city}
                                            class="block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 transition-shadow py-2.5 px-3 border"
                                        />
                                    </div>
                                    <div>
                                        <label
                                            for="state"
                                            class="block text-sm font-medium text-gray-700 mb-1"
                                            >State / Province</label
                                        >
                                        <input
                                            type="text"
                                            id="state"
                                            bind:value={userAddress.state}
                                            class="block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 transition-shadow py-2.5 px-3 border"
                                        />
                                    </div>
                                </div>
                                <div class="grid grid-cols-2 gap-4">
                                    <div>
                                        <label
                                            for="zip"
                                            class="block text-sm font-medium text-gray-700 mb-1"
                                            >ZIP / Postal Code</label
                                        >
                                        <input
                                            type="text"
                                            id="zip"
                                            bind:value={userAddress.zipCode}
                                            class="block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 transition-shadow py-2.5 px-3 border"
                                        />
                                    </div>
                                    <div>
                                        <label
                                            for="country"
                                            class="block text-sm font-medium text-gray-700 mb-1"
                                            >Country</label
                                        >
                                        <input
                                            type="text"
                                            id="country"
                                            bind:value={userAddress.country}
                                            class="block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 transition-shadow py-2.5 px-3 border"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div
                        class="bg-gray-50 px-6 py-4 flex justify-end gap-3 border-t border-gray-200"
                    >
                        <div class="text-xs text-gray-500 flex items-center">
                            {#if isSaving}
                                Saving…
                            {:else if isDirty}
                                Unsaved changes
                            {:else}
                                All changes saved
                            {/if}
                        </div>
                        <button
                            onclick={resetProfile}
                            class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed"
                            disabled={!isDirty || isSaving}
                        >
                            Cancel
                        </button>
                        <button
                            onclick={handleUpdateProfile}
                            class="px-6 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-black focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 shadow-sm transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                            disabled={!isDirty || isSaving}
                        >
                            {isSaving ? "Saving..." : "Save Changes"}
                        </button>
                    </div>
                </div>
            </div>
        {/if}
    </div>
</div>

<!-- Add Pet Modal -->
<AddPetModal
    bind:open={showAddModal}
    onClose={() => (showAddModal = false)}
    onPetAdded={fetchMyPets}
/>
