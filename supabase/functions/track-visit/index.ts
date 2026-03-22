import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const BOT_PATTERNS = [
  /bot/i, /crawl/i, /spider/i, /slurp/i, /mediapartners/i,
  /googlebot/i, /bingbot/i, /yandex/i, /baiduspider/i,
  /facebookexternalhit/i, /twitterbot/i, /linkedinbot/i,
  /whatsapp/i, /telegrambot/i, /discordbot/i,
  /curl/i, /wget/i, /python-requests/i, /httpie/i,
  /go-http-client/i, /java\//i, /axios/i, /node-fetch/i,
  /headlesschrome/i, /phantomjs/i, /selenium/i,
  /scrapy/i, /httpclient/i, /libwww/i,
];

function isBot(ua: string): boolean {
  if (!ua) return false;
  return BOT_PATTERNS.some((p) => p.test(ua));
}

function getDeviceType(ua: string): string {
  if (!ua) return "unknown";
  if (/mobile|android|iphone|ipod|blackberry|opera mini|iemobile/i.test(ua)) return "mobile";
  if (/ipad|tablet|kindle|silk/i.test(ua)) return "tablet";
  return "desktop";
}

async function hashIP(ip: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(ip + "_rubi_salt_2024");
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function geoLookup(ip: string): Promise<{ country_code: string; city_name: string }> {
  try {
    const res = await fetch(`http://ip-api.com/json/${ip}?fields=countryCode,city`, {
      signal: AbortSignal.timeout(2000),
    });
    if (!res.ok) return { country_code: "", city_name: "" };
    const data = await res.json();
    return {
      country_code: data.countryCode || "",
      city_name: data.city || "",
    };
  } catch {
    return { country_code: "", city_name: "" };
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { session_id, page_path, referrer_url, utm_source, utm_medium, utm_campaign, user_id } = body;

    if (!session_id || !page_path) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Extract IP
    const forwarded = req.headers.get("x-forwarded-for");
    const ip = forwarded ? forwarded.split(",")[0].trim() : "unknown";

    // Get user agent
    const userAgent = req.headers.get("user-agent") || "";

    // Process in parallel
    const [ipHash, geo] = await Promise.all([
      ip !== "unknown" ? hashIP(ip) : Promise.resolve(null),
      ip !== "unknown" ? geoLookup(ip) : Promise.resolve({ country_code: "", city_name: "" }),
    ]);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const { error } = await supabase.from("site_visits").insert({
      session_id,
      page_path,
      referrer_url: referrer_url || null,
      utm_source: utm_source || null,
      utm_medium: utm_medium || null,
      utm_campaign: utm_campaign || null,
      ip_hash: ipHash,
      country_code: geo.country_code || null,
      city_name: geo.city_name || null,
      user_agent: userAgent,
      device_type: getDeviceType(userAgent),
      user_id: user_id || null,
      is_bot: isBot(userAgent),
    });

    if (error) {
      console.error("Insert error:", error);
      return new Response(JSON.stringify({ error: "Failed to track" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Track visit error:", err);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
