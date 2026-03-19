import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MessageCircle, Send, MapPin, Globe, DollarSign, Calendar } from "lucide-react";
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
  country: string | null;
  category: string | null;
  bio: string | null;
  languages: string[] | null;
  pricing_from: number | null;
  whatsapp: string | null;
  telegram: string | null;
  slug: string | null;
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
  const [loading, setLoading] = useState(true);
  const [hasActiveSub, setHasActiveSub] = useState(false);

  useEffect(() => {
    if (!slug) return;

    const load = async () => {
      // Fetch from centralized eligible view (approved + active subscription)
      const { data: rawEligible } = await supabase
        .from("eligible_profiles" as any)
        .select("*")
        .eq("slug", slug)
        .maybeSingle();

      const eligible = rawEligible as any;

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

      // Record lead
      await supabase.from("leads").insert({
        profile_id: eligible.id,
        source: "profile_view",
      });

      setLoading(false);
    };

    load();
  }, [slug]);

  // SEO meta
  useEffect(() => {
    if (profile) {
      document.title = `${profile.display_name} — ${profile.city || "Brasil"} | Acompanhante`;
      const desc = document.querySelector('meta[name="description"]');
      const text = `${profile.display_name}, ${profile.category || "acompanhante"} em ${profile.city || "Brasil"}. ${profile.bio?.slice(0, 120) || ""}`;
      if (desc) desc.setAttribute("content", text);
    }
    return () => { document.title = "AURA"; };
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
        <h1 className="font-display text-2xl font-bold text-foreground">Perfil indisponível</h1>
        <p className="mt-2 text-muted-foreground">
          Este perfil não está disponível no momento.
        </p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 animate-fade-in">
      <div className="grid gap-8 lg:grid-cols-5">
        {/* Photos */}
        <div className="lg:col-span-3">
          {images.length > 0 ? (
            <Carousel className="w-full">
              <CarouselContent>
                {images.map((img) => (
                  <CarouselItem key={img.id}>
                    <div className="aspect-[3/4] overflow-hidden rounded-lg">
                      <img src={img.url} alt={`Foto de ${profile.display_name}`}
                        className="h-full w-full object-cover" loading="lazy" />
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              {images.length > 1 && (
                <>
                  <CarouselPrevious className="left-2" />
                  <CarouselNext className="right-2" />
                </>
              )}
            </Carousel>
          ) : (
            <div className="flex aspect-[3/4] items-center justify-center rounded-lg border border-border bg-card">
              <p className="text-muted-foreground">Sem fotos</p>
            </div>
          )}

          {/* Thumbnails */}
          {images.length > 1 && (
            <div className="mt-4 flex gap-2 overflow-x-auto pb-2">
              {images.map((img) => (
                <div key={img.id} className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-md border border-border">
                  <img src={img.url} alt="" className="h-full w-full object-cover" loading="lazy" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="lg:col-span-2 space-y-6">
          <div>
            <h1 className="font-display text-3xl font-bold text-foreground">
              {profile.display_name}
            </h1>
            {profile.age && (
              <p className="mt-1 text-lg text-muted-foreground">{profile.age} anos</p>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            {profile.category && <Badge variant="secondary">{profile.category}</Badge>}
            {profile.city && (
              <Badge variant="outline">
                <MapPin className="mr-1 h-3 w-3" /> {profile.city}
              </Badge>
            )}
          </div>

          {profile.pricing_from && (
            <div className="flex items-center gap-2 text-foreground">
              <DollarSign className="h-4 w-4 text-primary" />
              <span className="font-display text-lg font-semibold">
                From €{Number(profile.pricing_from).toLocaleString("de-DE")}
              </span>
            </div>
          )}

          {profile.languages && profile.languages.length > 0 && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Globe className="h-4 w-4" />
              {profile.languages.join(", ")}
            </div>
          )}

          {profile.bio && (
            <div className="rounded-lg border border-border bg-card p-4">
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
                {profile.bio}
              </p>
            </div>
          )}

          {/* Contact */}
          <div className="space-y-3">
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
          address: profile.city ? { "@type": "PostalAddress", addressLocality: profile.city, addressCountry: profile.country || "BR" } : undefined,
          image: images[0]?.url,
        }),
      }} />
    </div>
  );
}
