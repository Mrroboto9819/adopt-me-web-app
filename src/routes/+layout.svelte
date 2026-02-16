<script lang="ts">
	import favicon from "$lib/assets/favicon.svg";
	import "../app.css";
	import Navbar from "$lib/components/Navbar.svelte";
	import Footer from "$lib/components/Footer.svelte";
	import ToastContainer from "$lib/components/ToastContainer.svelte";
	import GlobalLoader from "$lib/components/GlobalLoader.svelte";
	import SEO from "$lib/components/SEO.svelte";
	import FloatingBugButton from "$lib/components/FloatingBugButton.svelte";
	import "$lib/i18n"; // Initialize i18n
	import { locale } from "svelte-i18n";
	import { auth } from "$lib/stores/auth.svelte";
	import { theme } from "$lib/stores/theme.svelte";
	import { onMount } from "svelte";
	import { page } from "$app/stores";

	let { children } = $props();

	// Hide navbar and footer on login page
	let isLoginPage = $derived($page.url.pathname === "/login");

	// Replace with your actual Google AdSense publisher ID
	const ADSENSE_CLIENT_ID = "ca-pub-XXXXXXXXXXXXXXXX";

	import { isLoading } from "svelte-i18n";

	$effect(() => {
		const user = auth.user;
		if (user && user.language) {
			locale.set(user.language);
		} else if (!user) {
			// If no user (or logged out), default to English
			locale.set("en");
		}
		// Load theme from user data (for page refresh when already logged in)
		if (user && user.theme) {
			theme.loadFromUser(user.theme);
		}
	});
</script>

<svelte:head>
	<link rel="icon" href={favicon} />

	<!-- Prevent flash of wrong theme -->
	{@html `<script>
		(function() {
			const theme = localStorage.getItem('theme') || 'system';
			const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
			const isDark = theme === 'dark' || (theme === 'system' && prefersDark);
			if (isDark) document.documentElement.classList.add('dark');
		})();
	</script>`}

	<!-- Google AdSense -->
	<script
		async
		src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client={ADSENSE_CLIENT_ID}"
		crossorigin="anonymous"
	></script>

	<!-- Preconnect for performance -->
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link
		rel="preconnect"
		href="https://fonts.gstatic.com"
		crossorigin="anonymous"
	/>

	<!-- Web App Manifest (for PWA) -->
	<link rel="manifest" href="/manifest.json" />
</svelte:head>

<!-- Default SEO (will be overridden by page-specific SEO) -->
<SEO />

{#if $isLoading}
	<GlobalLoader />
{:else}
	<div
		class="min-h-screen flex flex-col bg-white dark:bg-gray-900 transition-colors duration-200"
	>
		{#if !isLoginPage}
			<Navbar />
		{/if}
		<main class="flex-1">
			{@render children()}
		</main>
		{#if !isLoginPage}
			<Footer />
		{/if}
	</div>
	<ToastContainer />
	<GlobalLoader />

	<!-- Version Badge -->
	<div class="fixed bottom-4 left-4 z-40 pointer-events-none">
		<span
			class="text-xs font-medium text-gray-400 dark:text-gray-600 select-none"
		>
			v0.1.0 Open Alph
		</span>
	</div>

	<!-- Floating Bug Report Button -->
	<FloatingBugButton />
{/if}
