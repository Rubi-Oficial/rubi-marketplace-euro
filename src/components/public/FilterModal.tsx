import { useState, useMemo } from "react";
import { Search, X, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useIsMobile } from "@/hooks/use-mobile";
import type { Country, City } from "@/hooks/useLocations";

interface Filters {
  country: string;
  city: string;
  category: string;
  service: string;
}

interface FilterModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filters: Filters;
  onApply: (filters: Partial<Filters>) => void;
  onClear: () => void;
  resultCount: number;
  countries: Country[];
  getCitiesByCountry: (slug: string) => City[];
  services: { id: string; name: string; slug: string }[];
  categories?: string[];
}

function FilterPill({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
        active
          ? "bg-primary text-primary-foreground"
          : "bg-muted text-muted-foreground hover:text-foreground hover:bg-accent"
      }`}
    >
      {label}
    </button>
  );
}

function FilterSection({ title, defaultOpen = false, children }: { title: string; defaultOpen?: boolean; children: React.ReactNode }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <Collapsible open={open} onOpenChange={setOpen} className="border-b border-border/20 last:border-0">
      <CollapsibleTrigger className="flex w-full items-center justify-between py-3 text-sm font-medium text-foreground hover:text-primary transition-colors">
        {title}
        <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
      </CollapsibleTrigger>
      <CollapsibleContent className="pb-4">
        {children}
      </CollapsibleContent>
    </Collapsible>
  );
}

function FilterBody({ filters, onApply, onClear, resultCount, countries, getCitiesByCountry, services, categories = [] }: Omit<FilterModalProps, "open" | "onOpenChange">) {
  const [searchInModal, setSearchInModal] = useState("");
  const cities = filters.country ? getCitiesByCountry(filters.country) : [];

  const filteredCountries = useMemo(() => {
    if (!searchInModal) return countries;
    const q = searchInModal.toLowerCase();
    return countries.filter((c) => c.name.toLowerCase().includes(q));
  }, [countries, searchInModal]);

  const filteredCities = useMemo(() => {
    if (!searchInModal) return cities;
    const q = searchInModal.toLowerCase();
    return cities.filter((c) => c.name.toLowerCase().includes(q));
  }, [cities, searchInModal]);

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

  const activeCount = [filters.country, filters.city, filters.category, filters.service].filter(Boolean).length;

  return (
    <div className="flex flex-col h-full">
      {/* Search inside modal */}
      <div className="px-1 pb-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search filters..."
            className="pl-9 h-9 bg-muted/50 border-border/30 text-sm"
            value={searchInModal}
            onChange={(e) => setSearchInModal(e.target.value)}
          />
        </div>
      </div>

      {/* Filter sections */}
      <div className="flex-1 overflow-y-auto px-1 space-y-0">
        <FilterSection title="Location" defaultOpen={!!filters.country || true}>
          <div className="space-y-3">
            <div>
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-2">Country</p>
              <div className="flex flex-wrap gap-1.5">
                {filteredCountries.map((c) => (
                  <FilterPill
                    key={c.slug}
                    label={c.name}
                    active={filters.country === c.slug}
                    onClick={() => onApply({
                      country: filters.country === c.slug ? "" : c.slug,
                      city: filters.country === c.slug ? "" : filters.city,
                    })}
                  />
                ))}
                {filteredCountries.length === 0 && (
                  <p className="text-xs text-muted-foreground">No countries match</p>
                )}
              </div>
            </div>
            {filteredCities.length > 0 && (
              <div>
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-2">City</p>
                <div className="flex flex-wrap gap-1.5">
                  {filteredCities.map((c) => (
                    <FilterPill
                      key={c.slug}
                      label={c.name}
                      active={filters.city === c.slug}
                      onClick={() => onApply({ city: filters.city === c.slug ? "" : c.slug })}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </FilterSection>

        {filteredServices.length > 0 && (
          <FilterSection title="Services" defaultOpen={!!filters.service}>
            <div className="flex flex-wrap gap-1.5">
              {filteredServices.map((s) => (
                <FilterPill
                  key={s.slug}
                  label={s.name}
                  active={filters.service === s.slug}
                  onClick={() => onApply({ service: filters.service === s.slug ? "" : s.slug })}
                />
              ))}
            </div>
          </FilterSection>
        )}

        {filteredCategories.length > 0 && (
          <FilterSection title="Category" defaultOpen={!!filters.category}>
            <div className="flex flex-wrap gap-1.5">
              {filteredCategories.map((cat) => (
                <FilterPill
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
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between gap-3 border-t border-border/20 pt-4 px-1 mt-2">
        {activeCount > 0 ? (
          <button onClick={onClear} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
            Clear all
          </button>
        ) : (
          <span />
        )}
        <Button variant="premium" size="sm" className="px-6">
          Show {resultCount} result{resultCount !== 1 ? "s" : ""}
        </Button>
      </div>
    </div>
  );
}

export function FilterModal(props: FilterModalProps) {
  const isMobile = useIsMobile();
  const { open, onOpenChange, ...bodyProps } = props;

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="right" className="w-full sm:w-[400px] p-5 flex flex-col">
          <SheetHeader className="pb-2">
            <div className="flex items-center justify-between">
              <SheetTitle className="font-display text-base">Filters</SheetTitle>
            </div>
          </SheetHeader>
          <FilterBody {...bodyProps} />
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[80vh] flex flex-col p-5">
        <DialogHeader className="pb-2">
          <DialogTitle className="font-display text-base">Filters</DialogTitle>
        </DialogHeader>
        <FilterBody {...bodyProps} />
      </DialogContent>
    </Dialog>
  );
}
