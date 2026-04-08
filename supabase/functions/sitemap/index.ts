import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { CITY_SLUG_TO_PROFILE_BASE, LOCAL_SEO_CITIES, SITE_URL_DEFAULT } from "../_shared/seoConfig.ts";

const CATEGORY_SLUGS = ["women", "men", "couples", "shemales", "gay", "virtual-sex", "videos"];
const SITE_URL = Deno.env.get("APP_URL") || SITE_URL_DEFAULT;

const STATIC_PAGES = ["/", "/buscar", "/planos", "/sobre", "/contato", "/blog", "/termos", "/privacidade", "/cookies"];
const MARKET_HUBS = ["/es", "/br"];

const toAbsoluteUrl = (path: string) => new URL(path.startsWith("/") ? path : `/${path}`, SITE_URL).toString();
const toUrlNode = (path: string, lastmod: string, changefreq = "weekly", priority = "0.7") => `  <url>\n    <loc>${toAbsoluteUrl(path)}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>${changefreq}</changefreq>\n    <priority>${priority}</priority>\n  </url>\n`;

Deno.serve(async () => {
  try {
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: cities } = await supabase.from("cities").select("slug, is_featured").eq("is_active", true);
    const { data: profiles } = await supabase.from("eligible_profiles").select("slug, city_slug, updated_at");

    const today = new Date().toISOString().split("T")[0];
    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

    for (const path of STATIC_PAGES) xml += toUrlNode(path, today, path === "/" ? "daily" : "weekly", path === "/" ? "1.0" : "0.7");
    for (const path of MARKET_HUBS) xml += toUrlNode(path, today, "daily", "0.85");
    for (const cat of CATEGORY_SLUGS) xml += toUrlNode(`/categoria/${cat}`, today, "daily", "0.8");

    if (cities) {
      for (const city of cities) {
        xml += toUrlNode(`/cidade/${city.slug}`, today, "daily", city.is_featured ? "0.9" : "0.7");
      }
    }

    // Canonical local city hubs are indexable; local subpages are omitted until inventory/index rules are fully validated.
    for (const localCity of LOCAL_SEO_CITIES) {
      xml += toUrlNode(localCity.basePath, today, "daily", "0.9");
    }

    if (profiles) {
      for (const p of profiles) {
        if (!p.slug) continue;
        const lastmod = p.updated_at ? new Date(p.updated_at).toISOString().split("T")[0] : today;
        const profileBasePath = p.city_slug ? CITY_SLUG_TO_PROFILE_BASE.get(p.city_slug) : undefined;
        const canonicalProfilePath = profileBasePath ? `${profileBasePath}/${p.slug}` : `/perfil/${p.slug}`;
        xml += toUrlNode(canonicalProfilePath, lastmod, "weekly", "0.7");
      }
    }

    xml += `</urlset>`;
    return new Response(xml, { headers: { "Content-Type": "application/xml", "Cache-Control": "public, max-age=3600" } });
  } catch (err) {
    console.error("Sitemap error:", err);
    return new Response("Error generating sitemap", { status: 500 });
  }
});
