<script lang="ts">
	import favicon from "$lib/assets/favicon.svg";
	import "../app.css";
	import Navbar from "$lib/components/Navbar.svelte";
	import Footer from "$lib/components/Footer.svelte";
	import ToastContainer from "$lib/components/ToastContainer.svelte";
	import GlobalLoader from "$lib/components/GlobalLoader.svelte";
	import SEO from "$lib/components/SEO.svelte";

	let { children } = $props();

	// Replace with your actual Google AdSense publisher ID
	const ADSENSE_CLIENT_ID = 'ca-pub-XXXXXXXXXXXXXXXX';
</script>

<svelte:head>
	<link rel="icon" href={favicon} />

	<!-- Google AdSense -->
	<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client={ADSENSE_CLIENT_ID}" crossorigin="anonymous"></script>

	<!-- Preconnect for performance -->
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />

	<!-- Web App Manifest (for PWA) -->
	<link rel="manifest" href="/manifest.json" />
</svelte:head>

<!-- Default SEO (will be overridden by page-specific SEO) -->
<SEO />

<div class="min-h-screen flex flex-col">
	<Navbar />
	<main class="flex-1">
		{@render children()}
	</main>
	<Footer />
</div>
<ToastContainer />
<GlobalLoader />
