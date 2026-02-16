<script lang="ts">
    import MultiStepModal from "./MultiStepModal.svelte";
    import AddPetModal from "./AddPetModal.svelte";
    import RichTextEditor from "./RichTextEditor.svelte";
    import { auth } from "$lib/stores/auth.svelte";
    import { toast } from "$lib/stores/toast.svelte";
    import { _ } from "$lib/i18n";
    import {
        Upload,
        X,
        Image,
        MapPin,
        Loader2,
        Video,
        FileText,
        Home,
        Search,
        Eye,
        Mail,
        Phone,
        AlertTriangle,
        PawPrint,
        Tag,
    } from "lucide-svelte";
    import VideoPlayer from "./VideoPlayer.svelte";

    interface Props {
        open: boolean;
        onClose: () => void;
        onPostCreated?: (post?: any) => void;
    }

    let { open = $bindable(false), onClose, onPostCreated }: Props = $props();

    type PostType = "post" | "adopt" | "missing";
    type ReportType = "lost" | "found";
    type PreferredContact = "phone" | "email";

    // Step management
    let currentStep = $state(0);

    // Form state
    let title = $state("");
    let description = $state("");
    let location = $state("");
    let postType = $state<PostType>("post");
    let reportType = $state<ReportType | null>(null);
    let preferredContact = $state<PreferredContact | null>(null);
    let selectedPetId = $state("");

    // User contact availability - ONLY verified contacts
    let userHasVerifiedPhone = $derived(!!auth.user?.phone && auth.user?.phoneVerified === true);
    let userHasVerifiedEmail = $derived(!!auth.user?.email && auth.user?.emailVerified === true);
    let hasAnyVerifiedContact = $derived(userHasVerifiedPhone || userHasVerifiedEmail);

    let tags = $state<string[]>([]);
    let tagInput = $state("");
    let imageFiles = $state<File[]>([]);
    let videoFile = $state<File | null>(null);
    let mediaType = $state<"images" | "video" | null>(null);
    let pets = $state<any[]>([]);
    let loading = $state(false);
    let loadingPets = $state(false);
    let hasFetchedPets = $state(false);
    let showAddPetModal = $state(false);
    let reopenAfterPet = $state(false);

    // Media constraints
    const MAX_IMAGES = 4;
    const MAX_VIDEO_SIZE_MB = 100;
    const MAX_VIDEO_DURATION_MINUTES = 5;

    // Dynamic steps based on post type
    const steps = $derived.by(() => {
        const baseSteps = [{ id: "type", title: $_("create_post.step_type") }];

        if (postType === "post") {
            return [
                ...baseSteps,
                { id: "pet", title: $_("create_post.step_pet") },
                { id: "content", title: $_("create_post.step_content") },
                { id: "media", title: $_("create_post.step_media") },
            ];
        }

        if (postType === "adopt" || (postType === "missing" && reportType === "lost")) {
            return [
                ...baseSteps,
                { id: "pet", title: $_("create_post.step_pet") },
                { id: "content", title: $_("create_post.step_content") },
                { id: "location", title: $_("create_post.step_location") },
                { id: "media", title: $_("create_post.step_media") },
            ];
        }

        // Found pet or missing without reportType yet - include location step
        if (postType === "missing") {
            return [
                ...baseSteps,
                { id: "content", title: $_("create_post.step_content") },
                { id: "location", title: $_("create_post.step_location") },
                { id: "media", title: $_("create_post.step_media") },
            ];
        }

        return baseSteps;
    });

    // Current step ID for conditional rendering
    const currentStepId = $derived(steps[currentStep]?.id ?? "type");

    // Step validation
    const canProceed = $derived.by(() => {
        switch (currentStepId) {
            case "type":
                if (postType === "missing") return !!reportType;
                return !!postType;
            case "pet":
                // Pet is required for all post types
                return !!selectedPetId;
            case "content":
                const descText = description.replace(/<[^>]*>/g, "").trim();
                return title.trim().length > 0 && descText.length > 0;
            case "location":
                const requiresContact = postType === "adopt" || postType === "missing";
                if (requiresContact) {
                    return !!location.trim() && !!preferredContact && hasAnyVerifiedContact;
                }
                return !!location.trim();
            case "media":
                if (postType === "adopt") return imageFiles.length > 0 || !!videoFile;
                if (postType === "missing") return imageFiles.length > 0;
                return true;
            default:
                return true;
        }
    });

    // Image previews
    let imagePreviews = $derived(
        imageFiles.map((file) => ({
            url: URL.createObjectURL(file),
            name: file.name,
        }))
    );

    // Video preview URL
    let videoPreview = $derived(videoFile ? URL.createObjectURL(videoFile) : null);

    // Location search state
    let locationSearchQuery = $state("");
    let locationSearchResults = $state<any[]>([]);
    let isSearchingLocation = $state(false);
    let searchTimeout: any;

    const postTypeOptions = [
        {
            value: "post",
            labelKey: "create_post.general_post",
            descKey: "create_post.general_post_desc",
        },
        {
            value: "adopt",
            labelKey: "create_post.adoption_post",
            descKey: "create_post.adoption_post_desc",
        },
        {
            value: "missing",
            labelKey: "create_post.missing_post",
            descKey: "create_post.missing_post_desc",
        },
    ] as const;

    function selectMediaType(type: "images" | "video") {
        if (mediaType === type) return;
        mediaType = type;
        if (type === "images") {
            videoFile = null;
        } else {
            imageFiles = [];
        }
    }

    function handleLocationSearchInput(value: string) {
        locationSearchQuery = value;
        clearTimeout(searchTimeout);
        if (value.length < 3) {
            locationSearchResults = [];
            return;
        }
        searchTimeout = setTimeout(() => {
            searchLocation(value);
        }, 400);
    }

    async function searchLocation(query: string) {
        if (!query || query.length < 3) return;
        isSearchingLocation = true;
        try {
            const res = await fetch(
                `https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=5`
            );
            const data = await res.json();
            locationSearchResults = (data.features || []).map((feature: any) => {
                const p = feature.properties;
                const name = p.name;
                const street = p.street;
                const city = p.city || p.town || p.village || p.hamlet;
                const parts = [
                    name,
                    street && street !== name ? street : null,
                    city,
                    p.state,
                    p.country,
                ].filter(Boolean);
                return {
                    ...feature,
                    display_name: parts.join(", "),
                };
            });
        } catch (e) {
            console.error("Location search failed:", e);
        } finally {
            isSearchingLocation = false;
        }
    }

    function selectLocation(result: any) {
        const p = result.properties;
        const city = p.city || p.town || p.village || p.hamlet || p.name || "";
        const state = p.state || "";
        const country = p.country || "";
        const parts = [city, state || country].filter(Boolean);
        location = parts.join(", ");
        locationSearchQuery = location;
        locationSearchResults = [];
    }

    function addTag() {
        const newTag = tagInput.trim().toLowerCase();
        if (newTag && !tags.includes(newTag) && tags.length < 5) {
            tags = [...tags, newTag];
            tagInput = "";
        }
    }

    function removeTag(tag: string) {
        tags = tags.filter((t) => t !== tag);
    }

    function handleTagKeydown(e: KeyboardEvent) {
        if (e.key === "Enter" || e.key === ",") {
            e.preventDefault();
            addTag();
        }
    }

    async function uploadFiles(files: File[]): Promise<string[]> {
        const formData = new FormData();
        for (const file of files) {
            formData.append("file", file);
        }
        const res = await fetch("/api/upload", {
            method: "POST",
            headers: { Authorization: `Bearer ${auth.token}` },
            body: formData,
        });
        if (!res.ok) throw new Error("Upload failed");
        const data = await res.json();
        return data.files;
    }

    function handleImageSelect(e: Event) {
        const input = e.currentTarget as HTMLInputElement;
        const files = input.files;
        if (!files || files.length === 0) return;

        const newFiles = Array.from(files);
        const totalFiles = imageFiles.length + newFiles.length;

        if (totalFiles > MAX_IMAGES) {
            toast.error(`You can only upload up to ${MAX_IMAGES} images`);
            input.value = "";
            return;
        }

        imageFiles = [...imageFiles, ...newFiles];
        input.value = "";
    }

    function removeImage(index: number) {
        imageFiles = imageFiles.filter((_, i) => i !== index);
    }

    async function uploadSingleFile(file: File): Promise<string> {
        const formData = new FormData();
        formData.append("file", file);
        const res = await fetch("/api/upload", {
            method: "POST",
            headers: { Authorization: `Bearer ${auth.token}` },
            body: formData,
        });
        if (!res.ok) throw new Error("Video upload failed");
        const data = await res.json();
        return data.files[0];
    }

    async function validateVideoFile(file: File): Promise<{ valid: boolean; error?: string }> {
        const fileSizeMB = file.size / (1024 * 1024);
        if (fileSizeMB > MAX_VIDEO_SIZE_MB) {
            return {
                valid: false,
                error: `Video is too large (${fileSizeMB.toFixed(1)}MB). Maximum size is ${MAX_VIDEO_SIZE_MB}MB.`,
            };
        }

        return new Promise((resolve) => {
            const video = document.createElement("video");
            video.preload = "metadata";

            video.onloadedmetadata = () => {
                window.URL.revokeObjectURL(video.src);
                const durationMinutes = video.duration / 60;
                if (durationMinutes > MAX_VIDEO_DURATION_MINUTES) {
                    resolve({
                        valid: false,
                        error: `Video is too long (${durationMinutes.toFixed(1)} min). Maximum duration is ${MAX_VIDEO_DURATION_MINUTES} minutes.`,
                    });
                } else {
                    resolve({ valid: true });
                }
            };

            video.onerror = () => {
                window.URL.revokeObjectURL(video.src);
                resolve({
                    valid: false,
                    error: "Could not read video file. Please try a different format.",
                });
            };

            video.src = URL.createObjectURL(file);
        });
    }

    async function handleVideoSelect(e: Event) {
        const input = e.currentTarget as HTMLInputElement;
        const files = input.files;
        if (!files || files.length === 0) return;

        const file = files[0];
        const validation = await validateVideoFile(file);

        if (!validation.valid) {
            toast.error(validation.error || "Invalid video file");
            input.value = "";
            return;
        }

        videoFile = file;
    }

    // Fetch user's pets when modal opens
    $effect(() => {
        if (open && !hasFetchedPets && pets.length === 0 && !loadingPets) {
            hasFetchedPets = true;
            fetchUserPets();
        }
        if (!open) {
            hasFetchedPets = false;
        }
    });

    // Reset form when modal closes (cancelled or closed)
    $effect(() => {
        if (!open) {
            resetForm();
        }
    });

    async function fetchUserPets() {
        if (!auth.token) return;
        loadingPets = true;
        try {
            const response = await fetch("/api/graphql", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${auth.token}`,
                },
                body: JSON.stringify({
                    query: `
                        query GetMyPets {
                            myPets(limit: 100) {
                                id
                                name
                                species { label }
                                breed { name }
                                customSpecies
                                customBreed
                                coverImage
                            }
                        }
                    `,
                }),
            });
            const result = await response.json();
            if (result.errors) throw new Error(result.errors[0].message);
            pets = result.data.myPets;
        } catch (e: any) {
            toast.error(e.message || "Failed to load pets");
        } finally {
            loadingPets = false;
        }
    }

    function startAddPetFlow() {
        reopenAfterPet = true;
        onClose();
        showAddPetModal = true;
    }

    async function handlePetAdded(pet?: { id: string; name: string }) {
        await fetchUserPets();
        if (pet?.id) {
            selectedPetId = pet.id;
        }
        showAddPetModal = false;
        if (reopenAfterPet) {
            open = true;
            reopenAfterPet = false;
        }
    }

    async function handleSubmit(e: Event) {
        e.preventDefault();

        // Don't validate if modal is closed
        if (!open) return;

        if (!auth.token || !auth.user) {
            toast.error("You must be logged in to create a post");
            return;
        }

        if (!title.trim()) {
            toast.warning($_("create_post.enter_title"));
            return;
        }

        const descriptionText = description.replace(/<[^>]*>/g, "").trim();
        if (!descriptionText) {
            toast.warning($_("create_post.enter_description"));
            return;
        }

        // Pet is required EXCEPT for "found" posts (you found someone else's pet)
        const petRequired = postType !== "missing" || reportType === "lost";
        if (petRequired && !selectedPetId) {
            toast.warning($_("create_post.select_pet_required"));
            return;
        }

        // Adoption validation
        if (postType === "adopt") {
            if (imageFiles.length === 0 && !videoFile) {
                toast.warning($_("create_post.media_required_adopt"));
                return;
            }
            if (!location.trim()) {
                toast.warning($_("create_post.enter_location"));
                return;
            }
            if (!preferredContact) {
                toast.warning($_("create_post.select_contact"));
                return;
            }
        }

        // Missing (lost/found) validation
        if (postType === "missing") {
            if (!reportType) {
                toast.warning($_("create_post.select_report_type"));
                return;
            }
            if (imageFiles.length === 0) {
                toast.warning($_("create_post.image_required_missing"));
                return;
            }
            if (!location.trim()) {
                toast.warning($_("create_post.enter_location"));
                return;
            }
            if (!preferredContact) {
                toast.warning($_("create_post.select_contact"));
                return;
            }
        }

        loading = true;

        try {
            let imageUrls: string[] = [];
            if (imageFiles.length > 0) {
                imageUrls = await uploadFiles(imageFiles);
            }

            let videoUrl: string | null = null;
            if (videoFile) {
                videoUrl = await uploadSingleFile(videoFile);
            }

            const response = await fetch("/api/graphql", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${auth.token}`,
                },
                body: JSON.stringify({
                    query: `
                        mutation CreatePost($title: String!, $description: String!, $postType: PostType!, $petId: ID, $location: String, $tags: [String!], $images: [String!], $video: String, $reportType: ReportType, $preferredContact: PreferredContactMethod) {
                            createPost(title: $title, description: $description, postType: $postType, petId: $petId, location: $location, tags: $tags, images: $images, video: $video, reportType: $reportType, preferredContact: $preferredContact) {
                                id
                                title
                                description
                                postType
                                reportType
                                preferredContact
                                tags
                                images
                                video
                                location
                                createdAt
                                voteScore
                                upvotes
                                downvotes
                                userVote
                                commentCount
                                contactEmail
                                contactPhone
                                contactPhoneCountryCode
                                author {
                                    id
                                    firstName
                                    lastName
                                    fullName
                                    profilePicture
                                    emailVerified
                                    phoneVerified
                                }
                                pet {
                                    id
                                    name
                                    species { label }
                                    breed { name }
                                    customSpecies
                                    customBreed
                                    coverImage
                                    description
                                    age
                                    status
                                }
                            }
                        }
                    `,
                    variables: {
                        title,
                        description,
                        postType,
                        petId: selectedPetId || null,
                        location: location.trim() || null,
                        tags,
                        images: imageUrls,
                        video: videoUrl,
                        reportType: reportType || null,
                        preferredContact: preferredContact || null,
                    },
                }),
            });

            const result = await response.json();
            if (result.errors) throw new Error(result.errors[0].message);

            const createdPost = result.data.createPost;
            toast.success($_("create_post.post_created"));
            resetForm();
            onClose();
            if (onPostCreated) onPostCreated(createdPost);
        } catch (e: any) {
            toast.error(e.message || "Failed to create post");
        } finally {
            loading = false;
        }
    }

    function resetForm() {
        title = "";
        description = "";
        location = "";
        locationSearchQuery = "";
        locationSearchResults = [];
        postType = "post";
        reportType = null;
        preferredContact = null;
        selectedPetId = "";
        tags = [];
        tagInput = "";
        imageFiles = [];
        videoFile = null;
        mediaType = null;
        currentStep = 0;
    }
</script>

<form onsubmit={handleSubmit}>
    <MultiStepModal
        {open}
        {onClose}
        title={$_("create_post.title")}
        {steps}
        bind:currentStep
        {canProceed}
        isSubmitting={loading}
        submitLabel={loading ? $_("create_post.creating") : $_("home.create_post")}
    >
        <!-- Step: Post Type Selection -->
        {#if currentStepId === "type"}
            <div class="space-y-5">
                <div class="flex items-center gap-2 mb-4">
                    <FileText class="w-5 h-5 text-indigo-500" />
                    <h3 class="font-semibold text-gray-900 dark:text-white">
                        {$_("create_post.choose_post_type")}
                    </h3>
                </div>

                <!-- Post Type Selection -->
                <div class="grid grid-cols-1 gap-3">
                    {#each postTypeOptions as option}
                        <button
                            type="button"
                            onclick={() => {
                                postType = option.value;
                                if (option.value !== "missing") reportType = null;
                            }}
                            class="p-4 rounded-xl border-2 text-left transition-all {postType === option.value
                                ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30'
                                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'}"
                        >
                            <div class="flex items-center gap-3">
                                {#if option.value === "post"}
                                    <FileText class="w-6 h-6 text-indigo-500" />
                                {:else if option.value === "adopt"}
                                    <Home class="w-6 h-6 text-green-500" />
                                {:else if option.value === "missing"}
                                    <Search class="w-6 h-6 text-red-500" />
                                {/if}
                                <div>
                                    <div class="font-medium text-gray-900 dark:text-white">
                                        {$_(option.labelKey)}
                                    </div>
                                    <div class="text-sm text-gray-500 dark:text-gray-400">
                                        {$_(option.descKey)}
                                    </div>
                                </div>
                            </div>
                        </button>
                    {/each}
                </div>

                <!-- Report Type Selection (for missing posts) -->
                {#if postType === "missing"}
                    <div class="mt-6" role="group" aria-labelledby="report-type-label">
                        <span id="report-type-label" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            {$_("create_post.report_type")} <span class="text-red-500">*</span>
                        </span>
                        <div class="grid grid-cols-2 gap-3">
                            <button
                                type="button"
                                onclick={() => (reportType = "lost")}
                                class="p-4 rounded-xl border-2 text-center transition-all {reportType === 'lost'
                                    ? 'border-red-500 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 text-gray-600 dark:text-gray-400'}"
                            >
                                <Search class="w-6 h-6 mx-auto mb-2" />
                                <div class="font-medium">{$_("create_post.lost_my_pet")}</div>
                                <div class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                    {$_("create_post.lost_my_pet_desc")}
                                </div>
                            </button>
                            <button
                                type="button"
                                onclick={() => (reportType = "found")}
                                class="p-4 rounded-xl border-2 text-center transition-all {reportType === 'found'
                                    ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400'
                                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 text-gray-600 dark:text-gray-400'}"
                            >
                                <Eye class="w-6 h-6 mx-auto mb-2" />
                                <div class="font-medium">{$_("create_post.found_a_pet")}</div>
                                <div class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                    {$_("create_post.found_a_pet_desc")}
                                </div>
                            </button>
                        </div>
                    </div>
                {/if}
            </div>

        <!-- Step: Pet Selection -->
        {:else if currentStepId === "pet"}
            <div class="space-y-5">
                <div class="flex items-center gap-2 mb-4">
                    <PawPrint class="w-5 h-5 text-indigo-500" />
                    <h3 class="font-semibold text-gray-900 dark:text-white">
                        {$_("create_post.select_pet")} <span class="text-red-500">*</span>
                    </h3>
                </div>

                {#if loadingPets}
                    <div class="flex items-center justify-center py-8">
                        <Loader2 class="w-6 h-6 text-indigo-500 animate-spin" />
                        <span class="ml-2 text-gray-500">{$_("create_post.loading_pets")}</span>
                    </div>
                {:else if pets.length === 0}
                    <div class="text-center py-8">
                        <PawPrint class="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <p class="text-gray-500 dark:text-gray-400 mb-4">
                            {$_("create_post.no_pets_found")}
                        </p>
                        <button
                            type="button"
                            onclick={startAddPetFlow}
                            class="px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 font-medium"
                        >
                            {$_("create_post.add_pet_first")}
                        </button>
                    </div>
                {:else}
                    <div class="grid grid-cols-2 gap-3">
                        {#each pets as pet}
                            <button
                                type="button"
                                onclick={() => {
                                    selectedPetId = pet.id;
                                }}
                                class="p-3 rounded-xl border-2 text-left transition-all {selectedPetId === pet.id
                                    ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30'
                                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'}"
                            >
                                <div class="flex items-center gap-3">
                                    {#if pet.coverImage}
                                        <img
                                            src={pet.coverImage}
                                            alt={pet.name}
                                            class="w-12 h-12 rounded-lg object-cover"
                                        />
                                    {:else}
                                        <div class="w-12 h-12 rounded-lg bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                                            <PawPrint class="w-6 h-6 text-gray-400" />
                                        </div>
                                    {/if}
                                    <div class="min-w-0">
                                        <div class="font-medium text-gray-900 dark:text-white truncate">
                                            {pet.name}
                                        </div>
                                        <div class="text-xs text-gray-500 truncate">
                                            {pet.species?.label || pet.customSpecies || $_("post_card.unknown")}
                                            {pet.breed?.name || pet.customBreed ? ` - ${pet.breed?.name || pet.customBreed}` : ""}
                                        </div>
                                    </div>
                                </div>
                            </button>
                        {/each}
                    </div>
                    <button
                        type="button"
                        onclick={startAddPetFlow}
                        class="w-full mt-3 px-4 py-2 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl text-gray-600 dark:text-gray-400 hover:border-indigo-500 hover:text-indigo-500 transition-colors"
                    >
                        {$_("create_post.new_pet")}
                    </button>
                {/if}
            </div>

        <!-- Step: Content (Title + Description) -->
        {:else if currentStepId === "content"}
            <div class="space-y-5">
                <div class="flex items-center gap-2 mb-4">
                    <FileText class="w-5 h-5 text-indigo-500" />
                    <h3 class="font-semibold text-gray-900 dark:text-white">
                        {$_("create_post.post_details")}
                    </h3>
                </div>

                <!-- Title -->
                <div>
                    <label for="title" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        {$_("create_post.post_title")} <span class="text-red-500">*</span>
                    </label>
                    <input
                        id="title"
                        type="text"
                        bind:value={title}
                        placeholder={postType === "missing"
                            ? $_("create_post.title_placeholder_missing")
                            : postType === "adopt"
                              ? $_("create_post.title_placeholder_adopt")
                              : $_("create_post.title_placeholder_general")}
                        class="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        required
                    />
                </div>

                <!-- Description -->
                <div role="group" aria-labelledby="description-label">
                    <span id="description-label" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        {$_("create_post.description")} <span class="text-red-500">*</span>
                    </span>
                    <RichTextEditor
                        content={description}
                        placeholder={postType === "missing"
                            ? $_("create_post.desc_placeholder_missing")
                            : postType === "adopt"
                              ? $_("create_post.desc_placeholder_adopt")
                              : $_("create_post.desc_placeholder_general")}
                        maxLength={5000}
                        minHeight="150px"
                        onUpdate={(html) => (description = html)}
                        disabled={loading}
                    />
                </div>
            </div>

        <!-- Step: Location & Contact -->
        {:else if currentStepId === "location"}
            <div class="space-y-5">
                <div class="flex items-center gap-2 mb-4">
                    <MapPin class="w-5 h-5 text-indigo-500" />
                    <h3 class="font-semibold text-gray-900 dark:text-white">
                        {$_("create_post.location_contact")}
                    </h3>
                </div>

                <!-- Location Search -->
                <div>
                    <label for="location" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        {$_("create_post.location")} <span class="text-red-500">*</span>
                    </label>
                    <div class="relative">
                        <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 dark:text-gray-500">
                            <MapPin class="h-4 w-4" />
                        </div>
                        <input
                            id="location"
                            type="text"
                            value={locationSearchQuery}
                            oninput={(e) => handleLocationSearchInput(e.currentTarget.value)}
                            placeholder={$_("create_post.search_location")}
                            class="w-full pl-9 pr-10 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        />
                        {#if isSearchingLocation}
                            <div class="absolute right-3 top-1/2 -translate-y-1/2">
                                <Loader2 class="w-4 h-4 text-indigo-500 animate-spin" />
                            </div>
                        {/if}
                    </div>

                    {#if locationSearchResults.length > 0}
                        <div class="mt-1 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden z-20 max-h-48 overflow-y-auto">
                            {#each locationSearchResults as result}
                                <button
                                    type="button"
                                    class="w-full text-left px-3 py-2 hover:bg-indigo-50 dark:hover:bg-gray-700 text-sm text-gray-700 dark:text-gray-300 flex items-center gap-2 transition-colors border-b last:border-0 border-gray-50 dark:border-gray-700"
                                    onclick={() => selectLocation(result)}
                                >
                                    <MapPin class="w-4 h-4 text-gray-400 dark:text-gray-500 shrink-0" />
                                    <span class="truncate">{result.display_name}</span>
                                </button>
                            {/each}
                        </div>
                    {/if}

                    {#if location && locationSearchResults.length === 0}
                        <div class="mt-2 flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                            <MapPin class="w-4 h-4" />
                            <span>{location}</span>
                        </div>
                    {/if}
                </div>

                <!-- Contact Method Selection -->
                {#if postType === "adopt" || postType === "missing"}
                    <div class="mt-6" role="group" aria-labelledby="preferred-contact-label">
                        <span id="preferred-contact-label" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            {$_("create_post.preferred_contact")} <span class="text-red-500">*</span>
                        </span>

                        {#if !hasAnyVerifiedContact}
                            <!-- No verified contact warning -->
                            <div class="flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl">
                                <AlertTriangle class="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                                <div class="text-sm">
                                    <p class="text-amber-800 dark:text-amber-300 font-medium">
                                        {$_("create_post.verify_contact_required")}
                                    </p>
                                    <p class="text-amber-700 dark:text-amber-400 mt-1">
                                        <a href="/profile" class="font-semibold underline hover:no-underline">
                                            {$_("create_post.go_to_profile")}
                                        </a>
                                    </p>
                                </div>
                            </div>
                        {:else}
                            <!-- Contact method selector - only verified methods are clickable -->
                            <div class="grid grid-cols-2 gap-3">
                                <!-- Email button -->
                                <button
                                    type="button"
                                    onclick={() => userHasVerifiedEmail && (preferredContact = "email")}
                                    disabled={!userHasVerifiedEmail}
                                    class="p-4 rounded-xl border-2 text-center transition-all {preferredContact === 'email'
                                        ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400'
                                        : !userHasVerifiedEmail
                                          ? 'border-gray-200 dark:border-gray-700 opacity-50 cursor-not-allowed'
                                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 text-gray-600 dark:text-gray-400'}"
                                >
                                    <Mail class="w-6 h-6 mx-auto mb-2" />
                                    <div class="text-sm font-medium">{$_("create_post.contact_email")}</div>
                                    {#if auth.user?.email}
                                        <div class="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate">
                                            {auth.user.email}
                                        </div>
                                        {#if !auth.user?.emailVerified}
                                            <div class="text-[10px] text-amber-600 dark:text-amber-400 mt-1 font-medium">
                                                {$_("create_post.not_verified")}
                                            </div>
                                        {/if}
                                    {/if}
                                </button>

                                <!-- Phone button -->
                                <button
                                    type="button"
                                    onclick={() => userHasVerifiedPhone && (preferredContact = "phone")}
                                    disabled={!userHasVerifiedPhone}
                                    class="p-4 rounded-xl border-2 text-center transition-all {preferredContact === 'phone'
                                        ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400'
                                        : !userHasVerifiedPhone
                                          ? 'border-gray-200 dark:border-gray-700 opacity-50 cursor-not-allowed'
                                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 text-gray-600 dark:text-gray-400'}"
                                >
                                    <Phone class="w-6 h-6 mx-auto mb-2" />
                                    <div class="text-sm font-medium">{$_("create_post.contact_phone")}</div>
                                    {#if auth.user?.phone}
                                        <div class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                            {#if auth.user?.phoneCountryCode}+{auth.user.phoneCountryCode} {/if}{auth.user.phone}
                                        </div>
                                        {#if !auth.user?.phoneVerified}
                                            <div class="text-[10px] text-amber-600 dark:text-amber-400 mt-1 font-medium">
                                                {$_("create_post.not_verified")}
                                            </div>
                                        {/if}
                                    {:else}
                                        <div class="text-xs text-gray-400 mt-1">
                                            {$_("create_post.no_phone")}
                                        </div>
                                    {/if}
                                </button>
                            </div>

                            <!-- Tip to add more contact methods -->
                            {#if (userHasVerifiedEmail && !userHasVerifiedPhone) || (!userHasVerifiedEmail && userHasVerifiedPhone)}
                                <p class="mt-3 text-xs text-gray-500 dark:text-gray-400">
                                    {$_("create_post.add_more_contact")}
                                    <a href="/profile" class="text-indigo-600 dark:text-indigo-400 hover:underline">
                                        {$_("create_post.update_profile")}
                                    </a>
                                </p>
                            {/if}
                        {/if}
                    </div>
                {/if}
            </div>

        <!-- Step: Media & Tags -->
        {:else if currentStepId === "media"}
            <div class="space-y-5">
                <div class="flex items-center gap-2 mb-4">
                    <Image class="w-5 h-5 text-indigo-500" />
                    <h3 class="font-semibold text-gray-900 dark:text-white">
                        {$_("create_post.media_tags")}
                    </h3>
                </div>

                <!-- Media Type Selector -->
                <div role="group" aria-labelledby="media-type-label">
                    <span id="media-type-label" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {$_("create_post.media")}
                        {#if postType === "adopt" || postType === "missing"}
                            <span class="text-red-500">*</span>
                        {:else}
                            ({$_("common.optional")})
                        {/if}
                    </span>

                    <div class="grid grid-cols-2 gap-2 mb-3">
                        <button
                            type="button"
                            onclick={() => selectMediaType("images")}
                            class="p-3 rounded-xl border-2 text-center transition-all flex items-center justify-center gap-2 {mediaType === 'images'
                                ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400'
                                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 text-gray-600 dark:text-gray-400'}"
                        >
                            <Image class="w-5 h-5" />
                            <span class="text-sm font-medium">
                                {$_("create_post.images")} ({$_("create_post.images_max", { values: { count: MAX_IMAGES } })})
                            </span>
                        </button>
                        {#if postType !== "missing"}
                            <button
                                type="button"
                                onclick={() => selectMediaType("video")}
                                class="p-3 rounded-xl border-2 text-center transition-all flex items-center justify-center gap-2 {mediaType === 'video'
                                    ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400'
                                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 text-gray-600 dark:text-gray-400'}"
                            >
                                <Video class="w-5 h-5" />
                                <span class="text-sm font-medium">
                                    {$_("create_post.video")} ({$_("create_post.video_max", { values: { minutes: MAX_VIDEO_DURATION_MINUTES } })})
                                </span>
                            </button>
                        {:else}
                            <!-- Missing posts only allow images -->
                            <div class="p-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 opacity-50 text-center flex items-center justify-center gap-2 text-gray-400">
                                <Video class="w-5 h-5" />
                                <span class="text-sm">{$_("create_post.images_only")}</span>
                            </div>
                        {/if}
                    </div>

                    <!-- Images Upload Section -->
                    {#if mediaType === "images"}
                        {#if imagePreviews.length > 0}
                            <div class="grid grid-cols-4 gap-2 mb-3">
                                {#each imagePreviews as preview, i}
                                    <div class="relative group aspect-square">
                                        <img
                                            src={preview.url}
                                            alt={preview.name}
                                            class="w-full h-full object-cover rounded-lg border border-gray-200 dark:border-gray-700"
                                        />
                                        <button
                                            type="button"
                                            onclick={() => removeImage(i)}
                                            class="absolute top-1 right-1 p-1 bg-red-500 hover:bg-red-600 text-white rounded-full shadow-lg transition-colors opacity-0 group-hover:opacity-100"
                                            aria-label="Remove image"
                                        >
                                            <X class="w-3 h-3" />
                                        </button>
                                    </div>
                                {/each}
                                {#if imagePreviews.length < MAX_IMAGES}
                                    <label
                                        for="postImages"
                                        class="aspect-square flex flex-col items-center justify-center border-2 border-gray-300 dark:border-gray-600 border-dashed rounded-lg cursor-pointer bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                    >
                                        <Upload class="w-5 h-5 text-gray-400 dark:text-gray-500" />
                                        <span class="text-xs text-gray-400 dark:text-gray-500 mt-1">{$_("common.add")}</span>
                                    </label>
                                {/if}
                            </div>
                            <p class="text-xs text-gray-500 dark:text-gray-400">
                                {imagePreviews.length} / {MAX_IMAGES} {$_("create_post.images_text")}
                            </p>
                        {:else}
                            <div class="flex items-center justify-center w-full">
                                <label
                                    for="postImages"
                                    class="flex flex-col items-center justify-center w-full h-24 border-2 border-gray-300 dark:border-gray-600 border-dashed rounded-xl cursor-pointer bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                >
                                    <div class="flex flex-col items-center justify-center py-4">
                                        <Upload class="w-6 h-6 text-gray-400 dark:text-gray-500 mb-1" />
                                        <p class="text-sm text-gray-500 dark:text-gray-400">
                                            <span class="font-semibold">{$_("create_post.click_upload_images")}</span>
                                        </p>
                                        <p class="text-xs text-gray-400 dark:text-gray-500 mt-1">
                                            {$_("create_post.up_to_images", { values: { count: MAX_IMAGES } })}
                                        </p>
                                    </div>
                                </label>
                            </div>
                        {/if}
                        <input
                            id="postImages"
                            type="file"
                            accept="image/*"
                            multiple
                            class="hidden"
                            onchange={handleImageSelect}
                        />
                    {/if}

                    <!-- Video Upload Section -->
                    {#if mediaType === "video"}
                        {#if videoPreview}
                            <div class="relative mb-3">
                                <VideoPlayer
                                    src={videoPreview}
                                    compact={true}
                                    class="rounded-xl border border-gray-200 dark:border-gray-700"
                                />
                                <button
                                    type="button"
                                    onclick={() => (videoFile = null)}
                                    class="absolute top-2 right-2 p-1.5 bg-red-500 hover:bg-red-600 text-white rounded-full shadow-lg transition-colors z-10"
                                    aria-label="Remove video"
                                >
                                    <X class="w-4 h-4" />
                                </button>
                            </div>
                            <p class="text-xs text-gray-500 dark:text-gray-400">{videoFile?.name}</p>
                        {:else}
                            <div class="flex items-center justify-center w-full">
                                <label
                                    for="postVideo"
                                    class="flex flex-col items-center justify-center w-full h-24 border-2 border-gray-300 dark:border-gray-600 border-dashed rounded-xl cursor-pointer bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                >
                                    <div class="flex flex-col items-center justify-center py-4">
                                        <Video class="w-6 h-6 text-gray-400 dark:text-gray-500 mb-1" />
                                        <p class="text-sm text-gray-500 dark:text-gray-400">
                                            <span class="font-semibold">{$_("create_post.click_upload_video")}</span>
                                        </p>
                                        <p class="text-xs text-gray-400 dark:text-gray-500 mt-1">
                                            {$_("create_post.video_formats", {
                                                values: { minutes: MAX_VIDEO_DURATION_MINUTES, size: MAX_VIDEO_SIZE_MB },
                                            })}
                                        </p>
                                    </div>
                                </label>
                            </div>
                        {/if}
                        <input
                            id="postVideo"
                            type="file"
                            accept="video/*"
                            class="hidden"
                            onchange={handleVideoSelect}
                        />
                    {/if}
                </div>

                <!-- Tags -->
                <div class="mt-6">
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        <Tag class="w-4 h-4 inline mr-1" />
                        {$_("create_post.tags")} ({$_("create_post.tags_hint")})
                    </label>
                    <div class="flex flex-wrap gap-2 mb-2">
                        {#each tags as tag}
                            <span class="inline-flex items-center gap-1 px-2 py-1 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 rounded-full text-sm">
                                #{tag}
                                <button
                                    type="button"
                                    onclick={() => removeTag(tag)}
                                    class="hover:text-indigo-900 dark:hover:text-indigo-200"
                                >
                                    <X class="w-3 h-3" />
                                </button>
                            </span>
                        {/each}
                    </div>
                    {#if tags.length < 5}
                        <div class="flex gap-2">
                            <input
                                type="text"
                                bind:value={tagInput}
                                onkeydown={handleTagKeydown}
                                placeholder={$_("create_post.add_tag_placeholder")}
                                class="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                            />
                            <button
                                type="button"
                                onclick={addTag}
                                class="px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 text-sm font-medium"
                            >
                                {$_("common.add")}
                            </button>
                        </div>
                    {/if}
                </div>
            </div>
        {/if}
    </MultiStepModal>
</form>

<AddPetModal
    bind:open={showAddPetModal}
    onClose={() => {
        showAddPetModal = false;
        reopenAfterPet = false;
    }}
    onPetAdded={handlePetAdded}
/>
