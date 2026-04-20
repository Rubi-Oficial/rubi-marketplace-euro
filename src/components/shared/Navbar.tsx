import { Link, useNavigate, useParams, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Menu, X, User } from "lucide-react";
import { useState, useCallback } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth, getRoleDashboard } from "@/contexts/AuthContext";
import BrandLogo from "@/components/shared/BrandLogo";
import DesktopNav from "./navbar/DesktopNav";
import MobileMenu from "./navbar/MobileMenu";
import CategoryRow from "./navbar/CategoryRow";
import { LanguageSelectorDropdown } from "./navbar/LanguageSelector";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

export default function Navbar() {
  const { t } = useLanguage();
  const { user, userRole, signOut } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { slug } = useParams();
  const [searchValue, setSearchValue] = useState("");

  const isCategory = location.pathname.startsWith("/categoria/");
  const activeSlug = isCategory ? slug : "";
  const isAllActive = !isCategory && (location.pathname === "/" || location.pathname === "/buscar");
  const dashboardPath = getRoleDashboard(userRole as any);

  const handleSearch = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (searchValue.trim()) {
        navigate(`/buscar?q=${encodeURIComponent(searchValue.trim())}`);
      } else {
        navigate("/buscar");
      }
    },
    [searchValue, navigate]
  );

  const closeMobile = useCallback(() => setMobileOpen(false), []);

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 bg-[hsl(274_36%_8%_/_0.72)] backdrop-blur-md border-b border-[hsl(0_0%_100%_/_0.08)] shadow-[0_8px_28px_hsl(274_36%_4%_/_0.5)]"
      role="navigation"
      aria-label="Main navigation"
    >
      <div className="container mx-auto flex h-14 items-center justify-between gap-3 px-4">
        <Link to="/" className="shrink-0" aria-label="Velvet Escorts VIP — Home">
          <BrandLogo imgClassName="h-9 sm:h-10" />
        </Link>

        <form onSubmit={handleSearch} className="hidden sm:flex flex-1 max-w-sm items-center gap-2" role="search">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <Input
              placeholder={t("nav.search_placeholder")}
              className="pl-9 h-9 bg-card border-border/40 text-sm rounded-full"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              aria-label={t("nav.search_placeholder")}
            />
          </div>
          <Button type="submit" variant="premium" size="sm" className="h-9 px-4 text-xs rounded-full" aria-label="Search">
            <Search className="h-3.5 w-3.5" />
          </Button>
        </form>

        <DesktopNav />

        <div className="flex items-center gap-1 md:hidden">
          <div className="scale-90">
            <LanguageSelectorDropdown />
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="p-2 text-foreground rounded-full hover:bg-accent transition-colors"
                aria-label={user ? t("nav.dashboard") : t("nav.sign_in")}
              >
                <User className="h-5 w-5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-[180px]">
              {user ? (
                <>
                  <DropdownMenuItem asChild>
                    <Link to={dashboardPath}>{t("nav.dashboard")}</Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => signOut()}>
                    {t("nav.sign_out")}
                  </DropdownMenuItem>
                </>
              ) : (
                <>
                  <DropdownMenuItem asChild>
                    <Link to="/login">{t("nav.sign_in")}</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/cadastro">{t("nav.get_started")}</Link>
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          <button
            className="p-2 text-foreground rounded-full hover:bg-accent transition-colors"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-expanded={mobileOpen}
            aria-controls="mobile-menu"
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      <CategoryRow activeSlug={activeSlug} isAllActive={isAllActive} />

      <MobileMenu
        isOpen={mobileOpen}
        searchValue={searchValue}
        onSearchChange={setSearchValue}
        onSearch={handleSearch}
        onClose={closeMobile}
      />
    </nav>
  );
}
