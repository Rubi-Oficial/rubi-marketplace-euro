import { forwardRef, useState, useCallback, memo } from "react";
import { useNavigate } from "react-router-dom";
import { MapPin, Euro, Heart, ShieldCheck } from "lucide-react";
import { useFavorites } from "@/hooks/useFavorites";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/i18n/LanguageContext";
import { ImageCarousel } from "@/components/profile/ImageCarousel";
import { TierBadge } from "@/components/profile/TierBadge";
import { CardBadges, isNewProfile } from "@/components/public/card/CardBadges";
import { CardMetaBadges } from "@/components/public/card/CardMetaBadges";
import { CardActions } from "@/components/public/card/CardActions";
import type { EligibleProfile } from "@/lib/profileApi";

// Import directly from "@/lib/profileApi"

const BIO_MAX_LENGTH = 150;

/** Returns tier-specific border/glow classes for subtle visual hierarchy */
function getTierStyles(tier: string | null, expiresAt: string | null, isFeatured: boolean) {
  const isActive = expiresAt && new Date(expiresAt) > new Date();

  if (tier === "exclusive" && isActive) {
    return "border-[hsl(41_49%_69%_/_0.35)] shadow-[0_0_20px_hsl(41_49%_69%_/_0.08),inset_0_0_0_1px_hsl(41_49%_69%_/_0.06)] animate-tier-pulse-gold";
  }
  if (tier === "premium" && isActive) {
    return "border-[hsl(278_31%_51%_/_0.35)] shadow-[0_0_18px_hsl(278_31%_51%_/_0.08),inset_0_0_0_1px_hsl(278_31%_51%_/_0.06)] animate-tier-pulse-purple";
  }
  if (isFeatured) {
    return "border-[hsl(41_49%_69%_/_0.22)]";
  }
  return "border-border/30";
}

const ProfileCardInner = forwardRef<HTMLDivElement, { profile: EligibleProfile }>(
  ({ profile }, ref) => {
    const navigate = useNavigate();
    const { t, lang } = useLanguage();
    const urls = profile.image_urls;
    const [hovered, setHovered] = useState(false);
    const { isFavorited, toggleFavorite, isToggling } = useFavorites();
    const favorited = isFavorited(profile.id);
    const [whatsappLoading, setWhatsappLoading] = useState(false);

    const isNew = isNewProfile(profile.created_at);

    const truncatedBio = profile.bio
      ? profile.bio.length > BIO_MAX_LENGTH
        ? profile.bio.slice(0, BIO_MAX_LENGTH).trimEnd() + "…"
        : profile.bio
      : null;

    const handleWhatsApp = useCallback(
      async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (whatsappLoading) return;
        setWhatsappLoading(true);
        try {
          const { data: contactData } = await supabase.rpc("get_profile_contact", { p_profile_id: profile.id });
          const contact = contactData as { whatsapp: string | null; telegram: string | null } | null;
          if (contact?.whatsapp) {
            supabase.from("leads").insert({ profile_id: profile.id, source: "whatsapp_card" });
            window.open(`https://wa.me/${contact.whatsapp.replace(/\D/g, "")}`, "_blank", "noopener,noreferrer");
          } else {
            navigate(`/perfil/${profile.slug}`);
          }
        } catch {
          navigate(`/perfil/${profile.slug}`);
        } finally {
          setWhatsappLoading(false);
        }
      },
      [profile.id, profile.slug, whatsappLoading, navigate]
    );

    const handleNavigate = useCallback(() => {
      navigate(`/perfil/${profile.slug}`);
    }, [navigate, profile.slug]);

    if (!profile.slug) return null;

    const tierClasses = getTierStyles(profile.highlight_tier, profile.highlight_expires_at, profile.is_featured);

    return (
      <div
        ref={ref}
        className={cn(
          "group relative flex flex-col overflow-hidden rounded-2xl bg-card border cursor-pointer card-hover-lift",
          "hover:shadow-[0_24px_64px_-16px_hsl(274_36%_4%_/_0.65),0_0_24px_hsl(var(--primary)_/_0.08)]",
          "hover:border-[hsl(var(--primary)_/_0.25)]",
          "focus-within:ring-2 focus-within:ring-primary/40 focus-within:ring-offset-2 focus-within:ring-offset-background",
          tierClasses
        )}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onClick={handleNavigate}
        role="article"
        aria-label={`${profile.display_name}${profile.age ? `, ${profile.age}` : ""}${profile.city ? ` — ${profile.city}` : ""}`}
      >
        {/* Image section */}
        <div className="relative h-[420px] sm:h-[380px] overflow-hidden bg-muted">
          <ImageCarousel urls={urls} displayName={profile.display_name} hovered={hovered} />
          <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-card via-card/40 to-transparent pointer-events-none" />

          <TierBadge
            highlight_tier={profile.highlight_tier}
            highlight_expires_at={profile.highlight_expires_at}
            is_featured={profile.is_featured}
          />

          <CardBadges isNew={isNew} category={profile.category} />

          {/* Favorite button */}
          <button
            className={cn(
              "absolute top-3 left-3 z-10 flex h-9 w-9 items-center justify-center rounded-full backdrop-blur-md transition-all duration-200",
              "focus-visible:ring-2 focus-visible:ring-primary",
              favorited
                ? "bg-primary/20 border border-primary/40 text-primary"
                : "bg-background/40 border border-border/20 text-foreground/70 hover:bg-background/60 hover:text-primary"
            )}
            disabled={isToggling}
            onClick={(e) => { e.stopPropagation(); toggleFavorite(profile.id); }}
            aria-label={favorited ? "Remover dos favoritos" : "Adicionar aos favoritos"}
          >
            <Heart className={cn("h-4 w-4 transition-transform", favorited ? "fill-primary scale-110" : "group-hover:scale-110")} />
          </button>
        </div>

        {/* Info sections */}
        <div className="flex flex-1 flex-col px-4 sm:px-5 py-4 sm:py-5 space-y-3">
          <div className="flex items-baseline gap-2">
            <h3 className="font-display text-xl font-bold text-foreground leading-tight truncate">
              {profile.display_name}
            </h3>
            {profile.age && (
              <span className="text-lg font-bold text-primary shrink-0">{profile.age}</span>
            )}
            <ShieldCheck className="h-4 w-4 text-primary/70 shrink-0" aria-label={t("common.verified") || "Verified"} />
          </div>

          <div className="flex min-h-[1.25rem] items-center gap-1.5 text-sm text-muted-foreground">
            {profile.city && (
              <>
                <MapPin className="h-3.5 w-3.5 text-primary/60 shrink-0" />
                <span className="truncate">{profile.city}</span>
              </>
            )}
          </div>

          <CardMetaBadges languages={profile.languages} serviceCount={profile.service_count} />

          {truncatedBio && (
            <div className="rounded-xl bg-[hsl(var(--surface-light)_/_0.6)] backdrop-blur-sm px-3.5 py-2.5 border border-border/10">
              <p className="text-sm leading-relaxed text-foreground/75 line-clamp-3">
                {truncatedBio}
              </p>
            </div>
          )}
          {!truncatedBio && <div className="min-h-[4rem]" />}

          <div className="flex min-h-[1.5rem] items-center gap-1.5 text-base font-semibold text-primary">
            {profile.pricing_from != null && profile.pricing_from > 0 && (
              <>
                <Euro className="h-4 w-4" />
                <span>{t("common.from_price", { price: Number(profile.pricing_from).toLocaleString(lang) })}</span>
              </>
            )}
          </div>

          <CardActions
            displayName={profile.display_name}
            hasWhatsapp={profile.has_whatsapp}
            whatsappLoading={whatsappLoading}
            onNavigate={handleNavigate}
            onWhatsApp={handleWhatsApp}
          />
        </div>
      </div>
    );
  }
);
ProfileCardInner.displayName = "ProfileCardInner";

export const ProfileCard = memo(ProfileCardInner, (prev, next) => {
  return prev.profile.id === next.profile.id
    && prev.profile.image_urls === next.profile.image_urls
    && prev.profile.highlight_tier === next.profile.highlight_tier;
});
