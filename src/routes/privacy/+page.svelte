<script lang="ts">
    import SEO from "$lib/components/SEO.svelte";
    import { Shield, Mail } from "lucide-svelte";

    const lastUpdated = "February 2026";
    const contactEmail = "pablo.cabrera.castrejon@gmail.com";
</script>

<SEO
    title="Privacy Policy"
    description="AdoptMe Privacy Policy - Learn how we collect, use, and protect your personal information."
    keywords="privacy policy, data protection, personal information, adoptme privacy"
/>

<div class="min-h-screen bg-gray-50">
    <!-- Hero Section -->
    <div class="bg-gradient-to-br from-indigo-600 to-purple-600 text-white">
        <div class="max-w-4xl mx-auto px-4 py-12 sm:py-16 text-center">
            <div class="inline-flex items-center justify-center w-16 h-16 bg-white/20 rounded-2xl mb-4 backdrop-blur-sm">
                <Shield class="w-8 h-8" />
            </div>
            <h1 class="text-3xl sm:text-4xl font-extrabold mb-3">Privacy Policy</h1>
            <p class="text-lg text-white/90">
                Last updated: {lastUpdated}
            </p>
        </div>
    </div>

    <!-- Content -->
    <div class="max-w-4xl mx-auto px-4 py-12">
        <div class="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 sm:p-8">
            <div class="prose prose-gray max-w-none">
                <!-- Introduction -->
                <section class="mb-8">
                    <h2 class="text-xl font-bold text-gray-900 mb-4">1. Introduction</h2>
                    <p class="text-gray-600 leading-relaxed mb-4">
                        Welcome to AdoptMe ("we," "our," or "us"). We are committed to protecting your personal information and your right to privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website and use our services.
                    </p>
                    <p class="text-gray-600 leading-relaxed">
                        This policy applies to users in the United States, Canada, and Mexico, and complies with applicable privacy laws including the California Consumer Privacy Act (CCPA), the Personal Information Protection and Electronic Documents Act (PIPEDA) in Canada, and the Ley Federal de Protección de Datos Personales en Posesión de los Particulares (LFPDPPP) in Mexico.
                    </p>
                </section>

                <!-- Information We Collect -->
                <section class="mb-8">
                    <h2 class="text-xl font-bold text-gray-900 mb-4">2. Information We Collect</h2>

                    <h3 class="text-lg font-semibold text-gray-800 mb-2">Personal Information You Provide</h3>
                    <p class="text-gray-600 leading-relaxed mb-4">
                        When you register for an account or use our services, we may collect:
                    </p>
                    <ul class="list-disc list-inside text-gray-600 mb-4 space-y-1">
                        <li>Name and contact information (email address, phone number)</li>
                        <li>Account credentials (username, password)</li>
                        <li>Profile information (profile picture, location, bio)</li>
                        <li>Pet listing information (photos, descriptions, location)</li>
                        <li>Communications with other users and with us</li>
                    </ul>

                    <h3 class="text-lg font-semibold text-gray-800 mb-2">Information Collected Automatically</h3>
                    <p class="text-gray-600 leading-relaxed mb-4">
                        When you access our services, we automatically collect:
                    </p>
                    <ul class="list-disc list-inside text-gray-600 mb-4 space-y-1">
                        <li>Device information (browser type, operating system, device type)</li>
                        <li>IP address and general location data</li>
                        <li>Usage data (pages visited, time spent, clicks)</li>
                        <li>Cookies and similar tracking technologies</li>
                    </ul>
                </section>

                <!-- How We Use Information -->
                <section class="mb-8">
                    <h2 class="text-xl font-bold text-gray-900 mb-4">3. How We Use Your Information</h2>
                    <p class="text-gray-600 leading-relaxed mb-4">
                        We use the information we collect to:
                    </p>
                    <ul class="list-disc list-inside text-gray-600 mb-4 space-y-1">
                        <li>Create and manage your account</li>
                        <li>Provide, maintain, and improve our services</li>
                        <li>Facilitate pet adoption connections between users</li>
                        <li>Process and respond to your inquiries</li>
                        <li>Send administrative communications and service updates</li>
                        <li>Personalize your experience and content</li>
                        <li>Display relevant advertisements (via Google AdSense)</li>
                        <li>Detect, prevent, and address fraud or security issues</li>
                        <li>Comply with legal obligations</li>
                    </ul>
                </section>

                <!-- Cookies and Tracking -->
                <section class="mb-8">
                    <h2 class="text-xl font-bold text-gray-900 mb-4">4. Cookies and Tracking Technologies</h2>
                    <p class="text-gray-600 leading-relaxed mb-4">
                        We use cookies and similar tracking technologies to collect and store information. These include:
                    </p>
                    <ul class="list-disc list-inside text-gray-600 mb-4 space-y-1">
                        <li><strong>Essential cookies:</strong> Required for basic site functionality</li>
                        <li><strong>Analytics cookies:</strong> Help us understand how users interact with our site</li>
                        <li><strong>Advertising cookies:</strong> Used by Google AdSense to display relevant ads</li>
                    </ul>
                    <p class="text-gray-600 leading-relaxed">
                        You can control cookies through your browser settings. However, disabling certain cookies may limit your ability to use some features of our services.
                    </p>
                </section>

                <!-- Third-Party Services -->
                <section class="mb-8">
                    <h2 class="text-xl font-bold text-gray-900 mb-4">5. Third-Party Services</h2>
                    <p class="text-gray-600 leading-relaxed mb-4">
                        We use third-party services that may collect information about you:
                    </p>
                    <ul class="list-disc list-inside text-gray-600 mb-4 space-y-1">
                        <li><strong>Google AdSense:</strong> Displays advertisements on our platform. Google may use cookies to serve ads based on your prior visits. You can opt out of personalized advertising at <a href="https://www.google.com/settings/ads" target="_blank" rel="noopener noreferrer" class="text-indigo-600 hover:underline">Google Ads Settings</a>.</li>
                        <li><strong>Analytics providers:</strong> Help us analyze website usage and improve our services.</li>
                    </ul>
                </section>

                <!-- Data Sharing -->
                <section class="mb-8">
                    <h2 class="text-xl font-bold text-gray-900 mb-4">6. How We Share Your Information</h2>
                    <p class="text-gray-600 leading-relaxed mb-4">
                        We may share your information in the following circumstances:
                    </p>
                    <ul class="list-disc list-inside text-gray-600 mb-4 space-y-1">
                        <li><strong>With other users:</strong> Pet listings and profile information are visible to other users to facilitate adoptions</li>
                        <li><strong>Service providers:</strong> Third parties who perform services on our behalf</li>
                        <li><strong>Legal requirements:</strong> When required by law or to protect our rights</li>
                        <li><strong>Business transfers:</strong> In connection with a merger, acquisition, or sale of assets</li>
                    </ul>
                    <p class="text-gray-600 leading-relaxed">
                        We do not sell your personal information to third parties.
                    </p>
                </section>

                <!-- Data Security -->
                <section class="mb-8">
                    <h2 class="text-xl font-bold text-gray-900 mb-4">7. Data Security</h2>
                    <p class="text-gray-600 leading-relaxed">
                        We implement appropriate technical and organizational security measures to protect your personal information. However, no method of transmission over the Internet is 100% secure. We cannot guarantee absolute security of your data, but we continuously work to protect your information.
                    </p>
                </section>

                <!-- Data Retention -->
                <section class="mb-8">
                    <h2 class="text-xl font-bold text-gray-900 mb-4">8. Data Retention</h2>
                    <p class="text-gray-600 leading-relaxed">
                        We retain your personal information for as long as your account is active or as needed to provide you services. We may retain certain information as required by law or for legitimate business purposes, such as resolving disputes and enforcing our agreements.
                    </p>
                </section>

                <!-- Your Rights -->
                <section class="mb-8">
                    <h2 class="text-xl font-bold text-gray-900 mb-4">9. Your Privacy Rights</h2>
                    <p class="text-gray-600 leading-relaxed mb-4">
                        Depending on your location, you may have the following rights:
                    </p>

                    <h3 class="text-lg font-semibold text-gray-800 mb-2">For All Users</h3>
                    <ul class="list-disc list-inside text-gray-600 mb-4 space-y-1">
                        <li>Access and receive a copy of your personal data</li>
                        <li>Correct inaccurate or incomplete information</li>
                        <li>Delete your account and personal data</li>
                        <li>Object to certain processing of your data</li>
                        <li>Withdraw consent at any time</li>
                    </ul>

                    <h3 class="text-lg font-semibold text-gray-800 mb-2">California Residents (CCPA)</h3>
                    <ul class="list-disc list-inside text-gray-600 mb-4 space-y-1">
                        <li>Right to know what personal information is collected</li>
                        <li>Right to delete personal information</li>
                        <li>Right to opt-out of the sale of personal information (we do not sell your data)</li>
                        <li>Right to non-discrimination for exercising your rights</li>
                    </ul>

                    <h3 class="text-lg font-semibold text-gray-800 mb-2">Canadian Residents (PIPEDA)</h3>
                    <ul class="list-disc list-inside text-gray-600 mb-4 space-y-1">
                        <li>Right to access your personal information</li>
                        <li>Right to challenge accuracy and completeness</li>
                        <li>Right to withdraw consent (subject to legal restrictions)</li>
                    </ul>

                    <h3 class="text-lg font-semibold text-gray-800 mb-2">Mexican Residents (LFPDPPP)</h3>
                    <ul class="list-disc list-inside text-gray-600 mb-4 space-y-1">
                        <li>Derechos ARCO: Access, Rectification, Cancellation, and Opposition</li>
                        <li>Right to revoke consent</li>
                        <li>Right to limit use or disclosure of your data</li>
                    </ul>

                    <p class="text-gray-600 leading-relaxed">
                        To exercise any of these rights, please contact us at <a href="mailto:{contactEmail}" class="text-indigo-600 hover:underline">{contactEmail}</a>.
                    </p>
                </section>

                <!-- Children's Privacy -->
                <section class="mb-8">
                    <h2 class="text-xl font-bold text-gray-900 mb-4">10. Children's Privacy</h2>
                    <p class="text-gray-600 leading-relaxed">
                        Our services are not intended for children under 13 years of age (or 16 in some jurisdictions). We do not knowingly collect personal information from children. If you believe we have collected information from a child, please contact us immediately, and we will take steps to delete such information.
                    </p>
                </section>

                <!-- International Transfers -->
                <section class="mb-8">
                    <h2 class="text-xl font-bold text-gray-900 mb-4">11. International Data Transfers</h2>
                    <p class="text-gray-600 leading-relaxed">
                        Your information may be transferred to and processed in countries other than your country of residence. These countries may have different data protection laws. When we transfer your data, we take appropriate safeguards to ensure your information remains protected in accordance with this Privacy Policy.
                    </p>
                </section>

                <!-- Changes to Policy -->
                <section class="mb-8">
                    <h2 class="text-xl font-bold text-gray-900 mb-4">12. Changes to This Privacy Policy</h2>
                    <p class="text-gray-600 leading-relaxed">
                        We may update this Privacy Policy from time to time. We will notify you of any material changes by posting the new Privacy Policy on this page and updating the "Last updated" date. We encourage you to review this Privacy Policy periodically.
                    </p>
                </section>

                <!-- Contact Us -->
                <section>
                    <h2 class="text-xl font-bold text-gray-900 mb-4">13. Contact Us</h2>
                    <p class="text-gray-600 leading-relaxed mb-4">
                        If you have questions about this Privacy Policy or wish to exercise your privacy rights, please contact us:
                    </p>
                    <div class="bg-gray-50 rounded-xl p-4">
                        <p class="text-gray-700 flex items-center gap-2">
                            <Mail class="w-5 h-5 text-indigo-600" />
                            <a href="mailto:{contactEmail}" class="text-indigo-600 hover:underline">{contactEmail}</a>
                        </p>
                    </div>
                </section>
            </div>
        </div>

        <!-- Back Link -->
        <div class="mt-8 text-center">
            <a href="/" class="text-indigo-600 hover:underline text-sm font-medium">
                ← Back to Home
            </a>
        </div>
    </div>
</div>
