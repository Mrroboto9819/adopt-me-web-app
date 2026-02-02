<script lang="ts">
    import Modal from "./Modal.svelte";
    import AddPetModal from "./AddPetModal.svelte";
    import { auth } from "$lib/stores/auth.svelte";
    import { toast } from "$lib/stores/toast.svelte";

    interface Props {
        open: boolean;
        onClose: () => void;
        onPostCreated?: () => void;
    }

    let { open = $bindable(false), onClose, onPostCreated }: Props = $props();

    let title = $state("");
    let description = $state("");
    let location = $state("");
    let selectedPetId = $state("");
    let pets = $state<any[]>([]);
    let loading = $state(false);
    let loadingPets = $state(false);
    let hasFetchedPets = $state(false);
    let showAddPetModal = $state(false);
    let reopenAfterPet = $state(false);

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
                            pets(limit: 100) {
                                id
                                name
                                species {
                                    label
                                }
                                breed {
                                    label
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

            pets = result.data.pets;

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

        if (!location.trim()) {
            toast.warning("Please enter a location");
            return;
        }

        if (!selectedPetId) {
            toast.warning("Please select a pet");
            return;
        }

        loading = true;

        try {
            const response = await fetch("/api/graphql", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${auth.token}`,
                },
                body: JSON.stringify({
                    query: `
                        mutation CreatePost($title: String!, $description: String!, $petId: ID!, $location: String!) {
                            createPost(title: $title, description: $description, petId: $petId, location: $location) {
                                id
                                title
                                description
                                location
                            }
                        }
                    `,
                    variables: {
                        title,
                        description,
                        petId: selectedPetId,
                        location,
                    },
                }),
            });

            const result = await response.json();
            if (result.errors) throw new Error(result.errors[0].message);

            toast.success("Post created successfully!");
            resetForm();
            onClose();
            if (onPostCreated) onPostCreated();
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
        selectedPetId = "";
    }
</script>

<Modal {open} {onClose} title="Create Post">
    <form onsubmit={handleSubmit} class="space-y-4">
        <!-- Pet Selection -->
        <div>
            <label
                for="pet"
                class="block text-sm font-medium text-gray-700 mb-1"
            >
                Select Pet
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
                        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        required
                    >
                        <option value="">Choose a pet...</option>
                        {#each pets as pet}
                            <option value={pet.id}>
                                {pet.name} ({pet.species?.label ||
                                    pet.customSpecies ||
                                    "Unknown"}{pet.breed?.label ||
                                pet.customBreed
                                    ? ` - ${pet.breed?.label || pet.customBreed}`
                                    : ""})
                            </option>
                        {/each}
                    </select>
                    <button
                        type="button"
                        onclick={startAddPetFlow}
                        class="shrink-0 px-3 py-2 bg-gray-100 text-gray-600 rounded-md hover:bg-gray-200 text-sm font-medium"
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
                placeholder="e.g., Adorable Golden Retriever looking for a home"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
                placeholder="Tell us about this pet..."
                rows="4"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
            ></textarea>
        </div>

        <!-- Location -->
        <div>
            <label
                for="location"
                class="block text-sm font-medium text-gray-700 mb-1"
            >
                Location
            </label>
            <input
                id="location"
                type="text"
                bind:value={location}
                placeholder="e.g., San Francisco, CA"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
            />
        </div>

        <!-- Actions -->
        <div class="flex gap-3 justify-end pt-4">
            <button
                type="button"
                onclick={onClose}
                class="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                disabled={loading}
            >
                Cancel
            </button>
            <button
                type="submit"
                class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                disabled={loading || pets.length === 0}
            >
                {#if loading}
                    <div
                        class="animate-spin rounded-full h-4 w-4 border-b-2 border-white"
                    ></div>
                {/if}
                {loading ? "Creating..." : "Create Post"}
            </button>
        </div>
    </form>
</Modal>

<AddPetModal
    bind:open={showAddPetModal}
    onClose={() => {
        showAddPetModal = false;
        reopenAfterPet = false;
    }}
    onPetAdded={handlePetAdded}
/>
