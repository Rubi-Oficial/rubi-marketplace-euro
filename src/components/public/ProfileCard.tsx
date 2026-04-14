import { forwardRef, useState, useCallback, memo } from "react";
import { useNavigate } from "react-router-dom";
import { MapPin, Euro, Heart, ArrowRight, MessageCircle } from "lucide-react";
import { motion } from "framer-motion";
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
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          duration: 0.4,
          delay: Math.min(index * 0.06, 0.48),
          ease: [0.25, 0.46, 0.45, 0.94],
        }}
        className={cn(
          "group relative flex flex-col overflow-hidden rounded-2xl bg-card shadow-sm border transition-all duration-300 hover:shadow-xl hover:shadow-primary/10 hover:-translate-y-0.5 cursor-pointer focus-within:ring-2 focus-within:ring-primary/40 focus-within:ring-offset-2 focus-within:ring-offset-background",
          tierClasses
        )}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onClick={handleNavigate}
      >
        {/* Image section */}
        <div className="relative h-[300px] sm:h-[360px] overflow-hidden bg-muted">
          <ImageCarousel urls={urls} displayName={profile.display_name} hovered={hovered} />

          <TierBadge
            highlight_tier={profile.highlight_tier}
            highlight_expires_at={profile.highlight_expires_at}
            is_featured={profile.is_featured}
          />

          {profile.category && (
            <div className="absolute top-3 right-3 rounded-full bg-black/50 backdrop-blur-sm px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-white/90">
              {profile.category}
            </div>
          )}
        </div>

        {/* Info sections */}
        <div className="flex flex-1 flex-col px-5 py-4 space-y-3">
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

          <div className={cn("min-h-[5.5rem]", truncatedBio && "rounded-lg bg-surface-light px-3 py-2.5")}>
            {truncatedBio && (
              <p className="text-sm leading-relaxed text-foreground/80 line-clamp-3">
                {truncatedBio}
              </p>
            )}
          </div>

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
              className="flex-1 gap-1.5 rounded-lg text-sm font-semibold"
              onClick={handleNavigate}
              aria-label={`${t("common.view_profile")} - ${profile.display_name}`}
            >
              {t("common.view_profile")}
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>

            {profile.has_whatsapp && (
              <Button
                size="sm"
                className="shrink-0 rounded-lg px-3 bg-success hover:bg-success/90 text-success-foreground border-0"
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

            <Button
              size="sm"
              variant="outline"
              className={`shrink-0 rounded-lg px-3 transition-colors duration-200 ${
                favorited
                  ? "bg-primary/10 border-primary/30 text-primary"
                  : "bg-surface-light border-border/60 text-muted-foreground hover:text-primary hover:border-primary/30"
              }`}
              disabled={isToggling}
              onClick={() => toggleFavorite(profile.id)}
              aria-label={favorited ? "Remover dos favoritos" : "Adicionar aos favoritos"}
            >
              <Heart className={`h-4 w-4 ${favorited ? "fill-primary" : ""}`} />
            </Button>
          </div>
        </div>
      </motion.div>
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
