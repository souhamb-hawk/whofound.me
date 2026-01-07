import type { APIRoute } from 'astro';

const pages = [
  { url: '/', changefreq: 'weekly', priority: 1.0 },
  { url: '/disclaimer', changefreq: 'monthly', priority: 0.5 },
];

export const GET: APIRoute = () => {
  const site = 'https://whofound.me';
  const lastmod = new Date().toISOString().split('T')[0];
  
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${pages.map(page => `  <url>
    <loc>${site}${page.url}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`).join('\n')}
</urlset>`;

  return new Response(sitemap, {
    headers: {
      'Content-Type': 'application/xml',
    },
  });
};

