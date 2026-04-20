import { useState, useMemo } from "react";
import { Search, ChevronDown, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useIsMobile } from "@/hooks/use-mobile";
import { useLanguage } from "@/i18n/LanguageContext";

interface Filters {
  category: string;
  services: string[];
}

interface FilterModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filters: Filters;
  onApply: (filters: Partial<Filters>) => void;
  onClear: () => void;
  resultCount: number;
  services: { id: string; name: string; slug: string }[];
  categories?: string[];
}

function FilterItem({ label, active, onClick, multi }: { label: string; active: boolean; onClick: () => void; multi?: boolean }) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center rounded-lg px-3 py-2.5 text-sm transition-colors text-left ${
        active
          ? "bg-primary/10 text-primary font-medium"
          : "text-foreground hover:bg-accent"
      }`}
      aria-pressed={active}
    >
      {multi && (
        <span
          className={`mr-2.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors ${
            active ? "border-primary bg-primary text-primary-foreground" : "border-border bg-transparent"
          }`}
          aria-hidden="true"
        >
          {active && <Check className="h-3 w-3" />}
        </span>
      )}
      <span className="flex-1">{label}</span>
      {!multi && active && (
        <span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
      )}
    </button>
  );
}

function FilterSection({ title, defaultOpen = false, badge, children }: { title: string; defaultOpen?: boolean; badge?: number; children: React.ReactNode }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <Collapsible open={open} onOpenChange={setOpen} className="border-b border-border/20 last:border-0">
      <CollapsibleTrigger className="flex w-full items-center justify-between py-3 text-sm font-medium text-foreground hover:text-primary transition-colors">
        <span className="flex items-center gap-2">
          {title}
          {badge ? (
            <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
              {badge}
            </span>
          ) : null}
        </span>
        <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
      </CollapsibleTrigger>
      <CollapsibleContent className="pb-4">
        {children}
      </CollapsibleContent>
    </Collapsible>
  );
}

function FilterBody({ filters, onApply, onClear, resultCount, services, categories = [], onClose }: Omit<FilterModalProps, "open" | "onOpenChange"> & { onClose: () => void }) {
  const { t } = useLanguage();
  const [searchInModal, setSearchInModal] = useState("");

  const filteredServices = useMemo(() => {
    if (!searchInModal) return services;
    const q = searchInModal.toLowerCase();
    return services.filter((s) => s.name.toLowerCase().includes(q));
  }, [services, searchInModal]);

  const filteredCategories = useMemo(() => {
    if (!searchInModal) return categories;
    const q = searchInModal.toLowerCase();
    return categories.filter((c) => c.toLowerCase().includes(q));
  }, [categories, searchInModal]);

  const activeCount = (filters.category ? 1 : 0) + filters.services.length;

  const toggleService = (slug: string) => {
    const next = filters.services.includes(slug)
      ? filters.services.filter((s) => s !== slug)
      : [...filters.services, slug];
    onApply({ services: next });
  };

  const clearServices = () => onApply({ services: [] });

  return (
    <div className="flex flex-col h-full">
      <div className="pb-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={t("filter.search_placeholder")}
            className="pl-9 h-9 bg-muted/50 border-border/30 text-sm"
            value={searchInModal}
            onChange={(e) => setSearchInModal(e.target.value)}
          />
        </div>
      </div>

      <ScrollArea className="flex-1 -mx-1 px-1">
        {filteredServices.length > 0 && (
          <FilterSection title={t("filter.services")} defaultOpen badge={filters.services.length}>
            {filters.services.length > 0 && (
              <div className="mb-2 flex items-center justify-between px-1">
                <span className="text-[11px] text-muted-foreground">
                  {filters.services.length} selected
                </span>
                <button
                  onClick={clearServices}
                  className="text-[11px] text-muted-foreground hover:text-foreground transition-colors"
                >
                  {t("filter.clear_all")}
                </button>
              </div>
            )}
            <div className="space-y-0.5">
              {filteredServices.map((s) => (
                <FilterItem
                  key={s.slug}
                  label={s.name}
                  active={filters.services.includes(s.slug)}
                  onClick={() => toggleService(s.slug)}
                  multi
                />
              ))}
            </div>
          </FilterSection>
        )}

        {filteredCategories.length > 0 && (
          <FilterSection title={t("filter.category")} defaultOpen={!!filters.category}>
            <div className="space-y-0.5">
              {filteredCategories.map((cat) => (
                <FilterItem
                  key={cat}
                  label={cat}
                  active={filters.category.toLowerCase() === cat.toLowerCase()}
                  onClick={() =>
                    onApply({ category: filters.category.toLowerCase() === cat.toLowerCase() ? "" : cat })
                  }
                />
              ))}
            </div>
          </FilterSection>
        )}
      </ScrollArea>

      <div className="flex items-center justify-between gap-3 border-t border-border/20 pt-4 mt-2">
        {activeCount > 0 ? (
          <button onClick={onClear} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
            {t("filter.clear_all")}
          </button>
        ) : (
          <span />
        )}
        <Button variant="premium" size="sm" className="px-6" onClick={onClose}>
          {t("filter.show_results", { count: String(resultCount) })}
        </Button>
      </div>
    </div>
  );
}

export function FilterModal(props: FilterModalProps) {
  const isMobile = useIsMobile();
  const { t } = useLanguage();
  const { open, onOpenChange, ...bodyProps } = props;

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="right" className="w-full sm:w-[400px] p-5 flex flex-col">
          <SheetHeader className="pb-2">
            <SheetTitle className="font-display text-base">{t("filter.title")}</SheetTitle>
          </SheetHeader>
          <FilterBody {...bodyProps} onClose={() => onOpenChange(false)} />
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[70vh] flex flex-col p-5" aria-describedby={undefined}>
        <DialogHeader className="pb-2">
          <DialogTitle className="font-display text-base">{t("filter.title")}</DialogTitle>
        </DialogHeader>
        <FilterBody {...bodyProps} onClose={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
}
