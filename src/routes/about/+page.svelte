<script lang="ts">
    import SEO from "$lib/components/SEO.svelte";
    import {
        Heart,
        Users,
        Shield,
        Award,
        Target,
        Sparkles,
    } from "lucide-svelte";
    import logo from "$lib/assets/favicon.svg";
</script>

<SEO
    title="About Us"
    description="Learn about AdoptMe - our mission to connect loving families with pets in need. Discover our story, values, and commitment to animal welfare."
    keywords="about adoptme, pet adoption mission, animal welfare, pet rescue platform"
/>

<div class="min-h-screen bg-gray-50">
    <!-- Hero Section -->
    <div
        class="bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 text-white"
    >
        <div class="max-w-4xl mx-auto px-4 py-16 sm:py-24 text-center">
            <div
                class="inline-flex items-center justify-center w-20 h-20 bg-white/20 rounded-2xl mb-6 backdrop-blur-sm"
            >
                <img src={logo} alt="AdoptMe" class="w-12 h-12" />
            </div>
            <h1 class="text-4xl sm:text-5xl font-extrabold mb-4">
                About AdoptMe
            </h1>
            <p class="text-xl text-white/90 max-w-2xl mx-auto leading-relaxed">
                We're on a mission to connect loving families with pets in need,
                making the adoption process simple, transparent, and joyful.
            </p>
        </div>
    </div>

    <!-- Main Content -->
    <div class="max-w-4xl mx-auto px-4 py-12">
        <!-- Our Story -->
        <section class="mb-16">
            <h2 class="text-2xl font-bold text-gray-900 mb-6">Our Story</h2>
            <div
                class="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 sm:p-8"
            >
                <p class="text-gray-600 leading-relaxed mb-4">
                    AdoptMe was born from a personal passion to learn and a deep
                    desire to give back. I started building this platform as a
                    way to challenge myself and master modern software
                    engineering, but the vision was always bigger than just
                    code—it was about community support.
                </p>
                <p class="text-gray-600 leading-relaxed mb-4">
                    I believe that technology is at its best when it helps
                    people. By creating AdoptMe, I wanted to build a bridge
                    between technology and compassion, providing a free,
                    accessible space where our community can foster connections
                    and help animals in need.
                </p>
                <p class="text-gray-600 leading-relaxed">
                    This project is a labor of love and a continuous learning
                    journey. Every feature is built with the hope of making
                    adoption easier and ensuring that every pet finds the loving
                    home they deserve. Thank you for being part of this story
                    and for supporting our mission to make a difference.
                </p>
            </div>
        </section>

        <!-- Our Values -->
        <section class="mb-16">
            <h2 class="text-2xl font-bold text-gray-900 mb-6">Our Values</h2>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div
                    class="bg-white rounded-2xl shadow-sm border border-gray-200 p-6"
                >
                    <div
                        class="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center mb-4"
                    >
                        <Heart class="w-6 h-6 text-indigo-600" />
                    </div>
                    <h3 class="font-semibold text-gray-900 mb-2">
                        Compassion First
                    </h3>
                    <p class="text-gray-600 text-sm">
                        Every decision we make prioritizes the well-being of
                        animals and the families who love them.
                    </p>
                </div>
                <div
                    class="bg-white rounded-2xl shadow-sm border border-gray-200 p-6"
                >
                    <div
                        class="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-4"
                    >
                        <Shield class="w-6 h-6 text-green-600" />
                    </div>
                    <h3 class="font-semibold text-gray-900 mb-2">
                        Trust & Safety
                    </h3>
                    <p class="text-gray-600 text-sm">
                        We verify listings and promote responsible adoption
                        practices to protect both pets and adopters.
                    </p>
                </div>
                <div
                    class="bg-white rounded-2xl shadow-sm border border-gray-200 p-6"
                >
                    <div
                        class="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-4"
                    >
                        <Users class="w-6 h-6 text-purple-600" />
                    </div>
                    <h3 class="font-semibold text-gray-900 mb-2">
                        Community Driven
                    </h3>
                    <p class="text-gray-600 text-sm">
                        We believe in the power of community to create positive
                        change for animals everywhere.
                    </p>
                </div>
                <div
                    class="bg-white rounded-2xl shadow-sm border border-gray-200 p-6"
                >
                    <div
                        class="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center mb-4"
                    >
                        <Sparkles class="w-6 h-6 text-orange-600" />
                    </div>
                    <h3 class="font-semibold text-gray-900 mb-2">Innovation</h3>
                    <p class="text-gray-600 text-sm">
                        We continuously improve our platform to make pet
                        adoption easier and more accessible.
                    </p>
                </div>
            </div>
        </section>

        <!-- Our Mission -->
        <section class="mb-16">
            <h2 class="text-2xl font-bold text-gray-900 mb-6">Our Mission</h2>
            <div
                class="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl border border-indigo-100 p-6 sm:p-8"
            >
                <div class="flex items-start gap-4">
                    <div
                        class="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center flex-shrink-0"
                    >
                        <Target class="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h3 class="font-semibold text-gray-900 mb-2">
                            Creating a world where every pet has a home
                        </h3>
                        <p class="text-gray-600 leading-relaxed">
                            We strive to reduce the number of homeless pets by
                            making adoption the first choice for families
                            looking to add a furry member. Through technology,
                            community engagement, and partnerships with
                            shelters, we're building a future where no pet is
                            left behind.
                        </p>
                    </div>
                </div>
            </div>
        </section>

        <!-- CTA -->
        <section class="text-center">
            <div
                class="bg-white rounded-2xl shadow-sm border border-gray-200 p-8"
            >
                <Award class="w-12 h-12 text-indigo-600 mx-auto mb-4" />
                <h2 class="text-xl font-bold text-gray-900 mb-2">
                    Join Our Mission
                </h2>
                <p class="text-gray-600 mb-6">
                    Whether you're looking to adopt, foster, or support our
                    cause, there's a place for you in our community.
                </p>
                <div class="flex flex-col sm:flex-row gap-3 justify-center">
                    <a
                        href="/"
                        class="px-6 py-3 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition-colors"
                    >
                        Find a Pet
                    </a>
                    <!-- <a href="/contact" class="px-6 py-3 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition-colors">
                        Contact Us
                    </a> -->
                </div>
            </div>
        </section>
    </div>
</div>
