import adapterAuto from '@sveltejs/adapter-auto';
import adapterNode from '@sveltejs/adapter-node';

// Use adapter-node for production builds, adapter-auto for development
const isProduction = process.env.NODE_ENV === 'production';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	kit: {
		adapter: isProduction
			? adapterNode({
				out: 'build'
			})
			: adapterAuto()
	}
};

export default config;
