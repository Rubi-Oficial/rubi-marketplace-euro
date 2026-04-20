import { Link } from "react-router-dom";
import { useAuth, getRoleDashboard } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, CreditCard, Megaphone, LogOut, LayoutDashboard, Compass, Info } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import { CATEGORIES } from "@/components/shared/CategoryBar";
import { Separator } from "@/components/ui/separator";

interface MobileMenuProps {
  isOpen: boolean;
  searchValue: string;
  onSearchChange: (v: string) => void;
  onSearch: (e: React.FormEvent) => void;
  onClose: () => void;
}

export default function MobileMenu({ isOpen, searchValue, onSearchChange, onSearch, onClose }: MobileMenuProps) {
  const { user, userRole, signOut } = useAuth();
  const { t } = useLanguage();
  const dashboardPath = getRoleDashboard(userRole as any);

  return (
    <div
      id="mobile-menu"
      className={`md:hidden border-t border-[hsl(0_0%_100%_/_0.08)] bg-[hsl(274_36%_8%_/_0.95)] backdrop-blur-lg px-4 shadow-[0_12px_40px_hsl(274_36%_4%_/_0.6)] overflow-hidden transition-all duration-300 ease-out ${
        isOpen ? "max-h-[80vh] py-4 opacity-100" : "max-h-0 py-0 opacity-0 pointer-events-none"
      }`}
      role="menu"
      aria-hidden={!isOpen}
    >
      {/* Search */}
      <form onSubmit={(e) => { onSearch(e); onClose(); }} className="flex gap-2 mb-4 sm:hidden" role="search">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <Input
            placeholder={t("nav.search_placeholder")}
            className="pl-9 h-10 bg-card border-border/40 text-sm rounded-full"
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            aria-label={t("nav.search_placeholder")}
          />
        </div>
        <Button type="submit" variant="premium" size="sm" className="h-10 px-4 rounded-full">
          <Search className="h-4 w-4" />
        </Button>
      </form>

      {/* Primary actions */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        <Link
          to="/planos"
          onClick={onClose}
          className="inline-flex items-center justify-center gap-1.5 text-xs font-semibold py-2.5 px-3 rounded-full bg-primary text-primary-foreground shadow-[0_8px_20px_hsl(var(--primary)_/_0.28)] hover:bg-primary/90 transition-colors"
        >
          <CreditCard className="h-3.5 w-3.5" />
          {t("landing.quick_plans")}
        </Link>
        <Link
          to="/cadastro?role=professional"
          onClick={onClose}
          className="inline-flex items-center justify-center gap-1.5 text-xs font-semibold py-2.5 px-3 rounded-full border border-border/50 text-foreground hover:bg-accent/40 transition-colors"
        >
          <Megaphone className="h-3.5 w-3.5" />
          {t("landing.quick_publish")}
        </Link>
      </div>

      <Separator className="bg-border/20 mb-2" />

      {/* Nav links */}
      <Link
        to="/buscar"
        onClick={onClose}
        className="flex items-center gap-3 text-sm font-medium text-foreground py-2.5 px-3 rounded-lg hover:bg-accent/40 transition-colors"
        role="menuitem"
      >
        <Compass className="h-4 w-4 text-muted-foreground" />
        {t("nav.explore")}
      </Link>

      {/* Categories collapsible-style list */}
      <div className="px-3 pt-2 pb-1">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">
          {t("nav.categories") || "Categorias"}
        </p>
      </div>
      <div className="grid grid-cols-2 gap-1 mb-2">
        {CATEGORIES.map((cat) => (
          <Link
            key={cat.slug}
            to={`/categoria/${cat.slug}`}
            onClick={onClose}
            className="block text-xs text-muted-foreground py-2 px-3 rounded-lg hover:bg-accent/40 hover:text-foreground transition-colors"
            role="menuitem"
          >
            {t(cat.key)}
          </Link>
        ))}
      </div>

      <Separator className="bg-border/20 my-2" />

      <Link
        to="/sobre"
        onClick={onClose}
        className="flex items-center gap-3 text-sm text-foreground py-2.5 px-3 rounded-lg hover:bg-accent/40 transition-colors"
        role="menuitem"
      >
        <Info className="h-4 w-4 text-muted-foreground" />
        {t("nav.about")}
      </Link>

      {/* Auth — only when logged in (login/register live in navbar user dropdown) */}
      {user && (
        <>
          <Separator className="bg-border/20 my-2" />
          <Link
            to={dashboardPath}
            onClick={onClose}
            className="flex items-center gap-3 text-sm text-foreground py-2.5 px-3 rounded-lg hover:bg-accent/40 transition-colors"
            role="menuitem"
          >
            <LayoutDashboard className="h-4 w-4 text-muted-foreground" />
            {t("nav.dashboard")}
          </Link>
          <button
            onClick={() => { signOut(); onClose(); }}
            className="flex w-full items-center gap-3 text-left text-sm text-muted-foreground py-2.5 px-3 rounded-lg hover:bg-accent/40 transition-colors"
            role="menuitem"
          >
            <LogOut className="h-4 w-4" />
            {t("nav.sign_out")}
          </button>
        </>
      )}
    </div>
  );
}
