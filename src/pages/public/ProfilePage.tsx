import { useParams, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProfileSkeleton } from "@/components/profile/ProfileSkeleton";
import { ProfileGallery } from "@/components/profile/ProfileGallery";
import { ProfileInfo } from "@/components/profile/ProfileInfo";

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

interface ProfileImage {
  id: string;
  storage_path: string;
  sort_order: number;
  url: string;
}

export default function ProfilePage() {
  const { slug } = useParams();
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [images, setImages] = useState<ProfileImage[]>([]);
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

      if (!eligible) {
        setLoading(false);
        return;
      }

      setProfile(eligible as PublicProfile);

      const { data: imgData } = await supabase
        .from("profile_images")
        .select("id, storage_path, sort_order")
        .eq("profile_id", eligible.id)
        .eq("moderation_status", "approved")
        .order("sort_order");

      if (imgData) {
        setImages(
          imgData.map((img) => ({
            ...img,
            url: supabase.storage
              .from("profile-images")
              .getPublicUrl(img.storage_path).data.publicUrl,
          }))
        );
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

      await supabase.from("leads").insert({
        profile_id: eligible.id,
        source: "profile_view",
      });

      setLoading(false);
    };

    load();
  }, [slug]);

  useEffect(() => {
    if (profile) {
      document.title = `${profile.display_name} — ${profile.city || "Europe"} | Rubi Girls`;
      const desc = document.querySelector('meta[name="description"]');
      const text = `${profile.display_name}${profile.category ? `, ${profile.category}` : ""} in ${profile.city || "Europe"}. ${profile.bio?.slice(0, 120) || ""}`;
      if (desc) desc.setAttribute("content", text);
    }
    return () => {
      document.title = "Rubi Girls";
    };
  }, [profile]);

  if (loading) return <ProfileSkeleton />;

  if (!profile) {
    return (
      <div className="container mx-auto px-4 py-20 text-center animate-fade-in">
        <h1 className="font-display text-2xl font-bold text-foreground">
          Profile unavailable
        </h1>
        <p className="mt-2 text-muted-foreground">
          This profile is not available at the moment.
        </p>
        <Button variant="ghost" className="mt-6" asChild>
          <Link to="/buscar">
            <ArrowLeft className="mr-1.5 h-4 w-4" /> Browse profiles
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 animate-fade-in">
      <Link
        to="/buscar"
        className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-5 transition-colors group"
      >
        <ArrowLeft className="h-3 w-3 transition-transform group-hover:-translate-x-0.5" />{" "}
        Back to explore
      </Link>

      <div className="grid gap-8 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <ProfileGallery images={images} name={profile.display_name} />
        </div>

        <div className="lg:col-span-2">
          <ProfileInfo profile={profile} services={services} />
        </div>
      </div>

      {/* JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Person",
            name: profile.display_name,
            address: profile.city
              ? {
                  "@type": "PostalAddress",
                  addressLocality: profile.city,
                  addressCountry: profile.country || "NL",
                }
              : undefined,
            image: images[0]?.url,
          }),
        }}
      />
    </div>
  );
}
