import { forwardRef, useState, useCallback, memo } from "react";
import { useNavigate } from "react-router-dom";
import { MapPin, Euro, Heart, ArrowRight, MessageCircle } from "lucide-react";
import { useFavorites } from "@/hooks/useFavorites";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/i18n/LanguageContext";
import { ImageCarousel } from "@/components/profile/ImageCarousel";
import { TierBadge } from "@/components/profile/TierBadge";
import type { EligibleProfile } from "@/lib/profileApi";

// Re-export for backward compatibility
export type { EligibleProfile } from "@/lib/profileApi";
export { fetchEligibleProfiles, fetchFilterOptions, fetchServices } from "@/lib/profileApi";

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

const ProfileCardInner = forwardRef<HTMLDivElement, { profile: EligibleProfile; index?: number }>(
  ({ profile, index = 0 }, ref) => {
    const navigate = useNavigate();
    const { t, lang } = useLanguage();
    const urls = profile.image_urls;
    const [hovered, setHovered] = useState(false);
    const { isFavorited, toggleFavorite, isToggling } = useFavorites();
    const favorited = isFavorited(profile.id);
    const [whatsappLoading, setWhatsappLoading] = useState(false);

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

    const tierClasses = getTierStyles(
      profile.highlight_tier,
      profile.highlight_expires_at,
      profile.is_featured
    );

    return (
      <div
        ref={ref}
        className={cn(
          "group relative flex flex-col overflow-hidden rounded-2xl bg-card border cursor-pointer",
          "transition-all duration-300 ease-out animate-fade-in",
          "hover:shadow-[0_20px_60px_-12px_hsl(274_36%_4%_/_0.6),0_0_20px_hsl(var(--primary)_/_0.06)]",
          "hover:-translate-y-1 hover:border-[hsl(var(--primary)_/_0.2)]",
          "focus-within:ring-2 focus-within:ring-primary/40 focus-within:ring-offset-2 focus-within:ring-offset-background",
          "active:scale-[0.98] active:transition-transform active:duration-100",
          tierClasses
        )}
        style={{ animationDelay: `${Math.min(index * 60, 480)}ms`, animationFillMode: "backwards" }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onClick={handleNavigate}
      >
        {/* Image section with overlay gradient */}
        <div className="relative h-[300px] sm:h-[360px] overflow-hidden bg-muted">
          <ImageCarousel urls={urls} displayName={profile.display_name} hovered={hovered} />

          {/* Bottom gradient for text readability */}
          <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-card/80 via-card/20 to-transparent pointer-events-none" />

          <TierBadge
            highlight_tier={profile.highlight_tier}
            highlight_expires_at={profile.highlight_expires_at}
            is_featured={profile.is_featured}
          />

          {profile.category && (
            <div className="absolute top-3 right-3 rounded-full bg-background/60 backdrop-blur-md px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-foreground/90 border border-border/20">
              {profile.category}
            </div>
          )}

          {/* Favorite button overlay - top-left for easier mobile reach */}
          <button
            className={cn(
              "absolute top-3 left-3 flex h-9 w-9 items-center justify-center rounded-full backdrop-blur-md transition-all duration-200",
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
        <div className="flex flex-1 flex-col px-4 sm:px-5 py-4 space-y-2.5">
          <div className="flex items-baseline gap-2">
            <h3 className="font-display text-xl font-bold text-foreground leading-tight truncate">
              {profile.display_name}
            </h3>
            {profile.age && (
              <span className="text-lg font-bold text-primary shrink-0">{profile.age}</span>
            )}
          </div>

          <div className="flex min-h-[1.25rem] items-center gap-1.5 text-sm text-muted-foreground">
            {profile.city && (
              <>
                <MapPin className="h-3.5 w-3.5 text-primary/60 shrink-0" />
                <span className="truncate">{profile.city}</span>
              </>
            )}
          </div>

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

          {/* Action buttons */}
          <div className="flex items-center gap-2 pt-1 mt-auto" onClick={(e) => e.stopPropagation()}>
            <Button
              size="sm"
              className="flex-1 gap-1.5 rounded-xl text-sm font-semibold h-10 transition-smooth"
              onClick={handleNavigate}
              aria-label={`${t("common.view_profile")} - ${profile.display_name}`}
            >
              {t("common.view_profile")}
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
            </Button>

            {profile.has_whatsapp && (
              <Button
                size="sm"
                className="shrink-0 rounded-xl px-3 h-10 bg-success hover:bg-success/90 text-success-foreground border-0 transition-smooth hover:shadow-[0_4px_12px_hsl(var(--success)_/_0.3)]"
                disabled={whatsappLoading}
                onClick={handleWhatsApp}
                aria-label={`WhatsApp — ${profile.display_name}`}
              >
                {whatsappLoading ? (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-success-foreground border-t-transparent" />
                ) : (
                  <MessageCircle className="h-4 w-4" />
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }
);
ProfileCardInner.displayName = "ProfileCardInner";

// Memoize to prevent re-renders when parent re-renders (e.g. infinite scroll adding new items)
export const ProfileCard = memo(ProfileCardInner, (prev, next) => {
  return prev.profile.id === next.profile.id
    && prev.profile.image_urls === next.profile.image_urls
    && prev.profile.highlight_tier === next.profile.highlight_tier
    && prev.index === next.index;
});
