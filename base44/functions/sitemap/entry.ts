import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const LOCATIONS = [
  { name: "KL", slug: "kl" },
  { name: "Cheras", slug: "cheras" },
  { name: "Ampang", slug: "ampang" },
  { name: "Negeri Sembilan", slug: "negeri-sembilan" },
];

function getLocationSlug(name) {
  return LOCATIONS.find((l) => l.name === name)?.slug || "kl";
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const url = new URL(req.url);
    const baseUrl = `${url.protocol}//${url.host}`;

    const [posts, categories, tags] = await Promise.all([
      base44.asServiceRole.entities.Post.filter({ status: "published" }, "-updated_date", 500),
      base44.asServiceRole.entities.Category.list(),
      base44.asServiceRole.entities.Tag.list(),
    ]);

    const urls = [];

    // Homepage
    urls.push({ loc: `${baseUrl}/`, priority: "1.0", changefreq: "daily" });

    // Location listing pages
    for (const loc of LOCATIONS) {
      urls.push({ loc: `${baseUrl}/${loc.slug}`, priority: "0.9", changefreq: "daily" });
    }

    // Category pages
    for (const cat of categories) {
      urls.push({ loc: `${baseUrl}/category/${cat.slug}`, priority: "0.7", changefreq: "weekly" });
    }

    // Tag pages
    for (const tag of tags) {
      urls.push({ loc: `${baseUrl}/tag/${tag.slug}`, priority: "0.6", changefreq: "weekly" });
    }

    // Post pages — new URL structure: /{location-slug}/{post-slug}
    for (const post of posts) {
      const locSlug = getLocationSlug(post.location);
      const lastmod = post.updated_date || post.created_date;
      urls.push({
        loc: `${baseUrl}/${locSlug}/${post.slug}`,
        priority: "0.8",
        changefreq: "weekly",
        ...(lastmod ? { lastmod: new Date(lastmod).toISOString() } : {}),
      });
    }

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url>
    <loc>${u.loc}</loc>${u.lastmod ? `\n    <lastmod>${u.lastmod}</lastmod>` : ""}
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`).join("\n")}
</urlset>`;

    return new Response(xml, {
      status: 200,
      headers: {
        "Content-Type": "application/xml",
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});