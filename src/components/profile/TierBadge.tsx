import { Sparkles } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";

interface TierBadgeProps {
  highlight_tier: string;
  highlight_expires_at: string | null;
  is_featured: boolean;
}

/**
 * Renders the appropriate tier badge (Exclusive > Premium > Featured).
 * Positioned at top-center of the card image.
 */
export function TierBadge({ highlight_tier, highlight_expires_at, is_featured }: TierBadgeProps) {
  const { t } = useLanguage();

  const isActive = highlight_expires_at && new Date(highlight_expires_at) > new Date();

  if (highlight_tier === "exclusive" && isActive) {
    return (
      <div className="absolute top-3 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1 rounded-full border border-[hsl(41_49%_69%_/_0.3)] bg-gradient-to-r from-[hsl(41_49%_69%_/_0.22)] to-[hsl(278_31%_51%_/_0.28)] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-foreground shadow-[0_8px_20px_hsl(274_36%_5%_/_0.4)] backdrop-blur-sm">
        <Sparkles className="h-2.5 w-2.5" />
        Exclusive
      </div>
    );
  }

  if (highlight_tier === "premium" && isActive) {
    return (
      <div className="absolute top-3 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1 rounded-full border border-[hsl(278_31%_51%_/_0.38)] bg-[hsl(278_31%_51%_/_0.26)] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-foreground shadow-[0_8px_18px_hsl(274_36%_5%_/_0.4)] backdrop-blur-sm">
        <Sparkles className="h-2.5 w-2.5" />
        Premium
      </div>
    );
  }

  if (is_featured) {
    return (
      <div className="absolute top-3 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1 rounded-full border border-[hsl(41_49%_69%_/_0.3)] bg-[hsl(41_49%_69%_/_0.2)] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-primary shadow-[0_8px_18px_hsl(274_36%_5%_/_0.4)] backdrop-blur-sm">
        <Sparkles className="h-2.5 w-2.5" />
        {t("common.featured")}
      </div>
    );
  }

  return null;
}
