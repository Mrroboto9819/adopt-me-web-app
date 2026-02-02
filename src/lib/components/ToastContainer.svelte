<script lang="ts">
    import { toast } from "$lib/stores/toast.svelte";
    import Toast from "./Toast.svelte";
</script>

<div
    class="
    fixed z-50 flex flex-col gap-2
    top-4 left-4 right-4
    sm:left-auto sm:right-4 sm:max-w-sm
  "
>
    {#each toast.toasts as toastItem (toastItem.id)}
        <Toast toast={toastItem} />
    {/each}
</div>
