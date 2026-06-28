import { canonical, PUBLIC_PATHS } from "~/lib/seo";

const LAST_MODIFIED = "2026-06-28";

export function loader() {
  const urls = PUBLIC_PATHS.map((path) => {
    const priority = path === "/" ? "1.0" : "0.7";
    return `  <url>
    <loc>${canonical(path)}</loc>
    <lastmod>${LAST_MODIFIED}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>${priority}</priority>
  </url>`;
  }).join("\n");

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`;

  return new Response(body, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
