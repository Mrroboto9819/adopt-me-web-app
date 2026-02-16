import type { RequestHandler } from './$types';

const SITE_URL = 'https://adoptme.com';

export const GET: RequestHandler = async () => {
    // Static pages
    const staticPages = [
        '',
        '/login',
        '/profile',
        '/about',
        '/contact',
        '/support'
    ];

    // Generate sitemap XML
    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
    ${staticPages
        .map(
            (page) => `
    <url>
        <loc>${SITE_URL}${page}</loc>
        <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
        <changefreq>${page === '' ? 'daily' : 'weekly'}</changefreq>
        <priority>${page === '' ? '1.0' : '0.8'}</priority>
    </url>`
        )
        .join('')}
</urlset>`.trim();

    return new Response(sitemap, {
        headers: {
            'Content-Type': 'application/xml',
            'Cache-Control': 'max-age=3600'
        }
    });
};
