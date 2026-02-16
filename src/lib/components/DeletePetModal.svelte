<script lang="ts">
    import Modal from "./Modal.svelte";
    import { auth } from "$lib/stores/auth.svelte";
    import { toast } from "$lib/stores/toast.svelte";
    import { _ } from "$lib/i18n";
    import { AlertTriangle } from "lucide-svelte";

    interface Pet {
        id: string;
        name: string;
        species?: { label: string } | null;
        customSpecies?: string;
        coverImage?: string;
    }

    interface Props {
        open: boolean;
        pet: Pet | null;
        onClose: () => void;
        onPetDeleted?: () => void;
    }

    let { open = $bindable(false), pet, onClose, onPetDeleted }: Props = $props();

    let deleting = $state(false);

    async function handleDeletePet() {
        if (!pet) return;

        deleting = true;
        try {
            const mutation = `
                mutation DeletePet($id: ID!) {
                    deletePet(id: $id)
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
                    variables: { id: pet.id },
                }),
            });

            const result = await res.json();
            if (result.errors) throw new Error(result.errors[0].message);

            toast.success($_("delete_pet.pet_deleted"));
            onClose();
            if (onPetDeleted) {
                onPetDeleted();
            }
        } catch (e: any) {
            toast.error($_("delete_pet.failed_delete") + ": " + e.message);
        } finally {
            deleting = false;
        }
    }

    function getSpeciesLabel(pet: Pet | null): string {
        if (!pet) return "";
        return pet.species?.label || pet.customSpecies || $_("profile.pets.unknown_species");
    }
</script>

<Modal {open} {onClose} title={$_("delete_pet.title")}>
    <div class="space-y-6">
        <!-- Warning Icon and Message -->
        <div class="flex flex-col items-center text-center">
            <div class="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <AlertTriangle class="w-8 h-8 text-red-600" />
            </div>
            <h3 class="text-lg font-semibold text-gray-900 mb-2">
                {$_("delete_pet.confirm_title")}
            </h3>
            <p class="text-gray-600">
                {$_("delete_pet.confirm_message")}
            </p>
        </div>

        <!-- Pet Preview -->
        {#if pet}
            <div class="bg-gray-50 rounded-xl p-4 flex items-center gap-4">
                {#if pet.coverImage}
                    <img
                        src={pet.coverImage}
                        alt={pet.name}
                        class="w-16 h-16 rounded-lg object-cover"
                    />
                {:else}
                    <div class="w-16 h-16 rounded-lg bg-indigo-100 flex items-center justify-center text-2xl">
                        🐾
                    </div>
                {/if}
                <div>
                    <h4 class="font-semibold text-gray-900">{pet.name}</h4>
                    <p class="text-sm text-gray-500">{getSpeciesLabel(pet)}</p>
                </div>
            </div>
        {/if}

        <!-- Warning Box -->
        <div class="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <p class="text-sm text-amber-800">
                <strong>{$_("delete_pet.warning_title")}:</strong>
                {$_("delete_pet.warning_message")}
            </p>
        </div>

        <!-- Action Buttons -->
        <div class="flex gap-3 justify-end pt-2">
            <button
                type="button"
                onclick={onClose}
                class="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
                disabled={deleting}
            >
                {$_("common.cancel")}
            </button>
            <button
                type="button"
                onclick={handleDeletePet}
                class="px-5 py-2.5 text-sm font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                disabled={deleting}
            >
                {#if deleting}
                    <div
                        class="animate-spin rounded-full h-4 w-4 border-b-2 border-white"
                    ></div>
                    {$_("delete_pet.deleting")}
                {:else}
                    {$_("delete_pet.confirm_button")}
                {/if}
            </button>
        </div>
    </div>
</Modal>
