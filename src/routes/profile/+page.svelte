<script lang="ts">
    import { auth } from "$lib/stores/auth.svelte";
    import { theme } from "$lib/stores/theme.svelte";
    import { goto } from "$app/navigation";
    import { page } from "$app/stores";
    import { onMount } from "svelte";
    import { fade, fly } from "svelte/transition";
    import gsap from "gsap";
    import SEO from "$lib/components/SEO.svelte";
    import {
        Plus,
        Trash2,
        Edit2,
        User,
        MapPin,
        Camera,
        Clock,
        FileText,
        AlertTriangle,
        Settings,
        Mail,
        Phone,
        Sun,
        Moon,
        Monitor,
        Shield,
        Bell,
        CheckCircle,
        XCircle,
        Bookmark,
        Heart,
    } from "lucide-svelte";
    import AddPetModal from "$lib/components/AddPetModal.svelte";
    import EditPetModal from "$lib/components/EditPetModal.svelte";
    import DeletePetModal from "$lib/components/DeletePetModal.svelte";
    import DeleteAccountModal from "$lib/components/DeleteAccountModal.svelte";
    import EditPostModal from "$lib/components/EditPostModal.svelte";
    import DeletePostModal from "$lib/components/DeletePostModal.svelte";
    import CountryPhoneSelect from "$lib/components/CountryPhoneSelect.svelte";
    import ProfileSkeleton from "$lib/components/ProfileSkeleton.svelte";
    import PetCardSkeleton from "$lib/components/PetCardSkeleton.svelte";
    import { getCountryFlag } from "$lib/utils/countryFlag";
    import { toast } from "$lib/stores/toast.svelte";
    import { _, locale } from "svelte-i18n";

    // Helper to strip HTML tags for preview text
    function stripHtml(html: string): string {
        if (!html) return "";
        const doc = new DOMParser().parseFromString(html, "text/html");
        return doc.body.textContent || "";
    }

    type ThemeOption = "light" | "dark" | "system";
    type LanguageOption = "en" | "es";
    type NotificationSettings = {
        email: boolean;
        push: boolean;
        sms: boolean;
        newMessages: boolean;
        adoptionUpdates: boolean;
        newsletter: boolean;
    };

    let pets = $state<any[]>([]);
    let userPosts = $state<any[]>([]);
    let savedPosts = $state<any[]>([]);
    let likedPosts = $state<any[]>([]);
    let initialLoading = $state(true); // Only for initial page load skeleton
    let loadingPets = $state(true);
    let loadingPosts = $state(false);
    let loadingSavedPosts = $state(false);
    let loadingLikedPosts = $state(false);
    let activeTab = $state("profile"); // 'profile' | 'pets' | 'posts' | 'saved' | 'liked' | 'settings'
    let isSaving = $state(false);
    let isDirty = $state(false);

    // Verification state
    let phoneNumber = $state(auth.user?.phone || "");
    let phoneCountryCode = $state(auth.user?.phoneCountryCode || "US");
    let phoneVerified = $state(!!auth.user?.phoneVerified);
    let emailVerified = $state(!!auth.user?.emailVerified);
    let sendingPhoneCode = $state(false);
    let sendingEmailCode = $state(false);
    let phoneVerificationCode = $state("");
    let verifyingPhone = $state(false);
    let emailVerificationCode = $state("");
    let verifyingEmail = $state(false);
    let emailCodeSent = $state(false);
    let emailResendCooldown = $state(0); // Seconds until resend is allowed

    // Countdown effect for resend cooldown
    $effect(() => {
        if (emailResendCooldown > 0) {
            const timer = setTimeout(() => {
                emailResendCooldown -= 1;
            }, 1000);
            return () => clearTimeout(timer);
        }
    });

    let settingsActionLoading = $state<
        "theme" | "language" | "phone" | "notifications" | null
    >(null);

    let userLanguage = $state<LanguageOption>(
        (auth.user?.language as LanguageOption) || "en",
    );
    let userTheme = $state<ThemeOption>(
        (auth.user?.theme as ThemeOption) || "system",
    );
    let notificationSettings = $state<NotificationSettings>({
        email: true,
        push: true,
        sms: false,
        newMessages: true,
        adoptionUpdates: true,
        newsletter: false,
    });

    // Countries for phone selector
    let countries = $state<any[]>([]);
    let selectedCountry = $state<any>(null);
    let loadingCountries = $state(false);

    // Verification banner visibility (sync with Navbar) - remind users to add/verify both
    let needsEmailVerification = $derived(
        auth.user && (!auth.user.email || !auth.user.emailVerified),
    );
    let needsPhoneVerification = $derived(
        auth.user && (!auth.user.phone || !auth.user.phoneVerified),
    );
    let showVerificationBanner = $derived(
        needsEmailVerification || needsPhoneVerification,
    );

    // Handle URL query params for tab
    $effect(() => {
        const tabParam = $page.url.searchParams.get("tab");
        if (
            tabParam &&
            ["profile", "pets", "posts", "saved", "liked", "settings"].includes(
                tabParam,
            )
        ) {
            activeTab = tabParam;
        }
    });

    // Form State - Pets
    let showAddModal = $state(false);
    let showEditModal = $state(false);
    let showDeleteModal = $state(false);
    let showDeleteAccountModal = $state(false);
    let selectedPet = $state<any>(null);
    let isDeletingAccount = $state(false);

    // Form State - Posts
    let showEditPostModal = $state(false);
    let showDeletePostModal = $state(false);
    let selectedPost = $state<any>(null);

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
    let userCoverImageOffset = $state({ x: 50, y: 50 });
    let userFirstName = $state(auth.user?.firstName || "");
    let userLastName = $state(auth.user?.lastName || "");
    let userSecondLastName = $state(auth.user?.secondLastName || "");

    // Cover image repositioning state
    let isRepositioningCover = $state(false);
    let isDraggingCover = $state(false);
    let dragStartPos = $state({ x: 0, y: 0 });
    let dragStartOffset = $state({ x: 50, y: 50 });
    let coverContainerRef: HTMLDivElement | undefined = $state();
    let coverImageRef: HTMLImageElement | undefined = $state();
    let savingCoverOffset = $state(false);
    let lastSavedProfile = $state({
        firstName: "",
        lastName: "",
        secondLastName: "",
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

    let profileInput: HTMLInputElement | undefined = $state();
    let coverInput: HTMLInputElement | undefined = $state();

    // Sync if auth user changes and we haven't loaded from DB yet/overwritten
    $effect(() => {
        if (auth.user?.firstName && !userFirstName) {
            userFirstName = auth.user.firstName;
        }
        if (auth.user?.lastName && !userLastName) {
            userLastName = auth.user.lastName;
        }
        if (auth.user?.secondLastName !== undefined && !userSecondLastName) {
            userSecondLastName = auth.user.secondLastName || "";
        }
    });

    function snapshotProfile() {
        lastSavedProfile = {
            firstName: userFirstName,
            lastName: userLastName,
            secondLastName: userSecondLastName,
            address: { ...userAddress },
            timezone: userTimezone,
            profilePicture: userProfilePicture,
            coverImage: userCoverImage,
        };
    }

    function resetProfile() {
        userFirstName = lastSavedProfile.firstName;
        userLastName = lastSavedProfile.lastName;
        userSecondLastName = lastSavedProfile.secondLastName;
        userAddress = { ...lastSavedProfile.address };
        userTimezone = lastSavedProfile.timezone;
        userProfilePicture = lastSavedProfile.profilePicture;
        userCoverImage = lastSavedProfile.coverImage;
    }

    function isProfileDifferent() {
        return (
            userFirstName !== lastSavedProfile.firstName ||
            userLastName !== lastSavedProfile.lastName ||
            userSecondLastName !== lastSavedProfile.secondLastName ||
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
        myPets {
          id
          name
          species {
            id
            label
          }
          customSpecies
          breed {
            id
            name
          }
          customBreed
          age
          gender
          size
          color
          description
          status
          coverImage
          images
          health {
            vaccinated
            neutered
          }
        }
        me {
           id
           email
           firstName
           lastName
           secondLastName
           fullName
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
           coverImageOffset {
             x
             y
           }
           language
           theme
           phone
           phoneCountryCode
           phoneVerified
           emailVerified
           notifications {
             email
             push
             sms
             newMessages
             adoptionUpdates
             newsletter
           }
        }
      }
    `;

        try {
            const res = await apiCall(query);
            if (res.errors) throw new Error(res.errors[0].message);

            // myPets query already filters by current user server-side
            pets = res.data.myPets || [];

            // Update user profile data if available
            if (res.data.me) {
                // Update with fresh data from DB
                userFirstName = res.data.me.firstName;
                userLastName = res.data.me.lastName;
                userSecondLastName = res.data.me.secondLastName || "";
                if (res.data.me.address)
                    userAddress = { ...res.data.me.address };
                if (res.data.me.timezone) userTimezone = res.data.me.timezone;
                userProfilePicture = res.data.me.profilePicture || "";
                userCoverImage = res.data.me.coverImage || "";
                userCoverImageOffset = res.data.me.coverImageOffset || {
                    x: 50,
                    y: 50,
                };
                userLanguage = (res.data.me.language as LanguageOption) || "en";
                userTheme = (res.data.me.theme as ThemeOption) || "system";
                phoneNumber = res.data.me.phone || "";
                phoneCountryCode = res.data.me.phoneCountryCode || "US";
                phoneVerified = !!res.data.me.phoneVerified;
                emailVerified = !!res.data.me.emailVerified;
                notificationSettings = {
                    ...notificationSettings,
                    ...(res.data.me.notifications || {}),
                };

                locale.set(userLanguage);
                theme.loadFromUser(userTheme);
                auth.updateUser({
                    firstName: userFirstName,
                    lastName: userLastName,
                    secondLastName: userSecondLastName,
                    fullName: [userFirstName, userLastName, userSecondLastName]
                        .filter(Boolean)
                        .join(" "),
                    profilePicture: userProfilePicture,
                    coverImage: userCoverImage,
                    coverImageOffset: userCoverImageOffset,
                    language: userLanguage,
                    theme: userTheme,
                    timezone: userTimezone,
                    phone: phoneNumber,
                    phoneCountryCode,
                    phoneVerified,
                    emailVerified,
                    notifications: notificationSettings,
                });
                snapshotProfile();
            }
        } catch (e: any) {
            console.error(e.message);
        } finally {
            loadingPets = false;
            initialLoading = false; // Only affects first load
        }
    }

    async function fetchMyPosts() {
        loadingPosts = true;
        const query = `
      query GetMyPosts {
        myPosts {
          id
          title
          description
          postType
          tags
          images
          location
          createdAt
          voteScore
          upvotes
          downvotes
          commentCount
          pet {
            id
            name
            species { label }
            breed { name }
            customSpecies
            customBreed
            coverImage
            status
          }
        }
      }
    `;

        try {
            const res = await apiCall(query);
            if (res.errors) throw new Error(res.errors[0].message);
            userPosts = res.data.myPosts || [];
        } catch (e: any) {
            console.error(e.message);
        } finally {
            loadingPosts = false;
        }
    }

    async function fetchSavedPosts() {
        loadingSavedPosts = true;
        const query = `
      query GetMySavedPosts {
        mySavedPosts {
          id
          title
          description
          postType
          tags
          images
          location
          createdAt
          voteScore
          upvotes
          downvotes
          commentCount
          isSaved
          author {
            id
            fullName
            profilePicture
          }
          pet {
            id
            name
            species { label }
            breed { name }
            customSpecies
            customBreed
            coverImage
            status
          }
        }
      }
    `;

        try {
            const res = await apiCall(query);
            if (res.errors) throw new Error(res.errors[0].message);
            savedPosts = res.data.mySavedPosts || [];
        } catch (e: any) {
            console.error(e.message);
        } finally {
            loadingSavedPosts = false;
        }
    }

    async function fetchLikedPosts() {
        loadingLikedPosts = true;
        const query = `
      query GetMyLikedPosts {
        myLikedPosts {
          id
          title
          description
          postType
          tags
          images
          location
          createdAt
          voteScore
          upvotes
          downvotes
          commentCount
          userVote
          author {
            id
            fullName
            profilePicture
          }
          pet {
            id
            name
            species { label }
            breed { name }
            customSpecies
            customBreed
            coverImage
            status
          }
        }
      }
    `;

        try {
            const res = await apiCall(query);
            if (res.errors) throw new Error(res.errors[0].message);
            likedPosts = res.data.myLikedPosts || [];
        } catch (e: any) {
            console.error(e.message);
        } finally {
            loadingLikedPosts = false;
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

    async function deleteFile(fileUrl: string): Promise<void> {
        if (!fileUrl) return;
        try {
            await fetch("/api/upload/delete", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${auth.token}`,
                },
                body: JSON.stringify({ fileUrl }),
            });
        } catch (error) {
            console.error("Failed to delete old file:", error);
            // Don't throw - we still want to proceed with the new upload
        }
    }

    async function handleProfileUpload(e: Event) {
        const input = e.target as HTMLInputElement;
        if (input.files && input.files.length > 0) {
            try {
                // Delete old profile picture if exists
                const oldUrl = userProfilePicture;

                const url = await uploadFile(input.files[0]);
                userProfilePicture = url;
                await handleUpdateProfile();

                // Delete old file after successful update
                if (oldUrl) {
                    await deleteFile(oldUrl);
                }
            } catch (error) {
                toast.error($_("profile.toasts.upload_profile_error"));
            }
        }
    }

    async function handleCoverUpload(e: Event) {
        const input = e.target as HTMLInputElement;
        if (input.files && input.files.length > 0) {
            try {
                // Delete old cover image if exists
                const oldUrl = userCoverImage;

                const url = await uploadFile(input.files[0]);
                userCoverImage = url;
                await handleUpdateProfile(); // Auto-save

                // Delete old file after successful update
                if (oldUrl) {
                    await deleteFile(oldUrl);
                }
            } catch (error) {
                toast.error($_("profile.toasts.upload_cover_error"));
            }
        }
    }

    function syncSelectedCountryFromCode() {
        if (!countries.length) return;
        const match = countries.find(
            (country: any) => country.alpha2 === phoneCountryCode,
        );
        if (match) selectedCountry = match;
    }

    $effect(() => {
        syncSelectedCountryFromCode();
    });

    async function updateUserSettings(
        variables: Record<string, any>,
        options?: {
            loadingKey?: "theme" | "language" | "phone" | "notifications";
            successMessage?: string;
            errorMessage?: string;
            silent?: boolean;
        },
    ) {
        const mutation = `
            mutation UpdateUserSettings(
                $firstName: String,
                $lastName: String,
                $secondLastName: String,
                $address: AddressInput,
                $timezone: String,
                $profilePicture: String,
                $coverImage: String,
                $coverImageOffset: CoverImageOffsetInput,
                $language: String,
                $phone: String,
                $phoneCountryCode: String,
                $theme: String,
                $notifications: NotificationSettingsInput
            ) {
                updateUser(
                    firstName: $firstName,
                    lastName: $lastName,
                    secondLastName: $secondLastName,
                    address: $address,
                    timezone: $timezone,
                    profilePicture: $profilePicture,
                    coverImage: $coverImage,
                    coverImageOffset: $coverImageOffset,
                    language: $language,
                    phone: $phone,
                    phoneCountryCode: $phoneCountryCode,
                    theme: $theme,
                    notifications: $notifications
                ) {
                    id
                    firstName
                    lastName
                    secondLastName
                    fullName
                    timezone
                    profilePicture
                    coverImage
                    coverImageOffset {
                        x
                        y
                    }
                    language
                    theme
                    phone
                    phoneCountryCode
                    phoneVerified
                    emailVerified
                    notifications {
                        email
                        push
                        sms
                        newMessages
                        adoptionUpdates
                        newsletter
                    }
                }
            }
        `;

        if (options?.loadingKey) settingsActionLoading = options.loadingKey;
        const wasProfileSave =
            "firstName" in variables ||
            "lastName" in variables ||
            "secondLastName" in variables ||
            "address" in variables ||
            "timezone" in variables ||
            "profilePicture" in variables ||
            "coverImage" in variables;
        if (wasProfileSave) isSaving = true;

        try {
            const res = await apiCall(mutation, variables);
            if (res.errors) throw new Error(res.errors[0].message);

            const updated = res.data?.updateUser;
            if (updated) {
                userFirstName = updated.firstName || userFirstName;
                userLastName = updated.lastName || userLastName;
                userSecondLastName = updated.secondLastName || "";
                userTimezone = updated.timezone || userTimezone;
                userProfilePicture = updated.profilePicture || "";
                userCoverImage = updated.coverImage || "";
                if (updated.coverImageOffset) {
                    userCoverImageOffset = updated.coverImageOffset;
                }
                userLanguage =
                    (updated.language as LanguageOption) || userLanguage;
                userTheme = (updated.theme as ThemeOption) || userTheme;
                phoneNumber = updated.phone || "";
                phoneCountryCode = updated.phoneCountryCode || phoneCountryCode;
                phoneVerified = !!updated.phoneVerified;
                emailVerified = !!updated.emailVerified;
                notificationSettings = {
                    ...notificationSettings,
                    ...(updated.notifications || {}),
                };

                auth.updateUser({
                    firstName: updated.firstName,
                    lastName: updated.lastName,
                    secondLastName: updated.secondLastName || "",
                    fullName: updated.fullName,
                    profilePicture: updated.profilePicture || "",
                    coverImage: updated.coverImage || "",
                    coverImageOffset:
                        updated.coverImageOffset || userCoverImageOffset,
                    language: updated.language || userLanguage,
                    theme: updated.theme || userTheme,
                    timezone: updated.timezone || userTimezone,
                    phone: updated.phone || "",
                    phoneCountryCode:
                        updated.phoneCountryCode || phoneCountryCode,
                    phoneVerified: !!updated.phoneVerified,
                    emailVerified: !!updated.emailVerified,
                    notifications:
                        updated.notifications || notificationSettings,
                });
            }

            if (wasProfileSave) snapshotProfile();

            if (!options?.silent && options?.successMessage) {
                toast.success(options.successMessage);
            }
            return updated;
        } catch (e: any) {
            if (!options?.silent) {
                toast.error(
                    options?.errorMessage ||
                        $_("profile.toasts.update_error", {
                            values: { error: e.message },
                        }),
                );
            }
            throw e;
        } finally {
            if (wasProfileSave) isSaving = false;
            settingsActionLoading = null;
        }
    }

    async function handleUpdateProfile() {
        await updateUserSettings(
            {
                firstName: userFirstName,
                lastName: userLastName,
                secondLastName: userSecondLastName || null,
                address: userAddress,
                timezone: userTimezone,
                profilePicture: userProfilePicture,
                coverImage: userCoverImage,
            },
            { successMessage: $_("profile.toasts.update_success") },
        );
    }

    async function handleThemeChange(nextTheme: ThemeOption) {
        userTheme = nextTheme;
        theme.setTheme(nextTheme, false);
        auth.updateUser({ theme: nextTheme });
        try {
            await updateUserSettings(
                { theme: nextTheme },
                {
                    loadingKey: "theme",
                    silent: true,
                },
            );
        } catch {
            toast.error($_("profile.toasts.update_error"));
        }
    }

    async function handleLanguageChange(nextLanguage: LanguageOption) {
        userLanguage = nextLanguage;
        locale.set(nextLanguage);
        auth.updateUser({ language: nextLanguage });
        try {
            await updateUserSettings(
                { language: nextLanguage },
                {
                    loadingKey: "language",
                    silent: true,
                },
            );
        } catch {
            toast.error($_("profile.toasts.update_error"));
        }
    }

    let phoneCodeSent = $state(false);
    let phoneResendCooldown = $state(0);

    // Countdown effect for phone resend cooldown
    $effect(() => {
        if (phoneResendCooldown > 0) {
            const timer = setTimeout(() => {
                phoneResendCooldown -= 1;
            }, 1000);
            return () => clearTimeout(timer);
        }
    });

    async function handlePhoneSave() {
        if (!phoneNumber || !selectedCountry) return;

        sendingPhoneCode = true;
        try {
            phoneCountryCode = selectedCountry.alpha2;
            // Format the full phone number with country code
            const fullPhoneNumber = `+${selectedCountry.phoneCode}${phoneNumber.replace(/\D/g, "")}`;

            const res = await fetch("/api/graphql", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${auth.token}`,
                },
                body: JSON.stringify({
                    query: `mutation SendPhoneVerification($phoneNumber: String!, $countryCode: String!) {
                        sendPhoneVerification(phoneNumber: $phoneNumber, countryCode: $countryCode)
                    }`,
                    variables: {
                        phoneNumber: fullPhoneNumber,
                        countryCode: selectedCountry.alpha2,
                    },
                }),
            });
            const result = await res.json();
            if (result.errors) throw new Error(result.errors[0].message);

            phoneCodeSent = true;
            phoneResendCooldown = 60; // Start 60s cooldown
            toast.success($_("settings.verification.sms_sent"));
        } catch (e: any) {
            toast.error(e.message || $_("profile.toasts.update_error"));
        } finally {
            sendingPhoneCode = false;
        }
    }

    async function handleVerifyPhone() {
        if (!phoneVerificationCode) return;

        verifyingPhone = true;
        try {
            const res = await fetch("/api/graphql", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${auth.token}`,
                },
                body: JSON.stringify({
                    query: `mutation VerifyPhone($code: String!) {
                        verifyPhone(code: $code) {
                            id
                            phoneVerified
                        }
                    }`,
                    variables: {
                        code: phoneVerificationCode,
                    },
                }),
            });
            const result = await res.json();
            if (result.errors) throw new Error(result.errors[0].message);

            phoneVerified = true;
            phoneCodeSent = false;
            phoneVerificationCode = "";
            auth.updateUser({ phoneVerified: true });
            toast.success($_("settings.verification.phone_verified"));
        } catch (e: any) {
            toast.error(e.message || $_("settings.verification.invalid_code"));
        } finally {
            verifyingPhone = false;
        }
    }

    async function handleResendPhoneCode() {
        sendingPhoneCode = true;
        try {
            const res = await fetch("/api/graphql", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${auth.token}`,
                },
                body: JSON.stringify({
                    query: `mutation { resendPhoneVerification }`,
                }),
            });
            const result = await res.json();
            if (result.errors) throw new Error(result.errors[0].message);
            phoneResendCooldown = 60; // Restart 60s cooldown
            toast.success($_("settings.verification.sms_sent"));
        } catch (e: any) {
            toast.error(e.message);
        } finally {
            sendingPhoneCode = false;
        }
    }

    async function toggleNotification(
        key: keyof NotificationSettings,
        value: boolean,
    ) {
        const nextSettings = {
            ...notificationSettings,
            [key]: value,
        };
        notificationSettings = nextSettings;

        try {
            await updateUserSettings(
                { notifications: nextSettings },
                {
                    loadingKey: "notifications",
                    silent: true,
                },
            );
        } catch {
            notificationSettings = {
                ...notificationSettings,
                [key]: !value,
            };
        }
    }

    async function handleDeleteAccount() {
        isDeletingAccount = true;
        try {
            const mutation = `
                mutation DeleteAccount {
                    deleteAccount
                }
            `;
            const res = await apiCall(mutation);
            if (res.errors) throw new Error(res.errors[0].message);

            toast.success($_("profile.toasts.delete_success"));

            // Log out the user and redirect to home
            auth.logout();
            goto("/");
        } catch (e: any) {
            toast.error(
                $_("profile.toasts.delete_error", {
                    values: { error: e.message },
                }),
            );
        } finally {
            isDeletingAccount = false;
        }
    }

    async function fetchCountries() {
        if (countries.length > 0) return; // Already loaded
        loadingCountries = true;
        const query = `
            query GetCountries {
                countries {
                    id
                    name
                    alpha2
                    phoneCode
                    flag
                }
            }
        `;
        try {
            const res = await apiCall(query);
            if (res.errors) throw new Error(res.errors[0].message);
            countries = res.data.countries || [];
            if (countries.length > 0) {
                const savedCountry = countries.find(
                    (c: any) => c.alpha2 === phoneCountryCode,
                );
                if (savedCountry) {
                    selectedCountry = savedCountry;
                } else if (!selectedCountry) {
                    selectedCountry =
                        countries.find((c: any) => c.alpha2 === "US") ||
                        countries[0];
                }
            }
        } catch (e: any) {
            console.error("Error fetching countries:", e.message);
        } finally {
            loadingCountries = false;
        }
    }

    onMount(async () => {
        // Redirect to login if not authenticated
        if (!auth.isAuthenticated) {
            goto("/login");
            return;
        }

        await Promise.all([fetchMyPets(), fetchCountries()]);

        // Run entrance animations after data loads
        if (!hasAnimated) {
            hasAnimated = true;
            requestAnimationFrame(() => {
                runEntranceAnimations();
            });
        }
    });

    let tabsContainer: HTMLElement | undefined = $state();

    // GSAP animation refs
    let profileHeaderEl: HTMLDivElement | null = $state(null);
    let avatarEl: HTMLDivElement | null = $state(null);
    let userInfoEl: HTMLDivElement | null = $state(null);
    let tabsNavEl: HTMLElement | null = $state(null);
    let tabContentEl: HTMLDivElement | null = $state(null);
    let hasAnimated = $state(false);

    // Run entrance animations
    function runEntranceAnimations() {
        const tl = gsap.timeline({ defaults: { ease: "power2.out" } });

        // Animate profile header/cover
        if (profileHeaderEl) {
            tl.fromTo(
                profileHeaderEl,
                { opacity: 0 },
                { opacity: 1, duration: 0.4 },
                0,
            );
        }

        // Animate avatar with scale
        if (avatarEl) {
            tl.fromTo(
                avatarEl,
                { opacity: 0, scale: 0.8, y: 20 },
                {
                    opacity: 1,
                    scale: 1,
                    y: 0,
                    duration: 0.5,
                    ease: "back.out(1.5)",
                },
                0.2,
            );
        }

        // Animate user info
        if (userInfoEl) {
            tl.fromTo(
                userInfoEl,
                { opacity: 0, y: 15 },
                { opacity: 1, y: 0, duration: 0.4 },
                0.35,
            );
        }

        // Animate tabs navigation
        if (tabsNavEl) {
            const tabs = tabsNavEl.querySelectorAll("button");
            tl.fromTo(
                tabsNavEl,
                { opacity: 0, y: -10 },
                { opacity: 1, y: 0, duration: 0.3 },
                0.4,
            );
            tl.fromTo(
                tabs,
                { opacity: 0, y: -5 },
                { opacity: 1, y: 0, duration: 0.2, stagger: 0.05 },
                0.45,
            );
        }

        // Animate initial tab content
        if (tabContentEl) {
            tl.fromTo(
                tabContentEl,
                { opacity: 0, y: 20 },
                { opacity: 1, y: 0, duration: 0.4 },
                0.5,
            );
        }
    }

    // Animate tab content change
    function animateTabContent() {
        if (tabContentEl) {
            gsap.fromTo(
                tabContentEl,
                { opacity: 0, y: 15 },
                { opacity: 1, y: 0, duration: 0.3, ease: "power2.out" },
            );
        }
    }

    function handleTabChange(tab: string) {
        if (activeTab === tab) return;
        activeTab = tab;

        if (tab === "posts" && userPosts.length === 0) {
            fetchMyPosts();
        }
        if (tab === "saved" && savedPosts.length === 0) {
            fetchSavedPosts();
        }
        if (tab === "liked" && likedPosts.length === 0) {
            fetchLikedPosts();
        }

        // Animate tab content change
        requestAnimationFrame(() => {
            animateTabContent();
        });
    }

    function handleEditPet(pet: any) {
        selectedPet = pet;
        showEditModal = true;
    }

    function handleDeletePet(pet: any) {
        selectedPet = pet;
        showDeleteModal = true;
    }

    function closeEditModal() {
        showEditModal = false;
        selectedPet = null;
    }

    function closeDeleteModal() {
        showDeleteModal = false;
        selectedPet = null;
    }

    // Cover image drag handlers
    function handleCoverDragStart(e: MouseEvent | TouchEvent) {
        if (!isRepositioningCover) return;
        e.preventDefault();
        isDraggingCover = true;

        const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
        const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;

        dragStartPos = { x: clientX, y: clientY };
        dragStartOffset = { ...userCoverImageOffset };
    }

    function handleCoverDragMove(e: MouseEvent | TouchEvent) {
        if (!isDraggingCover || !coverContainerRef) return;
        e.preventDefault();

        const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
        const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;

        const containerRect = coverContainerRef.getBoundingClientRect();

        // Calculate delta as percentage of container size
        const deltaX = ((clientX - dragStartPos.x) / containerRect.width) * 100;
        const deltaY =
            ((clientY - dragStartPos.y) / containerRect.height) * 100;

        // Update offset (inverted because we're moving the focal point)
        userCoverImageOffset = {
            x: Math.min(100, Math.max(0, dragStartOffset.x - deltaX)),
            y: Math.min(100, Math.max(0, dragStartOffset.y - deltaY)),
        };
    }

    function handleCoverDragEnd() {
        isDraggingCover = false;
    }

    async function saveCoverOffset() {
        savingCoverOffset = true;
        try {
            await updateUserSettings(
                { coverImageOffset: userCoverImageOffset },
                { silent: true },
            );
            isRepositioningCover = false;
            toast.success($_("profile.toasts.cover_position_saved"));
        } catch {
            toast.error($_("profile.toasts.cover_position_error"));
        } finally {
            savingCoverOffset = false;
        }
    }

    function cancelCoverReposition() {
        // Reset to last saved offset
        userCoverImageOffset = auth.user?.coverImageOffset || { x: 50, y: 50 };
        isRepositioningCover = false;
    }
</script>

{#if !auth.isAuthenticated}
    <!-- Redirecting to login... -->
    <div class="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
    </div>
{:else}
    <SEO
        title={$_("profile.seo_title")}
        description={$_("profile.seo_desc")}
        noindex={true}
    />

    {#if initialLoading}
        <ProfileSkeleton />
    {:else}
    <div
        class="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20 transition-colors"
    >
        <!-- Profile Header -->
        <div class="relative" bind:this={profileHeaderEl} style="opacity: 0;">
            <div
                class="relative h-56 md:h-72 lg:h-80 {isRepositioningCover
                    ? 'ring-4 ring-indigo-500 ring-inset'
                    : ''}"
            >
                <!-- svelte-ignore a11y_no_static_element_interactions -->
                <div
                    bind:this={coverContainerRef}
                    class="absolute inset-0 overflow-hidden {isRepositioningCover
                        ? 'cursor-ns-resize'
                        : ''}"
                    onmousedown={handleCoverDragStart}
                    onmousemove={handleCoverDragMove}
                    onmouseup={handleCoverDragEnd}
                    onmouseleave={handleCoverDragEnd}
                    ontouchstart={handleCoverDragStart}
                    ontouchmove={handleCoverDragMove}
                    ontouchend={handleCoverDragEnd}
                >
                    {#if userCoverImage}
                        <img
                            bind:this={coverImageRef}
                            src={userCoverImage}
                            alt="Cover"
                            class="w-full h-full object-cover select-none transition-[object-position] {isDraggingCover
                                ? 'duration-0'
                                : 'duration-150'}"
                            style="object-position: {userCoverImageOffset.x}% {userCoverImageOffset.y}%;"
                            draggable="false"
                        />
                        {#if !isRepositioningCover}
                            <div class="absolute inset-0 bg-black/10"></div>
                        {/if}
                    {:else}
                        <div
                            class="w-full h-full bg-gradient-to-r from-purple-600 to-indigo-600"
                        ></div>
                    {/if}

                    <!-- Reposition Mode Overlay with drag indicator -->
                    {#if isRepositioningCover}
                        <div class="absolute inset-0 pointer-events-none">
                            <!-- Top/bottom fade to indicate more image -->
                            <div
                                class="absolute top-0 left-0 right-0 h-12 bg-gradient-to-b from-black/40 to-transparent"
                            ></div>
                            <div
                                class="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-black/40 to-transparent"
                            ></div>

                            <!-- Center hint -->
                            <div
                                class="absolute inset-0 flex items-center justify-center"
                            >
                                <div
                                    class="bg-black/70 text-white px-5 py-3 rounded-xl text-sm font-medium backdrop-blur-sm flex items-center gap-3 shadow-xl"
                                >
                                    <div
                                        class="flex flex-col items-center gap-0.5 text-white/80"
                                    >
                                        <svg
                                            class="w-4 h-4"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                stroke-linecap="round"
                                                stroke-linejoin="round"
                                                stroke-width="2"
                                                d="M5 15l7-7 7 7"
                                            ></path>
                                        </svg>
                                        <svg
                                            class="w-4 h-4"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                stroke-linecap="round"
                                                stroke-linejoin="round"
                                                stroke-width="2"
                                                d="M19 9l-7 7-7-7"
                                            ></path>
                                        </svg>
                                    </div>
                                    <span>{$_("profile.cover_drag_hint")}</span>
                                </div>
                            </div>
                        </div>
                    {/if}

                    <!-- Cover Action Buttons -->
                    {#if !isRepositioningCover}
                        <div class="absolute top-4 right-4 flex gap-2">
                            {#if userCoverImage}
                                <button
                                    class="bg-black/30 hover:bg-black/50 text-white p-2 rounded-full backdrop-blur-sm transition-colors cursor-pointer"
                                    onclick={() =>
                                        (isRepositioningCover = true)}
                                    aria-label={$_(
                                        "profile.cover_reposition_aria",
                                    )}
                                    title={$_("profile.cover_reposition_title")}
                                >
                                    <Edit2 class="w-5 h-5" />
                                </button>
                            {/if}
                            <button
                                class="bg-black/30 hover:bg-black/50 text-white p-2 rounded-full backdrop-blur-sm transition-colors cursor-pointer"
                                onclick={() => coverInput?.click()}
                                aria-label={$_("profile.cover_photo_aria")}
                            >
                                <Camera class="w-5 h-5" />
                            </button>
                        </div>
                    {:else}
                        <!-- Save/Cancel buttons when repositioning -->
                        <div
                            class="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-3 z-10"
                        >
                            <button
                                class="bg-white/95 text-gray-700 px-5 py-2.5 rounded-xl text-sm font-semibold shadow-xl hover:bg-white transition-colors backdrop-blur-sm"
                                onclick={cancelCoverReposition}
                                disabled={savingCoverOffset}
                            >
                                {$_("profile.settings.buttons.cancel")}
                            </button>
                            <button
                                class="bg-indigo-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold shadow-xl hover:bg-indigo-700 transition-colors disabled:opacity-50"
                                onclick={saveCoverOffset}
                                disabled={savingCoverOffset}
                            >
                                {savingCoverOffset
                                    ? $_("profile.settings.buttons.saving")
                                    : $_("profile.settings.buttons.save")}
                            </button>
                        </div>
                    {/if}

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
                        <div
                            class="relative -mt-10 sm:-mt-12"
                            bind:this={avatarEl}
                            style="opacity: 0;"
                        >
                            <div
                                role="button"
                                tabindex="0"
                                class="group w-28 h-28 sm:w-32 sm:h-32 rounded-full border-4 border-white bg-white shadow-xl overflow-hidden flex items-center justify-center text-4xl font-bold text-indigo-600 cursor-pointer"
                                onclick={() => profileInput?.click()}
                                onkeydown={(e) =>
                                    e.key === "Enter" && profileInput?.click()}
                            >
                                {#if userProfilePicture}
                                    <img
                                        src={userProfilePicture}
                                        alt={auth.user?.fullName}
                                        class="w-full h-full object-cover"
                                    />
                                {:else if auth.user?.firstName}
                                    {auth.user.firstName
                                        .charAt(0)
                                        .toUpperCase()}
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
                        <div
                            class="mt-4 text-center sm:text-left"
                            bind:this={userInfoEl}
                            style="opacity: 0;"
                        >
                            <div
                                class="flex items-center justify-center sm:justify-start gap-2"
                            >
                                <h1
                                    class="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white"
                                >
                                    {[
                                        userFirstName,
                                        userLastName,
                                        userSecondLastName,
                                    ]
                                        .filter(Boolean)
                                        .join(" ") ||
                                        $_("profile.default_name")}
                                </h1>
                                <!-- Verification badges -->
                                <div class="flex items-center gap-1">
                                    {#if emailVerified}
                                        <span
                                            class="inline-flex items-center justify-center w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900/30"
                                            title={$_(
                                                "settings.verification.email",
                                            ) +
                                                " - " +
                                                $_(
                                                    "settings.verification.verified",
                                                )}
                                        >
                                            <Mail
                                                class="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400"
                                            />
                                        </span>
                                    {/if}
                                    {#if phoneVerified}
                                        <span
                                            class="inline-flex items-center justify-center w-6 h-6 rounded-full bg-green-100 dark:bg-green-900/30"
                                            title={$_(
                                                "settings.verification.phone",
                                            ) +
                                                " - " +
                                                $_(
                                                    "settings.verification.verified",
                                                )}
                                        >
                                            <Phone
                                                class="w-3.5 h-3.5 text-green-600 dark:text-green-400"
                                            />
                                        </span>
                                    {/if}
                                </div>
                            </div>
                            <p
                                class="text-gray-500 dark:text-gray-400 font-medium"
                            >
                                {auth.user?.email}
                            </p>

                            <div
                                class="mt-3 flex flex-wrap justify-center sm:justify-start gap-2"
                            >
                                <span
                                    class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-sm text-gray-700 dark:text-gray-300"
                                >
                                    <MapPin
                                        class="w-4 h-4 text-gray-500 dark:text-gray-400"
                                    />
                                    {userAddress.city
                                        ? `${userAddress.city}, ${userAddress.state}`
                                        : $_("profile.no_location")}
                                </span>

                                <span
                                    class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-sm text-gray-700 dark:text-gray-300"
                                >
                                    <Clock
                                        class="w-4 h-4 text-gray-500 dark:text-gray-400"
                                    />
                                    {userTimezone ||
                                        $_("profile.timezone_not_set")}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Main Content -->

        <!-- Main Content -->
        <div
            class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-8"
            bind:this={tabsContainer}
        >
            <!-- Tabs Navigation -->
            <!-- Position: Nav (64px) + Support banner (28px) + Verification banner if shown (28px) -->
            <div
                class="sticky z-10 bg-gray-50 dark:bg-gray-900 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 pt-2 pb-0 mb-8 border-b border-gray-200 dark:border-gray-700 {showVerificationBanner
                    ? 'top-[120px]'
                    : 'top-[92px]'}"
                style="opacity: 0;"
                bind:this={tabsNavEl}
            >
                <nav
                    class="-mb-px flex space-x-4 sm:space-x-6 overflow-x-auto scrollbar-hide pb-0 snap-x snap-mandatory"
                    aria-label="Tabs"
                >
                    <button
                        onclick={() => handleTabChange("profile")}
                        class="snap-start shrink-0 {activeTab === 'profile'
                            ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                            : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'} whitespace-nowrap py-3 sm:py-4 px-3 sm:px-1 border-b-2 font-medium text-sm transition-colors flex items-center gap-2"
                    >
                        <User class="w-4 h-4" />
                        {$_("profile.tabs.profile")}
                    </button>
                    <button
                        onclick={() => handleTabChange("pets")}
                        class="snap-start shrink-0 {activeTab === 'pets'
                            ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                            : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'} whitespace-nowrap py-3 sm:py-4 px-3 sm:px-1 border-b-2 font-medium text-sm transition-colors"
                    >
                        {$_("profile.tabs.pets")}
                    </button>
                    <button
                        onclick={() => handleTabChange("posts")}
                        class="snap-start shrink-0 {activeTab === 'posts'
                            ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                            : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'} whitespace-nowrap py-3 sm:py-4 px-3 sm:px-1 border-b-2 font-medium text-sm transition-colors"
                    >
                        {$_("profile.tabs.posts")}
                    </button>
                    <button
                        onclick={() => handleTabChange("saved")}
                        class="snap-start shrink-0 {activeTab === 'saved'
                            ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                            : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'} whitespace-nowrap py-3 sm:py-4 px-3 sm:px-1 border-b-2 font-medium text-sm transition-colors flex items-center gap-2"
                    >
                        <Bookmark class="w-4 h-4" />
                        {$_("profile.tabs.saved")}
                    </button>
                    <button
                        onclick={() => handleTabChange("liked")}
                        class="snap-start shrink-0 {activeTab === 'liked'
                            ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                            : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'} whitespace-nowrap py-3 sm:py-4 px-3 sm:px-1 border-b-2 font-medium text-sm transition-colors flex items-center gap-2"
                    >
                        <Heart class="w-4 h-4" />
                        {$_("profile.tabs.liked")}
                    </button>
                    <button
                        onclick={() => handleTabChange("settings")}
                        class="snap-start shrink-0 {activeTab === 'settings'
                            ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                            : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'} whitespace-nowrap py-3 sm:py-4 px-3 sm:px-1 border-b-2 font-medium text-sm transition-colors flex items-center gap-2"
                    >
                        <Settings class="w-4 h-4" />
                        {$_("profile.tabs.app_settings")}
                    </button>
                </nav>
            </div>

            <!-- Tab Content -->
            <div bind:this={tabContentEl}>
                <!-- Pets Tab -->
                {#if activeTab === "pets"}
                    <div in:fade={{ duration: 200 }}>
                        <div class="flex justify-between items-center mb-6">
                            <h2
                                class="text-xl font-bold text-gray-900 dark:text-white"
                            >
                                {$_("profile.pets.title")}
                            </h2>
                            <button
                                onclick={() => (showAddModal = true)}
                                class="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-full text-sm font-semibold shadow-md transition-all flex items-center gap-2 transform hover:scale-105 active:scale-95"
                            >
                                <Plus class="w-5 h-5" />
                                {$_("profile.pets.add_new")}
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
                                class="text-center py-16 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-dashed border-gray-300 dark:border-gray-600"
                            >
                                <div
                                    class="mx-auto h-16 w-16 text-gray-400 mb-4 bg-gray-50 dark:bg-gray-700 rounded-full flex items-center justify-center"
                                >
                                    🐾
                                </div>
                                <h3
                                    class="mt-2 text-sm font-medium text-gray-900 dark:text-white"
                                >
                                    {$_("profile.pets.empty_title")}
                                </h3>
                                <p
                                    class="mt-1 text-sm text-gray-500 dark:text-gray-400"
                                >
                                    {$_("profile.pets.empty_desc")}
                                </p>
                                <div class="mt-6">
                                    <button
                                        onclick={() => (showAddModal = true)}
                                        class="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none"
                                    >
                                        <Plus class="-ml-1 mr-2 h-5 w-5" />
                                        {$_("profile.pets.add_btn")}
                                    </button>
                                </div>
                            </div>
                        {:else}
                            <div
                                class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
                            >
                                {#each pets as pet}
                                    <div
                                        class="group bg-white dark:bg-gray-800 rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-300 border border-gray-100 dark:border-gray-700 overflow-hidden"
                                    >
                                        <div
                                            class="relative h-48 bg-gray-200 dark:bg-gray-700 overflow-hidden"
                                        >
                                            {#if pet.coverImage}
                                                <img
                                                    src={pet.coverImage}
                                                    alt={pet.name}
                                                    class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                                />
                                            {:else}
                                                <div
                                                    class="w-full h-full flex items-center justify-center text-4xl bg-indigo-50 dark:bg-indigo-900/30 text-indigo-200 dark:text-indigo-600"
                                                >
                                                    🐾
                                                </div>
                                            {/if}
                                            <div class="absolute top-2 right-2">
                                                <span
                                                    class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-white/90 dark:bg-gray-800/90 text-gray-800 dark:text-gray-200 backdrop-blur-sm shadow-sm"
                                                >
                                                    {pet.species?.label ||
                                                        pet.customSpecies ||
                                                        $_(
                                                            "profile.pets.unknown_species",
                                                        )}
                                                </span>
                                            </div>
                                        </div>
                                        <div class="p-5">
                                            <h3
                                                class="text-lg font-bold text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors"
                                            >
                                                {pet.name}
                                            </h3>
                                            <p
                                                class="text-sm text-gray-500 dark:text-gray-400 mt-1"
                                            >
                                                {pet.breed?.name ||
                                                    pet.customBreed ||
                                                    $_(
                                                        "profile.pets.unknown_breed",
                                                    )}
                                            </p>

                                            <div
                                                class="mt-4 flex justify-between items-center"
                                            >
                                                <button
                                                    class="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 text-sm font-medium flex items-center gap-1"
                                                    aria-label="Edit pet details"
                                                    onclick={() =>
                                                        handleEditPet(pet)}
                                                >
                                                    <Edit2 class="w-4 h-4" />
                                                    {$_(
                                                        "profile.pets.edit_details",
                                                    )}
                                                </button>
                                                <button
                                                    class="text-gray-400 dark:text-gray-500 hover:text-red-500 transition-colors"
                                                    aria-label={$_(
                                                        "profile.pets.delete_aria",
                                                    )}
                                                    onclick={() =>
                                                        handleDeletePet(pet)}
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

                <!-- Posts Tab -->
                {#if activeTab === "posts"}
                    <div in:fade={{ duration: 200 }}>
                        <div class="flex justify-between items-center mb-6">
                            <h2
                                class="text-xl font-bold text-gray-900 dark:text-white"
                            >
                                {$_("profile.posts.title")}
                            </h2>
                            <span
                                class="text-sm text-gray-500 dark:text-gray-400"
                                >{$_("profile.posts.count", {
                                    values: { count: userPosts.length },
                                })}</span
                            >
                        </div>

                        {#if loadingPosts}
                            <div class="flex justify-center py-12">
                                <div
                                    class="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"
                                ></div>
                            </div>
                        {:else if userPosts.length === 0}
                            <div
                                class="text-center py-16 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-dashed border-gray-300 dark:border-gray-600"
                            >
                                <div
                                    class="mx-auto h-16 w-16 text-gray-400 mb-4 bg-gray-50 dark:bg-gray-700 rounded-full flex items-center justify-center"
                                >
                                    <FileText class="w-8 h-8" />
                                </div>
                                <h3
                                    class="mt-2 text-sm font-medium text-gray-900 dark:text-white"
                                >
                                    {$_("profile.posts.empty_title")}
                                </h3>
                                <p
                                    class="mt-1 text-sm text-gray-500 dark:text-gray-400"
                                >
                                    {$_("profile.posts.empty_desc")}
                                </p>
                                <div class="mt-6">
                                    <a
                                        href="/"
                                        class="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none"
                                    >
                                        {$_("profile.posts.create_btn")}
                                    </a>
                                </div>
                            </div>
                        {:else}
                            <div class="space-y-4">
                                {#each userPosts as post}
                                    <div
                                        class="bg-white dark:bg-gray-800 rounded-2xl shadow-sm hover:shadow-md transition-shadow border border-gray-100 dark:border-gray-700 overflow-hidden"
                                    >
                                        <div class="p-5">
                                            <div
                                                class="flex items-start justify-between gap-4"
                                            >
                                                <a
                                                    href="/post/{post.id}"
                                                    class="flex-1 min-w-0"
                                                >
                                                    <div
                                                        class="flex items-center gap-2 mb-2"
                                                    >
                                                        <span
                                                            class="text-xs px-2 py-0.5 rounded-full font-medium {post.postType ===
                                                            'adopt'
                                                                ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                                                                : post.postType ===
                                                                    'missing'
                                                                  ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                                                                  : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'}"
                                                        >
                                                            {post.postType ===
                                                            "adopt"
                                                                ? $_(
                                                                      "profile.posts.types.adopt",
                                                                  )
                                                                : post.postType ===
                                                                    "missing"
                                                                  ? $_(
                                                                        "profile.posts.types.missing",
                                                                    )
                                                                  : $_(
                                                                        "profile.posts.types.default",
                                                                    )}
                                                        </span>
                                                        <span
                                                            class="text-xs text-gray-500 dark:text-gray-400"
                                                        >
                                                            {new Date(
                                                                Number(
                                                                    post.createdAt,
                                                                ),
                                                            ).toLocaleDateString()}
                                                        </span>
                                                    </div>
                                                    <h3
                                                        class="font-semibold text-gray-900 dark:text-white mb-1 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                                                    >
                                                        {post.title}
                                                    </h3>
                                                    <p
                                                        class="text-sm text-gray-600 dark:text-gray-300 line-clamp-2"
                                                    >
                                                        {stripHtml(
                                                            post.description,
                                                        )}
                                                    </p>
                                                    {#if post.pet}
                                                        <div
                                                            class="mt-2 flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400"
                                                        >
                                                            <span
                                                                class="bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded"
                                                            >
                                                                {post.pet.name} ({post
                                                                    .pet.species
                                                                    ?.label ||
                                                                    post.pet
                                                                        .customSpecies ||
                                                                    $_(
                                                                        "profile.posts.pet_fallback",
                                                                    )})
                                                            </span>
                                                        </div>
                                                    {/if}
                                                </a>
                                                <div
                                                    class="flex items-start gap-2 flex-shrink-0"
                                                >
                                                    {#if post.images && post.images.length > 0}
                                                        <a
                                                            href="/post/{post.id}"
                                                        >
                                                            <img
                                                                src={post
                                                                    .images[0]}
                                                                alt=""
                                                                class="w-20 h-20 rounded-lg object-cover"
                                                            />
                                                        </a>
                                                    {/if}
                                                    <div
                                                        class="flex flex-col gap-1"
                                                    >
                                                        <button
                                                            onclick={() => {
                                                                selectedPost =
                                                                    post;
                                                                showEditPostModal = true;
                                                            }}
                                                            class="p-2 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors group"
                                                            title={$_(
                                                                "common.edit",
                                                            )}
                                                        >
                                                            <Edit2
                                                                class="w-4 h-4 text-gray-400 group-hover:text-indigo-500"
                                                            />
                                                        </button>
                                                        <button
                                                            onclick={() => {
                                                                selectedPost =
                                                                    post;
                                                                showDeletePostModal = true;
                                                            }}
                                                            class="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors group"
                                                            title={$_(
                                                                "common.delete",
                                                            )}
                                                        >
                                                            <Trash2
                                                                class="w-4 h-4 text-gray-400 group-hover:text-red-500"
                                                            />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                            <div
                                                class="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700 flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400"
                                            >
                                                <span
                                                    class="flex items-center gap-1"
                                                >
                                                    <svg
                                                        class="w-4 h-4"
                                                        fill="none"
                                                        stroke="currentColor"
                                                        viewBox="0 0 24 24"
                                                    >
                                                        <path
                                                            stroke-linecap="round"
                                                            stroke-linejoin="round"
                                                            stroke-width="2"
                                                            d="M5 15l7-7 7 7"
                                                        ></path>
                                                    </svg>
                                                    {$_("profile.posts.votes", {
                                                        values: {
                                                            count:
                                                                post.voteScore ??
                                                                0,
                                                        },
                                                    })}
                                                </span>
                                                <span
                                                    class="flex items-center gap-1"
                                                >
                                                    <svg
                                                        class="w-4 h-4"
                                                        fill="none"
                                                        stroke="currentColor"
                                                        viewBox="0 0 24 24"
                                                    >
                                                        <path
                                                            stroke-linecap="round"
                                                            stroke-linejoin="round"
                                                            stroke-width="2"
                                                            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                                                        ></path>
                                                    </svg>
                                                    {$_(
                                                        "profile.posts.comments",
                                                        {
                                                            values: {
                                                                count:
                                                                    post.commentCount ??
                                                                    0,
                                                            },
                                                        },
                                                    )}
                                                </span>
                                                {#if post.location}
                                                    <span
                                                        class="flex items-center gap-1"
                                                    >
                                                        <svg
                                                            class="w-4 h-4"
                                                            fill="none"
                                                            stroke="currentColor"
                                                            viewBox="0 0 24 24"
                                                        >
                                                            <path
                                                                stroke-linecap="round"
                                                                stroke-linejoin="round"
                                                                stroke-width="2"
                                                                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                                                            ></path>
                                                        </svg>
                                                        {post.location}
                                                    </span>
                                                {/if}
                                            </div>
                                        </div>
                                    </div>
                                {/each}
                            </div>
                        {/if}
                    </div>
                {/if}

                <!-- Profile Tab (Personal Info) -->
                {#if activeTab === "profile"}
                    <div in:fade={{ duration: 200 }} class="max-w-2xl mx-auto">
                        <div
                            class="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden transition-colors"
                        >
                            <div class="p-6 md:p-8 space-y-8">
                                <!-- Personal Info -->
                                <div class="space-y-6">
                                    <h2
                                        class="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2"
                                    >
                                        <User class="w-5 h-5 text-indigo-500" />
                                        {$_(
                                            "profile.settings.personal_info.title",
                                        )}
                                    </h2>
                                    <div
                                        class="grid grid-cols-1 gap-y-6 gap-x-4"
                                    >
                                        <!-- Name fields -->
                                        <div>
                                            <label
                                                for="firstName"
                                                class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                                                >{$_("auth.first_name")}
                                                <span class="text-red-500"
                                                    >*</span
                                                ></label
                                            >
                                            <input
                                                type="text"
                                                id="firstName"
                                                bind:value={userFirstName}
                                                required
                                                class="block w-full rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 transition-shadow py-2.5 px-3 border"
                                                placeholder={$_(
                                                    "auth.first_name_placeholder",
                                                )}
                                            />
                                        </div>

                                        <div class="grid grid-cols-2 gap-4">
                                            <div>
                                                <label
                                                    for="lastName"
                                                    class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                                                    >{$_("auth.last_name")}
                                                    <span class="text-red-500"
                                                        >*</span
                                                    ></label
                                                >
                                                <input
                                                    type="text"
                                                    id="lastName"
                                                    bind:value={userLastName}
                                                    required
                                                    class="block w-full rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 transition-shadow py-2.5 px-3 border"
                                                    placeholder={$_(
                                                        "auth.last_name_placeholder",
                                                    )}
                                                />
                                            </div>
                                            <div>
                                                <label
                                                    for="secondLastName"
                                                    class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                                                    >{$_(
                                                        "auth.second_last_name",
                                                    )}</label
                                                >
                                                <input
                                                    type="text"
                                                    id="secondLastName"
                                                    bind:value={
                                                        userSecondLastName
                                                    }
                                                    class="block w-full rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 transition-shadow py-2.5 px-3 border"
                                                    placeholder={$_(
                                                        "auth.second_last_name_placeholder",
                                                    )}
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <label
                                                for="email"
                                                class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                                                >{$_(
                                                    "profile.settings.personal_info.email",
                                                )}</label
                                            >
                                            <input
                                                type="email"
                                                id="email"
                                                value={auth.user?.email || ""}
                                                class="block w-full rounded-lg border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-400 shadow-sm py-2.5 px-3 border cursor-not-allowed"
                                                readonly
                                            />
                                        </div>

                                        <div>
                                            <label
                                                for="timezone"
                                                class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                                                >{$_(
                                                    "profile.settings.personal_info.timezone",
                                                )}</label
                                            >
                                            <input
                                                type="text"
                                                id="timezone"
                                                bind:value={userTimezone}
                                                class="block w-full rounded-lg border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-400 shadow-sm py-2.5 px-3 border cursor-not-allowed"
                                                placeholder={$_(
                                                    "profile.settings.personal_info.timezone_placeholder",
                                                )}
                                                readonly
                                            />
                                        </div>

                                        <!-- Hidden input kept to ensure value is submitted consistently -->
                                        <input
                                            type="hidden"
                                            bind:value={userTimezone}
                                        />
                                    </div>
                                </div>

                                <div
                                    class="border-t border-gray-100 dark:border-gray-700"
                                ></div>

                                <!-- Address -->
                                <div class="space-y-6">
                                    <h2
                                        class="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2"
                                    >
                                        <MapPin
                                            class="w-5 h-5 text-indigo-500"
                                        />
                                        {$_("profile.settings.location.title")}
                                    </h2>
                                    <div class="space-y-4">
                                        <div>
                                            <label
                                                for="address-search"
                                                class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                                                >{$_(
                                                    "profile.settings.location.search_label",
                                                )}</label
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
                                                            e.currentTarget
                                                                .value,
                                                        )}
                                                    class="block w-full rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 transition-shadow py-2.5 pl-10 pr-4 border"
                                                    placeholder={$_(
                                                        "profile.settings.location.search_placeholder",
                                                    )}
                                                />
                                                <!-- Search Results Dropdown -->
                                                {#if searchResults.length > 0}
                                                    <div
                                                        class="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-600"
                                                    >
                                                        {#each searchResults as result}
                                                            <button
                                                                type="button"
                                                                class="w-full text-left px-4 py-2 hover:bg-indigo-50 dark:hover:bg-gray-700 text-sm text-gray-700 dark:text-gray-300 flex items-center gap-2"
                                                                onclick={() =>
                                                                    selectAddress(
                                                                        result,
                                                                    )}
                                                            >
                                                                <MapPin
                                                                    class="w-4 h-4 text-gray-400"
                                                                />
                                                                <span
                                                                    class="truncate"
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
                                                class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                                                >{$_(
                                                    "profile.settings.location.street",
                                                )}</label
                                            >
                                            <input
                                                type="text"
                                                id="street"
                                                bind:value={userAddress.street}
                                                class="block w-full rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 transition-shadow py-2.5 px-3 border"
                                            />
                                        </div>
                                        <div class="grid grid-cols-2 gap-4">
                                            <div>
                                                <label
                                                    for="city"
                                                    class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                                                    >{$_(
                                                        "profile.settings.location.city",
                                                    )}</label
                                                >
                                                <input
                                                    type="text"
                                                    id="city"
                                                    bind:value={
                                                        userAddress.city
                                                    }
                                                    class="block w-full rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 transition-shadow py-2.5 px-3 border"
                                                />
                                            </div>
                                            <div>
                                                <label
                                                    for="state"
                                                    class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                                                    >{$_(
                                                        "profile.settings.location.state",
                                                    )}</label
                                                >
                                                <input
                                                    type="text"
                                                    id="state"
                                                    bind:value={
                                                        userAddress.state
                                                    }
                                                    class="block w-full rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 transition-shadow py-2.5 px-3 border"
                                                />
                                            </div>
                                        </div>
                                        <div class="grid grid-cols-2 gap-4">
                                            <div>
                                                <label
                                                    for="zip"
                                                    class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                                                    >{$_(
                                                        "profile.settings.location.zip",
                                                    )}</label
                                                >
                                                <input
                                                    type="text"
                                                    id="zip"
                                                    bind:value={
                                                        userAddress.zipCode
                                                    }
                                                    class="block w-full rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 transition-shadow py-2.5 px-3 border"
                                                />
                                            </div>
                                            <div>
                                                <label
                                                    for="country"
                                                    class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                                                    >{$_(
                                                        "profile.settings.location.country",
                                                    )}</label
                                                >
                                                <input
                                                    type="text"
                                                    id="country"
                                                    bind:value={
                                                        userAddress.country
                                                    }
                                                    class="block w-full rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 transition-shadow py-2.5 px-3 border"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div
                                class="bg-gray-50 dark:bg-gray-800/50 px-6 py-4 flex justify-end gap-3 border-t border-gray-200 dark:border-gray-700"
                            >
                                <div
                                    class="text-xs text-gray-500 dark:text-gray-400 flex items-center"
                                >
                                    {#if isSaving}
                                        {$_("profile.settings.status.saving")}
                                    {:else if isDirty}
                                        {$_("profile.settings.status.unsaved")}
                                    {:else}
                                        {$_("profile.settings.status.saved")}
                                    {/if}
                                </div>
                                <button
                                    onclick={resetProfile}
                                    class="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                                    disabled={!isDirty || isSaving}
                                >
                                    {$_("profile.settings.buttons.cancel")}
                                </button>
                                <button
                                    onclick={handleUpdateProfile}
                                    class="px-6 py-2 text-sm font-medium text-white bg-gray-900 dark:bg-indigo-600 rounded-lg hover:bg-black dark:hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 dark:focus:ring-indigo-500 shadow-sm transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                                    disabled={!isDirty || isSaving}
                                >
                                    {isSaving
                                        ? $_("profile.settings.buttons.saving")
                                        : $_("profile.settings.buttons.save")}
                                </button>
                            </div>
                        </div>
                    </div>
                {/if}

                <!-- Saved Posts Tab -->
                {#if activeTab === "saved"}
                    <div in:fade={{ duration: 200 }}>
                        <div class="flex justify-between items-center mb-6">
                            <h2
                                class="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2"
                            >
                                <Bookmark class="w-5 h-5 text-indigo-500" />
                                {$_("profile.saved.title")}
                            </h2>
                            <span
                                class="text-sm text-gray-500 dark:text-gray-400"
                                >{$_("profile.saved.count", {
                                    values: { count: savedPosts.length },
                                })}</span
                            >
                        </div>

                        {#if loadingSavedPosts}
                            <div class="flex justify-center py-12">
                                <div
                                    class="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"
                                ></div>
                            </div>
                        {:else if savedPosts.length === 0}
                            <div
                                class="text-center py-16 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-dashed border-gray-300 dark:border-gray-600"
                            >
                                <div
                                    class="mx-auto h-16 w-16 text-gray-400 mb-4 bg-gray-50 dark:bg-gray-700 rounded-full flex items-center justify-center"
                                >
                                    <Bookmark class="w-8 h-8" />
                                </div>
                                <h3
                                    class="mt-2 text-sm font-medium text-gray-900 dark:text-white"
                                >
                                    {$_("profile.saved.empty_title")}
                                </h3>
                                <p
                                    class="mt-1 text-sm text-gray-500 dark:text-gray-400"
                                >
                                    {$_("profile.saved.empty_desc")}
                                </p>
                                <div class="mt-6">
                                    <a
                                        href="/"
                                        class="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none"
                                    >
                                        {$_("profile.saved.browse_btn")}
                                    </a>
                                </div>
                            </div>
                        {:else}
                            <div class="space-y-4">
                                {#each savedPosts as post}
                                    <a
                                        href="/post/{post.id}"
                                        class="block bg-white dark:bg-gray-800 rounded-2xl shadow-sm hover:shadow-md transition-shadow border border-gray-100 dark:border-gray-700 overflow-hidden"
                                    >
                                        <div class="p-5">
                                            <div
                                                class="flex items-start justify-between gap-4"
                                            >
                                                <div class="flex-1">
                                                    <div
                                                        class="flex items-center gap-2 mb-2"
                                                    >
                                                        <span
                                                            class="text-xs px-2 py-0.5 rounded-full font-medium {post.postType ===
                                                            'adopt'
                                                                ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                                                                : post.postType ===
                                                                    'missing'
                                                                  ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                                                                  : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'}"
                                                        >
                                                            {post.postType ===
                                                            "adopt"
                                                                ? $_(
                                                                      "profile.posts.types.adopt",
                                                                  )
                                                                : post.postType ===
                                                                    "missing"
                                                                  ? $_(
                                                                        "profile.posts.types.missing",
                                                                    )
                                                                  : $_(
                                                                        "profile.posts.types.default",
                                                                    )}
                                                        </span>
                                                        <span
                                                            class="text-xs text-gray-500 dark:text-gray-400"
                                                        >
                                                            {$_(
                                                                "profile.saved.by",
                                                            )}
                                                            {post.author
                                                                ?.fullName ||
                                                                $_(
                                                                    "common.unknown",
                                                                )}
                                                        </span>
                                                    </div>
                                                    <h3
                                                        class="font-semibold text-gray-900 dark:text-white mb-1"
                                                    >
                                                        {post.title}
                                                    </h3>
                                                    <p
                                                        class="text-sm text-gray-600 dark:text-gray-400 line-clamp-2"
                                                    >
                                                        {stripHtml(
                                                            post.description,
                                                        )}
                                                    </p>
                                                </div>
                                                {#if post.images && post.images.length > 0}
                                                    <img
                                                        src={post.images[0]}
                                                        alt=""
                                                        class="w-20 h-20 rounded-xl object-cover flex-shrink-0"
                                                    />
                                                {/if}
                                            </div>
                                        </div>
                                    </a>
                                {/each}
                            </div>
                        {/if}
                    </div>
                {/if}

                <!-- Liked Posts Tab -->
                {#if activeTab === "liked"}
                    <div in:fade={{ duration: 200 }}>
                        <div class="flex justify-between items-center mb-6">
                            <h2
                                class="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2"
                            >
                                <Heart class="w-5 h-5 text-red-500" />
                                {$_("profile.liked.title")}
                            </h2>
                            <span
                                class="text-sm text-gray-500 dark:text-gray-400"
                                >{$_("profile.liked.count", {
                                    values: { count: likedPosts.length },
                                })}</span
                            >
                        </div>

                        {#if loadingLikedPosts}
                            <div class="flex justify-center py-12">
                                <div
                                    class="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"
                                ></div>
                            </div>
                        {:else if likedPosts.length === 0}
                            <div
                                class="text-center py-16 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-dashed border-gray-300 dark:border-gray-600"
                            >
                                <div
                                    class="mx-auto h-16 w-16 text-gray-400 mb-4 bg-gray-50 dark:bg-gray-700 rounded-full flex items-center justify-center"
                                >
                                    <Heart class="w-8 h-8" />
                                </div>
                                <h3
                                    class="mt-2 text-sm font-medium text-gray-900 dark:text-white"
                                >
                                    {$_("profile.liked.empty_title")}
                                </h3>
                                <p
                                    class="mt-1 text-sm text-gray-500 dark:text-gray-400"
                                >
                                    {$_("profile.liked.empty_desc")}
                                </p>
                                <div class="mt-6">
                                    <a
                                        href="/"
                                        class="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none"
                                    >
                                        {$_("profile.liked.browse_btn")}
                                    </a>
                                </div>
                            </div>
                        {:else}
                            <div class="space-y-4">
                                {#each likedPosts as post}
                                    <a
                                        href="/post/{post.id}"
                                        class="block bg-white dark:bg-gray-800 rounded-2xl shadow-sm hover:shadow-md transition-shadow border border-gray-100 dark:border-gray-700 overflow-hidden"
                                    >
                                        <div class="p-5">
                                            <div
                                                class="flex items-start justify-between gap-4"
                                            >
                                                <div class="flex-1">
                                                    <div
                                                        class="flex items-center gap-2 mb-2"
                                                    >
                                                        <span
                                                            class="text-xs px-2 py-0.5 rounded-full font-medium {post.postType ===
                                                            'adopt'
                                                                ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                                                                : post.postType ===
                                                                    'missing'
                                                                  ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                                                                  : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'}"
                                                        >
                                                            {post.postType ===
                                                            "adopt"
                                                                ? $_(
                                                                      "profile.posts.types.adopt",
                                                                  )
                                                                : post.postType ===
                                                                    "missing"
                                                                  ? $_(
                                                                        "profile.posts.types.missing",
                                                                    )
                                                                  : $_(
                                                                        "profile.posts.types.default",
                                                                    )}
                                                        </span>
                                                        <span
                                                            class="text-xs text-gray-500 dark:text-gray-400"
                                                        >
                                                            {$_(
                                                                "profile.liked.by",
                                                            )}
                                                            {post.author
                                                                ?.fullName ||
                                                                $_(
                                                                    "common.unknown",
                                                                )}
                                                        </span>
                                                    </div>
                                                    <h3
                                                        class="font-semibold text-gray-900 dark:text-white mb-1"
                                                    >
                                                        {post.title}
                                                    </h3>
                                                    <p
                                                        class="text-sm text-gray-600 dark:text-gray-400 line-clamp-2"
                                                    >
                                                        {stripHtml(
                                                            post.description,
                                                        )}
                                                    </p>
                                                </div>
                                                {#if post.images && post.images.length > 0}
                                                    <img
                                                        src={post.images[0]}
                                                        alt=""
                                                        class="w-20 h-20 rounded-xl object-cover flex-shrink-0"
                                                    />
                                                {/if}
                                            </div>
                                        </div>
                                    </a>
                                {/each}
                            </div>
                        {/if}
                    </div>
                {/if}

                <!-- App Settings Tab -->
                {#if activeTab === "settings"}
                    <div
                        in:fade={{ duration: 200 }}
                        class="max-w-2xl mx-auto space-y-6"
                    >
                        <!-- Account Verification Section -->
                        <div
                            class="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 transition-colors"
                        >
                            <div class="p-6 md:p-8 space-y-6">
                                <div class="flex items-center gap-3">
                                    <div
                                        class="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl flex items-center justify-center"
                                    >
                                        <Shield
                                            class="w-5 h-5 text-indigo-600 dark:text-indigo-400"
                                        />
                                    </div>
                                    <div>
                                        <h2
                                            class="text-xl font-bold text-gray-900 dark:text-white"
                                        >
                                            {$_("settings.verification.title")}
                                        </h2>
                                        <p
                                            class="text-sm text-gray-500 dark:text-gray-400"
                                        >
                                            {$_(
                                                "settings.verification.subtitle",
                                            )}
                                        </p>
                                    </div>
                                </div>

                                <!-- Email Verification -->
                                <div
                                    class="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl space-y-4"
                                >
                                    <div
                                        class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
                                    >
                                        <div class="flex items-center gap-3">
                                            <div
                                                class="w-10 h-10 shrink-0 bg-white dark:bg-gray-800 rounded-lg flex items-center justify-center border border-gray-200 dark:border-gray-600"
                                            >
                                                <Mail
                                                    class="w-5 h-5 text-gray-600 dark:text-gray-400"
                                                />
                                            </div>
                                            <div class="min-w-0">
                                                <p
                                                    class="font-medium text-gray-900 dark:text-white"
                                                >
                                                    {$_(
                                                        "settings.verification.email",
                                                    )}
                                                </p>
                                                <p
                                                    class="text-sm text-gray-500 dark:text-gray-400 truncate"
                                                >
                                                    {auth.user?.email}
                                                </p>
                                            </div>
                                        </div>
                                        <div
                                            class="flex items-center gap-2 sm:shrink-0"
                                        >
                                            {#if emailVerified}
                                                <span
                                                    class="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                                                >
                                                    <CheckCircle
                                                        class="w-3.5 h-3.5"
                                                    />
                                                    {$_(
                                                        "settings.verification.verified",
                                                    )}
                                                </span>
                                            {:else}
                                                <span
                                                    class="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                                                >
                                                    <XCircle
                                                        class="w-3.5 h-3.5"
                                                    />
                                                    {$_(
                                                        "settings.verification.not_verified",
                                                    )}
                                                </span>
                                                {#if !emailCodeSent}
                                                    <button
                                                        onclick={async () => {
                                                            sendingEmailCode = true;
                                                            try {
                                                                const res =
                                                                    await fetch(
                                                                        "/api/graphql",
                                                                        {
                                                                            method: "POST",
                                                                            headers:
                                                                                {
                                                                                    "Content-Type":
                                                                                        "application/json",
                                                                                    Authorization: `Bearer ${auth.token}`,
                                                                                },
                                                                            body: JSON.stringify(
                                                                                {
                                                                                    query: `mutation { sendEmailVerification }`,
                                                                                },
                                                                            ),
                                                                        },
                                                                    );
                                                                const result =
                                                                    await res.json();
                                                                if (
                                                                    result.errors
                                                                )
                                                                    throw new Error(
                                                                        result.errors[0].message,
                                                                    );
                                                                emailCodeSent = true;
                                                                emailResendCooldown = 60; // Start 60s cooldown
                                                                toast.success(
                                                                    $_(
                                                                        "settings.verification.email_sent",
                                                                    ),
                                                                );
                                                            } catch (e: any) {
                                                                toast.error(
                                                                    e.message,
                                                                );
                                                            } finally {
                                                                sendingEmailCode = false;
                                                            }
                                                        }}
                                                        disabled={sendingEmailCode}
                                                        class="px-3 py-1.5 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-1.5"
                                                    >
                                                        {#if sendingEmailCode}
                                                            <div
                                                                class="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"
                                                            ></div>
                                                            {$_(
                                                                "settings.verification.sending",
                                                            )}
                                                        {:else}
                                                            {$_(
                                                                "settings.verification.send_code",
                                                            )}
                                                        {/if}
                                                    </button>
                                                {/if}
                                            {/if}
                                        </div>
                                    </div>

                                    <!-- Code Input (shown after sending) -->
                                    {#if emailCodeSent && !emailVerified}
                                        <div
                                            class="pt-4 border-t border-gray-200 dark:border-gray-600 space-y-4"
                                        >
                                            <!-- Success message -->
                                            <div
                                                class="flex items-start gap-3 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg"
                                            >
                                                <CheckCircle
                                                    class="w-5 h-5 text-green-600 dark:text-green-400 shrink-0 mt-0.5"
                                                />
                                                <div>
                                                    <p
                                                        class="text-sm font-medium text-green-800 dark:text-green-300"
                                                    >
                                                        {$_(
                                                            "settings.verification.email_sent",
                                                        )}
                                                    </p>
                                                    <p
                                                        class="text-xs text-green-600 dark:text-green-400 mt-0.5"
                                                    >
                                                        {$_(
                                                            "settings.verification.code_expires",
                                                            {
                                                                values: {
                                                                    minutes: 15,
                                                                },
                                                            },
                                                        )}
                                                    </p>
                                                </div>
                                            </div>

                                            <!-- Code input and verify button -->
                                            <div
                                                class="flex flex-col sm:flex-row gap-3"
                                            >
                                                <div class="flex-1">
                                                    <label
                                                        class="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5"
                                                        >{$_(
                                                            "settings.verification.enter_code",
                                                        )}</label
                                                    >
                                                    <input
                                                        type="text"
                                                        bind:value={
                                                            emailVerificationCode
                                                        }
                                                        placeholder={$_(
                                                            "settings.verification.code_placeholder",
                                                        )}
                                                        maxlength="6"
                                                        class="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-center text-xl tracking-[0.5em] font-mono focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                                                        oninput={(e) => {
                                                            // Only allow numbers
                                                            const target =
                                                                e.target as HTMLInputElement;
                                                            target.value =
                                                                target.value.replace(
                                                                    /[^0-9]/g,
                                                                    "",
                                                                );
                                                            emailVerificationCode =
                                                                target.value;
                                                        }}
                                                    />
                                                </div>
                                                <div class="sm:self-end">
                                                    <button
                                                        onclick={async () => {
                                                            if (
                                                                !emailVerificationCode.trim() ||
                                                                emailVerificationCode.length !==
                                                                    6
                                                            ) {
                                                                toast.error(
                                                                    $_(
                                                                        "settings.verification.invalid_code",
                                                                    ),
                                                                );
                                                                return;
                                                            }
                                                            verifyingEmail = true;
                                                            try {
                                                                const res =
                                                                    await fetch(
                                                                        "/api/graphql",
                                                                        {
                                                                            method: "POST",
                                                                            headers:
                                                                                {
                                                                                    "Content-Type":
                                                                                        "application/json",
                                                                                    Authorization: `Bearer ${auth.token}`,
                                                                                },
                                                                            body: JSON.stringify(
                                                                                {
                                                                                    query: `mutation VerifyEmail($code: String!) { verifyEmail(code: $code) { id emailVerified } }`,
                                                                                    variables:
                                                                                        {
                                                                                            code: emailVerificationCode,
                                                                                        },
                                                                                },
                                                                            ),
                                                                        },
                                                                    );
                                                                const result =
                                                                    await res.json();
                                                                if (
                                                                    result.errors
                                                                )
                                                                    throw new Error(
                                                                        result.errors[0].message,
                                                                    );
                                                                emailVerified = true;
                                                                emailCodeSent = false;
                                                                emailVerificationCode =
                                                                    "";
                                                                emailResendCooldown = 0;
                                                                auth.updateUser(
                                                                    {
                                                                        emailVerified: true,
                                                                    },
                                                                );
                                                                toast.success(
                                                                    $_(
                                                                        "settings.verification.email_verified_success",
                                                                    ),
                                                                );
                                                            } catch (e: any) {
                                                                toast.error(
                                                                    e.message,
                                                                );
                                                            } finally {
                                                                verifyingEmail = false;
                                                            }
                                                        }}
                                                        disabled={verifyingEmail ||
                                                            emailVerificationCode.length !==
                                                                6}
                                                        class="w-full sm:w-auto px-6 py-3 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap flex items-center justify-center gap-2"
                                                    >
                                                        {#if verifyingEmail}
                                                            <div
                                                                class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"
                                                            ></div>
                                                            {$_(
                                                                "settings.verification.verifying",
                                                            )}
                                                        {:else}
                                                            {$_(
                                                                "settings.verification.verify_code",
                                                            )}
                                                        {/if}
                                                    </button>
                                                </div>
                                            </div>

                                            <!-- Resend with cooldown -->
                                            <div
                                                class="flex items-center justify-center pt-2"
                                            >
                                                {#if emailResendCooldown > 0}
                                                    <p
                                                        class="text-sm text-gray-500 dark:text-gray-400"
                                                    >
                                                        {$_(
                                                            "settings.verification.resend_code",
                                                        )}
                                                        <span
                                                            class="font-mono font-medium text-gray-700 dark:text-gray-300"
                                                            >({emailResendCooldown}s)</span
                                                        >
                                                    </p>
                                                {:else}
                                                    <button
                                                        onclick={async () => {
                                                            sendingEmailCode = true;
                                                            try {
                                                                const res =
                                                                    await fetch(
                                                                        "/api/graphql",
                                                                        {
                                                                            method: "POST",
                                                                            headers:
                                                                                {
                                                                                    "Content-Type":
                                                                                        "application/json",
                                                                                    Authorization: `Bearer ${auth.token}`,
                                                                                },
                                                                            body: JSON.stringify(
                                                                                {
                                                                                    query: `mutation { resendEmailVerification }`,
                                                                                },
                                                                            ),
                                                                        },
                                                                    );
                                                                const result =
                                                                    await res.json();
                                                                if (
                                                                    result.errors
                                                                )
                                                                    throw new Error(
                                                                        result.errors[0].message,
                                                                    );
                                                                emailResendCooldown = 60; // Restart 60s cooldown
                                                                toast.success(
                                                                    $_(
                                                                        "settings.verification.email_sent",
                                                                    ),
                                                                );
                                                            } catch (e: any) {
                                                                toast.error(
                                                                    e.message,
                                                                );
                                                            } finally {
                                                                sendingEmailCode = false;
                                                            }
                                                        }}
                                                        disabled={sendingEmailCode}
                                                        class="text-sm text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 font-medium disabled:opacity-50 flex items-center gap-1.5"
                                                    >
                                                        {#if sendingEmailCode}
                                                            <div
                                                                class="w-3 h-3 border-2 border-indigo-600/30 border-t-indigo-600 rounded-full animate-spin"
                                                            ></div>
                                                        {/if}
                                                        {$_(
                                                            "settings.verification.resend_code",
                                                        )}
                                                    </button>
                                                {/if}
                                            </div>
                                        </div>
                                    {/if}
                                </div>

                                <!-- Phone Verification -->
                                <!-- <div class="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl space-y-4">
                            <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                <div class="flex items-center gap-3">
                                    <div class="w-10 h-10 shrink-0 bg-white dark:bg-gray-800 rounded-lg flex items-center justify-center border border-gray-200 dark:border-gray-600">
                                        <Phone class="w-5 h-5 text-gray-600 dark:text-gray-400" />
                                    </div>
                                    <div class="min-w-0">
                                        <p class="font-medium text-gray-900 dark:text-white">{$_("settings.verification.phone")}</p>
                                        <p class="text-sm text-gray-500 dark:text-gray-400 truncate">
                                            {#if selectedCountry && phoneNumber}
                                                {getCountryFlag(selectedCountry.flag, selectedCountry.alpha2)} +{selectedCountry.phoneCode} {phoneNumber}
                                            {:else}
                                                {$_("settings.verification.no_phone")}
                                            {/if}
                                        </p>
                                    </div>
                                </div>
                                {#if phoneVerified}
                                    <span class="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 sm:shrink-0">
                                        <CheckCircle class="w-3.5 h-3.5" />
                                        {$_("settings.verification.verified")}
                                    </span>
                                {/if}
                            </div>

                            {#if !phoneVerified}
                                {#if !phoneCodeSent}
                                    <div class="flex flex-col sm:flex-row gap-2 sm:items-end">
                                        <div class="flex-1">
                                            <CountryPhoneSelect
                                                {countries}
                                                bind:selectedCountry
                                                bind:phoneNumber
                                                placeholder="123 456 7890"
                                                disabled={loadingCountries}
                                            />
                                        </div>
                                        <button
                                            onclick={handlePhoneSave}
                                            disabled={sendingPhoneCode || !phoneNumber || !selectedCountry || settingsActionLoading === "phone"}
                                            class="w-full sm:w-auto px-4 py-2.5 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                                        >
                                            {sendingPhoneCode ? $_("settings.verification.sending") : $_("settings.verification.send_sms")}
                                        </button>
                                    </div>
                                    <p class="text-xs text-gray-500 dark:text-gray-400">{$_("settings.verification.phone_hint")}</p>
                                {:else}
                                    <div class="space-y-3">
                                        <div class="flex flex-col sm:flex-row gap-2">
                                            <input
                                                type="text"
                                                bind:value={phoneVerificationCode}
                                                placeholder={$_("settings.verification.enter_code")}
                                                maxlength="6"
                                                class="flex-1 px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg text-center text-lg font-mono tracking-widest focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                            />
                                            <button
                                                onclick={handleVerifyPhone}
                                                disabled={verifyingPhone || phoneVerificationCode.length !== 6}
                                                class="px-4 py-2.5 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap flex items-center justify-center gap-2"
                                            >
                                                {#if verifyingPhone}
                                                    <div class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                                    {$_("settings.verification.verifying")}
                                                {:else}
                                                    {$_("settings.verification.verify_code")}
                                                {/if}
                                            </button>
                                        </div>

                                        <div class="flex items-center justify-center">
                                            {#if phoneResendCooldown > 0}
                                                <p class="text-sm text-gray-500 dark:text-gray-400">
                                                    {$_("settings.verification.resend_code")}
                                                    <span class="font-mono font-medium text-gray-700 dark:text-gray-300">({phoneResendCooldown}s)</span>
                                                </p>
                                            {:else}
                                                <button
                                                    onclick={handleResendPhoneCode}
                                                    disabled={sendingPhoneCode}
                                                    class="text-sm text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 font-medium disabled:opacity-50 flex items-center gap-1.5"
                                                >
                                                    {#if sendingPhoneCode}
                                                        <div class="w-3 h-3 border-2 border-indigo-600/30 border-t-indigo-600 rounded-full animate-spin"></div>
                                                    {/if}
                                                    {$_("settings.verification.resend_code")}
                                                </button>
                                            {/if}
                                        </div>

                                        <div class="text-center">
                                            <button
                                                onclick={() => { phoneCodeSent = false; phoneVerificationCode = ""; }}
                                                class="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                                            >
                                                {$_("settings.verification.change_number")}
                                            </button>
                                        </div>
                                    </div>
                                {/if}
                            {/if}
                        </div> -->
                            </div>
                        </div>

                        <!-- Appearance Section -->
                        <div
                            class="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden transition-colors"
                        >
                            <div class="p-6 md:p-8 space-y-6">
                                <div class="flex items-center gap-3">
                                    <div
                                        class="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center"
                                    >
                                        {#if theme.isDark}
                                            <Moon
                                                class="w-5 h-5 text-purple-600 dark:text-purple-400"
                                            />
                                        {:else}
                                            <Sun
                                                class="w-5 h-5 text-purple-600 dark:text-purple-400"
                                            />
                                        {/if}
                                    </div>
                                    <div>
                                        <h2
                                            class="text-xl font-bold text-gray-900 dark:text-white"
                                        >
                                            {$_("settings.appearance.title")}
                                        </h2>
                                        <p
                                            class="text-sm text-gray-500 dark:text-gray-400"
                                        >
                                            {$_("settings.appearance.subtitle")}
                                        </p>
                                    </div>
                                </div>

                                <!-- Theme Selection -->
                                <div class="grid grid-cols-3 gap-3">
                                    <button
                                        onclick={() =>
                                            handleThemeChange("light")}
                                        disabled={settingsActionLoading ===
                                            "theme"}
                                        class="p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2
                                    {userTheme === 'light'
                                            ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30'
                                            : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 bg-white dark:bg-gray-700'}
                                    disabled:opacity-60 disabled:cursor-not-allowed"
                                    >
                                        <div
                                            class="w-10 h-10 bg-white border border-gray-200 rounded-lg flex items-center justify-center shadow-sm"
                                        >
                                            <Sun
                                                class="w-5 h-5 text-amber-500"
                                            />
                                        </div>
                                        <span
                                            class="text-sm font-medium {userTheme ===
                                            'light'
                                                ? 'text-indigo-600 dark:text-indigo-400'
                                                : 'text-gray-700 dark:text-gray-300'}"
                                        >
                                            {$_("settings.appearance.light")}
                                        </span>
                                    </button>

                                    <button
                                        onclick={() =>
                                            handleThemeChange("dark")}
                                        disabled={settingsActionLoading ===
                                            "theme"}
                                        class="p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2
                                    {userTheme === 'dark'
                                            ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30'
                                            : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 bg-white dark:bg-gray-700'}
                                    disabled:opacity-60 disabled:cursor-not-allowed"
                                    >
                                        <div
                                            class="w-10 h-10 bg-gray-900 rounded-lg flex items-center justify-center shadow-sm"
                                        >
                                            <Moon
                                                class="w-5 h-5 text-indigo-400"
                                            />
                                        </div>
                                        <span
                                            class="text-sm font-medium {userTheme ===
                                            'dark'
                                                ? 'text-indigo-600 dark:text-indigo-400'
                                                : 'text-gray-700 dark:text-gray-300'}"
                                        >
                                            {$_("settings.appearance.dark")}
                                        </span>
                                    </button>

                                    <button
                                        onclick={() =>
                                            handleThemeChange("system")}
                                        disabled={settingsActionLoading ===
                                            "theme"}
                                        class="p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2
                                    {userTheme === 'system'
                                            ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30'
                                            : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 bg-white dark:bg-gray-700'}
                                    disabled:opacity-60 disabled:cursor-not-allowed"
                                    >
                                        <div
                                            class="w-10 h-10 bg-gradient-to-br from-white to-gray-900 rounded-lg flex items-center justify-center shadow-sm border border-gray-200"
                                        >
                                            <Monitor
                                                class="w-5 h-5 text-gray-600"
                                            />
                                        </div>
                                        <span
                                            class="text-sm font-medium {userTheme ===
                                            'system'
                                                ? 'text-indigo-600 dark:text-indigo-400'
                                                : 'text-gray-700 dark:text-gray-300'}"
                                        >
                                            {$_("settings.appearance.system")}
                                        </span>
                                    </button>
                                </div>
                            </div>
                        </div>

                        <!-- Language Section -->
                        <div
                            class="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden transition-colors"
                        >
                            <div class="p-6 md:p-8 space-y-6">
                                <div class="flex items-center gap-3">
                                    <div
                                        class="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center"
                                    >
                                        <span class="text-lg">🌐</span>
                                    </div>
                                    <div>
                                        <h2
                                            class="text-xl font-bold text-gray-900 dark:text-white"
                                        >
                                            {$_("settings.language.title")}
                                        </h2>
                                        <p
                                            class="text-sm text-gray-500 dark:text-gray-400"
                                        >
                                            {$_("settings.language.subtitle")}
                                        </p>
                                    </div>
                                </div>

                                <!-- Language Selection -->
                                <div class="grid grid-cols-2 gap-3">
                                    <button
                                        onclick={() =>
                                            handleLanguageChange("en")}
                                        disabled={settingsActionLoading ===
                                            "language"}
                                        class="p-4 rounded-xl border-2 transition-all flex items-center gap-3
                                    {userLanguage === 'en'
                                            ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30'
                                            : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 bg-white dark:bg-gray-700'}
                                    disabled:opacity-60 disabled:cursor-not-allowed"
                                    >
                                        <img
                                            src="/usa.svg"
                                            alt="English"
                                            class="w-8 h-8 rounded-full object-cover shadow-sm"
                                        />
                                        <div class="text-left">
                                            <p
                                                class="font-medium {userLanguage ===
                                                'en'
                                                    ? 'text-indigo-600 dark:text-indigo-400'
                                                    : 'text-gray-900 dark:text-white'}"
                                            >
                                                English
                                            </p>
                                            <p
                                                class="text-xs text-gray-500 dark:text-gray-400"
                                            >
                                                United States
                                            </p>
                                        </div>
                                    </button>

                                    <button
                                        onclick={() =>
                                            handleLanguageChange("es")}
                                        disabled={settingsActionLoading ===
                                            "language"}
                                        class="p-4 rounded-xl border-2 transition-all flex items-center gap-3
                                    {userLanguage === 'es'
                                            ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30'
                                            : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 bg-white dark:bg-gray-700'}
                                    disabled:opacity-60 disabled:cursor-not-allowed"
                                    >
                                        <img
                                            src="/mx.svg"
                                            alt="Español"
                                            class="w-8 h-8 rounded-full object-cover shadow-sm"
                                        />
                                        <div class="text-left">
                                            <p
                                                class="font-medium {userLanguage ===
                                                'es'
                                                    ? 'text-indigo-600 dark:text-indigo-400'
                                                    : 'text-gray-900 dark:text-white'}"
                                            >
                                                Español
                                            </p>
                                            <p
                                                class="text-xs text-gray-500 dark:text-gray-400"
                                            >
                                                México
                                            </p>
                                        </div>
                                    </button>
                                </div>
                            </div>
                        </div>

                        <!-- Notifications Section - Coming Soon -->
                        <div
                            class="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden transition-colors opacity-75"
                        >
                            <div class="p-6 md:p-8 space-y-5">
                                <div class="flex items-center gap-3 mb-1">
                                    <div
                                        class="w-10 h-10 bg-orange-100 dark:bg-orange-900/30 rounded-xl flex items-center justify-center"
                                    >
                                        <Bell
                                            class="w-5 h-5 text-orange-600 dark:text-orange-400"
                                        />
                                    </div>
                                    <div class="flex-1">
                                        <div class="flex items-center gap-2">
                                            <h2
                                                class="text-xl font-bold text-gray-900 dark:text-white"
                                            >
                                                {$_(
                                                    "settings.notifications.title",
                                                )}
                                            </h2>
                                            <span
                                                class="px-2 py-0.5 text-xs font-semibold bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 rounded-full"
                                            >
                                                {$_("common.coming_soon")}
                                            </span>
                                        </div>
                                        <p
                                            class="text-sm text-gray-500 dark:text-gray-400"
                                        >
                                            {$_(
                                                "settings.notifications.subtitle",
                                            )}
                                        </p>
                                    </div>
                                </div>

                                <div class="space-y-3">
                                    <label
                                        class="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-700/50 cursor-not-allowed"
                                    >
                                        <span
                                            class="text-sm font-medium text-gray-400 dark:text-gray-500"
                                            >Email</span
                                        >
                                        <input
                                            type="checkbox"
                                            checked={notificationSettings.email}
                                            disabled={true}
                                            class="cursor-not-allowed"
                                        />
                                    </label>
                                    <label
                                        class="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-700/50 cursor-not-allowed"
                                    >
                                        <span
                                            class="text-sm font-medium text-gray-400 dark:text-gray-500"
                                            >Push</span
                                        >
                                        <input
                                            type="checkbox"
                                            checked={notificationSettings.push}
                                            disabled={true}
                                            class="cursor-not-allowed"
                                        />
                                    </label>
                                    <label
                                        class="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-700/50 cursor-not-allowed"
                                    >
                                        <span
                                            class="text-sm font-medium text-gray-400 dark:text-gray-500"
                                            >SMS</span
                                        >
                                        <input
                                            type="checkbox"
                                            checked={notificationSettings.sms}
                                            disabled={true}
                                            class="cursor-not-allowed"
                                        />
                                    </label>
                                    <label
                                        class="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-700/50 cursor-not-allowed"
                                    >
                                        <span
                                            class="text-sm font-medium text-gray-400 dark:text-gray-500"
                                            >New messages</span
                                        >
                                        <input
                                            type="checkbox"
                                            checked={notificationSettings.newMessages}
                                            disabled={true}
                                            class="cursor-not-allowed"
                                        />
                                    </label>
                                    <label
                                        class="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-700/50 cursor-not-allowed"
                                    >
                                        <span
                                            class="text-sm font-medium text-gray-400 dark:text-gray-500"
                                            >Adoption updates</span
                                        >
                                        <input
                                            type="checkbox"
                                            checked={notificationSettings.adoptionUpdates}
                                            disabled={true}
                                            class="cursor-not-allowed"
                                        />
                                    </label>
                                    <label
                                        class="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-700/50 cursor-not-allowed"
                                    >
                                        <span
                                            class="text-sm font-medium text-gray-400 dark:text-gray-500"
                                            >Newsletter</span
                                        >
                                        <input
                                            type="checkbox"
                                            checked={notificationSettings.newsletter}
                                            disabled={true}
                                            class="cursor-not-allowed"
                                        />
                                    </label>
                                </div>
                            </div>
                        </div>

                        <!-- Delete Account Section -->
                        <div
                            class="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-red-200 dark:border-red-900/50 overflow-hidden transition-colors"
                        >
                            <div class="p-6 md:p-8">
                                <div
                                    class="flex flex-col sm:flex-row sm:items-center gap-4"
                                >
                                    <div class="flex items-start gap-4 flex-1">
                                        <div
                                            class="flex-shrink-0 w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-xl flex items-center justify-center"
                                        >
                                            <AlertTriangle
                                                class="w-6 h-6 text-red-600 dark:text-red-400"
                                            />
                                        </div>
                                        <div class="flex-1">
                                            <h2
                                                class="text-xl font-bold text-red-600 dark:text-red-400 mb-1"
                                            >
                                                {$_(
                                                    "profile.settings.delete.title",
                                                )}
                                            </h2>
                                            <p
                                                class="text-gray-600 dark:text-gray-300 text-sm"
                                            >
                                                {$_(
                                                    "profile.settings.delete.desc",
                                                )}
                                            </p>
                                        </div>
                                    </div>
                                    <div class="sm:flex-shrink-0 sm:ml-4">
                                        <button
                                            type="button"
                                            onclick={() =>
                                                (showDeleteAccountModal = true)}
                                            class="w-full sm:w-auto px-5 py-2.5 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 shadow-sm transition-colors"
                                        >
                                            {$_(
                                                "profile.settings.delete.button",
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                {/if}
            </div>
        </div>
    </div>
{/if}

<!-- Add Pet Modal -->
<AddPetModal
    bind:open={showAddModal}
    onClose={() => (showAddModal = false)}
    onPetAdded={fetchMyPets}
/>

<!-- Edit Pet Modal -->
<EditPetModal
    bind:open={showEditModal}
    pet={selectedPet}
    onClose={closeEditModal}
    onPetUpdated={fetchMyPets}
/>

<!-- Delete Pet Modal -->
<DeletePetModal
    bind:open={showDeleteModal}
    pet={selectedPet}
    onClose={closeDeleteModal}
    onPetDeleted={fetchMyPets}
/>

<!-- Delete Account Modal -->
<DeleteAccountModal
    bind:open={showDeleteAccountModal}
    onClose={() => (showDeleteAccountModal = false)}
    onConfirm={handleDeleteAccount}
    isDeleting={isDeletingAccount}
/>

<!-- Edit Post Modal -->
<EditPostModal
    bind:open={showEditPostModal}
    post={selectedPost}
    onClose={() => {
        showEditPostModal = false;
        selectedPost = null;
    }}
    onPostUpdated={(updatedPost) => {
        showEditPostModal = false;
        const postId = selectedPost?.id;
        if (postId && updatedPost) {
            // Update the post in all arrays
            userPosts = userPosts.map((p) =>
                p.id === postId ? { ...p, ...updatedPost } : p,
            );
            savedPosts = savedPosts.map((p) =>
                p.id === postId ? { ...p, ...updatedPost } : p,
            );
            likedPosts = likedPosts.map((p) =>
                p.id === postId ? { ...p, ...updatedPost } : p,
            );
        }
        selectedPost = null;
    }}
/>

<!-- Delete Post Modal -->
<DeletePostModal
    bind:open={showDeletePostModal}
    post={selectedPost}
    onClose={() => {
        showDeletePostModal = false;
        selectedPost = null;
    }}
    onPostDeleted={() => {
        showDeletePostModal = false;
        const deletedId = selectedPost?.id;
        if (deletedId) {
            userPosts = userPosts.filter((p) => p.id !== deletedId);
            savedPosts = savedPosts.filter((p) => p.id !== deletedId);
            likedPosts = likedPosts.filter((p) => p.id !== deletedId);
        }
        selectedPost = null;
    }}
/>
{/if}

<style>
    /* Hide scrollbar for tabs navigation */
    .scrollbar-hide {
        -ms-overflow-style: none;
        scrollbar-width: none;
    }
    .scrollbar-hide::-webkit-scrollbar {
        display: none;
    }
</style>
