import { Link } from "react-router-dom";
import { CATEGORIES } from "@/components/shared/CategoryBar";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { useLanguage } from "@/i18n/LanguageContext";
import TrustBadges from "./TrustBadges";

interface CategoryRowProps {
  activeSlug: string | undefined;
  isAllActive: boolean;
}

export default function CategoryRow({ activeSlug, isAllActive }: CategoryRowProps) {
  const { t } = useLanguage();

  const pillClass = (active: boolean) =>
    `shrink-0 rounded-full px-4 py-1.5 text-xs font-medium transition-all duration-200 ${
      active
        ? "bg-primary/95 text-primary-foreground shadow-[0_8px_18px_hsl(41_49%_69%_/_0.18)]"
        : "text-secondary-foreground hover:text-foreground hover:bg-accent/35"
    }`;

  return (
    <div className="border-t border-border/20">
      <div className="container mx-auto px-4 flex items-center gap-2">
        <ScrollArea className="flex-1">
          <div className="flex items-center gap-1 py-1.5" role="tablist" aria-label="Categories">
            <Link to="/buscar" role="tab" aria-selected={isAllActive} className={pillClass(isAllActive)}>
              {t("nav.all")}
            </Link>
            {CATEGORIES.map((cat) => (
              <Link
                key={cat.slug}
                to={`/categoria/${cat.slug}`}
                role="tab"
                aria-selected={activeSlug === cat.slug}
                className={pillClass(activeSlug === cat.slug)}
              >
                {t(cat.key)}
              </Link>
            ))}
          </div>
          <ScrollBar orientation="horizontal" className="h-0" />
        </ScrollArea>

        <div className="hidden xl:flex items-center gap-3 pl-3 border-l border-border/20 shrink-0">
          <TrustBadges />
        </div>
      </div>
    </div>
  );
}
