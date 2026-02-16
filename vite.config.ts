import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig, loadEnv } from 'vite';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig(({ mode }) => {
	const env = loadEnv(mode, process.cwd(), '');

	return {
		plugins: [tailwindcss(), sveltekit()],
		server: {
			watch: {
				usePolling: true,
			},
			host: true, // Needed for Docker port mapping
			port: 5173,
			// Allow ngrok and other tunnel services
			allowedHosts: env.VITE_ALLOW_EXTERNAL_HOSTS === 'true'
				? true  // Allow all hosts
				: ['.ngrok-free.app', '.ngrok.io']  // Or just ngrok domains
		}
	};
});
