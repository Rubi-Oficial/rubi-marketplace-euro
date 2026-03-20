import { useState, useMemo } from "react";
import { Search, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useIsMobile } from "@/hooks/use-mobile";

interface Filters {
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
  services: { id: string; name: string; slug: string }[];
  categories?: string[];
}

function FilterItem({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center rounded-lg px-3 py-2.5 text-sm transition-colors text-left ${
        active
          ? "bg-primary/10 text-primary font-medium"
          : "text-foreground hover:bg-accent"
      }`}
    >
      <span className="flex-1">{label}</span>
      {active && (
        <span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
      )}
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

function FilterBody({ filters, onApply, onClear, resultCount, services, categories = [] }: Omit<FilterModalProps, "open" | "onOpenChange">) {
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

  const activeCount = [filters.category, filters.service].filter(Boolean).length;

  return (
    <div className="flex flex-col h-full">
      {/* Search inside modal */}
      <div className="pb-3">
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
      <ScrollArea className="flex-1 -mx-1 px-1">
        {filteredServices.length > 0 && (
          <FilterSection title="Services" defaultOpen={!!filters.service || true}>
            <div className="space-y-0.5">
              {filteredServices.map((s) => (
                <FilterItem
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

      {/* Footer */}
      <div className="flex items-center justify-between gap-3 border-t border-border/20 pt-4 mt-2">
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
            <SheetTitle className="font-display text-base">Filters</SheetTitle>
          </SheetHeader>
          <FilterBody {...bodyProps} />
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[70vh] flex flex-col p-5" aria-describedby={undefined}>
        <DialogHeader className="pb-2">
          <DialogTitle className="font-display text-base">Filters</DialogTitle>
        </DialogHeader>
        <FilterBody {...bodyProps} />
      </DialogContent>
    </Dialog>
  );
}
