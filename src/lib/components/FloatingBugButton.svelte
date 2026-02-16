<script lang="ts">
    import { Bug } from "lucide-svelte";
    import { _ } from "$lib/i18n";
    import ReportBugModal from "./ReportBugModal.svelte";

    let isModalOpen = $state(false);
    let isHovered = $state(false);
</script>

<!-- Floating Bug Report Button -->
<div class="fixed bottom-4 right-4 z-50">
    <button
        type="button"
        onclick={() => isModalOpen = true}
        onmouseenter={() => isHovered = true}
        onmouseleave={() => isHovered = false}
        class="group flex items-center gap-2 px-3 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:pr-4"
        aria-label={$_("bug_report.button_aria")}
    >
        <Bug class="w-5 h-5" />
        <span
            class="text-sm font-medium whitespace-nowrap overflow-hidden transition-all duration-300
                {isHovered ? 'max-w-32 opacity-100' : 'max-w-0 opacity-0'}"
        >
            {$_("bug_report.button_label")}
        </span>
    </button>
</div>

<!-- Bug Report Modal -->
<ReportBugModal
    bind:open={isModalOpen}
    onClose={() => isModalOpen = false}
/>
