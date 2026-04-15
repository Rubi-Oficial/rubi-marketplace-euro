import { ArrowRight, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/i18n/LanguageContext";

interface CardActionsProps {
  displayName: string;
  hasWhatsapp: boolean;
  whatsappLoading: boolean;
  onNavigate: () => void;
  onWhatsApp: (e: React.MouseEvent) => void;
}

export function CardActions({ displayName, hasWhatsapp, whatsappLoading, onNavigate, onWhatsApp }: CardActionsProps) {
  const { t } = useLanguage();

  return (
    <div className="flex items-center gap-2 pt-1 mt-auto" onClick={(e) => e.stopPropagation()}>
      <Button
        size="sm"
        className="flex-1 gap-1.5 rounded-xl text-sm font-semibold h-10 transition-all duration-300 hover:shadow-[0_4px_16px_hsl(var(--primary)_/_0.25)] hover:-translate-y-0.5 active:scale-[0.97]"
        onClick={onNavigate}
        aria-label={`${t("common.view_profile")} - ${displayName}`}
      >
        {t("common.view_profile")}
        <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1" />
      </Button>

      {hasWhatsapp && (
        <Button
          size="sm"
          className="shrink-0 rounded-xl px-3 h-10 bg-success hover:bg-success/90 text-success-foreground border-0 transition-smooth hover:shadow-[0_4px_12px_hsl(var(--success)_/_0.3)]"
          disabled={whatsappLoading}
          onClick={onWhatsApp}
          aria-label={`WhatsApp — ${displayName}`}
        >
          {whatsappLoading ? (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-success-foreground border-t-transparent" />
          ) : (
            <MessageCircle className="h-4 w-4" />
          )}
        </Button>
      )}
    </div>
  );
}
