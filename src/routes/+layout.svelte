<script lang="ts">
	import favicon from "$lib/assets/favicon.svg";
	import "../app.css";
	import Navbar from "$lib/components/Navbar.svelte";
	import ToastContainer from "$lib/components/ToastContainer.svelte";
	import GlobalLoader from "$lib/components/GlobalLoader.svelte";

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<Navbar />
{@render children()}
<ToastContainer />
<GlobalLoader />
