<script lang="ts">
    import SEO from "$lib/components/SEO.svelte";
    import { FileText, Mail } from "lucide-svelte";

    const lastUpdated = "February 2026";
    const contactEmail = "pablo.cabrera.castrejon@gmail.com";
</script>

<SEO
    title="Terms of Service"
    description="AdoptMe Terms of Service - Read our terms and conditions for using the AdoptMe pet adoption platform."
    keywords="terms of service, terms and conditions, user agreement, adoptme terms"
/>

<div class="min-h-screen bg-gray-50">
    <!-- Hero Section -->
    <div class="bg-gradient-to-br from-indigo-600 to-purple-600 text-white">
        <div class="max-w-4xl mx-auto px-4 py-12 sm:py-16 text-center">
            <div class="inline-flex items-center justify-center w-16 h-16 bg-white/20 rounded-2xl mb-4 backdrop-blur-sm">
                <FileText class="w-8 h-8" />
            </div>
            <h1 class="text-3xl sm:text-4xl font-extrabold mb-3">Terms of Service</h1>
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
                    <h2 class="text-xl font-bold text-gray-900 mb-4">1. Agreement to Terms</h2>
                    <p class="text-gray-600 leading-relaxed mb-4">
                        Welcome to AdoptMe. These Terms of Service ("Terms") govern your access to and use of the AdoptMe website, mobile applications, and services (collectively, the "Services"). By accessing or using our Services, you agree to be bound by these Terms.
                    </p>
                    <p class="text-gray-600 leading-relaxed">
                        If you do not agree to these Terms, you may not access or use our Services. Please read these Terms carefully before using AdoptMe.
                    </p>
                </section>

                <!-- Eligibility -->
                <section class="mb-8">
                    <h2 class="text-xl font-bold text-gray-900 mb-4">2. Eligibility</h2>
                    <p class="text-gray-600 leading-relaxed mb-4">
                        To use our Services, you must:
                    </p>
                    <ul class="list-disc list-inside text-gray-600 mb-4 space-y-1">
                        <li>Be at least 18 years old or the age of majority in your jurisdiction</li>
                        <li>Have the legal capacity to enter into a binding agreement</li>
                        <li>Not be prohibited from using the Services under applicable law</li>
                        <li>Provide accurate and complete registration information</li>
                    </ul>
                    <p class="text-gray-600 leading-relaxed">
                        If you are using the Services on behalf of an organization, you represent that you have the authority to bind that organization to these Terms.
                    </p>
                </section>

                <!-- Account Registration -->
                <section class="mb-8">
                    <h2 class="text-xl font-bold text-gray-900 mb-4">3. Account Registration</h2>
                    <p class="text-gray-600 leading-relaxed mb-4">
                        To access certain features of our Services, you must create an account. When you create an account, you agree to:
                    </p>
                    <ul class="list-disc list-inside text-gray-600 mb-4 space-y-1">
                        <li>Provide accurate, current, and complete information</li>
                        <li>Maintain and promptly update your account information</li>
                        <li>Keep your password secure and confidential</li>
                        <li>Accept responsibility for all activities under your account</li>
                        <li>Notify us immediately of any unauthorized use of your account</li>
                    </ul>
                    <p class="text-gray-600 leading-relaxed">
                        We reserve the right to suspend or terminate accounts that violate these Terms or for any other reason at our sole discretion.
                    </p>
                </section>

                <!-- Services Description -->
                <section class="mb-8">
                    <h2 class="text-xl font-bold text-gray-900 mb-4">4. Description of Services</h2>
                    <p class="text-gray-600 leading-relaxed mb-4">
                        AdoptMe is a platform that connects people looking to adopt pets with individuals and organizations offering pets for adoption. Our Services include:
                    </p>
                    <ul class="list-disc list-inside text-gray-600 mb-4 space-y-1">
                        <li>Browsing pet listings</li>
                        <li>Creating and managing pet adoption listings</li>
                        <li>Communicating with other users about pet adoptions</li>
                        <li>Managing your profile and favorites</li>
                    </ul>
                    <p class="text-gray-600 leading-relaxed">
                        AdoptMe is a platform that facilitates connections. We do not own, breed, sell, or guarantee any pets listed on our platform.
                    </p>
                </section>

                <!-- User Content -->
                <section class="mb-8">
                    <h2 class="text-xl font-bold text-gray-900 mb-4">5. User Content</h2>
                    <p class="text-gray-600 leading-relaxed mb-4">
                        You may submit content to our Services, including pet listings, photos, descriptions, and messages ("User Content"). By submitting User Content, you:
                    </p>
                    <ul class="list-disc list-inside text-gray-600 mb-4 space-y-1">
                        <li>Represent that you own or have the right to use and share the content</li>
                        <li>Grant AdoptMe a non-exclusive, worldwide, royalty-free license to use, display, reproduce, and distribute your User Content in connection with our Services</li>
                        <li>Accept responsibility for the accuracy and legality of your content</li>
                        <li>Understand that your content may be viewed by other users</li>
                    </ul>
                    <p class="text-gray-600 leading-relaxed">
                        We reserve the right to remove any User Content that violates these Terms or is otherwise objectionable at our sole discretion.
                    </p>
                </section>

                <!-- Prohibited Conduct -->
                <section class="mb-8">
                    <h2 class="text-xl font-bold text-gray-900 mb-4">6. Prohibited Conduct</h2>
                    <p class="text-gray-600 leading-relaxed mb-4">
                        When using our Services, you agree NOT to:
                    </p>
                    <ul class="list-disc list-inside text-gray-600 mb-4 space-y-1">
                        <li>Post false, misleading, or fraudulent information</li>
                        <li>List pets you do not own or have authority to place for adoption</li>
                        <li>Engage in pet sales for commercial profit (breeding operations)</li>
                        <li>Post content promoting animal cruelty or illegal activities</li>
                        <li>Harass, threaten, or intimidate other users</li>
                        <li>Use the Services for any unlawful purpose</li>
                        <li>Impersonate another person or entity</li>
                        <li>Attempt to gain unauthorized access to our systems</li>
                        <li>Interfere with or disrupt the Services</li>
                        <li>Scrape, harvest, or collect user information without consent</li>
                        <li>Use automated systems (bots) to access the Services</li>
                        <li>Circumvent any security measures</li>
                    </ul>
                </section>

                <!-- Pet Adoption Disclaimer -->
                <section class="mb-8">
                    <h2 class="text-xl font-bold text-gray-900 mb-4">7. Pet Adoption Disclaimer</h2>
                    <div class="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4">
                        <p class="text-amber-800 font-medium mb-2">Important Notice</p>
                        <p class="text-amber-700 text-sm">
                            AdoptMe is a platform that connects users. We do not own, possess, or control any animals listed on our platform. All adoption arrangements are made directly between users.
                        </p>
                    </div>
                    <p class="text-gray-600 leading-relaxed mb-4">
                        By using our Services, you acknowledge and agree that:
                    </p>
                    <ul class="list-disc list-inside text-gray-600 mb-4 space-y-1">
                        <li>AdoptMe does not verify the health, temperament, or history of listed pets</li>
                        <li>AdoptMe does not guarantee the accuracy of any listing information</li>
                        <li>You are responsible for conducting your own due diligence before any adoption</li>
                        <li>AdoptMe is not a party to any adoption agreement between users</li>
                        <li>You should verify the identity and legitimacy of other users before meeting</li>
                        <li>You assume all risks associated with pet adoptions</li>
                    </ul>
                    <p class="text-gray-600 leading-relaxed">
                        We strongly recommend meeting in safe, public locations and bringing a companion when meeting other users. Consider having pets examined by a veterinarian before finalizing any adoption.
                    </p>
                </section>

                <!-- Advertisements -->
                <section class="mb-8">
                    <h2 class="text-xl font-bold text-gray-900 mb-4">8. Advertisements</h2>
                    <p class="text-gray-600 leading-relaxed">
                        Our Services may display advertisements provided by third parties, including Google AdSense. These advertisements may be targeted based on content, queries, or other information. We are not responsible for the content of third-party advertisements or any products or services advertised.
                    </p>
                </section>

                <!-- Intellectual Property -->
                <section class="mb-8">
                    <h2 class="text-xl font-bold text-gray-900 mb-4">9. Intellectual Property</h2>
                    <p class="text-gray-600 leading-relaxed mb-4">
                        The Services and all content, features, and functionality (excluding User Content) are owned by AdoptMe and are protected by copyright, trademark, and other intellectual property laws.
                    </p>
                    <p class="text-gray-600 leading-relaxed">
                        You may not copy, modify, distribute, sell, or lease any part of our Services without our prior written consent.
                    </p>
                </section>

                <!-- Disclaimer of Warranties -->
                <section class="mb-8">
                    <h2 class="text-xl font-bold text-gray-900 mb-4">10. Disclaimer of Warranties</h2>
                    <p class="text-gray-600 leading-relaxed mb-4 uppercase text-sm font-semibold">
                        THE SERVICES ARE PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO:
                    </p>
                    <ul class="list-disc list-inside text-gray-600 mb-4 space-y-1">
                        <li>Implied warranties of merchantability and fitness for a particular purpose</li>
                        <li>Warranties that the Services will be uninterrupted or error-free</li>
                        <li>Warranties regarding the accuracy or reliability of any information obtained through the Services</li>
                        <li>Warranties regarding the quality of any pets, information, or other material obtained through the Services</li>
                    </ul>
                </section>

                <!-- Limitation of Liability -->
                <section class="mb-8">
                    <h2 class="text-xl font-bold text-gray-900 mb-4">11. Limitation of Liability</h2>
                    <p class="text-gray-600 leading-relaxed mb-4">
                        TO THE MAXIMUM EXTENT PERMITTED BY LAW, ADOPTME AND ITS OFFICERS, DIRECTORS, EMPLOYEES, AND AGENTS SHALL NOT BE LIABLE FOR:
                    </p>
                    <ul class="list-disc list-inside text-gray-600 mb-4 space-y-1">
                        <li>Any indirect, incidental, special, consequential, or punitive damages</li>
                        <li>Any loss of profits, data, use, or goodwill</li>
                        <li>Any damages resulting from pet adoptions arranged through the Services</li>
                        <li>Any damages resulting from unauthorized access to your account</li>
                        <li>Any damages resulting from User Content posted by third parties</li>
                    </ul>
                    <p class="text-gray-600 leading-relaxed">
                        Some jurisdictions do not allow the exclusion of certain warranties or limitations on liability. In such cases, our liability will be limited to the greatest extent permitted by law.
                    </p>
                </section>

                <!-- Indemnification -->
                <section class="mb-8">
                    <h2 class="text-xl font-bold text-gray-900 mb-4">12. Indemnification</h2>
                    <p class="text-gray-600 leading-relaxed">
                        You agree to indemnify, defend, and hold harmless AdoptMe and its officers, directors, employees, agents, and affiliates from any claims, damages, losses, liabilities, and expenses (including attorneys' fees) arising from your use of the Services, your User Content, your violation of these Terms, or your violation of any rights of another person or entity.
                    </p>
                </section>

                <!-- Governing Law -->
                <section class="mb-8">
                    <h2 class="text-xl font-bold text-gray-900 mb-4">13. Governing Law and Jurisdiction</h2>
                    <p class="text-gray-600 leading-relaxed mb-4">
                        These Terms shall be governed by and construed in accordance with applicable laws, without regard to conflict of law principles.
                    </p>
                    <p class="text-gray-600 leading-relaxed">
                        For users in Mexico, these Terms are also subject to the provisions of the Ley Federal de Protección al Consumidor. For users in Canada, provincial consumer protection legislation may apply.
                    </p>
                </section>

                <!-- Dispute Resolution -->
                <section class="mb-8">
                    <h2 class="text-xl font-bold text-gray-900 mb-4">14. Dispute Resolution</h2>
                    <p class="text-gray-600 leading-relaxed mb-4">
                        Before initiating any legal proceeding, you agree to first contact us at <a href="mailto:{contactEmail}" class="text-indigo-600 hover:underline">{contactEmail}</a> to attempt to resolve any dispute informally. Most disputes can be resolved through open communication.
                    </p>
                    <p class="text-gray-600 leading-relaxed">
                        If we cannot resolve a dispute informally, any legal proceedings will be conducted in accordance with the applicable laws of your jurisdiction.
                    </p>
                </section>

                <!-- Termination -->
                <section class="mb-8">
                    <h2 class="text-xl font-bold text-gray-900 mb-4">15. Termination</h2>
                    <p class="text-gray-600 leading-relaxed mb-4">
                        You may terminate your account at any time by contacting us or using the account deletion feature (if available).
                    </p>
                    <p class="text-gray-600 leading-relaxed">
                        We may suspend or terminate your access to the Services at any time, with or without cause, with or without notice. Upon termination, your right to use the Services will immediately cease.
                    </p>
                </section>

                <!-- Changes to Terms -->
                <section class="mb-8">
                    <h2 class="text-xl font-bold text-gray-900 mb-4">16. Changes to These Terms</h2>
                    <p class="text-gray-600 leading-relaxed">
                        We may modify these Terms at any time. We will notify you of material changes by posting the updated Terms on this page and updating the "Last updated" date. Your continued use of the Services after changes become effective constitutes your acceptance of the revised Terms.
                    </p>
                </section>

                <!-- Severability -->
                <section class="mb-8">
                    <h2 class="text-xl font-bold text-gray-900 mb-4">17. Severability</h2>
                    <p class="text-gray-600 leading-relaxed">
                        If any provision of these Terms is found to be unenforceable or invalid, that provision will be limited or eliminated to the minimum extent necessary, and the remaining provisions will continue in full force and effect.
                    </p>
                </section>

                <!-- Entire Agreement -->
                <section class="mb-8">
                    <h2 class="text-xl font-bold text-gray-900 mb-4">18. Entire Agreement</h2>
                    <p class="text-gray-600 leading-relaxed">
                        These Terms, together with our Privacy Policy, constitute the entire agreement between you and AdoptMe regarding your use of the Services and supersede all prior agreements and understandings.
                    </p>
                </section>

                <!-- Contact Us -->
                <section>
                    <h2 class="text-xl font-bold text-gray-900 mb-4">19. Contact Us</h2>
                    <p class="text-gray-600 leading-relaxed mb-4">
                        If you have any questions about these Terms of Service, please contact us:
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
