import { useParams, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MessageCircle, Send, MapPin, Globe, ArrowLeft, Sparkles } from "lucide-react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

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
  const [hasActiveSub, setHasActiveSub] = useState(false);

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

      setHasActiveSub(true);
      setProfile(eligible as PublicProfile);

      // Fetch approved images
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

      // Fetch services for this profile
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

      // Record lead
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
    return () => { document.title = "Rubi Girls"; };
  }, [profile]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!profile || !hasActiveSub) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <h1 className="font-display text-2xl font-bold text-foreground">Profile unavailable</h1>
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
      {/* Back link */}
      <Link to="/buscar" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mb-5 transition-colors">
        <ArrowLeft className="h-3 w-3" /> Back to explore
      </Link>

      <div className="grid gap-8 lg:grid-cols-5">
        {/* Photos */}
        <div className="lg:col-span-3">
          {images.length > 0 ? (
            <Carousel className="w-full">
              <CarouselContent>
                {images.map((img) => (
                  <CarouselItem key={img.id}>
                    <div className="aspect-[3/4] overflow-hidden rounded-xl bg-muted">
                      <img src={img.url} alt={profile.display_name}
                        className="h-full w-full object-cover" loading="lazy" />
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              {images.length > 1 && (
                <>
                  <CarouselPrevious className="left-3" />
                  <CarouselNext className="right-3" />
                </>
              )}
            </Carousel>
          ) : (
            <div className="flex aspect-[3/4] items-center justify-center rounded-xl border border-border/30 bg-card">
              <p className="text-sm text-muted-foreground">No photos</p>
            </div>
          )}

          {/* Thumbnails */}
          {images.length > 1 && (
            <div className="mt-3 flex gap-2 overflow-x-auto pb-2">
              {images.map((img) => (
                <div key={img.id} className="h-14 w-14 flex-shrink-0 overflow-hidden rounded-lg border border-border/30">
                  <img src={img.url} alt="" className="h-full w-full object-cover" loading="lazy" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="lg:col-span-2 space-y-5">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-display text-2xl font-bold text-foreground">
                {profile.display_name}
              </h1>
              {profile.is_featured && (
                <span className="inline-flex items-center gap-1 rounded-full gold-gradient px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary-foreground">
                  <Sparkles className="h-2.5 w-2.5" /> Featured
                </span>
              )}
            </div>
            {profile.age && (
              <p className="mt-0.5 text-muted-foreground">{profile.age} years</p>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            {profile.category && <Badge variant="secondary">{profile.category}</Badge>}
            {profile.city && (
              <Badge variant="outline" className="border-border/40">
                <MapPin className="mr-1 h-3 w-3 text-primary/70" /> {profile.city}
              </Badge>
            )}
          </div>

          {profile.pricing_from && (
            <div className="flex items-center gap-2 text-foreground">
              <span className="font-display text-lg font-semibold text-primary">
                From €{Number(profile.pricing_from).toLocaleString("de-DE")}
              </span>
            </div>
          )}

          {/* Services */}
          {services.length > 0 && (
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Services</p>
              <div className="flex flex-wrap gap-1.5">
                {services.map((s) => (
                  <Link
                    key={s.slug}
                    to={`/buscar?service=${s.slug}`}
                    className="rounded-full bg-card border border-border/40 px-2.5 py-1 text-xs text-muted-foreground hover:border-primary/30 hover:text-foreground transition-colors"
                  >
                    {s.name}
                  </Link>
                ))}
              </div>
            </div>
          )}

          {profile.languages && profile.languages.length > 0 && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Globe className="h-4 w-4" />
              {profile.languages.join(", ")}
            </div>
          )}

          {profile.bio && (
            <div className="rounded-xl border border-border/30 bg-card/50 p-4">
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
                {profile.bio}
              </p>
            </div>
          )}

          {/* Contact */}
          <div className="space-y-2.5">
            {profile.whatsapp && (
              <Button className="w-full" asChild>
                <a href={`https://wa.me/${profile.whatsapp.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer">
                  <MessageCircle className="mr-2 h-4 w-4" /> WhatsApp
                </a>
              </Button>
            )}
            {profile.telegram && (
              <Button variant="outline" className="w-full" asChild>
                <a href={`https://t.me/${profile.telegram.replace("@", "")}`} target="_blank" rel="noopener noreferrer">
                  <Send className="mr-2 h-4 w-4" /> Telegram
                </a>
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* JSON-LD */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{
        __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Person",
          name: profile.display_name,
          address: profile.city ? { "@type": "PostalAddress", addressLocality: profile.city, addressCountry: profile.country || "NL" } : undefined,
          image: images[0]?.url,
        }),
      }} />
    </div>
  );
}
