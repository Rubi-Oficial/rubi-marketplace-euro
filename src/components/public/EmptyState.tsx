import { Link } from "react-router-dom";
import { SearchX, X, ArrowRight } from "lucide-react";
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
    <div className="flex flex-col items-center justify-center rounded-2xl border border-border/50 bg-card p-10 md:p-16 text-center shadow-sm">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-muted">
        <SearchX className="h-6 w-6 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold text-foreground font-display">
        {hasFilters ? t("landing.empty_title") : t("search.no_filters")}
      </h3>
      <p className="mt-1.5 text-sm text-muted-foreground max-w-md">
        {hasFilters ? t("landing.empty_desc") : t("landing.cta_desc")}
      </p>

      {hasFilters && (
        <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
          {(countryFilter || cityFilter) && onRemoveLocation && (
            <Button variant="outline" size="sm" className="h-8 gap-1.5 rounded-full text-xs" onClick={onRemoveLocation}>
              <X className="h-3 w-3" />
              {t("landing.empty_remove_location")}
            </Button>
          )}
          {serviceFilter && onRemoveService && (
            <Button variant="outline" size="sm" className="h-8 gap-1.5 rounded-full text-xs" onClick={onRemoveService}>
              <X className="h-3 w-3" />
              {t("landing.empty_remove_service")}
            </Button>
          )}
          {categoryFilter && onRemoveCategory && (
            <Button variant="outline" size="sm" className="h-8 gap-1.5 rounded-full text-xs" onClick={onRemoveCategory}>
              <X className="h-3 w-3" />
              {t("landing.empty_remove_category")}
            </Button>
          )}
          <Button variant="premium" size="sm" className="h-8 rounded-full text-xs" onClick={onClearAll}>
            {t("landing.empty_browse_all")}
          </Button>
        </div>
      )}

      {!hasFilters && (
        <Button variant="premium" size="sm" className="mt-5" asChild>
          <Link to="/cadastro?role=professional">
            {t("landing.cta_button")} <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
          </Link>
        </Button>
      )}
    </div>
  );
}
