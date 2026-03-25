import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SITE_URL = "https://rubigirls.fun";

const STATIC_PAGES = [
  { path: "/", priority: "1.0", changefreq: "daily" },
  { path: "/buscar", priority: "0.9", changefreq: "daily" },
  { path: "/planos", priority: "0.8", changefreq: "weekly" },
  { path: "/sobre", priority: "0.5", changefreq: "monthly" },
  { path: "/contato", priority: "0.5", changefreq: "monthly" },
  { path: "/blog", priority: "0.6", changefreq: "weekly" },
  { path: "/termos", priority: "0.3", changefreq: "monthly" },
  { path: "/privacidade", priority: "0.3", changefreq: "monthly" },
  { path: "/cookies", priority: "0.3", changefreq: "monthly" },
];

serve(async () => {
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseKey) {
      console.error("Sitemap error: Missing required environment variables: SUPABASE_URL and/or SUPABASE_SERVICE_ROLE_KEY");
      return new Response("Server configuration error", { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch active cities
    const { data: cities, error: citiesError } = await supabase
      .from("cities")
      .select("slug, name")
      .eq("is_active", true);
    if (citiesError) {
      console.error("Error fetching cities for sitemap:", citiesError);
      return new Response("Error generating sitemap", { status: 500 });
    }

    // Fetch approved profile slugs
    const { data: profiles, error: profilesError } = await supabase
      .from("eligible_profiles")
      .select("slug, updated_at");
    if (profilesError) {
      console.error("Error fetching profiles for sitemap:", profilesError);
      return new Response("Error generating sitemap", { status: 500 });
    }

    const today = new Date().toISOString().split("T")[0];

    const categories = ["women", "men", "trans", "couples"];

    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
`;

    // Static pages
    for (const page of STATIC_PAGES) {
      xml += `  <url>
    <loc>${SITE_URL}${page.path}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>
`;
    }

    // Category pages
    for (const cat of categories) {
      xml += `  <url>
    <loc>${SITE_URL}/categoria/${cat}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>
`;
    }

    // City pages
    if (cities) {
      for (const city of cities) {
        xml += `  <url>
    <loc>${SITE_URL}/cidade/${city.slug}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.7</priority>
  </url>
`;
      }
    }

    // Profile pages
    if (profiles) {
      for (const p of profiles) {
        if (!p.slug) continue;
        const lastmod = p.updated_at ? new Date(p.updated_at).toISOString().split("T")[0] : today;
        xml += `  <url>
    <loc>${SITE_URL}/perfil/${p.slug}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>
`;
      }
    }

    xml += `</urlset>`;

    return new Response(xml, {
      headers: {
        "Content-Type": "application/xml",
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (err) {
    console.error("Sitemap error:", err);
    return new Response("Error generating sitemap", { status: 500 });
  }
});
