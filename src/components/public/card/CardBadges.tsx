import { Zap } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";

const NEW_PROFILE_DAYS = 7;

export function isNewProfile(createdAt: string | null): boolean {
  if (!createdAt) return false;
  const diff = Date.now() - new Date(createdAt).getTime();
  return diff < NEW_PROFILE_DAYS * 24 * 60 * 60 * 1000;
}

interface CardBadgesProps {
  isNew: boolean;
  category: string | null;
}

export function CardBadges({ isNew, category }: CardBadgesProps) {
  const { t } = useLanguage();

  if (!isNew && !category) return null;

  return (
    <div className="absolute top-3 right-3 flex flex-col items-end gap-1.5 z-10">
      {isNew && (
        <div className="flex items-center gap-1 rounded-full bg-[hsl(var(--success)_/_0.85)] backdrop-blur-md px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-success-foreground border border-[hsl(var(--success)_/_0.3)] shadow-sm">
          <Zap className="h-2.5 w-2.5" />
          {t("common.new") || "New"}
        </div>
      )}
      {category && (
        <div className="rounded-full bg-background/60 backdrop-blur-md px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-foreground/90 border border-border/20">
          {category}
        </div>
      )}
    </div>
  );
}
