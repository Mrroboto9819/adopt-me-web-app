<script lang="ts">
    import { auth } from "$lib/stores/auth.svelte";

    // Props for the post
    let { post } = $props();

    // Format date relative (simple version)
    function formatDate(dateStr: string) {
        const d = new Date(Number(dateStr));
        return d.toLocaleDateString() + " " + d.toLocaleTimeString();
    }
</script>

<div
    class="bg-white border border-gray-300 rounded-md hover:border-gray-400 transition-colors cursor-pointer mb-4 overflow-hidden"
>
    <div class="flex">
        <!-- Vote Column (Visual only for now) -->
        <div
            class="w-10 bg-gray-50/50 flex flex-col items-center py-2 gap-1 border-r border-gray-100"
        >
            <button
                class="text-gray-400 hover:text-orange-500 hover:bg-gray-200 rounded p-1"
                aria-label="Upvote"
            >
                <svg
                    class="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    ><path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M5 15l7-7 7 7"
                    ></path></svg
                >
            </button>
            <span class="text-sm font-bold text-gray-700">0</span>
            <button
                class="text-gray-400 hover:text-indigo-500 hover:bg-gray-200 rounded p-1"
                aria-label="Downvote"
            >
                <svg
                    class="w-6 h-6"
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
            </button>
        </div>

        <!-- Content Column -->
        <div class="p-2 pb-1 flex-1">
            <!-- Meta Header -->
            <div class="flex items-center text-xs text-gray-500 mb-2 gap-1">
                {#if post.pet.status === "Adopted"}
                    <span
                        class="bg-green-100 text-green-700 px-1.5 rounded-full border border-green-200"
                        >Adopted</span
                    >
                {:else}
                    <span
                        class="bg-indigo-100 text-indigo-700 px-1.5 rounded-full border border-indigo-200"
                        >Available</span
                    >
                {/if}
                <span
                    >Posted by <span
                        class="hover:underline font-semibold text-gray-700"
                        >u/{post.author.name}</span
                    ></span
                >
                <span>•</span>
                <span>{formatDate(post.createdAt)}</span>
                <span>•</span>
                <span class="flex items-center"
                    ><svg
                        class="w-3 h-3 mr-0.5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        ><path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                        ></path><path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                        ></path></svg
                    >{post.location}</span
                >
            </div>

            <!-- Title -->
            <h3 class="text-lg font-medium text-gray-900 mb-2 leading-snug">
                {post.title}
            </h3>

            <!-- Pet Info / Visuals -->
            <div class="mb-3">
                <div
                    class="bg-gray-100 rounded-lg p-3 border border-gray-200 flex gap-4"
                >
                    <!-- Placeholder for Pet Image -->
                    <div
                        class="w-24 h-24 bg-gray-200 rounded-md flex-shrink-0 flex items-center justify-center text-gray-400"
                    >
                        <svg
                            class="w-10 h-10"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            ><path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="2"
                                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                            ></path></svg
                        >
                    </div>
                    <div>
                        <h4 class="font-bold text-gray-800">
                            {post.pet.name}
                            <span class="font-normal text-gray-500 text-sm"
                                >({post.pet.species?.label ||
                                    post.pet.customSpecies ||
                                    "Unknown"})</span
                            >
                        </h4>
                        <p class="text-sm text-gray-600 mt-1 line-clamp-2">
                            {post.pet.description || "No description provided."}
                        </p>
                        <div class="flex gap-2 mt-2 text-xs font-medium">
                            <span
                                class="bg-gray-200 text-gray-700 px-2 py-0.5 rounded"
                                >{post.pet.breed?.label ||
                                    post.pet.customBreed ||
                                    "Mixed"}</span
                            >
                            <span
                                class="bg-gray-200 text-gray-700 px-2 py-0.5 rounded"
                                >{post.pet.age
                                    ? `${post.pet.age} yrs`
                                    : "Age N/A"}</span
                            >
                        </div>
                    </div>
                </div>
            </div>

            <!-- Actions Bar -->
            <div
                class="flex items-center gap-1 text-gray-500 font-bold text-xs mt-1"
            >
                <button
                    class="flex items-center gap-1.5 hover:bg-gray-200 p-2 rounded transition-colors group"
                >
                    <svg
                        class="w-5 h-5 group-hover:text-indigo-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        ><path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                        ></path></svg
                    >
                    <span class="group-hover:text-indigo-600">Comments</span>
                </button>
                <button
                    class="flex items-center gap-1.5 hover:bg-gray-200 p-2 rounded transition-colors group"
                >
                    <svg
                        class="w-5 h-5 group-hover:text-indigo-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        ><path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                        ></path></svg
                    >
                    <span class="group-hover:text-indigo-600">Share</span>
                </button>

                <!-- Only show Adopt button if user is logged in (or redirect) -->
                <button
                    onclick={() => {
                        if (!auth.user) {
                            window.location.href = "/login";
                        } else {
                            alert(
                                "Contact feature coming soon! (You are logged in)",
                            );
                        }
                    }}
                    class="ml-auto flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-full transition-colors shadow-sm"
                    aria-label="Adopt this pet"
                >
                    <svg
                        class="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        ><path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                        ></path></svg
                    >
                    Adopt
                </button>
            </div>
        </div>
    </div>
</div>
