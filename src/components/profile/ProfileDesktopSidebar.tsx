import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, Send, MapPin, Sparkles } from "lucide-react";
import { ProfileServiceChips } from "@/components/profile/ProfileServiceChips";

interface ProfileDesktopSidebarProps {
  profile: {
    display_name: string;
    age: number | null;
    city: string | null;
    city_slug?: string | null;
    category: string | null;
    bio: string | null;
    pricing_from: number | null;
    whatsapp: string | null;
    telegram: string | null;
    is_featured: boolean;
  };
  services: { name: string; slug: string }[];
  onWhatsappClick: () => void;
  onTelegramClick: () => void;
}

export function ProfileDesktopSidebar({
  profile,
  services,
  onWhatsappClick,
  onTelegramClick,
}: ProfileDesktopSidebarProps) {
  const shortBio = profile.bio && profile.bio.length > 180 ? `${profile.bio.slice(0, 180)}...` : profile.bio;

  return (
    <aside className="hidden lg:block">
      <div className="sticky top-20 space-y-4 rounded-2xl border border-border/30 bg-card/85 p-5 shadow-sm backdrop-blur-sm">
        <div className="space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h1 className="font-display text-3xl font-bold text-foreground">{profile.display_name}</h1>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                {profile.age && <span>{profile.age} anos</span>}
                {profile.city && (
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" />
                    {profile.city}
                  </span>
                )}
              </div>
            </div>
            {profile.is_featured && (
              <span className="inline-flex items-center gap-1 rounded-full gold-gradient px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-primary-foreground">
                <Sparkles className="h-3 w-3" /> Destaque
              </span>
            )}
          </div>

          <div className="flex flex-wrap gap-1.5">
            {profile.category && <Badge variant="secondary">{profile.category}</Badge>}
            {profile.pricing_from && (
              <Badge className="bg-primary text-primary-foreground">
                A partir de €{Number(profile.pricing_from).toLocaleString("de-DE")}
              </Badge>
            )}
          </div>

          {shortBio && <p className="text-sm leading-relaxed text-foreground/85">{shortBio}</p>}
        </div>

        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Serviços principais</p>
          <ProfileServiceChips services={services} limit={8} />
        </div>

        <div className="space-y-2.5 border-t border-border/20 pt-4">
          {profile.whatsapp && (
            <Button className="h-11 w-full bg-green-600 font-semibold hover:bg-green-700" asChild>
              <a
                href={`https://wa.me/${profile.whatsapp.replace(/\D/g, "")}`}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Entrar em contato por WhatsApp"
                onClick={onWhatsappClick}
              >
                <MessageCircle className="mr-2 h-4 w-4" /> Chamar no WhatsApp
              </a>
            </Button>
          )}
          {profile.telegram && (
            <Button variant="outline" className="h-11 w-full font-semibold" asChild>
              <a
                href={`https://t.me/${profile.telegram.replace("@", "")}`}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Entrar em contato por Telegram"
                onClick={onTelegramClick}
              >
                <Send className="mr-2 h-4 w-4" /> Falar no Telegram
              </a>
            </Button>
          )}
        </div>

        <div className="flex flex-wrap gap-2 border-t border-border/20 pt-3 text-xs">
          {profile.city_slug && (
            <Link to={`/cidade/${profile.city_slug}`} className="rounded-full border border-border/40 px-2.5 py-1 hover:border-primary/30">
              Ver cidade
            </Link>
          )}
          {profile.category && (
            <Link
              to={`/categoria/${profile.category.toLowerCase().replace(/\s+/g, "-")}`}
              className="rounded-full border border-border/40 px-2.5 py-1 hover:border-primary/30"
            >
              Ver categoria
            </Link>
          )}
          <Link to="/buscar" className="rounded-full border border-border/40 px-2.5 py-1 hover:border-primary/30">
            Explorar serviços
          </Link>
        </div>
      </div>
    </aside>
  );
}
