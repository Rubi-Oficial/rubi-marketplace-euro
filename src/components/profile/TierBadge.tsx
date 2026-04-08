import { Sparkles } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";

interface TierBadgeProps {
  highlight_tier: string;
  highlight_expires_at: string | null;
  is_featured: boolean;
}

/**
 * Renders the appropriate tier badge (Exclusive > Premium > Featured).
 */
export function TierBadge({ highlight_tier, highlight_expires_at, is_featured }: TierBadgeProps) {
  const { t } = useLanguage();

  const isActive = highlight_expires_at && new Date(highlight_expires_at) > new Date();

  if (highlight_tier === "exclusive" && isActive) {
    return (
      <div className="absolute top-3 left-3 flex items-center gap-1 rounded-full bg-gradient-to-r from-[#D8BE8A] to-[#B08D57] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-[#1A1222] shadow-md">
        <Sparkles className="h-2.5 w-2.5" />
        Exclusive
      </div>
    );
  }

  if (highlight_tier === "premium" && isActive) {
    return (
      <div className="absolute top-3 left-3 flex items-center gap-1 rounded-full bg-gradient-to-r from-[#8C5BAA] to-[#5B2C7D] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-[#F6F1EA] shadow-md">
        <Sparkles className="h-2.5 w-2.5" />
        Premium
      </div>
    );
  }

  if (is_featured) {
    return (
      <div className="absolute top-3 left-3 flex items-center gap-1 rounded-full gold-gradient px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-[#1A1222] shadow-md">
        <Sparkles className="h-2.5 w-2.5" />
        {t("common.featured")}
      </div>
    );
  }

  return null;
}
