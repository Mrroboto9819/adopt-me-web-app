<script lang="ts">
    import Modal from "./Modal.svelte";
    import RichTextEditor from "./RichTextEditor.svelte";
    import { auth } from "$lib/stores/auth.svelte";
    import { toast } from "$lib/stores/toast.svelte";
    import { _ } from "$lib/i18n";
    import {
        X,
        MapPin,
        Tag,
        Image as ImageIcon,
        Upload,
        PawPrint,
        Loader2,
        Mail,
        Phone
    } from "lucide-svelte";
    import { onMount } from "svelte";

    interface Post {
        id: string;
        title: string;
        description: string;
        postType: string;
        reportType?: string;
        location?: string;
        tags?: string[];
        images?: string[];
        video?: string;
        preferredContact?: string;
        pet?: {
            id: string;
            name: string;
            coverImage?: string;
            species?: { label: string };
            customSpecies?: string;
        };
        pets?: {
            id: string;
            name: string;
            coverImage?: string;
            species?: { label: string };
            customSpecies?: string;
        }[];
    }

    interface Props {
        open: boolean;
        post: Post | null;
        onClose: () => void;
        onPostUpdated?: (updatedPost: any) => void;
    }

    let { open = $bindable(false), post, onClose, onPostUpdated }: Props = $props();

    // Form state
    let title = $state("");
    let description = $state("");
    let location = $state("");
    let tags = $state<string[]>([]);
    let tagInput = $state("");
    let images = $state<string[]>([]);
    let originalImages = $state<string[]>([]); // Track original images to delete removed ones
    let video = $state("");
    let selectedPetIds = $state<string[]>([]);
    let preferredContact = $state<string>("");

    const MAX_IMAGES = 3;

    // New images to upload
    let newImageFiles = $state<File[]>([]);
    let newImagePreviews = $derived(newImageFiles.map(f => URL.createObjectURL(f)));
    let totalImageCount = $derived(images.length + newImageFiles.length);

    // UI state
    let saving = $state(false);
    let pets = $state<any[]>([]);
    let loadingPets = $state(false);

    // Delete file from server
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
            console.log(`[EditPost] Deleted old image: ${fileUrl}`);
        } catch (error) {
            console.error("Failed to delete old file:", error);
        }
    }

    // Reset new files when modal closes
    $effect(() => {
        if (!open) {
            newImageFiles = [];
        }
    });

    async function uploadNewImages(): Promise<string[]> {
        if (newImageFiles.length === 0) return [];
        const formData = new FormData();
        for (const file of newImageFiles) {
            formData.append("file", file);
        }
        const res = await fetch("/api/upload", {
            method: "POST",
            headers: { Authorization: `Bearer ${auth.token}` },
            body: formData,
        });
        if (!res.ok) throw new Error("Image upload failed");
        const data = await res.json();
        return data.files as string[];
    }

    function handleImageInput(e: Event) {
        const input = e.currentTarget as HTMLInputElement;
        if (!input.files) return;
        const remaining = MAX_IMAGES - images.length - newImageFiles.length;
        if (remaining <= 0) {
            toast.error(`You can only upload up to ${MAX_IMAGES} images`);
            input.value = "";
            return;
        }
        const added = Array.from(input.files).slice(0, remaining);
        newImageFiles = [...newImageFiles, ...added];
        input.value = "";
    }

    function removeNewImage(index: number) {
        newImageFiles = newImageFiles.filter((_, i) => i !== index);
    }

    // Initialize form when post changes
    $effect(() => {
        if (post && open) {
            title = post.title || "";
            description = post.description || "";
            location = post.location || "";
            tags = post.tags ? [...post.tags] : [];
            images = post.images ? [...post.images] : [];
            originalImages = post.images ? [...post.images] : []; // Track original for cleanup
            video = post.video || "";
            // Prefer pets array; fall back to single pet for backward-compat
            if (post.pets && post.pets.length > 0) {
                selectedPetIds = post.pets.map(p => p.id);
            } else if (post.pet?.id) {
                selectedPetIds = [post.pet.id];
            } else {
                selectedPetIds = [];
            }
            preferredContact = post.preferredContact || "";

            // Fetch pets for selection
            if (pets.length === 0) {
                fetchPets();
            }
        }
    });

    async function fetchPets() {
        loadingPets = true;
        try {
            const res = await fetch("/api/graphql", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${auth.token}`,
                },
                body: JSON.stringify({
                    query: `
                        query MyPets {
                            me {
                                pets {
                                    id
                                    name
                                    coverImage
                                    species { label }
                                    customSpecies
                                }
                            }
                        }
                    `,
                }),
            });
            const result = await res.json();
            if (result.data?.me?.pets) {
                pets = result.data.me.pets;
            }
        } catch (e) {
            console.error("Failed to fetch pets:", e);
        } finally {
            loadingPets = false;
        }
    }

    function addTag() {
        const trimmed = tagInput.trim().toLowerCase().replace(/[^a-z0-9]/g, "");
        if (trimmed && !tags.includes(trimmed) && tags.length < 5) {
            tags = [...tags, trimmed];
            tagInput = "";
        }
    }

    function removeTag(tag: string) {
        tags = tags.filter((t) => t !== tag);
    }

    function handleTagKeydown(e: KeyboardEvent) {
        if (e.key === "Enter") {
            e.preventDefault();
            addTag();
        }
    }

    function removeImage(index: number) {
        images = images.filter((_, i) => i !== index);
    }

    async function handleSave() {
        if (!post) return;

        // Validate
        if (!title.trim()) {
            toast.error($_("create_post.enter_title"));
            return;
        }
        if (!description.trim()) {
            toast.error($_("create_post.enter_description"));
            return;
        }

        saving = true;
        try {
            // Upload any new images first
            const uploadedUrls = await uploadNewImages();
            const allImages = [...images, ...uploadedUrls];

            const mutation = `
                mutation UpdatePost(
                    $id: ID!
                    $title: String
                    $description: String
                    $petIds: [ID!]
                    $location: String
                    $tags: [String!]
                    $images: [String!]
                    $video: String
                    $preferredContact: PreferredContactMethod
                ) {
                    updatePost(
                        id: $id
                        title: $title
                        description: $description
                        petIds: $petIds
                        location: $location
                        tags: $tags
                        images: $images
                        video: $video
                        preferredContact: $preferredContact
                    ) {
                        id
                        title
                        description
                        location
                        tags
                        images
                        video
                        preferredContact
                        pets {
                            id
                            name
                            coverImage
                            species { label }
                            customSpecies
                        }
                    }
                }
            `;

            const res = await fetch("/api/graphql", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${auth.token}`,
                },
                body: JSON.stringify({
                    query: mutation,
                    variables: {
                        id: post.id,
                        title: title.trim(),
                        description: description.trim(),
                        petIds: selectedPetIds.length > 0 ? selectedPetIds : null,
                        location: location.trim() || null,
                        tags: tags,
                        images: allImages,
                        video: video || null,
                        preferredContact: preferredContact || null,
                    },
                }),
            });

            const result = await res.json();
            if (result.errors) throw new Error(result.errors[0].message);

            const updatedPost = result.data.updatePost;

            // Delete removed images from server
            const removedImages = originalImages.filter(img => !images.includes(img));
            for (const imgUrl of removedImages) {
                await deleteFile(imgUrl);
            }

            newImageFiles = [];
            toast.success($_("edit_post.post_updated"));
            onClose();
            if (onPostUpdated) {
                onPostUpdated(updatedPost);
            }
        } catch (e: any) {
            toast.error($_("edit_post.failed_update") + ": " + e.message);
        } finally {
            saving = false;
        }
    }

    // User contact availability
    let userHasPhone = $derived(!!auth.user?.phone);
    let userHasEmail = $derived(!!auth.user?.email);
    let needsContact = $derived(post?.postType === 'adopt' || post?.postType === 'missing');
</script>

<Modal {open} {onClose} title={$_("edit_post.title")}>
    <div class="space-y-6 max-h-[70vh] overflow-y-auto pr-2">
        <!-- Title -->
        <div>
            <label for="editPostTitle" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {$_("create_post.post_title")} <span class="text-red-500">*</span>
            </label>
            <input
                id="editPostTitle"
                type="text"
                bind:value={title}
                class="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder={$_("create_post.title_placeholder_general")}
            />
        </div>

        <!-- Description -->
        <div role="group" aria-labelledby="edit-post-desc-label">
            <span id="edit-post-desc-label" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {$_("create_post.description")} <span class="text-red-500">*</span>
            </span>
            <RichTextEditor content={description} onUpdate={(html) => description = html} placeholder={$_("create_post.desc_placeholder_general")} />
        </div>

        <!-- Pet Selection -->
        <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <PawPrint class="w-4 h-4 inline mr-1" />
                {$_("create_post.tag_pet")}
            </label>
            {#if loadingPets}
                <div class="flex items-center justify-center py-4">
                    <Loader2 class="w-5 h-5 text-indigo-500 animate-spin" />
                </div>
            {:else if pets.length === 0}
                <p class="text-sm text-gray-500 dark:text-gray-400">{$_("create_post.no_pets_found")}</p>
            {:else}
                <div class="grid grid-cols-2 gap-2">
                    {#each pets as pet}
                        <button
                            type="button"
                            onclick={() => {
                                if (selectedPetIds.includes(pet.id)) {
                                    selectedPetIds = selectedPetIds.filter(id => id !== pet.id);
                                } else {
                                    selectedPetIds = [...selectedPetIds, pet.id];
                                }
                            }}
                            class="p-3 rounded-xl border-2 text-left transition-all {selectedPetIds.includes(pet.id)
                                ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30'
                                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'}"
                        >
                            <div class="flex items-center gap-2">
                                {#if pet.coverImage}
                                    <img src={pet.coverImage} alt={pet.name} class="w-10 h-10 rounded-lg object-cover" />
                                {:else}
                                    <div class="w-10 h-10 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">🐾</div>
                                {/if}
                                <div class="min-w-0 flex-1">
                                    <p class="font-medium text-gray-900 dark:text-white truncate">{pet.name}</p>
                                    <p class="text-xs text-gray-500 dark:text-gray-400 truncate">
                                        {pet.species?.label || pet.customSpecies || ""}
                                    </p>
                                </div>
                            </div>
                        </button>
                    {/each}
                </div>
            {/if}
        </div>

        <!-- Location (for adopt/missing posts) -->
        {#if post?.postType === 'adopt' || post?.postType === 'missing'}
            <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <MapPin class="w-4 h-4 inline mr-1" />
                    {$_("create_post.location")}
                </label>
                <input
                    type="text"
                    bind:value={location}
                    class="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder={$_("create_post.search_location")}
                />
            </div>

            <!-- Preferred Contact -->
            <div role="group" aria-labelledby="edit-post-contact-label">
                <span id="edit-post-contact-label" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {$_("create_post.preferred_contact")}
                </span>
                <div class="grid grid-cols-2 gap-2">
                    <button
                        type="button"
                        onclick={() => userHasEmail && (preferredContact = 'email')}
                        disabled={!userHasEmail}
                        class="p-3 rounded-xl border-2 text-center transition-all {preferredContact === 'email'
                            ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30'
                            : !userHasEmail
                              ? 'border-gray-200 dark:border-gray-700 opacity-50 cursor-not-allowed'
                              : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'}"
                    >
                        <Mail class="w-5 h-5 mx-auto mb-1 {preferredContact === 'email' ? 'text-indigo-500' : 'text-gray-400'}" />
                        <div class="text-xs font-medium">{$_("create_post.contact_email")}</div>
                    </button>
                    <button
                        type="button"
                        onclick={() => userHasPhone && (preferredContact = 'phone')}
                        disabled={!userHasPhone}
                        class="p-3 rounded-xl border-2 text-center transition-all {preferredContact === 'phone'
                            ? 'border-green-500 bg-green-50 dark:bg-green-900/30'
                            : !userHasPhone
                              ? 'border-gray-200 dark:border-gray-700 opacity-50 cursor-not-allowed'
                              : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'}"
                    >
                        <Phone class="w-5 h-5 mx-auto mb-1 {preferredContact === 'phone' ? 'text-green-500' : 'text-gray-400'}" />
                        <div class="text-xs font-medium">{$_("create_post.contact_phone")}</div>
                    </button>
                </div>
            </div>
        {/if}

        <!-- Tags -->
        <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <Tag class="w-4 h-4 inline mr-1" />
                {$_("create_post.tags")} <span class="text-xs text-gray-400">({$_("create_post.tags_hint")})</span>
            </label>
            <div class="flex flex-wrap gap-2 mb-2">
                {#each tags as tag}
                    <span class="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 text-sm">
                        #{tag}
                        <button type="button" onclick={() => removeTag(tag)} class="hover:text-indigo-900">
                            <X class="w-3 h-3" />
                        </button>
                    </span>
                {/each}
            </div>
            {#if tags.length < 5}
                <input
                    type="text"
                    bind:value={tagInput}
                    onkeydown={handleTagKeydown}
                    onblur={addTag}
                    class="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                    placeholder={$_("create_post.add_tag_placeholder")}
                />
            {/if}
        </div>

        <!-- Images -->
        <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <ImageIcon class="w-4 h-4 inline mr-1" />
                {$_("create_post.images")}
            </label>
            <div class="grid grid-cols-4 gap-2 mb-2">
                <!-- Existing images -->
                {#each images as image, i}
                    <div class="relative aspect-square group">
                        <img src={image} alt="Post image {i + 1}" class="w-full h-full object-cover rounded-lg border border-gray-200 dark:border-gray-700" />
                        <button
                            type="button"
                            onclick={() => removeImage(i)}
                            class="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity shadow"
                        >
                            <X class="w-3 h-3" />
                        </button>
                    </div>
                {/each}
                <!-- New images (not yet uploaded) -->
                {#each newImagePreviews as preview, i}
                    <div class="relative aspect-square group">
                        <img src={preview} alt="New image {i + 1}" class="w-full h-full object-cover rounded-lg border-2 border-indigo-400 dark:border-indigo-500" />
                        <button
                            type="button"
                            onclick={() => removeNewImage(i)}
                            class="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity shadow"
                        >
                            <X class="w-3 h-3" />
                        </button>
                    </div>
                {/each}
                <!-- Add more button (hidden when at limit) -->
                {#if totalImageCount < MAX_IMAGES}
                    <label
                        for="editPostImages"
                        class="aspect-square flex flex-col items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                        <Upload class="w-5 h-5 text-gray-400 dark:text-gray-500" />
                        <span class="text-xs text-gray-400 dark:text-gray-500 mt-1">{$_("common.add")}</span>
                    </label>
                {/if}
            </div>
            <input
                id="editPostImages"
                type="file"
                accept="image/*"
                multiple
                class="hidden"
                onchange={handleImageInput}
            />
            <p class="text-xs text-gray-400 dark:text-gray-500">
                {totalImageCount} / {MAX_IMAGES} {$_("create_post.images_text")}
            </p>
        </div>
    </div>

    <!-- Action Buttons -->
    <div class="flex gap-3 justify-end pt-4 mt-4 border-t border-gray-200 dark:border-gray-700">
        <button
            type="button"
            onclick={onClose}
            class="px-5 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
            disabled={saving}
        >
            {$_("common.cancel")}
        </button>
        <button
            type="button"
            onclick={handleSave}
            class="px-5 py-2.5 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            disabled={saving}
        >
            {#if saving}
                <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                {$_("edit_post.updating")}
            {:else}
                {$_("edit_post.save_changes")}
            {/if}
        </button>
    </div>
</Modal>
