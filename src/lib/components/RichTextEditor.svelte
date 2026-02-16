<script lang="ts">
    import { onMount, onDestroy } from "svelte";
    import { Editor } from "@tiptap/core";
    import StarterKit from "@tiptap/starter-kit";
    import Placeholder from "@tiptap/extension-placeholder";
    import CharacterCount from "@tiptap/extension-character-count";
    import { Bold, Italic, List, ListOrdered, Undo, Redo } from "lucide-svelte";

    interface Props {
        content?: string;
        placeholder?: string;
        maxLength?: number;
        minHeight?: string;
        onUpdate?: (html: string) => void;
        disabled?: boolean;
    }

    let {
        content = "",
        placeholder = "Write something...",
        maxLength = 5000,
        minHeight = "150px",
        onUpdate,
        disabled = false,
    }: Props = $props();

    let element: HTMLDivElement;
    let editor: Editor | null = $state(null);
    let characterCount = $state(0);

    function sanitizeThemeSpecificStyles(html: string): string {
        if (!html || typeof window === "undefined") return html;

        const container = document.createElement("div");
        container.innerHTML = html;

        container.querySelectorAll<HTMLElement>("[style]").forEach((el) => {
            const style = el.getAttribute("style");
            if (!style) return;

            const keptRules = style
                .split(";")
                .map((rule) => rule.trim())
                .filter(Boolean)
                .filter((rule) => {
                    const [prop] = rule.split(":");
                    if (!prop) return false;
                    const key = prop.trim().toLowerCase();
                    return (
                        key !== "color" &&
                        key !== "background-color" &&
                        key !== "-webkit-text-fill-color"
                    );
                });

            if (keptRules.length === 0) {
                el.removeAttribute("style");
            } else {
                el.setAttribute("style", keptRules.join("; "));
            }
        });

        container
            .querySelectorAll<HTMLElement>("[color]")
            .forEach((el) => el.removeAttribute("color"));

        return container.innerHTML;
    }

    onMount(() => {
        editor = new Editor({
            element,
            extensions: [
                StarterKit.configure({
                    heading: false, // Disable headings for simpler use
                    codeBlock: false,
                    horizontalRule: false,
                }),
                Placeholder.configure({
                    placeholder,
                }),
                CharacterCount.configure({
                    limit: maxLength,
                }),
            ],
            content: sanitizeThemeSpecificStyles(content),
            editable: !disabled,
            onUpdate: ({ editor }) => {
                const rawHtml = editor.getHTML();
                const html = sanitizeThemeSpecificStyles(rawHtml);
                if (html !== rawHtml) {
                    editor.commands.setContent(html, { emitUpdate: false });
                }
                characterCount = editor.storage.characterCount.characters();
                onUpdate?.(html);
            },
            onTransaction: ({ editor }) => {
                characterCount = editor.storage.characterCount.characters();
            },
        });

        characterCount = editor.storage.characterCount.characters();
    });

    onDestroy(() => {
        editor?.destroy();
    });

    // Update content when prop changes
    $effect(() => {
        if (editor) {
            const sanitized = sanitizeThemeSpecificStyles(content);
            if (sanitized !== editor.getHTML()) {
                editor.commands.setContent(sanitized, { emitUpdate: false });
            }
        }
    });

    // Update editable state
    $effect(() => {
        if (editor) {
            editor.setEditable(!disabled);
        }
    });

    function toggleBold() {
        editor?.chain().focus().toggleBold().run();
    }

    function toggleItalic() {
        editor?.chain().focus().toggleItalic().run();
    }

    function toggleBulletList() {
        editor?.chain().focus().toggleBulletList().run();
    }

    function toggleOrderedList() {
        editor?.chain().focus().toggleOrderedList().run();
    }

    function undo() {
        editor?.chain().focus().undo().run();
    }

    function redo() {
        editor?.chain().focus().redo().run();
    }
</script>

<div
    class="rich-text-editor border border-gray-300 dark:border-gray-600 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-500 transition-all {disabled
        ? 'opacity-50 cursor-not-allowed'
        : ''}"
>
    <!-- Toolbar -->
    <div
        class="flex items-center gap-1 p-2 border-b border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700"
    >
        <button
            type="button"
            onclick={toggleBold}
            {disabled}
            class="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors disabled:opacity-50 {editor?.isActive(
                'bold',
            )
                ? 'bg-gray-200 dark:bg-gray-600 text-indigo-600 dark:text-indigo-400'
                : 'text-gray-600 dark:text-gray-300'}"
            title="Bold (Ctrl+B)"
        >
            <Bold class="w-4 h-4" />
        </button>
        <button
            type="button"
            onclick={toggleItalic}
            {disabled}
            class="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors disabled:opacity-50 {editor?.isActive(
                'italic',
            )
                ? 'bg-gray-200 dark:bg-gray-600 text-indigo-600 dark:text-indigo-400'
                : 'text-gray-600 dark:text-gray-300'}"
            title="Italic (Ctrl+I)"
        >
            <Italic class="w-4 h-4" />
        </button>
        <div class="w-px h-5 bg-gray-300 dark:bg-gray-600 mx-1"></div>
        <button
            type="button"
            onclick={toggleBulletList}
            {disabled}
            class="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors disabled:opacity-50 {editor?.isActive(
                'bulletList',
            )
                ? 'bg-gray-200 dark:bg-gray-600 text-indigo-600 dark:text-indigo-400'
                : 'text-gray-600 dark:text-gray-300'}"
            title="Bullet List"
        >
            <List class="w-4 h-4" />
        </button>
        <button
            type="button"
            onclick={toggleOrderedList}
            {disabled}
            class="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors disabled:opacity-50 {editor?.isActive(
                'orderedList',
            )
                ? 'bg-gray-200 dark:bg-gray-600 text-indigo-600 dark:text-indigo-400'
                : 'text-gray-600 dark:text-gray-300'}"
            title="Numbered List"
        >
            <ListOrdered class="w-4 h-4" />
        </button>
        <div class="w-px h-5 bg-gray-300 dark:bg-gray-600 mx-1"></div>
        <button
            type="button"
            onclick={undo}
            disabled={disabled || !editor?.can().undo()}
            class="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors disabled:opacity-50 text-gray-600 dark:text-gray-300"
            title="Undo (Ctrl+Z)"
        >
            <Undo class="w-4 h-4" />
        </button>
        <button
            type="button"
            onclick={redo}
            disabled={disabled || !editor?.can().redo()}
            class="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors disabled:opacity-50 text-gray-600 dark:text-gray-300"
            title="Redo (Ctrl+Y)"
        >
            <Redo class="w-4 h-4" />
        </button>

        <!-- Character count -->
        <div class="ml-auto text-xs text-gray-400 dark:text-gray-500">
            {characterCount}/{maxLength}
        </div>
    </div>

    <!-- Editor content -->
    <div
        bind:this={element}
        class="prose prose-sm dark:prose-invert max-w-none p-4 text-black dark:text-white"
        style="min-height: {minHeight};"
    ></div>
</div>

<style>
    :global(.rich-text-editor .ProseMirror) {
        outline: none;
        min-height: inherit;
        color: inherit;
    }

    :global(.rich-text-editor .ProseMirror p),
    :global(.rich-text-editor .ProseMirror li),
    :global(.rich-text-editor .ProseMirror ul),
    :global(.rich-text-editor .ProseMirror ol) {
        color: inherit;
    }

    :global(
            .rich-text-editor .ProseMirror p.is-editor-empty:first-child::before
        ) {
        content: attr(data-placeholder);
        float: left;
        color: #9ca3af; /* gray-400 */
        pointer-events: none;
        height: 0;
    }

    :global(
            .dark
                .rich-text-editor
                .ProseMirror
                p.is-editor-empty:first-child::before
        ) {
        color: #6b7280; /* gray-500 */
    }

    :global(.rich-text-editor .ProseMirror p) {
        margin: 0 0 0.5em 0;
    }

    :global(.rich-text-editor .ProseMirror ul),
    :global(.rich-text-editor .ProseMirror ol) {
        padding-left: 1.5rem;
        margin: 0.5em 0;
    }

    :global(.rich-text-editor .ProseMirror li) {
        margin: 0.25em 0;
    }

    :global(.rich-text-editor .ProseMirror strong) {
        font-weight: 600;
    }
</style>
