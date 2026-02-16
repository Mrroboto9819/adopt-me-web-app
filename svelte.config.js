import adapterAuto from '@sveltejs/adapter-auto';
import adapterNode from '@sveltejs/adapter-node';

// Use adapter-node for production builds, adapter-auto for development
const isProduction = process.env.NODE_ENV === 'production';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	kit: {
		adapter: isProduction
			? adapterNode({
				out: 'build',
				// Increase body size limit to support image uploads (10MB) and video uploads (100MB)
				// Set to 110MB to allow for some overhead
				envPrefix: '',
				polyfill: false
			})
			: adapterAuto(),
		csrf: {
			checkOrigin: false
		}
	}
};

export default config;
