import { useState } from "react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MessageCircle, Send, MapPin, Globe, Sparkles, ChevronDown, ChevronUp } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import { supabase } from "@/lib/supabase";
import { ProfileServiceChips } from "@/components/profile/ProfileServiceChips";

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
  showContactButtons?: boolean;
  maxServices?: number;
  onWhatsappClick?: () => void;
  onTelegramClick?: () => void;
}

export function ProfileInfo({
  profile,
  services,
  showContactButtons = true,
  maxServices = 6,
  onWhatsappClick,
  onTelegramClick,
}: ProfileInfoProps) {
  const { t } = useLanguage();
  const [expandedBio, setExpandedBio] = useState(false);

  const trackClick = (source: string) => {
    supabase.from("leads").insert({ profile_id: profile.id, source });
  };

  const longBio = Boolean(profile.bio && profile.bio.length > 200);
  const displayBio = longBio && !expandedBio ? `${profile.bio?.slice(0, 200)}...` : profile.bio;

  return (
    <div className="space-y-4 animate-fade-in" style={{ animationDelay: "0.1s" }}>
      <div className="rounded-2xl border border-border/30 bg-card/90 p-4 shadow-sm">
        <div className="flex items-start justify-between gap-2.5">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-display text-2xl font-bold text-foreground">{profile.display_name}</h1>
              {profile.is_featured && (
                <span className="inline-flex items-center gap-1 rounded-full gold-gradient px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary-foreground shadow-lg">
                  <Sparkles className="h-2.5 w-2.5" /> {t("common.featured")}
                </span>
              )}
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              {profile.age && <span>{profile.age} {t("common.years")}</span>}
              {profile.city && (
                <span className="inline-flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5 text-primary/70" /> {profile.city}
                </span>
              )}
            </div>
          </div>

          {profile.pricing_from && (
            <div className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              {t("common.from_price", { price: Number(profile.pricing_from).toLocaleString("de-DE") })}
            </div>
          )}
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          {profile.category && (
            <Badge variant="secondary" className="bg-secondary/80 border border-border/30">
              {profile.category}
            </Badge>
          )}
          {profile.languages && profile.languages.length > 0 && (
            <Badge variant="outline" className="border-border/40">
              <Globe className="mr-1 h-3 w-3 text-primary/70" /> {profile.languages.join(", ")}
            </Badge>
          )}
        </div>

        {services.length > 0 && (
          <div className="mt-4">
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{t("common.services")}</p>
            <ProfileServiceChips services={services} limit={maxServices} />
          </div>
        )}

        {profile.bio && (
          <div className="mt-4 rounded-xl border border-border/30 bg-background/70 p-3">
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">{displayBio}</p>
            {longBio && (
              <Button
                variant="ghost"
                className="mt-1 h-8 px-2 text-xs"
                onClick={() => setExpandedBio((prev) => !prev)}
              >
                {expandedBio ? <ChevronUp className="mr-1 h-3.5 w-3.5" /> : <ChevronDown className="mr-1 h-3.5 w-3.5" />}
                {expandedBio ? "Mostrar menos" : "Ler mais"}
              </Button>
            )}
          </div>
        )}
      </div>

      {showContactButtons && (
        <div className="space-y-2.5 pt-1">
          {profile.whatsapp && (
            <Button className="h-12 w-full text-base font-semibold bg-green-600 hover:bg-green-700" asChild>
              <a
                href={`https://wa.me/${profile.whatsapp.replace(/\D/g, "")}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => {
                  trackClick("whatsapp_profile");
                  onWhatsappClick?.();
                }}
                aria-label="Entrar em contato por WhatsApp"
              >
                <MessageCircle className="mr-2 h-5 w-5" /> WhatsApp
              </a>
            </Button>
          )}
          {profile.telegram && (
            <Button variant="outline" className="h-12 w-full text-base border-border/40 hover:border-primary/30" asChild>
              <a
                href={`https://t.me/${profile.telegram.replace("@", "")}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => {
                  trackClick("telegram_profile");
                  onTelegramClick?.();
                }}
                aria-label="Entrar em contato por Telegram"
              >
                <Send className="mr-2 h-5 w-5" /> Telegram
              </a>
            </Button>
          )}
        </div>
      )}

      <div className="flex flex-wrap gap-2 text-xs">
        {profile.category && (
          <Link
            to={`/categoria/${profile.category.toLowerCase().replace(/\s+/g, "-")}`}
            className="rounded-full border border-border/40 px-3 py-1.5 hover:border-primary/40"
          >
            Ver categoria
          </Link>
        )}
        <Link to="/buscar" className="rounded-full border border-border/40 px-3 py-1.5 hover:border-primary/40">
          Explorar mais perfis
        </Link>
      </div>
    </div>
  );
}
