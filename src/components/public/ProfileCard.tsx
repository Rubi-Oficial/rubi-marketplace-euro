import { forwardRef, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
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

export const ProfileCard = forwardRef<HTMLDivElement, { profile: EligibleProfile }>(({ profile }, ref) => {
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

  if (!profile.slug) return null;

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="group relative flex flex-col overflow-hidden rounded-xl bg-card shadow-sm border border-border/40 transition-shadow duration-300 hover:shadow-xl hover:shadow-primary/8 cursor-pointer"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => navigate(`/perfil/${profile.slug}`)}
    >
      {/* Image section */}
      <div className="relative h-[340px] sm:h-[380px] overflow-hidden bg-muted">
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
            onClick={() => navigate(`/perfil/${profile.slug}`)}
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
});
ProfileCard.displayName = "ProfileCard";
