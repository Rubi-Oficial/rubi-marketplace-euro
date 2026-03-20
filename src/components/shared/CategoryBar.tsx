import { Link, useParams, useLocation } from "react-router-dom";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

const CATEGORIES = [
  { label: "Women", slug: "women" },
  { label: "Men", slug: "men" },
  { label: "Couples", slug: "couples" },
  { label: "Shemales", slug: "shemales" },
  { label: "Gay", slug: "gay" },
  { label: "Virtual Sex", slug: "virtual-sex" },
];

export { CATEGORIES };

export default function CategoryBar() {
  const { slug } = useParams();
  const location = useLocation();
  const isCategory = location.pathname.startsWith("/categoria/");
  const activeSlug = isCategory ? slug : "";
  const isAllActive = !isCategory && (location.pathname === "/" || location.pathname === "/buscar");

  return (
    <div className="border-b border-border/40 bg-card/80 backdrop-blur-sm">
      <div className="container mx-auto px-4">
        <ScrollArea className="w-full">
          <nav className="flex items-center gap-1 py-2">
            <Link
              to="/buscar"
              className={`shrink-0 rounded-full px-4 py-1.5 text-xs font-medium transition-colors ${
                isAllActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent"
              }`}
            >
              All
            </Link>
            {CATEGORIES.map((cat) => (
              <Link
                key={cat.slug}
                to={`/categoria/${cat.slug}`}
                className={`shrink-0 rounded-full px-4 py-1.5 text-xs font-medium transition-colors ${
                  activeSlug === cat.slug
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent"
                }`}
              >
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
