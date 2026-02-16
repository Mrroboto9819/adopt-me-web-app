<script lang="ts">
    import SEO from "$lib/components/SEO.svelte";
    import { toast } from "$lib/stores/toast.svelte";
    import { Mail, MapPin, Phone, Send, MessageSquare, Clock, Loader2 } from "lucide-svelte";

    let name = $state("");
    let email = $state("");
    let subject = $state("");
    let message = $state("");
    let isSubmitting = $state(false);

    async function handleSubmit() {
        if (!name.trim() || !email.trim() || !message.trim()) {
            toast.error("Please fill in all required fields");
            return;
        }

        isSubmitting = true;

        // Simulate form submission - replace with actual API call
        await new Promise(resolve => setTimeout(resolve, 1500));

        toast.success("Message sent successfully! We'll get back to you soon.");

        // Reset form
        name = "";
        email = "";
        subject = "";
        message = "";
        isSubmitting = false;
    }
</script>

<SEO
    title="Contact Us"
    description="Get in touch with AdoptMe. Have questions about pet adoption? Need support? We're here to help you find your perfect companion."
    keywords="contact adoptme, pet adoption support, help, customer service"
/>

<div class="min-h-screen bg-gray-50">
    <!-- Hero Section -->
    <div class="bg-gradient-to-br from-indigo-600 to-purple-600 text-white">
        <div class="max-w-4xl mx-auto px-4 py-12 sm:py-16 text-center">
            <div class="inline-flex items-center justify-center w-16 h-16 bg-white/20 rounded-2xl mb-4 backdrop-blur-sm">
                <MessageSquare class="w-8 h-8" />
            </div>
            <h1 class="text-3xl sm:text-4xl font-extrabold mb-3">Contact Us</h1>
            <p class="text-lg text-white/90 max-w-xl mx-auto">
                Have questions or feedback? We'd love to hear from you. Our team is here to help.
            </p>
        </div>
    </div>

    <!-- Main Content -->
    <div class="max-w-5xl mx-auto px-4 py-12">
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <!-- Contact Info -->
            <div class="lg:col-span-1 space-y-4">
                <div class="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                    <div class="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center mb-4">
                        <Mail class="w-6 h-6 text-indigo-600" />
                    </div>
                    <h3 class="font-semibold text-gray-900 mb-1">Email Us</h3>
                    <p class="text-gray-500 text-sm mb-2">For general inquiries</p>
                    <a href="mailto:hello@adoptme.com" class="text-indigo-600 font-medium hover:underline">
                        hello@adoptme.com
                    </a>
                </div>

                <div class="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                    <div class="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-4">
                        <Phone class="w-6 h-6 text-green-600" />
                    </div>
                    <h3 class="font-semibold text-gray-900 mb-1">Call Us</h3>
                    <p class="text-gray-500 text-sm mb-2">Mon-Fri from 9am to 6pm</p>
                    <a href="tel:+1234567890" class="text-indigo-600 font-medium hover:underline">
                        +1 (234) 567-890
                    </a>
                </div>

                <div class="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                    <div class="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-4">
                        <MapPin class="w-6 h-6 text-purple-600" />
                    </div>
                    <h3 class="font-semibold text-gray-900 mb-1">Visit Us</h3>
                    <p class="text-gray-500 text-sm mb-2">Our headquarters</p>
                    <p class="text-gray-700 text-sm">
                        123 Pet Street<br />
                        San Francisco, CA 94102<br />
                        United States
                    </p>
                </div>

                <div class="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                    <div class="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center mb-4">
                        <Clock class="w-6 h-6 text-orange-600" />
                    </div>
                    <h3 class="font-semibold text-gray-900 mb-1">Response Time</h3>
                    <p class="text-gray-500 text-sm">
                        We typically respond within 24-48 hours during business days.
                    </p>
                </div>
            </div>

            <!-- Contact Form -->
            <div class="lg:col-span-2">
                <div class="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 sm:p-8">
                    <h2 class="text-xl font-bold text-gray-900 mb-6">Send us a message</h2>

                    <form onsubmit={(e) => { e.preventDefault(); handleSubmit(); }} class="space-y-5">
                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-5">
                            <div>
                                <label for="name" class="block text-sm font-medium text-gray-700 mb-1">
                                    Name <span class="text-red-500">*</span>
                                </label>
                                <input
                                    id="name"
                                    type="text"
                                    bind:value={name}
                                    required
                                    class="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
                                    placeholder="Your name"
                                />
                            </div>
                            <div>
                                <label for="email" class="block text-sm font-medium text-gray-700 mb-1">
                                    Email <span class="text-red-500">*</span>
                                </label>
                                <input
                                    id="email"
                                    type="email"
                                    bind:value={email}
                                    required
                                    class="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
                                    placeholder="you@example.com"
                                />
                            </div>
                        </div>

                        <div>
                            <label for="subject" class="block text-sm font-medium text-gray-700 mb-1">
                                Subject
                            </label>
                            <input
                                id="subject"
                                type="text"
                                bind:value={subject}
                                class="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
                                placeholder="What's this about?"
                            />
                        </div>

                        <div>
                            <label for="message" class="block text-sm font-medium text-gray-700 mb-1">
                                Message <span class="text-red-500">*</span>
                            </label>
                            <textarea
                                id="message"
                                bind:value={message}
                                required
                                rows="5"
                                class="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all resize-none"
                                placeholder="Tell us how we can help..."
                            ></textarea>
                        </div>

                        <button
                            type="submit"
                            disabled={isSubmitting}
                            class="w-full sm:w-auto px-8 py-3 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {#if isSubmitting}
                                <Loader2 class="w-5 h-5 animate-spin" />
                                Sending...
                            {:else}
                                <Send class="w-5 h-5" />
                                Send Message
                            {/if}
                        </button>
                    </form>
                </div>

                <!-- FAQ Teaser -->
                <div class="mt-6 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl border border-indigo-100 p-6">
                    <h3 class="font-semibold text-gray-900 mb-2">Looking for quick answers?</h3>
                    <p class="text-gray-600 text-sm mb-4">
                        Check out our frequently asked questions for instant help with common topics.
                    </p>
                    <div class="flex flex-wrap gap-2">
                        <span class="px-3 py-1 bg-white rounded-full text-sm text-gray-600 border border-gray-200">How to adopt?</span>
                        <span class="px-3 py-1 bg-white rounded-full text-sm text-gray-600 border border-gray-200">Listing a pet</span>
                        <span class="px-3 py-1 bg-white rounded-full text-sm text-gray-600 border border-gray-200">Account help</span>
                        <span class="px-3 py-1 bg-white rounded-full text-sm text-gray-600 border border-gray-200">Report an issue</span>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>
