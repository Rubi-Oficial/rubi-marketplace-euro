import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MessageCircle, Send, MapPin, Globe, Sparkles } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import { supabase } from "@/lib/supabase";

interface ProfileInfoProps {
  profile: {
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
    is_featured: boolean;
  };
  services: { name: string; slug: string }[];
}

export function ProfileInfo({ profile, services }: ProfileInfoProps) {
  const { t } = useLanguage();

  const trackClick = (source: string) => {
    supabase.from("leads").insert({ profile_id: profile.id, source });
  };

  return (
    <div className="space-y-5 animate-fade-in" style={{ animationDelay: "0.1s" }}>
      {/* Name & Featured */}
      <div>
        <div className="flex items-center gap-2.5">
          <h1 className="font-display text-2xl font-bold text-foreground lg:text-3xl">
            {profile.display_name}
          </h1>
          {profile.is_featured && (
            <span className="inline-flex items-center gap-1 rounded-full gold-gradient px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary-foreground shadow-lg">
              <Sparkles className="h-2.5 w-2.5" /> {t("common.featured")}
            </span>
          )}
        </div>
        {profile.age && (
          <p className="mt-1 text-muted-foreground">{profile.age} {t("common.years")}</p>
        )}
      </div>

      {/* Tags */}
      <div className="flex flex-wrap gap-2">
        {profile.category && (
          <Badge variant="secondary" className="bg-secondary/80 border border-border/30">
            {profile.category}
          </Badge>
        )}
        {profile.city && (
          <Badge variant="outline" className="border-border/40">
            <MapPin className="mr-1 h-3 w-3 text-primary/70" /> {profile.city}
          </Badge>
        )}
      </div>

      {/* Price */}
      {profile.pricing_from && (
        <div className="rounded-lg bg-primary/5 border border-primary/10 px-4 py-3 inline-flex items-center gap-2">
          <span className="font-display text-xl font-bold text-primary">
            {t("common.from_price", { price: Number(profile.pricing_from).toLocaleString("de-DE") })}
          </span>
        </div>
      )}

      {/* Services */}
      {services.length > 0 && (
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
            {t("common.services")}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {services.map((s) => (
              <Link
                key={s.slug}
                to={`/buscar?service=${s.slug}`}
                className="rounded-full bg-card border border-border/40 px-3 py-1.5 text-xs text-muted-foreground hover:border-primary/40 hover:text-foreground hover:shadow-[0_0_8px_hsl(350_65%_52%_/_0.1)] transition-all duration-300"
              >
                {s.name}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Languages */}
      {profile.languages && profile.languages.length > 0 && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Globe className="h-4 w-4 text-primary/50" />
          {profile.languages.join(", ")}
        </div>
      )}

      {/* Bio */}
      {profile.bio && (
        <div className="rounded-xl border border-border/30 bg-card/50 backdrop-blur-sm p-4">
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">
            {profile.bio}
          </p>
        </div>
      )}

      {/* Contact */}
      <div className="space-y-2.5 pt-2">
        {profile.whatsapp && (
          <Button className="w-full h-12 text-base font-semibold bg-green-600 hover:bg-green-700" asChild>
            <a
              href={`https://wa.me/${profile.whatsapp.replace(/\D/g, "")}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackClick("whatsapp_profile")}
            >
              <MessageCircle className="mr-2 h-5 w-5" /> WhatsApp
            </a>
          </Button>
        )}
        {profile.telegram && (
          <Button variant="outline" className="w-full h-12 text-base border-border/40 hover:border-primary/30" asChild>
            <a
              href={`https://t.me/${profile.telegram.replace("@", "")}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackClick("telegram_profile")}
            >
              <Send className="mr-2 h-5 w-5" /> Telegram
            </a>
          </Button>
        )}
      </div>
    </div>
  );
}
