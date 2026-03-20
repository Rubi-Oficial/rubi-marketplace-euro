import { Link, useParams, useLocation } from "react-router-dom";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { useLanguage } from "@/i18n/LanguageContext";
import { useRef, useState, useEffect } from "react";
import { cn } from "@/lib/utils";

const CATEGORIES = [
  { label: "Women", slug: "women" },
  { label: "Men", slug: "men" },
  { label: "Couples", slug: "couples" },
  { label: "Shemales", slug: "shemales" },
  { label: "Gay", slug: "gay" },
  { label: "Virtual Sex", slug: "virtual-sex" },
  { label: "Vídeos", slug: "videos" },
];

export { CATEGORIES };

export default function CategoryBar() {
  const { slug } = useParams();
  const location = useLocation();
  const { t } = useLanguage();
  const isCategory = location.pathname.startsWith("/categoria/");
  const activeSlug = isCategory ? slug : "";
  const isAllActive = !isCategory && (location.pathname === "/" || location.pathname === "/buscar");

  const trackRef = useRef<HTMLDivElement>(null);
  const [paused, setPaused] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 640);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const items = CATEGORIES;
  // Duplicate for seamless loop on desktop
  const loopItems = [...items, ...items];

  const linkClasses = (active: boolean) =>
    cn(
      "shrink-0 rounded-full px-4 py-1.5 text-xs font-medium transition-colors duration-200 select-none",
      active
        ? "bg-primary/15 text-primary font-bold border-b-2 border-primary"
        : "text-muted-foreground hover:text-foreground hover:bg-surface-light"
    );

  // Mobile: horizontal scroll, no animation
  if (isMobile) {
    return (
      <div className="border-b border-border/40 bg-card/80 backdrop-blur-sm">
        <div className="container mx-auto px-4">
          <ScrollArea className="w-full">
            <nav className="flex items-center gap-1 py-2">
              <Link to="/buscar" className={linkClasses(isAllActive)}>
                {t("common.all")}
              </Link>
              {items.map((cat) => (
                <Link key={cat.slug} to={`/categoria/${cat.slug}`} className={linkClasses(activeSlug === cat.slug)}>
                  {cat.label}
                </Link>
              ))}
            </nav>
            <ScrollBar orientation="horizontal" className="h-0" />
          </ScrollArea>
        </div>
      </div>
    );
  }

  // Desktop/tablet: marquee carousel
  return (
    <div
      className="border-b border-border/40 bg-card/80 backdrop-blur-sm overflow-hidden"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="container mx-auto px-4">
        <nav className="relative flex items-center py-2 overflow-hidden">
          <Link to="/buscar" className={cn(linkClasses(isAllActive), "relative z-10 mr-2")}>
            {t("common.all")}
          </Link>
          <div className="overflow-hidden flex-1">
            <div
              ref={trackRef}
              className="flex items-center gap-1 w-max carousel-track"
              style={{
                animationPlayState: paused ? "paused" : "running",
              }}
            >
              {loopItems.map((cat, i) => (
                <Link
                  key={`${cat.slug}-${i}`}
                  to={`/categoria/${cat.slug}`}
                  className={linkClasses(activeSlug === cat.slug)}
                >
                  {cat.label}
                </Link>
              ))}
            </div>
          </div>
        </nav>
      </div>
    </div>
  );
}
