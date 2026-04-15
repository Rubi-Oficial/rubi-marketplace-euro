import { Globe } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";

const LANG_FLAGS: Record<string, string> = {
  pt: "🇧🇷", en: "🇬🇧", es: "🇪🇸", fr: "🇫🇷", de: "🇩🇪", it: "🇮🇹", ru: "🇷🇺", zh: "🇨🇳", ja: "🇯🇵", ko: "🇰🇷", ar: "🇸🇦", nl: "🇳🇱",
};

interface CardMetaBadgesProps {
  languages: string[] | null;
  serviceCount: number;
}

export function CardMetaBadges({ languages, serviceCount }: CardMetaBadgesProps) {
  const { t } = useLanguage();

  if (!languages?.length && serviceCount <= 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {languages && languages.length > 0 && (
        <div className="flex items-center gap-1 rounded-full bg-accent/30 px-2 py-0.5 text-[10px] text-muted-foreground border border-border/15">
          <Globe className="h-2.5 w-2.5 text-primary/50" />
          <span className="flex gap-0.5">
            {languages.slice(0, 4).map((l) => (
              <span key={l} title={l}>{LANG_FLAGS[l.toLowerCase()] || l.toUpperCase()}</span>
            ))}
            {languages.length > 4 && (
              <span className="text-muted-foreground/60">+{languages.length - 4}</span>
            )}
          </span>
        </div>
      )}
      {serviceCount > 0 && (
        <div className="rounded-full bg-accent/30 px-2 py-0.5 text-[10px] text-muted-foreground border border-border/15">
          {serviceCount} {serviceCount === 1 ? (t("common.service") || "serviço") : (t("common.services") || "serviços")}
        </div>
      )}
    </div>
  );
}
