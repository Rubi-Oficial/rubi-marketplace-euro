import { useParams, Link } from "react-router-dom";
import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { getSignedUrls } from "@/lib/storageUrls";
import { ArrowLeft, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProfileSkeleton } from "@/components/profile/ProfileSkeleton";
import { ProfileGallery } from "@/components/profile/ProfileGallery";
import { ProfileInfo } from "@/components/profile/ProfileInfo";
import { useLanguage } from "@/i18n/LanguageContext";
import { usePageMeta, SITE_URL } from "@/hooks/usePageMeta";

interface PublicProfile {
  id: string;
  display_name: string;
  age: number | null;
  city: string | null;
  city_slug: string | null;
  country: string | null;
  category: string | null;
  bio: string | null;
  languages: string[] | null;
  pricing_from: number | null;
  whatsapp: string | null;
  telegram: string | null;
  slug: string | null;
  is_featured: boolean;
}

interface MediaItem {
  id: string;
  storage_path: string;
  sort_order: number;
  url: string;
}

export default function ProfilePage() {
  const { t } = useLanguage();
  const { slug } = useParams();
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [images, setImages] = useState<MediaItem[]>([]);
  const [videos, setVideos] = useState<MediaItem[]>([]);
  const [services, setServices] = useState<{ name: string; slug: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;

    const load = async () => {
      try {
        setError(null);

        const { data: eligible, error: eligibleErr } = await supabase
          .from("eligible_profiles")
          .select("*")
          .eq("slug", slug)
          .maybeSingle();

        if (eligibleErr) {
          console.error("[ProfilePage] Failed to fetch profile:", eligibleErr.message);
          setError("Não foi possível carregar o perfil. Tente novamente.");
          setLoading(false);
          return;
        }

        if (!eligible) { setLoading(false); return; }

        // Parallel fetches: contact, images, videos, services
        const [contactResult, imgResult, vidResult, psResult] = await Promise.all([
          supabase.rpc("get_profile_contact", { p_profile_id: eligible.id }),
          supabase
            .from("profile_images")
            .select("id, storage_path, sort_order")
            .eq("profile_id", eligible.id)
            .eq("moderation_status", "approved")
            .order("sort_order"),
          supabase
            .from("profile_videos")
            .select("id, storage_path, sort_order")
            .eq("profile_id", eligible.id)
            .eq("moderation_status", "approved")
            .order("sort_order"),
          supabase
            .from("profile_services")
            .select("service_id")
            .eq("profile_id", eligible.id),
        ]);

        // Set profile with contact info
        const contact = contactResult.data as { whatsapp: string | null; telegram: string | null } | null;
        setProfile({
          ...eligible,
          whatsapp: contact?.whatsapp ?? null,
          telegram: contact?.telegram ?? null,
        } as unknown as PublicProfile);

        // Process images + videos signed URLs in a single batch
        const allPaths: string[] = [];
        const imgData = imgResult.data ?? [];
        const vidData = vidResult.data ?? [];

        if (imgResult.error) console.error("[ProfilePage] Failed to fetch images:", imgResult.error.message);
        if (vidResult.error) console.error("[ProfilePage] Failed to fetch videos:", vidResult.error.message);

        imgData.forEach((img) => allPaths.push(img.storage_path));
        vidData.forEach((v) => allPaths.push(v.storage_path));

        const signedMap = allPaths.length > 0 ? await getSignedUrls(allPaths) : {};

        setImages(imgData.map((img) => ({
          ...img,
          url: signedMap[img.storage_path] || "",
        })));

        setVideos(vidData.map((v) => ({
          ...v,
          url: signedMap[v.storage_path] || "",
        })));

        // Fetch service names if profile has services
        const psData = psResult.data;
        if (psData && psData.length > 0) {
          const serviceIds = psData.map((r: any) => r.service_id);
          const { data: svcData } = await supabase
            .from("services")
            .select("name, slug")
            .in("id", serviceIds)
            .eq("is_active", true)
            .order("sort_order");
          if (svcData) setServices(svcData);
        }

        // Track lead (non-critical, fire and forget)
        supabase.from("leads").insert({ profile_id: eligible.id, source: "profile_view" }).then(({ error: leadErr }) => {
          if (leadErr) console.warn("[ProfilePage] Lead insert failed:", leadErr.message);
        });

        setLoading(false);
      } catch (err) {
        console.error("[ProfilePage] Unexpected error:", err);
        setError("Ocorreu um erro inesperado. Tente novamente.");
        setLoading(false);
      }
    };

    load();
  }, [slug]);

  const profileJsonLd = useMemo(() => {
    if (!profile) return undefined;
    return {
      "@context": "https://schema.org",
      "@type": "ProfilePage",
      name: profile.display_name,
      url: `${SITE_URL}/perfil/${slug}`,
      mainEntity: {
        "@type": "Person",
        name: profile.display_name,
        address: profile.city ? { "@type": "PostalAddress", addressLocality: profile.city, addressCountry: profile.country || "NL" } : undefined,
        image: images[0]?.url,
      },
    };
  }, [profile, images, slug]);

  const breadcrumbs = useMemo(() => {
    const crumbs = [{ name: "Home", url: SITE_URL }];
    if (profile?.category) {
      const catSlug = profile.category.toLowerCase().replace(/\s+/g, "-");
      crumbs.push({ name: profile.category, url: `${SITE_URL}/categoria/${catSlug}` });
    }
    if (profile?.city && profile?.city_slug) {
      crumbs.push({ name: profile.city, url: `${SITE_URL}/cidade/${profile.city_slug}` });
    }
    if (profile) {
      crumbs.push({ name: profile.display_name, url: `${SITE_URL}/perfil/${slug}` });
    }
    return crumbs;
  }, [profile, slug]);

  usePageMeta({
    title: profile ? `${profile.display_name} — ${profile.city || "Europe"}` : "Profile",
    description: profile
      ? `${profile.display_name}${profile.category ? `, ${profile.category}` : ""} in ${profile.city || "Europe"}. ${profile.bio?.slice(0, 120) || ""}`
      : "Profile on Rubi Girls",
    path: `/perfil/${slug}`,
    image: images[0]?.url,
    imageAlt: profile ? `${profile.display_name} profile photo` : undefined,
    type: "profile",
    jsonLd: profileJsonLd,
    breadcrumbs,
  });

  if (loading) return <ProfileSkeleton />;

  if (error) {
    return (
      <div className="container mx-auto px-4 py-20 text-center animate-fade-in">
        <AlertTriangle className="mx-auto h-10 w-10 text-destructive mb-3" />
        <h1 className="font-display text-2xl font-bold text-foreground">Erro ao carregar</h1>
        <p className="mt-2 text-muted-foreground">{error}</p>
        <div className="flex items-center justify-center gap-3 mt-6">
          <Button variant="outline" onClick={() => window.location.reload()}>
            Tentar novamente
          </Button>
          <Button variant="ghost" asChild>
            <Link to="/buscar"><ArrowLeft className="mr-1.5 h-4 w-4" /> Voltar</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="container mx-auto px-4 py-20 text-center animate-fade-in">
        <h1 className="font-display text-2xl font-bold text-foreground">{t("profile.unavailable")}</h1>
        <p className="mt-2 text-muted-foreground">{t("profile.unavailable_desc")}</p>
        <Button variant="ghost" className="mt-6" asChild>
          <Link to="/buscar"><ArrowLeft className="mr-1.5 h-4 w-4" /> {t("profile.browse")}</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 animate-fade-in">
      <nav aria-label="Breadcrumb" className="mb-3 text-xs text-muted-foreground">
        <ol className="flex items-center gap-1.5 flex-wrap">
          <li><Link to="/" className="hover:text-foreground transition-colors">Home</Link></li>
          {profile.category && (
            <>
              <li className="text-border">/</li>
              <li><Link to={`/categoria/${profile.category.toLowerCase().replace(/\s+/g, "-")}`} className="hover:text-foreground transition-colors">{profile.category}</Link></li>
            </>
          )}
          {profile.city && profile.city_slug && (
            <>
              <li className="text-border">/</li>
              <li><Link to={`/cidade/${profile.city_slug}`} className="hover:text-foreground transition-colors">{profile.city}</Link></li>
            </>
          )}
          <li className="text-border">/</li>
          <li className="text-foreground">{profile.display_name}</li>
        </ol>
      </nav>

      <div className="flex items-center gap-1.5 flex-wrap mb-5">
        {profile.category && (
          <Link
            to={`/categoria/${profile.category.toLowerCase().replace(/\s+/g, "-")}`}
            className="rounded-full bg-primary/10 border border-primary/20 px-2.5 py-1 text-[11px] font-medium text-primary hover:bg-primary/20 transition-colors"
          >
            {profile.category}
          </Link>
        )}
        {profile.city && profile.city_slug && (
          <Link
            to={`/cidade/${profile.city_slug}`}
            className="rounded-full bg-card border border-border/40 px-2.5 py-1 text-[11px] font-medium text-muted-foreground hover:border-primary/30 hover:text-foreground transition-colors"
          >
            {profile.city}
          </Link>
        )}
        {services.map((s) => (
          <Link
            key={s.slug}
            to={`/buscar?service=${s.slug}`}
            className="rounded-full bg-card border border-border/40 px-2.5 py-1 text-[11px] font-medium text-muted-foreground hover:border-primary/30 hover:text-foreground transition-colors"
          >
            {s.name}
          </Link>
        ))}
      </div>

      <div className="grid gap-8 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <ProfileGallery images={images} videos={videos} name={profile.display_name} />
        </div>
        <div className="lg:col-span-2">
          <ProfileInfo profile={profile} services={services} />
        </div>
      </div>
    </div>
  );
}