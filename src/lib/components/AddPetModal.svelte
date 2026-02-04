<script lang="ts">
    import Modal from "./Modal.svelte";
    import { auth } from "$lib/stores/auth.svelte";
    import { toast } from "$lib/stores/toast.svelte";
    import {
        Upload,
        Calendar,
        Image,
        Camera,
    } from "lucide-svelte";

    interface Props {
        open: boolean;
        onClose: () => void;
        onPetAdded?: (pet?: { id: string; name: string }) => void;
    }

    let { open = $bindable(false), onClose, onPetAdded }: Props = $props();

    interface SpeciesOption {
        id: string;
        name: string;
        label: string;
    }

    interface BreedOption {
        id: string;
        name: string;
    }

    let petName = $state("");
    let petSpeciesId = $state("");
    let petBreedId = $state("");
    let customSpecies = $state("");
    let customBreed = $state("");
    let petAge = $state<number | undefined>(undefined);
    let coverImageFiles = $state<FileList | null>(null);
    let galleryFiles = $state<FileList | null>(null);
    let uploading = $state(false);

    // Image preview URL
    let coverImagePreview = $derived(
        coverImageFiles && coverImageFiles.length > 0
            ? URL.createObjectURL(coverImageFiles[0])
            : null
    );

    let speciesList = $state<SpeciesOption[]>([]);
    let breedsList = $state<BreedOption[]>([]);
    let loadingSpecies = $state(false);
    let loadingBreeds = $state(false);

    // Fetch species when modal opens
    $effect(() => {
        if (open && speciesList.length === 0) {
            fetchSpecies();
        }
    });

    // Fetch breeds when species changes
    $effect(() => {
        if (petSpeciesId && petSpeciesId !== "other") {
            fetchBreedsBySpecies(petSpeciesId);
        } else {
            breedsList = [];
            petBreedId = "";
        }
    });

    async function fetchSpecies() {
        loadingSpecies = true;
        try {
            const query = `
                query {
                    species {
                        id
                        name
                        label
                    }
                }
            `;
            const res = await fetch("/api/graphql", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ query }),
            });
            const result = await res.json();
            if (result.data?.species) {
                speciesList = result.data.species;
            }
        } catch (e) {
            console.error("Failed to fetch species:", e);
        } finally {
            loadingSpecies = false;
        }
    }

    async function fetchBreedsBySpecies(speciesId: string) {
        loadingBreeds = true;
        petBreedId = "";
        breedsList = [];
        try {
            const query = `
                query BreedsBySpeciesId($speciesId: ID!) {
                    breedsBySpeciesId(speciesId: $speciesId) {
                        id
                        name
                    }
                }
            `;
            const res = await fetch("/api/graphql", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    query,
                    variables: { speciesId },
                }),
            });
            const result = await res.json();
            if (result.data?.breedsBySpeciesId) {
                breedsList = result.data.breedsBySpeciesId;
            }
        } catch (e) {
            console.error("Failed to fetch breeds:", e);
        } finally {
            loadingBreeds = false;
        }
    }

    async function uploadFiles(fileList: FileList): Promise<string[]> {
        const formData = new FormData();
        for (let i = 0; i < fileList.length; i++) {
            formData.append("file", fileList[i]);
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

    async function handleAddPet(e: Event) {
        e.preventDefault();

        const hasSpecies = petSpeciesId || customSpecies;
        if (!petName || !hasSpecies) {
            toast.warning("Name and Species are required");
            return;
        }

        uploading = true;
        try {
            let coverImageUrl = "";
            let galleryUrls: string[] = [];

            if (coverImageFiles && coverImageFiles.length > 0) {
                const urls = await uploadFiles(coverImageFiles);
                coverImageUrl = urls[0];
            }

            if (galleryFiles && galleryFiles.length > 0) {
                galleryUrls = await uploadFiles(galleryFiles);
            }

            const mutation = `
            mutation AddPet($name: String!, $speciesId: ID, $customSpecies: String, $breedId: ID, $customBreed: String, $age: Int, $coverImage: String, $images: [String!]) {
                addPet(name: $name, speciesId: $speciesId, customSpecies: $customSpecies, breedId: $breedId, customBreed: $customBreed, age: $age, coverImage: $coverImage, images: $images) {
                    id
                    name
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
                        name: petName,
                        speciesId: petSpeciesId && petSpeciesId !== "other" ? petSpeciesId : null,
                        customSpecies: petSpeciesId === "other" ? customSpecies : null,
                        breedId: petBreedId && petBreedId !== "other" && petSpeciesId !== "other" ? petBreedId : null,
                        customBreed: petBreedId === "other" || petSpeciesId === "other" ? customBreed : null,
                        age: petAge ? Number(petAge) : null,
                        coverImage: coverImageUrl,
                        images: galleryUrls,
                    },
                }),
            });

            const result = await res.json();
            if (result.errors) throw new Error(result.errors[0].message);

            toast.success(`${petName} has been listed successfully!`);
            resetForm();
            // Don't call onClose() here - let onPetAdded handle modal state
            // This allows the parent to decide whether to close or reopen another modal
            if (onPetAdded) {
                onPetAdded(result.data.addPet);
            } else {
                onClose();
            }
        } catch (e: any) {
            toast.error("Error adding pet: " + e.message);
        } finally {
            uploading = false;
        }
    }

    function resetForm() {
        petName = "";
        petSpeciesId = "";
        petBreedId = "";
        customSpecies = "";
        customBreed = "";
        petAge = undefined;
        coverImageFiles = null;
        galleryFiles = null;
    }
</script>

<Modal {open} {onClose} title="List a New Pet">
    <form onsubmit={handleAddPet} class="space-y-6">
        <!-- Basic Info Section -->
        <div class="space-y-4">
            <div>
                <label
                    for="petName"
                    class="block text-sm font-medium text-gray-700 mb-1"
                    >Pet Name</label
                >
                <div class="relative">
                    <input
                        id="petName"
                        type="text"
                        bind:value={petName}
                        class="w-full pl-3 pr-3 py-2.5 border border-gray-300 rounded-xl focus:ring-indigo-500 focus:border-indigo-500 shadow-sm transition-shadow"
                        placeholder="e.g. Buddy"
                        required
                    />
                </div>
            </div>

            <div class="grid grid-cols-2 gap-4">
                <div>
                    <label
                        for="petSpecies"
                        class="block text-sm font-medium text-gray-700 mb-1"
                        >Species</label
                    >
                    <div class="relative">
                        <select
                            id="petSpecies"
                            bind:value={petSpeciesId}
                            class="w-full pl-3 pr-8 py-2.5 border border-gray-300 rounded-xl focus:ring-indigo-500 focus:border-indigo-500 shadow-sm appearance-none bg-white"
                            required
                            disabled={loadingSpecies}
                        >
                            <option value="" disabled selected>
                                {loadingSpecies ? "Loading..." : "Select Type"}
                            </option>
                            {#each speciesList as species}
                                <option value={species.id}>{species.label}</option>
                            {/each}
                            <option value="other">Other</option>
                        </select>
                        <div
                            class="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none text-gray-500"
                        >
                            <svg
                                class="h-4 w-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                                ><path
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                    stroke-width="2"
                                    d="M19 9l-7 7-7-7"
                                ></path></svg
                            >
                        </div>
                    </div>
                    {#if petSpeciesId === "other"}
                        <input
                            type="text"
                            bind:value={customSpecies}
                            class="w-full mt-2 pl-3 pr-3 py-2.5 border border-gray-300 rounded-xl focus:ring-indigo-500 focus:border-indigo-500 shadow-sm"
                            placeholder="Enter species name"
                            required
                        />
                    {/if}
                </div>
                <div>
                    <label
                        for="petAge"
                        class="block text-sm font-medium text-gray-700 mb-1"
                        >Age (Years)</label
                    >
                    <div class="relative">
                        <div
                            class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400"
                        >
                            <Calendar class="w-4 h-4" />
                        </div>
                        <input
                            id="petAge"
                            type="number"
                            min="0"
                            step="0.5"
                            bind:value={petAge}
                            class="w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-xl focus:ring-indigo-500 focus:border-indigo-500 shadow-sm"
                            placeholder="e.g. 2"
                        />
                    </div>
                </div>
            </div>

            <div>
                <label
                    for="petBreed"
                    class="block text-sm font-medium text-gray-700 mb-1"
                    >Breed (Optional)</label
                >
                {#if petSpeciesId === "other"}
                    <!-- Show only text input when species is "Other" -->
                    <input
                        id="petBreed"
                        type="text"
                        bind:value={customBreed}
                        class="w-full pl-3 pr-3 py-2.5 border border-gray-300 rounded-xl focus:ring-indigo-500 focus:border-indigo-500 shadow-sm"
                        placeholder="Enter breed name"
                    />
                {:else}
                    <!-- Show select dropdown for known species -->
                    <div class="relative">
                        <select
                            id="petBreed"
                            bind:value={petBreedId}
                            class="w-full pl-3 pr-8 py-2.5 border border-gray-300 rounded-xl focus:ring-indigo-500 focus:border-indigo-500 shadow-sm appearance-none bg-white disabled:bg-gray-100 disabled:cursor-not-allowed"
                            disabled={!petSpeciesId || loadingBreeds}
                        >
                            <option value="">
                                {#if loadingBreeds}
                                    Loading...
                                {:else if !petSpeciesId}
                                    Select species first
                                {:else if breedsList.length === 0}
                                    No breeds available
                                {:else}
                                    Select Breed
                                {/if}
                            </option>
                            {#each breedsList as breed}
                                <option value={breed.id}>{breed.name}</option>
                            {/each}
                            {#if breedsList.length > 0}
                                <option value="other">Other</option>
                            {/if}
                        </select>
                        <div
                            class="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none text-gray-500"
                        >
                            <svg
                                class="h-4 w-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                                ><path
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                    stroke-width="2"
                                    d="M19 9l-7 7-7-7"
                                ></path></svg
                            >
                        </div>
                    </div>
                    {#if petBreedId === "other"}
                        <input
                            type="text"
                            bind:value={customBreed}
                            class="w-full mt-2 pl-3 pr-3 py-2.5 border border-gray-300 rounded-xl focus:ring-indigo-500 focus:border-indigo-500 shadow-sm"
                            placeholder="Enter breed name"
                        />
                    {/if}
                {/if}
            </div>
        </div>

        <!-- Media Upload -->
        <div class="space-y-4 pt-2 border-t border-gray-100">
            <h3
                class="text-sm font-semibold text-gray-900 flex items-center gap-2"
            >
                <Camera class="w-4 h-4 text-indigo-500" />
                Photos
            </h3>

            <div>
                <label class="block text-sm font-medium text-gray-700 mb-2"
                    >Cover Photo</label
                >
                <div class="flex items-center justify-center w-full">
                    {#if coverImagePreview}
                        <!-- Show image preview -->
                        <div class="relative w-full">
                            <img
                                src={coverImagePreview}
                                alt="Cover preview"
                                class="w-full h-40 object-cover rounded-xl border-2 border-green-300"
                            />
                            <button
                                type="button"
                                onclick={() => (coverImageFiles = null)}
                                class="absolute top-2 right-2 p-1.5 bg-red-500 hover:bg-red-600 text-white rounded-full shadow-lg transition-colors"
                                aria-label="Remove image"
                            >
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                                </svg>
                            </button>
                            <label
                                for="petCoverImage"
                                class="absolute bottom-2 right-2 px-3 py-1.5 bg-white/90 hover:bg-white text-gray-700 text-xs font-medium rounded-lg cursor-pointer shadow-lg transition-colors"
                            >
                                Change
                            </label>
                        </div>
                    {:else}
                        <!-- Show upload button -->
                        <label
                            for="petCoverImage"
                            class="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-xl cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors"
                        >
                            <div
                                class="flex flex-col items-center justify-center pt-5 pb-6"
                            >
                                <Upload class="w-8 h-8 text-gray-400 mb-2" />
                                <p class="text-sm text-gray-500">
                                    <span class="font-semibold"
                                        >Click to upload</span
                                    > cover image
                                </p>
                                <p class="text-xs text-gray-500">
                                    PNG, JPG or GIF
                                </p>
                            </div>
                        </label>
                    {/if}
                    <input
                        id="petCoverImage"
                        type="file"
                        accept="image/*"
                        class="hidden"
                        onchange={(e) =>
                            (coverImageFiles = e.currentTarget.files)}
                    />
                </div>
            </div>
        </div>

        <div class="flex gap-3 justify-end pt-4 border-t border-gray-100 mt-2">
            <button
                type="button"
                onclick={onClose}
                class="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                disabled={uploading}
            >
                Cancel
            </button>
            <button
                type="submit"
                class="px-5 py-2.5 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 shadow-md transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                disabled={uploading}
            >
                {#if uploading}
                    <div
                        class="animate-spin rounded-full h-4 w-4 border-b-2 border-white"
                    ></div>
                    Saving...
                {:else}
                    List Pet
                {/if}
            </button>
        </div>
    </form>
</Modal>
