<script lang="ts">
	interface Props {
		title?: string;
		description?: string;
		keywords?: string;
		image?: string;
		url?: string;
		type?: 'website' | 'article' | 'profile';
		siteName?: string;
		twitterCard?: 'summary' | 'summary_large_image';
		noindex?: boolean;
		canonical?: string;
		author?: string;
		publishedTime?: string;
		modifiedTime?: string;
	}

	let {
		title = 'AdoptMe - Find Your Perfect Pet Companion',
		description = 'Give a pet a second chance at happiness. AdoptMe helps you discover dogs, cats, and other animals waiting for their forever home. Post adoptions, report lost pets, and connect with a community that cares.',
		keywords = 'pet adoption, adopt a pet, dog adoption, cat adoption, animal rescue, pet shelter, adopt dogs, adopt cats, pet finder, animal adoption, lost pets, found pets, pet community',
		image = 'https://www.hartz.com/wp-content/uploads/2021/10/adopt-dog-1.jpg',
		url = '',
		type = 'website',
		siteName = 'AdoptMe',
		twitterCard = 'summary_large_image',
		noindex = false,
		canonical = '',
		author = '',
		publishedTime = '',
		modifiedTime = ''
	}: Props = $props();

	const fullTitle = title.includes('AdoptMe') ? title : `${title} | AdoptMe`;
</script>

<svelte:head>
	<!-- Primary Meta Tags -->
	<title>{fullTitle}</title>
	<meta name="title" content={fullTitle} />
	<meta name="description" content={description} />
	<meta name="keywords" content={keywords} />

	{#if noindex}
		<meta name="robots" content="noindex, nofollow" />
	{:else}
		<meta name="robots" content="index, follow" />
	{/if}

	{#if canonical}
		<link rel="canonical" href={canonical} />
	{/if}

	{#if author}
		<meta name="author" content={author} />
	{/if}

	<!-- Open Graph / Facebook -->
	<meta property="og:type" content={type} />
	<meta property="og:site_name" content={siteName} />
	<meta property="og:title" content={fullTitle} />
	<meta property="og:description" content={description} />
	{#if image}
		<meta property="og:image" content={image} />
	{/if}
	{#if url}
		<meta property="og:url" content={url} />
	{/if}

	{#if type === 'article'}
		{#if publishedTime}
			<meta property="article:published_time" content={publishedTime} />
		{/if}
		{#if modifiedTime}
			<meta property="article:modified_time" content={modifiedTime} />
		{/if}
	{/if}

	<!-- Twitter -->
	<meta name="twitter:card" content={twitterCard} />
	<meta name="twitter:title" content={fullTitle} />
	<meta name="twitter:description" content={description} />
	{#if image}
		<meta name="twitter:image" content={image} />
	{/if}

	<!-- Additional SEO -->
	<meta name="theme-color" content="#6366f1" />
	<meta name="apple-mobile-web-app-capable" content="yes" />
	<meta name="apple-mobile-web-app-status-bar-style" content="default" />
	<meta name="apple-mobile-web-app-title" content={siteName} />
</svelte:head>
