import { useState } from "react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MessageCircle, Send, MapPin, Globe, Sparkles, ChevronDown, ChevronUp } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
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

  const longBio = Boolean(profile.bio && profile.bio.length > 200);
  const displayBio = longBio && !expandedBio ? `${profile.bio?.slice(0, 200)}...` : profile.bio;

  return (
    <div className="space-y-3 animate-fade-in" style={{ animationDelay: "0.1s" }}>
      <div className="rounded-2xl border border-border/20 bg-card/70 p-4 shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-display text-2xl font-bold leading-tight text-foreground">{profile.display_name}</h1>
              {profile.is_featured && (
                <span className="inline-flex items-center gap-1 rounded-full gold-gradient px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary-foreground shadow-md">
                  <Sparkles className="h-2.5 w-2.5" /> {t("common.featured")}
                </span>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
              {profile.age && <span>{profile.age} {t("common.years")}</span>}
              {profile.city && (
                <span className="inline-flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5 text-primary/70" /> {profile.city}
                </span>
              )}
            </div>
          </div>

          {profile.pricing_from && (
            <div className="rounded-xl bg-primary/10 px-3 py-1.5 text-xs font-semibold leading-tight text-primary">
              {t("common.from_price", { price: Number(profile.pricing_from).toLocaleString("de-DE") })}
            </div>
          )}
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          {profile.category && (
            <Badge variant="secondary" className="border border-border/30 bg-secondary/80">
              {profile.category}
            </Badge>
          )}
          {profile.languages && profile.languages.length > 0 && (
            <Badge variant="outline" className="border-border/40 bg-background/70">
              <Globe className="mr-1 h-3 w-3 text-primary/70" /> {profile.languages.join(", ")}
            </Badge>
          )}
        </div>

        {services.length > 0 && (
          <div className="mt-4">
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Serviços mais buscados</p>
            <ProfileServiceChips services={services} limit={maxServices} />
          </div>
        )}

        {profile.bio && (
          <div className="mt-4 rounded-xl border border-border/25 bg-background/60 p-3">
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">{displayBio}</p>
            {longBio && (
              <Button
                variant="ghost"
                className="mt-1 h-8 px-2 text-xs"
                onClick={() => setExpandedBio((prev) => !prev)}
                aria-expanded={expandedBio}
              >
                {expandedBio ? <ChevronUp className="mr-1 h-3.5 w-3.5" /> : <ChevronDown className="mr-1 h-3.5 w-3.5" />}
                {expandedBio ? "Mostrar menos" : "Ler bio completa"}
              </Button>
            )}
          </div>
        )}
      </div>

      {showContactButtons && (
        <div className="space-y-2 pt-1">
          {profile.whatsapp && (
            <Button className="h-12 w-full bg-green-600 text-base font-semibold hover:bg-green-700" asChild>
              <a
                href={`https://wa.me/${profile.whatsapp.replace(/\D/g, "")}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={onWhatsappClick}
                aria-label="Entrar em contato por WhatsApp"
              >
                <MessageCircle className="mr-2 h-5 w-5" /> Falar no WhatsApp
              </a>
            </Button>
          )}
          {profile.telegram && (
            <Button variant="outline" className="h-12 w-full border-border/40 text-base hover:border-primary/30" asChild>
              <a
                href={`https://t.me/${profile.telegram.replace("@", "")}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={onTelegramClick}
                aria-label="Entrar em contato por Telegram"
              >
                <Send className="mr-2 h-5 w-5" /> Conversar no Telegram
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
