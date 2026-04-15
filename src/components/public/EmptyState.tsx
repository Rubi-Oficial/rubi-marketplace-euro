import { Link } from "react-router-dom";
import { SearchX, X, ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/i18n/LanguageContext";

interface EmptyStateProps {
  hasFilters: boolean;
  countryFilter?: string;
  cityFilter?: string;
  serviceFilter?: string;
  categoryFilter?: string;
  onRemoveLocation?: () => void;
  onRemoveService?: () => void;
  onRemoveCategory?: () => void;
  onClearAll: () => void;
}

export function EmptyState({
  hasFilters,
  countryFilter,
  cityFilter,
  serviceFilter,
  categoryFilter,
  onRemoveLocation,
  onRemoveService,
  onRemoveCategory,
  onClearAll,
}: EmptyStateProps) {
  const { t } = useLanguage();

  return (
    <div
      className="flex flex-col items-center justify-center rounded-3xl border border-border/30 bg-gradient-to-b from-card/80 to-card p-10 md:p-20 text-center animate-scale-in"
      role="status"
      aria-live="polite"
    >
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-muted to-muted/60 border border-border/20 shadow-[0_8px_24px_hsl(274_36%_4%_/_0.3)]">
        <SearchX className="h-8 w-8 text-muted-foreground" aria-hidden="true" />
      </div>
      <h3 className="text-xl md:text-2xl font-bold text-foreground font-display">
        {hasFilters ? t("landing.empty_title") : t("search.no_filters")}
      </h3>
      <p className="mt-3 text-sm md:text-base text-muted-foreground max-w-md leading-relaxed">
        {hasFilters ? t("landing.empty_desc") : t("landing.cta_desc")}
      </p>

      {hasFilters && (
        <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
          {(countryFilter || cityFilter) && onRemoveLocation && (
            <Button variant="outline" size="sm" className="h-9 gap-1.5 rounded-full text-xs hover:border-destructive/40 hover:text-destructive transition-colors" onClick={onRemoveLocation}>
              <X className="h-3 w-3" />
              {t("landing.empty_remove_location")}
            </Button>
          )}
          {serviceFilter && onRemoveService && (
            <Button variant="outline" size="sm" className="h-9 gap-1.5 rounded-full text-xs hover:border-destructive/40 hover:text-destructive transition-colors" onClick={onRemoveService}>
              <X className="h-3 w-3" />
              {t("landing.empty_remove_service")}
            </Button>
          )}
          {categoryFilter && onRemoveCategory && (
            <Button variant="outline" size="sm" className="h-9 gap-1.5 rounded-full text-xs hover:border-destructive/40 hover:text-destructive transition-colors" onClick={onRemoveCategory}>
              <X className="h-3 w-3" />
              {t("landing.empty_remove_category")}
            </Button>
          )}
          <Button variant="premium" size="sm" className="h-9 rounded-full text-xs shadow-md" onClick={onClearAll}>
            <Sparkles className="mr-1.5 h-3 w-3" />
            {t("landing.empty_browse_all")}
          </Button>
        </div>
      )}

      {!hasFilters && (
        <Button variant="premium" size="sm" className="mt-8 rounded-full h-11 px-6 shadow-md hover:shadow-lg transition-shadow" asChild>
          <Link to="/cadastro?role=professional">
            {t("landing.cta_button")} <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
          </Link>
        </Button>
      )}
    </div>
  );
}