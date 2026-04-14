import { Link } from "react-router-dom";
import { useAuth, getRoleDashboard } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, CreditCard, Megaphone } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import { CATEGORIES } from "@/components/shared/CategoryBar";
import { Separator } from "@/components/ui/separator";
import { LanguageSelectorInline } from "./LanguageSelector";
import TrustBadges from "./TrustBadges";

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
      className={`md:hidden border-t border-[hsl(0_0%_100%_/_0.08)] bg-[hsl(274_36%_8%_/_0.95)] backdrop-blur-lg px-4 space-y-1 shadow-[0_12px_40px_hsl(274_36%_4%_/_0.6)] overflow-hidden transition-all duration-300 ease-out ${
        isOpen ? "max-h-[80vh] py-4 opacity-100" : "max-h-0 py-0 opacity-0 pointer-events-none"
      }`}
      role="menu"
      aria-hidden={!isOpen}
    >
      {/* Search */}
      <form onSubmit={(e) => { onSearch(e); onClose(); }} className="flex gap-2 mb-3 sm:hidden" role="search">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <Input
            placeholder={t("nav.search_placeholder")}
            className="pl-9 h-9 bg-card border-border/40 text-sm rounded-full"
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            aria-label={t("nav.search_placeholder")}
          />
        </div>
        <Button type="submit" variant="premium" size="sm" className="h-9 px-3 rounded-full">
          <Search className="h-3.5 w-3.5" />
        </Button>
      </form>

      {/* Quick access */}
      <div className="flex gap-2 mb-3">
        <Link to="/buscar" onClick={onClose} className="flex-1 inline-flex items-center justify-center gap-1.5 text-xs font-medium py-2 px-3 rounded-full bg-primary text-primary-foreground shadow-sm">
          <Search className="h-3 w-3" />
          {t("landing.quick_search")}
        </Link>
        <Link to="/planos" onClick={onClose} className="flex-1 inline-flex items-center justify-center gap-1.5 text-xs font-medium py-2 px-3 rounded-full border border-border/50 text-foreground hover:bg-accent/40 transition-colors">
          <CreditCard className="h-3 w-3" />
          {t("landing.quick_plans")}
        </Link>
        <Link to="/cadastro?role=professional" onClick={onClose} className="flex-1 inline-flex items-center justify-center gap-1.5 text-xs font-medium py-2 px-3 rounded-full border border-border/50 text-foreground hover:bg-accent/40 transition-colors">
          <Megaphone className="h-3 w-3" />
          {t("landing.quick_publish")}
        </Link>
      </div>

      {/* Trust badges */}
      <div className="flex items-center justify-center gap-3 py-1.5 mb-2">
        <TrustBadges size="sm" />
      </div>

      <Separator className="bg-border/20 my-1" />

      {/* Language */}
      <LanguageSelectorInline />

      {/* Nav links */}
      <Link to="/buscar" onClick={onClose} className="flex items-center gap-2.5 text-sm text-foreground py-2.5 px-3 rounded-lg hover:bg-accent/40 transition-colors" role="menuitem">
        <Search className="h-4 w-4 text-muted-foreground" /> {t("nav.explore")}
      </Link>
      {CATEGORIES.map((cat) => (
        <Link key={cat.slug} to={`/categoria/${cat.slug}`} onClick={onClose} className="block text-sm text-muted-foreground py-2 px-5 rounded-lg hover:bg-accent/40 hover:text-foreground transition-colors" role="menuitem">
          {t(cat.key)}
        </Link>
      ))}
      <Link to="/planos" onClick={onClose} className="block text-sm text-foreground py-2.5 px-3 rounded-lg hover:bg-accent/40 transition-colors" role="menuitem">{t("nav.plans")}</Link>
      <Link to="/sobre" onClick={onClose} className="block text-sm text-foreground py-2.5 px-3 rounded-lg hover:bg-accent/40 transition-colors" role="menuitem">{t("nav.about")}</Link>
      <Separator className="bg-border/20 my-1" />

      {/* Auth */}
      <div>
        {user ? (
          <>
            <Link to={dashboardPath} onClick={onClose} className="block text-sm text-foreground py-2.5 px-3 rounded-lg hover:bg-accent/40 transition-colors" role="menuitem">{t("nav.dashboard")}</Link>
            <button onClick={() => { signOut(); onClose(); }} className="block w-full text-left text-sm text-muted-foreground py-2.5 px-3 rounded-lg hover:bg-accent/40 transition-colors" role="menuitem">{t("nav.sign_out")}</button>
          </>
        ) : (
          <div className="grid gap-2">
            <Link to="/login?redirect=/app" onClick={onClose} className="inline-flex items-center justify-center text-sm font-medium py-2.5 px-3 rounded-lg border border-border/50 bg-card/60 text-foreground hover:bg-accent/45 transition-colors" role="menuitem">
              Login profissionais
            </Link>
            <Link to="/login?redirect=/cliente" onClick={onClose} className="inline-flex items-center justify-center text-sm font-medium py-2.5 px-3 rounded-lg border border-border/50 bg-card/60 text-foreground hover:bg-accent/45 transition-colors" role="menuitem">
              Login clientes
            </Link>
            <Link to="/cadastro" onClick={onClose} className="inline-flex items-center justify-center text-sm font-semibold py-2.5 px-3 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-[0_8px_20px_hsl(var(--primary)_/_0.28)]" role="menuitem">
              {t("nav.get_started")}
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
