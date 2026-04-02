import { useParams, Link } from "react-router-dom";
import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { getSignedUrls } from "@/lib/storageUrls";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProfileSkeleton } from "@/components/profile/ProfileSkeleton";
import { ProfileGallery } from "@/components/profile/ProfileGallery";
import { ProfileInfo } from "@/components/profile/ProfileInfo";
import { useLanguage } from "@/i18n/LanguageContext";
import { usePageMeta } from "@/hooks/usePageMeta";

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

  useEffect(() => {
    if (!slug) return;

    const load = async () => {
      const { data: eligible } = await supabase
        .from("eligible_profiles")
        .select("*")
        .eq("slug", slug)
        .maybeSingle();

      if (!eligible) { setLoading(false); return; }

      // Fetch contact details via secure RPC
      const { data: contactData } = await supabase.rpc("get_profile_contact", { p_profile_id: eligible.id });
      const contact = contactData as { whatsapp: string | null; telegram: string | null } | null;

      setProfile({
        ...eligible,
        whatsapp: contact?.whatsapp ?? null,
        telegram: contact?.telegram ?? null,
      } as unknown as PublicProfile);

      const { data: imgData } = await supabase
        .from("profile_images")
        .select("id, storage_path, sort_order")
        .eq("profile_id", eligible.id)
        .eq("moderation_status", "approved")
        .order("sort_order");

      if (imgData) {
        setImages(imgData.map((img) => ({
          ...img,
          url: supabase.storage.from("profile-images").getPublicUrl(img.storage_path).data.publicUrl,
        })));
      }

      const { data: vidData } = await supabase
        .from("profile_videos")
        .select("id, storage_path, sort_order")
        .eq("profile_id", eligible.id)
        .eq("moderation_status", "approved")
        .order("sort_order");

      if (vidData) {
        setVideos(vidData.map((v) => ({
          ...v,
          url: supabase.storage.from("profile-images").getPublicUrl(v.storage_path).data.publicUrl,
        })));
      }

      const { data: psData } = await supabase
        .from("profile_services")
        .select("service_id")
        .eq("profile_id", eligible.id);

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

      await supabase.from("leads").insert({ profile_id: eligible.id, source: "profile_view" });
      setLoading(false);
    };

    load();
  }, [slug]);

  const profileJsonLd = useMemo(() => {
    if (!profile) return undefined;
    return {
      "@context": "https://schema.org",
      "@type": "Person",
      name: profile.display_name,
      address: profile.city ? { "@type": "PostalAddress", addressLocality: profile.city, addressCountry: profile.country || "NL" } : undefined,
      image: images[0]?.url,
    };
  }, [profile, images]);

  usePageMeta({
    title: profile ? `${profile.display_name} — ${profile.city || "Europe"}` : "Profile",
    description: profile
      ? `${profile.display_name}${profile.category ? `, ${profile.category}` : ""} in ${profile.city || "Europe"}. ${profile.bio?.slice(0, 120) || ""}`
      : "Profile on Rubi Girls",
    path: `/perfil/${slug}`,
    image: images[0]?.url,
    type: "profile",
    jsonLd: profileJsonLd,
  });

  if (loading) return <ProfileSkeleton />;

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
      <Link
        to="/buscar"
        className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-3 transition-colors group"
      >
        <ArrowLeft className="h-3 w-3 transition-transform group-hover:-translate-x-0.5" /> {t("profile.back")}
      </Link>

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
