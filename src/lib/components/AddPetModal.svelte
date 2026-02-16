<script lang="ts">
    import MultiStepModal from "./MultiStepModal.svelte";
    import { auth } from "$lib/stores/auth.svelte";
    import { toast } from "$lib/stores/toast.svelte";
    import { _ } from "$lib/i18n";
    import {
        Upload,
        Calendar,
        Camera,
        Heart,
        Users,
        DollarSign,
        PawPrint,
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

    // Step management
    let currentStep = $state(0);
    const steps = $derived([
        { id: "basic", title: $_("add_pet.step_basic") },
        { id: "personality", title: $_("add_pet.step_personality") },
        { id: "health", title: $_("add_pet.step_health") },
        { id: "photos", title: $_("add_pet.step_photos") },
    ]);

    // Step 1: Basic Info
    let petName = $state("");
    let petSpeciesId = $state("");
    let petBreedId = $state("");
    let customSpecies = $state("");
    let customBreed = $state("");
    let petAge = $state<number | undefined>(undefined);
    let petGender = $state("");
    let petSize = $state("");
    let petColor = $state("");
    let petWeight = $state<number | undefined>(undefined);
    let petWeightUnit = $state<'kg' | 'lb'>('kg');

    // Step 2: Personality & Compatibility
    let energyLevel = $state("");
    let temperament = $state<string[]>([]);
    let goodWithKids = $state<boolean | undefined>(undefined);
    let goodWithDogs = $state<boolean | undefined>(undefined);
    let goodWithCats = $state<boolean | undefined>(undefined);
    let houseTrained = $state<boolean | undefined>(undefined);
    let trainingLevel = $state("");

    // Step 3: Health & Adoption
    let vaccinated = $state(false);
    let neutered = $state(false);
    let microchipped = $state(false);
    let specialNeeds = $state("");
    let adoptionFee = $state<number | undefined>(undefined);
    let petStatus = $state("available");
    let petDescription = $state("");

    // Step 4: Photos
    let coverImageFiles = $state<FileList | null>(null);
    let galleryFiles = $state<FileList | null>(null);
    let uploading = $state(false);

    // Image preview URL
    let coverImagePreview = $derived(
        coverImageFiles && coverImageFiles.length > 0
            ? URL.createObjectURL(coverImageFiles[0])
            : null,
    );

    let speciesList = $state<SpeciesOption[]>([]);
    let breedsList = $state<BreedOption[]>([]);
    let loadingSpecies = $state(false);
    let loadingBreeds = $state(false);

    // Temperament options
    const temperamentOptions = [
        "friendly",
        "playful",
        "calm",
        "energetic",
        "shy",
        "independent",
        "affectionate",
        "protective",
        "curious",
        "gentle",
    ];

    // Validation for each step
    const step1Valid = $derived(
        petName.trim().length > 0 &&
            (!!petSpeciesId || customSpecies.trim().length > 0),
    );

    // Fetch species when modal opens
    $effect(() => {
        if (open && speciesList.length === 0) {
            fetchSpecies();
        }
    });

    // Reset step when modal closes
    $effect(() => {
        if (!open) {
            currentStep = 0;
        }
    });

    // Fetch breeds when species changes (only when modal is open)
    $effect(() => {
        if (!open) return;
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

    function toggleTemperament(trait: string) {
        if (temperament.includes(trait)) {
            temperament = temperament.filter((t) => t !== trait);
        } else {
            temperament = [...temperament, trait];
        }
    }

    async function handleAddPet(e: Event) {
        e.preventDefault();

        if (!petName || !step1Valid) {
            toast.warning($_("add_pet.name_species_required"));
            currentStep = 0;
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
            mutation AddPet(
                $name: String!,
                $speciesId: ID,
                $customSpecies: String,
                $breedId: ID,
                $customBreed: String,
                $age: Int,
                $gender: String,
                $size: String,
                $color: String,
                $weight: Float,
                $weightUnit: String,
                $description: String,
                $status: String,
                $energyLevel: String,
                $temperament: [String!],
                $goodWithKids: Boolean,
                $goodWithDogs: Boolean,
                $goodWithCats: Boolean,
                $houseTrained: Boolean,
                $trainingLevel: String,
                $specialNeeds: String,
                $adoptionFee: Float,
                $coverImage: String,
                $images: [String!],
                $health: HealthInput
            ) {
                addPet(
                    name: $name,
                    speciesId: $speciesId,
                    customSpecies: $customSpecies,
                    breedId: $breedId,
                    customBreed: $customBreed,
                    age: $age,
                    gender: $gender,
                    size: $size,
                    color: $color,
                    weight: $weight,
                    weightUnit: $weightUnit,
                    description: $description,
                    status: $status,
                    energyLevel: $energyLevel,
                    temperament: $temperament,
                    goodWithKids: $goodWithKids,
                    goodWithDogs: $goodWithDogs,
                    goodWithCats: $goodWithCats,
                    houseTrained: $houseTrained,
                    trainingLevel: $trainingLevel,
                    specialNeeds: $specialNeeds,
                    adoptionFee: $adoptionFee,
                    coverImage: $coverImage,
                    images: $images,
                    health: $health
                ) {
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
                        speciesId:
                            petSpeciesId && petSpeciesId !== "other"
                                ? petSpeciesId
                                : null,
                        customSpecies:
                            petSpeciesId === "other" ? customSpecies : null,
                        breedId:
                            petBreedId &&
                            petBreedId !== "other" &&
                            petSpeciesId !== "other"
                                ? petBreedId
                                : null,
                        customBreed:
                            petBreedId === "other" || petSpeciesId === "other"
                                ? customBreed
                                : null,
                        age: petAge ? Number(petAge) : null,
                        gender: petGender || null,
                        size: petSize || null,
                        color: petColor || null,
                        weight: petWeight ? Number(petWeight) : null,
                        weightUnit: petWeightUnit,
                        description: petDescription || null,
                        status: petStatus,
                        energyLevel: energyLevel || null,
                        temperament:
                            temperament.length > 0 ? temperament : null,
                        goodWithKids,
                        goodWithDogs,
                        goodWithCats,
                        houseTrained,
                        trainingLevel: trainingLevel || null,
                        specialNeeds: specialNeeds || null,
                        adoptionFee: adoptionFee ? Number(adoptionFee) : null,
                        coverImage: coverImageUrl,
                        images: galleryUrls,
                        health: {
                            vaccinated,
                            neutered,
                            microchipped,
                        },
                    },
                }),
            });

            const result = await res.json();
            if (result.errors) throw new Error(result.errors[0].message);

            toast.success($_("add_pet.pet_added"));
            resetForm();
            onClose();
            if (onPetAdded) {
                onPetAdded(result.data.addPet);
            }
        } catch (e: any) {
            toast.error($_("add_pet.failed_add") + ": " + e.message);
        } finally {
            uploading = false;
        }
    }

    function resetForm() {
        // Step 1
        petName = "";
        petSpeciesId = "";
        petBreedId = "";
        customSpecies = "";
        customBreed = "";
        petAge = undefined;
        petGender = "";
        petSize = "";
        petColor = "";
        petWeight = undefined;
        petWeightUnit = 'kg';
        // Step 2
        energyLevel = "";
        temperament = [];
        goodWithKids = undefined;
        goodWithDogs = undefined;
        goodWithCats = undefined;
        houseTrained = undefined;
        trainingLevel = "";
        // Step 3
        vaccinated = false;
        neutered = false;
        microchipped = false;
        specialNeeds = "";
        adoptionFee = undefined;
        petStatus = "available";
        petDescription = "";
        // Step 4
        coverImageFiles = null;
        galleryFiles = null;
        // Reset step
        currentStep = 0;
    }
</script>

<form onsubmit={handleAddPet}>
    <MultiStepModal
        {open}
        {onClose}
        title={$_("add_pet.title")}
        {steps}
        bind:currentStep
        canProceed={currentStep === 0 ? step1Valid : true}
        isSubmitting={uploading}
        submitLabel={uploading
            ? $_("add_pet.adding_pet")
            : $_("add_pet.add_pet")}
    >
        <!-- Step 1: Basic Info -->
        {#if currentStep === 0}
            <div class="space-y-4">
                <div class="flex items-center gap-2 mb-4">
                    <PawPrint class="w-5 h-5 text-indigo-500" />
                    <h3 class="font-semibold text-gray-900 dark:text-white">
                        {$_("add_pet.basic_info")}
                    </h3>
                </div>

                <!-- Name -->
                <div>
                    <label
                        for="petName"
                        class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                    >
                        {$_("add_pet.pet_name")}
                        <span class="text-red-500">*</span>
                    </label>
                    <input
                        id="petName"
                        type="text"
                        bind:value={petName}
                        class="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        placeholder={$_("add_pet.pet_name_placeholder")}
                        required
                    />
                </div>

                <!-- Species & Age -->
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label
                            for="petSpecies"
                            class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                        >
                            {$_("add_pet.species")}
                            <span class="text-red-500">*</span>
                        </label>
                        <select
                            id="petSpecies"
                            bind:value={petSpeciesId}
                            class="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            required
                            disabled={loadingSpecies}
                        >
                            <option value="" disabled
                                >{loadingSpecies
                                    ? $_("common.loading")
                                    : $_("add_pet.select_species")}</option
                            >
                            {#each speciesList as species}
                                <option value={species.id}
                                    >{species.label}</option
                                >
                            {/each}
                            <option value="other"
                                >{$_("add_pet.other_species")}</option
                            >
                        </select>
                        {#if petSpeciesId === "other"}
                            <input
                                type="text"
                                bind:value={customSpecies}
                                class="w-full mt-2 px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                placeholder={$_(
                                    "add_pet.other_species_placeholder",
                                )}
                                required
                            />
                        {/if}
                    </div>
                    <div>
                        <label
                            for="petAge"
                            class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                        >
                            {$_("add_pet.age")} ({$_("add_pet.age_years")})
                        </label>
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
                                class="w-full pl-9 pr-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                placeholder="e.g. 2"
                            />
                        </div>
                    </div>
                </div>

                <!-- Breed -->
                <div>
                    <label
                        for="petBreed"
                        class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                    >
                        {$_("add_pet.breed")} ({$_("common.optional")})
                    </label>
                    {#if petSpeciesId === "other"}
                        <input
                            id="petBreed"
                            type="text"
                            bind:value={customBreed}
                            class="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            placeholder={$_("add_pet.other_breed_placeholder")}
                        />
                    {:else}
                        <select
                            id="petBreed"
                            bind:value={petBreedId}
                            class="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:text-gray-500 dark:disabled:text-gray-500"
                            disabled={!petSpeciesId || loadingBreeds}
                        >
                            <option value="">
                                {#if loadingBreeds}
                                    {$_("common.loading")}
                                {:else if !petSpeciesId}
                                    {$_("add_pet.select_species")}
                                {:else}
                                    {$_("add_pet.select_breed")}
                                {/if}
                            </option>
                            {#each breedsList as breed}
                                <option value={breed.id}>{breed.name}</option>
                            {/each}
                            {#if breedsList.length > 0}
                                <option value="other"
                                    >{$_("add_pet.other_breed")}</option
                                >
                            {/if}
                        </select>
                        {#if petBreedId === "other"}
                            <input
                                type="text"
                                bind:value={customBreed}
                                class="w-full mt-2 px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                placeholder={$_(
                                    "add_pet.other_breed_placeholder",
                                )}
                            />
                        {/if}
                    {/if}
                </div>

                <!-- Gender, Size, Weight -->
                <div class="grid grid-cols-3 gap-4">
                    <div>
                        <label
                            for="petGender"
                            class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                        >
                            {$_("add_pet.gender")}
                        </label>
                        <select
                            id="petGender"
                            bind:value={petGender}
                            class="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        >
                            <option value="">{$_("add_pet.select")}</option>
                            <option value="male"
                                >{$_("add_pet.gender_male")}</option
                            >
                            <option value="female"
                                >{$_("add_pet.gender_female")}</option
                            >
                        </select>
                    </div>
                    <div>
                        <label
                            for="petSize"
                            class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                        >
                            {$_("add_pet.size")}
                        </label>
                        <select
                            id="petSize"
                            bind:value={petSize}
                            class="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        >
                            <option value="">{$_("add_pet.select")}</option>
                            <option value="small"
                                >{$_("add_pet.size_small")}</option
                            >
                            <option value="medium"
                                >{$_("add_pet.size_medium")}</option
                            >
                            <option value="large"
                                >{$_("add_pet.size_large")}</option
                            >
                        </select>
                    </div>
                    <div>
                        <label
                            for="petWeight"
                            class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                        >
                            {$_("add_pet.weight")}
                        </label>
                        <div class="flex">
                            <input
                                id="petWeight"
                                type="number"
                                min="0"
                                step="0.1"
                                bind:value={petWeight}
                                class="flex-1 min-w-0 px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-l-xl focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                placeholder="0"
                            />
                            <select
                                bind:value={petWeightUnit}
                                class="px-2 py-2.5 border border-l-0 border-gray-300 dark:border-gray-600 rounded-r-xl focus:ring-indigo-500 focus:border-indigo-500 bg-gray-50 dark:bg-gray-600 text-gray-900 dark:text-white text-sm font-medium"
                            >
                                <option value="kg">{$_("add_pet.weight_unit_kg")}</option>
                                <option value="lb">{$_("add_pet.weight_unit_lb")}</option>
                            </select>
                        </div>
                    </div>
                </div>

                <!-- Color -->
                <div>
                    <label
                        for="petColor"
                        class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                    >
                        {$_("add_pet.color")}
                    </label>
                    <input
                        id="petColor"
                        type="text"
                        bind:value={petColor}
                        class="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        placeholder={$_("add_pet.color_placeholder")}
                    />
                </div>
            </div>
        {/if}

        <!-- Step 2: Personality & Compatibility -->
        {#if currentStep === 1}
            <div class="space-y-5">
                <div class="flex items-center gap-2 mb-4">
                    <Users class="w-5 h-5 text-indigo-500" />
                    <h3 class="font-semibold text-gray-900 dark:text-white">
                        {$_("add_pet.personality_title")}
                    </h3>
                </div>

                <!-- Energy Level & Training -->
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label
                            for="energyLevel"
                            class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                        >
                            {$_("add_pet.energy_level")}
                        </label>
                        <select
                            id="energyLevel"
                            bind:value={energyLevel}
                            class="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        >
                            <option value="">{$_("add_pet.select")}</option>
                            <option value="low"
                                >{$_("add_pet.energy_low")}</option
                            >
                            <option value="medium"
                                >{$_("add_pet.energy_medium")}</option
                            >
                            <option value="high"
                                >{$_("add_pet.energy_high")}</option
                            >
                        </select>
                    </div>
                    <div>
                        <label
                            for="trainingLevel"
                            class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                        >
                            {$_("add_pet.training_level")}
                        </label>
                        <select
                            id="trainingLevel"
                            bind:value={trainingLevel}
                            class="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        >
                            <option value="">{$_("add_pet.select")}</option>
                            <option value="none"
                                >{$_("add_pet.training_none")}</option
                            >
                            <option value="basic"
                                >{$_("add_pet.training_basic")}</option
                            >
                            <option value="advanced"
                                >{$_("add_pet.training_advanced")}</option
                            >
                        </select>
                    </div>
                </div>

                <!-- Temperament -->
                <div role="group" aria-labelledby="temperament-label">
                    <span id="temperament-label" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {$_("add_pet.temperament")}
                    </span>
                    <div class="flex flex-wrap gap-2">
                        {#each temperamentOptions as trait}
                            <button
                                type="button"
                                onclick={() => toggleTemperament(trait)}
                                class="px-3 py-1.5 text-sm rounded-full border transition-colors
                                    {temperament.includes(trait)
                                    ? 'bg-indigo-100 dark:bg-indigo-900/50 border-indigo-300 dark:border-indigo-700 text-indigo-700 dark:text-indigo-300'
                                    : 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'}"
                            >
                                {$_(`add_pet.temperament_${trait}`)}
                            </button>
                        {/each}
                    </div>
                </div>

                <!-- Compatibility -->
                <div role="group" aria-labelledby="compatibility-label">
                    <span id="compatibility-label" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                        {$_("add_pet.compatibility")}
                    </span>
                    <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <!-- Good with kids -->
                        <div class="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                            <p class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                {$_("add_pet.good_with_kids")}
                            </p>
                            <div class="flex gap-2">
                                <button
                                    type="button"
                                    onclick={() => (goodWithKids = true)}
                                    class="flex-1 py-1.5 text-sm rounded-lg border transition-colors
                                    {goodWithKids === true
                                        ? 'bg-green-100 dark:bg-green-900/50 border-green-300 dark:border-green-700 text-green-700 dark:text-green-300'
                                        : 'bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300'}"
                                >
                                    {$_("common.yes")}
                                </button>
                                <button
                                    type="button"
                                    onclick={() => (goodWithKids = false)}
                                    class="flex-1 py-1.5 text-sm rounded-lg border transition-colors
                                    {goodWithKids === false
                                        ? 'bg-red-100 dark:bg-red-900/50 border-red-300 dark:border-red-700 text-red-700 dark:text-red-300'
                                        : 'bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300'}"
                                >
                                    {$_("common.no")}
                                </button>
                            </div>
                        </div>
                        <!-- Good with dogs -->
                        <div class="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                            <p class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                {$_("add_pet.good_with_dogs")}
                            </p>
                            <div class="flex gap-2">
                                <button
                                    type="button"
                                    onclick={() => (goodWithDogs = true)}
                                    class="flex-1 py-1.5 text-sm rounded-lg border transition-colors
                                    {goodWithDogs === true
                                        ? 'bg-green-100 dark:bg-green-900/50 border-green-300 dark:border-green-700 text-green-700 dark:text-green-300'
                                        : 'bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300'}"
                                >
                                    {$_("common.yes")}
                                </button>
                                <button
                                    type="button"
                                    onclick={() => (goodWithDogs = false)}
                                    class="flex-1 py-1.5 text-sm rounded-lg border transition-colors
                                    {goodWithDogs === false
                                        ? 'bg-red-100 dark:bg-red-900/50 border-red-300 dark:border-red-700 text-red-700 dark:text-red-300'
                                        : 'bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300'}"
                                >
                                    {$_("common.no")}
                                </button>
                            </div>
                        </div>
                        <!-- Good with cats -->
                        <div class="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                            <p class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                {$_("add_pet.good_with_cats")}
                            </p>
                            <div class="flex gap-2">
                                <button
                                    type="button"
                                    onclick={() => (goodWithCats = true)}
                                    class="flex-1 py-1.5 text-sm rounded-lg border transition-colors
                                    {goodWithCats === true
                                        ? 'bg-green-100 dark:bg-green-900/50 border-green-300 dark:border-green-700 text-green-700 dark:text-green-300'
                                        : 'bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300'}"
                                >
                                    {$_("common.yes")}
                                </button>
                                <button
                                    type="button"
                                    onclick={() => (goodWithCats = false)}
                                    class="flex-1 py-1.5 text-sm rounded-lg border transition-colors
                                    {goodWithCats === false
                                        ? 'bg-red-100 dark:bg-red-900/50 border-red-300 dark:border-red-700 text-red-700 dark:text-red-300'
                                        : 'bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300'}"
                                >
                                    {$_("common.no")}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- House Trained -->
                <div class="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                    <div class="flex items-center justify-between">
                        <span class="text-sm font-medium text-gray-700 dark:text-gray-300"
                            >{$_("add_pet.house_trained")}</span
                        >
                        <div class="flex gap-2">
                            <button
                                type="button"
                                onclick={() => (houseTrained = true)}
                                class="px-4 py-1.5 text-sm rounded-lg border transition-colors
                                {houseTrained === true
                                    ? 'bg-green-100 dark:bg-green-900/50 border-green-300 dark:border-green-700 text-green-700 dark:text-green-300'
                                    : 'bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300'}"
                            >
                                {$_("common.yes")}
                            </button>
                            <button
                                type="button"
                                onclick={() => (houseTrained = false)}
                                class="px-4 py-1.5 text-sm rounded-lg border transition-colors
                                {houseTrained === false
                                    ? 'bg-red-100 dark:bg-red-900/50 border-red-300 dark:border-red-700 text-red-700 dark:text-red-300'
                                    : 'bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300'}"
                            >
                                {$_("common.no")}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        {/if}

        <!-- Step 3: Health & Adoption -->
        {#if currentStep === 2}
            <div class="space-y-5">
                <div class="flex items-center gap-2 mb-4">
                    <Heart class="w-5 h-5 text-red-500" />
                    <h3 class="font-semibold text-gray-900 dark:text-white">
                        {$_("add_pet.health_adoption_title")}
                    </h3>
                </div>

                <!-- Health Checkboxes -->
                <div
                    class="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl space-y-3"
                >
                    <p
                        class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                    >
                        {$_("add_pet.health_info")}
                    </p>
                    <label class="flex items-center gap-3 cursor-pointer">
                        <input
                            type="checkbox"
                            bind:checked={vaccinated}
                            class="w-5 h-5 text-indigo-600 border-gray-300 dark:border-gray-600 rounded focus:ring-indigo-500 dark:bg-gray-700"
                        />
                        <span class="text-sm text-gray-700 dark:text-gray-300"
                            >{$_("add_pet.vaccinated")}</span
                        >
                    </label>
                    <label class="flex items-center gap-3 cursor-pointer">
                        <input
                            type="checkbox"
                            bind:checked={neutered}
                            class="w-5 h-5 text-indigo-600 border-gray-300 dark:border-gray-600 rounded focus:ring-indigo-500 dark:bg-gray-700"
                        />
                        <span class="text-sm text-gray-700 dark:text-gray-300"
                            >{$_("add_pet.neutered")}</span
                        >
                    </label>
                    <label class="flex items-center gap-3 cursor-pointer">
                        <input
                            type="checkbox"
                            bind:checked={microchipped}
                            class="w-5 h-5 text-indigo-600 border-gray-300 dark:border-gray-600 rounded focus:ring-indigo-500 dark:bg-gray-700"
                        />
                        <span class="text-sm text-gray-700 dark:text-gray-300"
                            >{$_("add_pet.microchipped")}</span
                        >
                    </label>
                </div>

                <!-- Special Needs -->
                <div>
                    <label
                        for="specialNeeds"
                        class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                    >
                        {$_("add_pet.special_needs")}
                    </label>
                    <textarea
                        id="specialNeeds"
                        bind:value={specialNeeds}
                        rows="2"
                        class="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-indigo-500 focus:border-indigo-500 resize-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        placeholder={$_("add_pet.special_needs_placeholder")}
                    ></textarea>
                </div>

                <!-- Status & Adoption Fee -->
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label
                            for="petStatus"
                            class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                        >
                            {$_("add_pet.status")}
                        </label>
                        <select
                            id="petStatus"
                            bind:value={petStatus}
                            class="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        >
                            <option value="available"
                                >{$_("add_pet.status_available")}</option
                            >
                            <option value="pending"
                                >{$_("add_pet.status_pending")}</option
                            >
                            <option value="adopted"
                                >{$_("add_pet.status_adopted")}</option
                            >
                            <option value="not_for_adoption"
                                >{$_("add_pet.status_not_for_adoption")}</option
                            >
                        </select>
                    </div>
                    <div>
                        <label
                            for="adoptionFee"
                            class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                        >
                            {$_("add_pet.adoption_fee")}
                        </label>
                        <div class="relative">
                            <div
                                class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400"
                            >
                                <DollarSign class="w-4 h-4" />
                            </div>
                            <input
                                id="adoptionFee"
                                type="number"
                                min="0"
                                step="1"
                                bind:value={adoptionFee}
                                class="w-full pl-9 pr-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                placeholder="0"
                            />
                        </div>
                    </div>
                </div>

                <!-- Description -->
                <div>
                    <label
                        for="petDescription"
                        class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                    >
                        {$_("add_pet.description")}
                    </label>
                    <textarea
                        id="petDescription"
                        bind:value={petDescription}
                        rows="4"
                        class="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-indigo-500 focus:border-indigo-500 resize-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        placeholder={$_("add_pet.description_placeholder")}
                    ></textarea>
                </div>
            </div>
        {/if}

        <!-- Step 4: Photos -->
        {#if currentStep === 3}
            <div class="space-y-5">
                <div class="flex items-center gap-2 mb-4">
                    <Camera class="w-5 h-5 text-indigo-500" />
                    <h3 class="font-semibold text-gray-900 dark:text-white">
                        {$_("add_pet.photos")}
                    </h3>
                </div>

                <!-- Cover Image -->
                <div>
                    <label
                        for="petCoverImage"
                        class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                    >
                        {$_("add_pet.cover_image")}
                    </label>
                    <div class="flex items-center justify-center w-full">
                        {#if coverImagePreview}
                            <div class="relative w-full">
                                <img
                                    src={coverImagePreview}
                                    alt="Cover preview"
                                    class="w-full h-48 object-cover rounded-xl border-2 border-green-300"
                                />
                                <button
                                    type="button"
                                    onclick={() => (coverImageFiles = null)}
                                    class="absolute top-2 right-2 p-1.5 bg-red-500 hover:bg-red-600 text-white rounded-full shadow-lg transition-colors"
                                    aria-label="Remove image"
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
                                            d="M6 18L18 6M6 6l12 12"
                                        ></path>
                                    </svg>
                                </button>
                                <label
                                    for="petCoverImage"
                                    class="absolute bottom-2 right-2 px-3 py-1.5 bg-white/90 hover:bg-white text-gray-700 text-xs font-medium rounded-lg cursor-pointer shadow-lg transition-colors"
                                >
                                    {$_("common.change")}
                                </label>
                            </div>
                        {:else}
                            <label
                                for="petCoverImage"
                                class="flex flex-col items-center justify-center w-full h-48 border-2 border-gray-300 dark:border-gray-600 border-dashed rounded-xl cursor-pointer bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                            >
                                <div
                                    class="flex flex-col items-center justify-center pt-5 pb-6"
                                >
                                    <Upload
                                        class="w-10 h-10 text-gray-400 dark:text-gray-500 mb-3"
                                    />
                                    <p
                                        class="text-sm text-gray-500 dark:text-gray-400 font-medium"
                                    >
                                        {$_("add_pet.click_upload_cover")}
                                    </p>
                                    <p
                                        class="text-xs text-gray-400 dark:text-gray-500 mt-1"
                                    >
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

                <!-- Photo tips -->
                <div class="p-4 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl">
                    <p
                        class="text-sm font-medium text-indigo-900 dark:text-indigo-200 mb-2"
                    >
                        {$_("add_pet.photo_tips_title")}
                    </p>
                    <ul
                        class="text-xs text-indigo-700 dark:text-indigo-300 space-y-1"
                    >
                        <li>• {$_("add_pet.photo_tip_1")}</li>
                        <li>• {$_("add_pet.photo_tip_2")}</li>
                        <li>• {$_("add_pet.photo_tip_3")}</li>
                    </ul>
                </div>
            </div>
        {/if}
    </MultiStepModal>
</form>
