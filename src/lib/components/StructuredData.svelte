<script lang="ts">
	interface Props {
		type: 'Organization' | 'WebSite' | 'WebPage' | 'Article' | 'LocalBusiness';
		data?: Record<string, unknown>;
	}

	let { type, data = {} }: Props = $props();

	const baseUrl = 'https://adoptme.com';

	function getStructuredData() {
		const baseData = {
			'@context': 'https://schema.org'
		};

		switch (type) {
			case 'Organization':
				return {
					...baseData,
					'@type': 'Organization',
					name: 'AdoptMe',
					url: baseUrl,
					logo: `${baseUrl}/logo.png`,
					description: 'AdoptMe is the leading pet adoption platform connecting loving families with pets in need.',
					sameAs: [
						'https://facebook.com/adoptme',
						'https://twitter.com/adoptme',
						'https://instagram.com/adoptme'
					],
					contactPoint: {
						'@type': 'ContactPoint',
						contactType: 'customer service',
						availableLanguage: ['English', 'Spanish']
					},
					...data
				};

			case 'WebSite':
				return {
					...baseData,
					'@type': 'WebSite',
					name: 'AdoptMe',
					url: baseUrl,
					potentialAction: {
						'@type': 'SearchAction',
						target: `${baseUrl}/search?q={search_term_string}`,
						'query-input': 'required name=search_term_string'
					},
					...data
				};

			case 'WebPage':
				return {
					...baseData,
					'@type': 'WebPage',
					name: data.name || 'AdoptMe',
					description: data.description || 'Find your perfect pet companion',
					url: data.url || baseUrl,
					isPartOf: {
						'@type': 'WebSite',
						name: 'AdoptMe',
						url: baseUrl
					},
					...data
				};

			case 'Article':
				return {
					...baseData,
					'@type': 'Article',
					headline: data.headline,
					image: data.image,
					datePublished: data.datePublished,
					dateModified: data.dateModified,
					author: {
						'@type': 'Person',
						name: data.authorName
					},
					publisher: {
						'@type': 'Organization',
						name: 'AdoptMe',
						logo: {
							'@type': 'ImageObject',
							url: `${baseUrl}/logo.png`
						}
					},
					...data
				};

			case 'LocalBusiness':
				return {
					...baseData,
					'@type': 'LocalBusiness',
					'@id': baseUrl,
					name: 'AdoptMe',
					description: 'Pet adoption platform connecting families with pets in need',
					url: baseUrl,
					priceRange: 'Free',
					...data
				};

			default:
				return baseData;
		}
	}

	const jsonLd = JSON.stringify(getStructuredData());
</script>

<svelte:head>
	{@html `<script type="application/ld+json">${jsonLd}</script>`}
</svelte:head>
