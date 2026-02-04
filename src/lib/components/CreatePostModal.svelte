<script lang="ts">
    import Modal from "./Modal.svelte";
    import AddPetModal from "./AddPetModal.svelte";
    import { auth } from "$lib/stores/auth.svelte";
    import { toast } from "$lib/stores/toast.svelte";
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
    } from "lucide-svelte";
    import VideoPlayer from "./VideoPlayer.svelte";

    interface Props {
        open: boolean;
        onClose: () => void;
        onPostCreated?: (post?: any) => void;
    }

    let { open = $bindable(false), onClose, onPostCreated }: Props = $props();

    type PostType = "post" | "adopt" | "missing";

    let title = $state("");
    let description = $state("");
    let location = $state("");
    let postType = $state<PostType>("post");
    let selectedPetId = $state("");
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
    const MAX_VIDEO_SIZE_MB = 100; // Max file size in MB
    const MAX_VIDEO_DURATION_MINUTES = 5; // Max duration in minutes

    // Image previews - create URLs for all selected files
    let imagePreviews = $derived(
        imageFiles.map((file) => ({
            url: URL.createObjectURL(file),
            name: file.name,
        })),
    );

    // Video preview URL
    let videoPreview = $derived(
        videoFile ? URL.createObjectURL(videoFile) : null,
    );

    // Location search state
    let locationSearchQuery = $state("");
    let locationSearchResults = $state<any[]>([]);
    let isSearchingLocation = $state(false);
    let searchTimeout: any;

    function selectMediaType(type: "images" | "video") {
        if (mediaType === type) return;
        mediaType = type;
        // Clear the other media type
        if (type === "images") {
            videoFile = null;
        } else {
            imageFiles = [];
        }
    }

    const postTypeOptions = [
        {
            value: "post",
            label: "General Post",
            description: "Share updates about your pet",
        },
        {
            value: "adopt",
            label: "Adoption",
            description: "Find a new home for a pet",
        },
        {
            value: "missing",
            label: "Missing Pet",
            description: "Report a lost pet",
        },
    ] as const;

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
                `https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=5`,
            );
            const data = await res.json();
            locationSearchResults = (data.features || []).map(
                (feature: any) => {
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
                },
            );
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

        // Format as "City, State" or "City, Country"
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
            headers: {
                Authorization: `Bearer ${auth.token}`,
            },
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
        input.value = ""; // Reset input so same files can be selected again
    }

    function removeImage(index: number) {
        imageFiles = imageFiles.filter((_, i) => i !== index);
    }

    async function uploadSingleFile(file: File): Promise<string> {
        const formData = new FormData();
        formData.append("file", file);

        const res = await fetch("/api/upload", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${auth.token}`,
            },
            body: formData,
        });

        if (!res.ok) throw new Error("Video upload failed");
        const data = await res.json();
        return data.files[0];
    }

    // Validate video file (size and duration)
    async function validateVideoFile(
        file: File,
    ): Promise<{ valid: boolean; error?: string }> {
        // Check file size
        const fileSizeMB = file.size / (1024 * 1024);
        if (fileSizeMB > MAX_VIDEO_SIZE_MB) {
            return {
                valid: false,
                error: `Video is too large (${fileSizeMB.toFixed(1)}MB). Maximum size is ${MAX_VIDEO_SIZE_MB}MB.`,
            };
        }

        // Check video duration
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

        // Validate the video
        const validation = await validateVideoFile(file);

        if (!validation.valid) {
            toast.error(validation.error || "Invalid video file");
            input.value = ""; // Clear the input
            return;
        }

        videoFile = file;
    }

    // Fetch user's pets when modal opens (only once)
    $effect(() => {
        if (open && !hasFetchedPets && pets.length === 0 && !loadingPets) {
            hasFetchedPets = true;
            fetchUserPets();
        }

        // Reset flag when modal closes
        if (!open) {
            hasFetchedPets = false;
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
                                species {
                                    label
                                }
                                breed {
                                    name
                                }
                                customSpecies
                                customBreed
                            }
                        }
                    `,
                }),
            });

            const result = await response.json();
            if (result.errors) throw new Error(result.errors[0].message);

            pets = result.data.myPets;

            // If pets just got added and there was none, auto-select the new one if possible or just refresh
            if (pets.length > 0 && !selectedPetId) {
                // optional: auto-select recent? For now just showing them is enough.
            }
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

        if (!auth.token || !auth.user) {
            toast.error("You must be logged in to create a post");
            return;
        }

        if (!title.trim()) {
            toast.warning("Please enter a title");
            return;
        }

        if (!description.trim()) {
            toast.warning("Please enter a description");
            return;
        }

        // Location is only required for adopt and missing post types
        if (
            (postType === "adopt" || postType === "missing") &&
            !location.trim()
        ) {
            toast.warning("Please enter a location for this post type");
            return;
        }

        // Pet is required for adopt and missing post types
        if (
            (postType === "adopt" || postType === "missing") &&
            !selectedPetId
        ) {
            toast.warning("Please select a pet for this post type");
            return;
        }

        loading = true;

        try {
            // Upload images if any
            let imageUrls: string[] = [];
            if (imageFiles.length > 0) {
                imageUrls = await uploadFiles(imageFiles);
            }

            // Upload video if any (only 1 video allowed)
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
                        mutation CreatePost($title: String!, $description: String!, $postType: PostType!, $petId: ID, $location: String, $tags: [String!], $images: [String!], $video: String) {
                            createPost(title: $title, description: $description, postType: $postType, petId: $petId, location: $location, tags: $tags, images: $images, video: $video) {
                                id
                                title
                                description
                                postType
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
                                author {
                                    id
                                    name
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
                    },
                }),
            });

            const result = await response.json();
            if (result.errors) throw new Error(result.errors[0].message);

            const createdPost = result.data.createPost;
            toast.success("Post created successfully!");
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
        selectedPetId = "";
        tags = [];
        tagInput = "";
        imageFiles = [];
        videoFile = null;
        mediaType = null;
    }
</script>

{#snippet modalFooter()}
    <div class="flex gap-3 justify-end w-full">
        <button
            type="button"
            onclick={onClose}
            class="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
            disabled={loading}
        >
            Cancel
        </button>
        <button
            form="create-post-form"
            type="submit"
            class="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            disabled={loading}
        >
            {#if loading}
                <div
                    class="animate-spin rounded-full h-4 w-4 border-b-2 border-white"
                ></div>
            {/if}
            {loading ? "Creating..." : "Create Post"}
        </button>
    </div>
{/snippet}

<Modal {open} {onClose} title="Create Post" footer={modalFooter}>
    <form id="create-post-form" onsubmit={handleSubmit} class="space-y-5">
        <!-- Post Type Selection -->
        <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
                Post Type
            </label>
            <div class="grid grid-cols-3 gap-2">
                {#each postTypeOptions as option}
                    <button
                        type="button"
                        onclick={() => (postType = option.value)}
                        class="p-3 rounded-xl border-2 text-center transition-all {postType ===
                        option.value
                            ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                            : 'border-gray-200 hover:border-gray-300 text-gray-600'}"
                    >
                        <div class="mb-1">
                            {#if option.value === "post"}
                                <FileText class="w-5 h-5 mx-auto" />
                            {:else if option.value === "adopt"}
                                <Home class="w-5 h-5 mx-auto" />
                            {:else if option.value === "missing"}
                                <Search class="w-5 h-5 mx-auto" />
                            {/if}
                        </div>
                        <div class="text-xs font-medium">{option.label}</div>
                    </button>
                {/each}
            </div>
        </div>

        <!-- Pet Selection (required for adopt/missing) -->
        <div>
            <label
                for="pet"
                class="block text-sm font-medium text-gray-700 mb-1"
            >
                Select Pet {postType === "adopt" || postType === "missing"
                    ? ""
                    : "(Optional)"}
            </label>
            {#if loadingPets}
                <div class="text-sm text-gray-500">Loading pets...</div>
            {:else if pets.length === 0}
                <div class="text-sm text-gray-500">
                    No pets found.
                    <button
                        type="button"
                        onclick={startAddPetFlow}
                        class="text-indigo-600 hover:text-indigo-700 font-medium hover:underline"
                    >
                        Add a pet first
                    </button>
                </div>
            {:else}
                <div class="flex gap-2">
                    <select
                        id="pet"
                        bind:value={selectedPetId}
                        class="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                        <option value="">Choose a pet...</option>
                        {#each pets as pet}
                            <option value={pet.id}>
                                {pet.name} ({pet.species?.label ||
                                    pet.customSpecies ||
                                    "Unknown"}{pet.breed?.name ||
                                pet.customBreed
                                    ? ` - ${pet.breed?.name || pet.customBreed}`
                                    : ""})
                            </option>
                        {/each}
                    </select>
                    <button
                        type="button"
                        onclick={startAddPetFlow}
                        class="shrink-0 px-3 py-2 bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200 text-sm font-medium"
                    >
                        + New
                    </button>
                </div>
            {/if}
        </div>

        <!-- Title -->
        <div>
            <label
                for="title"
                class="block text-sm font-medium text-gray-700 mb-1"
            >
                Title
            </label>
            <input
                id="title"
                type="text"
                bind:value={title}
                placeholder={postType === "missing"
                    ? "e.g., Missing: Orange tabby cat last seen downtown"
                    : postType === "adopt"
                      ? "e.g., Adorable Golden Retriever looking for a home"
                      : "e.g., My cat's first birthday!"}
                class="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
            />
        </div>

        <!-- Description -->
        <div>
            <label
                for="description"
                class="block text-sm font-medium text-gray-700 mb-1"
            >
                Description
            </label>
            <textarea
                id="description"
                bind:value={description}
                placeholder={postType === "missing"
                    ? "Provide details: when/where last seen, distinctive features, contact info..."
                    : postType === "adopt"
                      ? "Tell us about this pet, their personality, requirements..."
                      : "Share your story..."}
                rows="3"
                class="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
            ></textarea>
        </div>

        <!-- Location (only for adopt/missing posts) -->
        {#if postType === "adopt" || postType === "missing"}
            <div>
                <label
                    for="location"
                    class="block text-sm font-medium text-gray-700 mb-1"
                >
                    Location
                </label>
                <div class="relative">
                    <div
                        class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400"
                    >
                        <MapPin class="h-4 w-4" />
                    </div>
                    <input
                        id="location"
                        type="text"
                        value={locationSearchQuery}
                        oninput={(e) =>
                            handleLocationSearchInput(e.currentTarget.value)}
                        placeholder="Search for a location..."
                        class="w-full pl-9 pr-10 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    {#if isSearchingLocation}
                        <div class="absolute right-3 top-1/2 -translate-y-1/2">
                            <Loader2
                                class="w-4 h-4 text-indigo-500 animate-spin"
                            />
                        </div>
                    {/if}
                </div>

                <!-- Search Results -->
                {#if locationSearchResults.length > 0}
                    <div
                        class="mt-1 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden z-20 max-h-48 overflow-y-auto"
                    >
                        {#each locationSearchResults as result}
                            <button
                                type="button"
                                class="w-full text-left px-3 py-2 hover:bg-indigo-50 text-sm text-gray-700 flex items-center gap-2 transition-colors border-b last:border-0 border-gray-50"
                                onclick={() => selectLocation(result)}
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

                <!-- Selected Location Display -->
                {#if location && locationSearchResults.length === 0}
                    <div
                        class="mt-2 flex items-center gap-2 text-sm text-green-600"
                    >
                        <MapPin class="w-4 h-4" />
                        <span>{location}</span>
                    </div>
                {/if}
            </div>
        {/if}

        <!-- Tags -->
        <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
                Tags (up to 5)
            </label>
            <div class="flex flex-wrap gap-2 mb-2">
                {#each tags as tag}
                    <span
                        class="inline-flex items-center gap-1 px-2 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm"
                    >
                        #{tag}
                        <button
                            type="button"
                            onclick={() => removeTag(tag)}
                            class="hover:text-indigo-900"
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
                        placeholder="Add a tag and press Enter"
                        class="flex-1 px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                    />
                    <button
                        type="button"
                        onclick={addTag}
                        class="px-3 py-2 bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200 text-sm font-medium"
                    >
                        Add
                    </button>
                </div>
            {/if}
        </div>

        <!-- Media Upload (Images OR Video) -->
        <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
                Media (Optional)
            </label>

            <!-- Media Type Selector -->
            <div class="grid grid-cols-2 gap-2 mb-3">
                <button
                    type="button"
                    onclick={() => selectMediaType("images")}
                    class="p-3 rounded-xl border-2 text-center transition-all flex items-center justify-center gap-2 {mediaType ===
                    'images'
                        ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                        : 'border-gray-200 hover:border-gray-300 text-gray-600'}"
                >
                    <Image class="w-5 h-5" />
                    <span class="text-sm font-medium"
                        >Images (max {MAX_IMAGES})</span
                    >
                </button>
                <button
                    type="button"
                    onclick={() => selectMediaType("video")}
                    class="p-3 rounded-xl border-2 text-center transition-all flex items-center justify-center gap-2 {mediaType ===
                    'video'
                        ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                        : 'border-gray-200 hover:border-gray-300 text-gray-600'}"
                >
                    <Video class="w-5 h-5" />
                    <span class="text-sm font-medium"
                        >Video (max {MAX_VIDEO_DURATION_MINUTES} min)</span
                    >
                </button>
            </div>

            <!-- Images Upload Section -->
            {#if mediaType === "images"}
                {#if imagePreviews.length > 0}
                    <!-- Image Previews Grid -->
                    <div class="grid grid-cols-4 gap-2 mb-3">
                        {#each imagePreviews as preview, i}
                            <div class="relative group aspect-square">
                                <img
                                    src={preview.url}
                                    alt={preview.name}
                                    class="w-full h-full object-cover rounded-lg border border-gray-200"
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
                        <!-- Add more slot if not at max -->
                        {#if imagePreviews.length < MAX_IMAGES}
                            <label
                                for="postImages"
                                class="aspect-square flex flex-col items-center justify-center border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors"
                            >
                                <Upload class="w-5 h-5 text-gray-400" />
                                <span class="text-xs text-gray-400 mt-1"
                                    >Add</span
                                >
                            </label>
                        {/if}
                    </div>
                    <p class="text-xs text-gray-500">
                        {imagePreviews.length} of {MAX_IMAGES} images
                    </p>
                {:else}
                    <!-- Upload button when no images -->
                    <div class="flex items-center justify-center w-full">
                        <label
                            for="postImages"
                            class="flex flex-col items-center justify-center w-full h-24 border-2 border-gray-300 border-dashed rounded-xl cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors"
                        >
                            <div
                                class="flex flex-col items-center justify-center py-4"
                            >
                                <Upload class="w-6 h-6 text-gray-400 mb-1" />
                                <p class="text-sm text-gray-500">
                                    <span class="font-semibold"
                                        >Click to upload</span
                                    > images
                                </p>
                                <p class="text-xs text-gray-400 mt-1">
                                    Up to {MAX_IMAGES} images
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
                    <!-- Video Preview -->
                    <div class="relative mb-3">
                        <VideoPlayer
                            src={videoPreview}
                            compact={true}
                            class="rounded-xl border border-gray-200"
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
                    <p class="text-xs text-gray-500">{videoFile?.name}</p>
                {:else}
                    <!-- Upload button when no video -->
                    <div class="flex items-center justify-center w-full">
                        <label
                            for="postVideo"
                            class="flex flex-col items-center justify-center w-full h-24 border-2 border-gray-300 border-dashed rounded-xl cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors"
                        >
                            <div
                                class="flex flex-col items-center justify-center py-4"
                            >
                                <Video class="w-6 h-6 text-gray-400 mb-1" />
                                <p class="text-sm text-gray-500">
                                    <span class="font-semibold"
                                        >Click to upload</span
                                    > a video
                                </p>
                                <p class="text-xs text-gray-400 mt-1">
                                    MP4, MOV, WebM (max {MAX_VIDEO_DURATION_MINUTES}
                                    min, {MAX_VIDEO_SIZE_MB}MB)
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
    </form>
</Modal>

<AddPetModal
    bind:open={showAddPetModal}
    onClose={() => {
        // User cancelled/closed the modal manually
        showAddPetModal = false;
        reopenAfterPet = false;
    }}
    onPetAdded={handlePetAdded}
/>
