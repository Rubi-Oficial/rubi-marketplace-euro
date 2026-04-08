import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CATEGORY_SLUGS = ["women", "men", "couples", "shemales", "gay", "virtual-sex", "videos"];
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
  { path: "/es", priority: "0.8", changefreq: "weekly" },
  { path: "/br", priority: "0.8", changefreq: "weekly" },
];

const LOCAL_CITY_PAGES = [
  "/es/escorts-barcelona", "/es/escorts-madrid", "/br/acompanhantes-florianopolis", "/br/acompanhantes-sao-paulo",
];

const LOCAL_SUB_PAGES = [
  "/es/escorts-barcelona/eixample", "/es/escorts-barcelona/gotic", "/es/escorts-barcelona/gracia", "/es/escorts-barcelona/vip", "/es/escorts-barcelona/luxury", "/es/escorts-barcelona/independientes",
  "/es/escorts-madrid/salamanca", "/es/escorts-madrid/chamberi", "/es/escorts-madrid/chamartin", "/es/escorts-madrid/vip", "/es/escorts-madrid/luxury", "/es/escorts-madrid/elite",
  "/br/acompanhantes-florianopolis/jurere-internacional", "/br/acompanhantes-florianopolis/trindade", "/br/acompanhantes-florianopolis/centro", "/br/acompanhantes-florianopolis/loiras", "/br/acompanhantes-florianopolis/morenas", "/br/acompanhantes-florianopolis/com-local", "/br/acompanhantes-florianopolis/a-domicilio",
  "/br/acompanhantes-sao-paulo/jardins", "/br/acompanhantes-sao-paulo/moema", "/br/acompanhantes-sao-paulo/vila-olimpia", "/br/acompanhantes-sao-paulo/loiras", "/br/acompanhantes-sao-paulo/morenas", "/br/acompanhantes-sao-paulo/com-local", "/br/acompanhantes-sao-paulo/a-domicilio",
];

const CITY_TO_PROFILE_BASE: Record<string, string> = {
  barcelona: "/es/escorts-barcelona/modelo",
  madrid: "/es/escorts-madrid/modelo",
  florianopolis: "/br/acompanhantes-florianopolis/modelo",
  "sao-paulo": "/br/acompanhantes-sao-paulo/modelo",
};

const toUrlNode = (path: string, lastmod: string, changefreq = "weekly", priority = "0.7") => `  <url>\n    <loc>${SITE_URL}${path}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>${changefreq}</changefreq>\n    <priority>${priority}</priority>\n  </url>\n`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET, OPTIONS", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type" } });
  }

  try {
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: cities } = await supabase.from("cities").select("slug, is_featured").eq("is_active", true);
    const { data: profiles } = await supabase.from("eligible_profiles").select("slug, city_slug, updated_at");

    const today = new Date().toISOString().split("T")[0];
    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

    for (const page of STATIC_PAGES) xml += toUrlNode(page.path, today, page.changefreq, page.priority);
    for (const cat of CATEGORY_SLUGS) xml += toUrlNode(`/categoria/${cat}`, today, "daily", "0.8");

    if (cities) {
      for (const city of cities) {
        xml += toUrlNode(`/cidade/${city.slug}`, today, "daily", city.is_featured ? "0.9" : "0.7");
      }
    }

    for (const cityPage of LOCAL_CITY_PAGES) xml += toUrlNode(cityPage, today, "daily", "0.9");
    for (const subPage of LOCAL_SUB_PAGES) xml += toUrlNode(subPage, today, "weekly", "0.75");

    if (profiles) {
      for (const p of profiles) {
        if (!p.slug) continue;
        const lastmod = p.updated_at ? new Date(p.updated_at).toISOString().split("T")[0] : today;
        xml += toUrlNode(`/perfil/${p.slug}`, lastmod, "weekly", "0.6");
        const profileBase = p.city_slug ? CITY_TO_PROFILE_BASE[p.city_slug] : null;
        if (profileBase) xml += toUrlNode(`${profileBase}/${p.slug}`, lastmod, "weekly", "0.7");
      }
    }

    xml += `</urlset>`;
    return new Response(xml, { headers: { "Content-Type": "application/xml", "Cache-Control": "public, max-age=3600" } });
  } catch (err) {
    console.error("Sitemap error:", err);
    return new Response("Error generating sitemap", { status: 500 });
  }
});
