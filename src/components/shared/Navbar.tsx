import { Link, useNavigate, useParams, useLocation } from "react-router-dom";
import { useAuth, getRoleDashboard } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LogOut, LayoutDashboard, Search, Menu, X } from "lucide-react";
import { useState } from "react";
import { CATEGORIES } from "@/components/shared/CategoryBar";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { useLanguage } from "@/i18n/LanguageContext";
import { LANGUAGES } from "@/i18n/translations";
import logoRubiGirls from "@/assets/logo-rubi-girls.png";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function Navbar() {
  const { user, userRole, signOut } = useAuth();
  const { lang, setLang, t } = useLanguage();
  const [mobileOpen, setMobileOpen] = useState(false);
  const dashboardPath = getRoleDashboard(userRole as any);
  const navigate = useNavigate();
  const location = useLocation();
  const { slug } = useParams();

  const [searchValue, setSearchValue] = useState("");

  const isCategory = location.pathname.startsWith("/categoria/");
  const activeSlug = isCategory ? slug : "";
  const isAllActive = !isCategory && (location.pathname === "/" || location.pathname === "/buscar");

  const currentLang = LANGUAGES.find((l) => l.code === lang)!;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchValue.trim()) {
      navigate(`/buscar?q=${encodeURIComponent(searchValue.trim())}`);
    } else {
      navigate("/buscar");
    }
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-xl border-b border-border/50 shadow-sm">
      {/* Top row: logo, search, auth */}
      <div className="container mx-auto flex h-14 items-center justify-between gap-4 px-4">
        <Link to="/" className="shrink-0">
          <img src={logoRubiGirls} alt="Rubi Girls" className="h-7" />
        </Link>

        <form onSubmit={handleSearch} className="hidden sm:flex flex-1 max-w-md items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={t("nav.search_placeholder")}
              className="pl-9 h-9 bg-card border-border/40 text-sm"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
            />
          </div>
          <Button type="submit" variant="premium" size="sm" className="h-9 px-4 text-xs">
            <Search className="h-3.5 w-3.5" />
          </Button>
        </form>

        <div className="hidden md:flex items-center gap-2 shrink-0">
          {/* Language selector — always visible, before auth buttons */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="shrink-0 rounded-full h-8 w-8 flex items-center justify-center text-lg leading-none transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2" aria-label="Select language">
                {currentLang.flag}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-[120px]">
              {LANGUAGES.map((l) => (
                <DropdownMenuItem
                  key={l.code}
                  onClick={() => setLang(l.code)}
                  className={`text-sm gap-2 ${lang === l.code ? "bg-accent font-semibold" : ""}`}
                >
                  <span className="text-base">{l.flag}</span>
                  <span>{l.label}</span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {user ? (
            <>
              <Button variant="ghost" size="sm" asChild className="text-[13px]">
                <Link to={dashboardPath}>
                  <LayoutDashboard className="mr-1.5 h-3.5 w-3.5" />
                  {t("nav.dashboard")}
                </Link>
              </Button>
              <Button variant="ghost" size="icon" onClick={signOut} className="h-8 w-8">
                <LogOut className="h-3.5 w-3.5" />
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" asChild className="text-[13px]">
                <Link to="/login">{t("nav.sign_in")}</Link>
              </Button>
              <Button variant="premium" size="sm" asChild className="text-[13px] h-8 px-4">
                <Link to="/cadastro">{t("nav.get_started")}</Link>
              </Button>
            </>
          )}
        </div>

        <button className="p-1 text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2 md:hidden" onClick={() => setMobileOpen(!mobileOpen)}>
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Category row integrated */}
      <div className="border-t border-border/20">
        <div className="container mx-auto px-4">
          <ScrollArea className="w-full">
            <div className="flex items-center gap-1 py-1.5">
              <Link
                to="/buscar"
                className={`shrink-0 rounded-full px-4 py-1 text-xs font-medium transition-colors ${
                  isAllActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent"
                }`}
              >
                {t("nav.all")}
              </Link>
              {CATEGORIES.map((cat) => (
                <Link
                  key={cat.slug}
                  to={`/categoria/${cat.slug}`}
                  className={`shrink-0 rounded-full px-4 py-1 text-xs font-medium transition-colors ${
                    activeSlug === cat.slug
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent"
                  }`}
                >
                  {cat.label}
                </Link>
              ))}

            </div>
            <ScrollBar orientation="horizontal" className="h-0" />
          </ScrollArea>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-border/50 bg-card/95 backdrop-blur-xl px-4 py-4 space-y-1 animate-fade-in shadow-lg">
          <form onSubmit={(e) => { handleSearch(e); setMobileOpen(false); }} className="flex gap-2 mb-3 sm:hidden">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder={t("nav.search_placeholder")}
                className="pl-9 h-9 bg-card border-border/40 text-sm"
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
              />
            </div>
            <Button type="submit" variant="premium" size="sm" className="h-9 px-3">
              <Search className="h-3.5 w-3.5" />
            </Button>
          </form>

          {/* Mobile language selector — flags only */}
          <div className="flex items-center gap-1 px-2 py-2 mb-1">
            <div className="flex gap-1.5">
              {LANGUAGES.map((l) => (
                <button
                  key={l.code}
                  onClick={() => setLang(l.code)}
                  className={`rounded-full px-2 py-1 text-base transition-colors ${
                    lang === l.code
                      ? "bg-primary/15 ring-1 ring-primary"
                      : "hover:bg-accent"
                  }`}
                  aria-label={l.name}
                >
                  {l.flag}
                </button>
              ))}
            </div>
          </div>

          <Link to="/buscar" onClick={() => setMobileOpen(false)} className="flex items-center gap-2 text-sm text-foreground py-2.5 px-2 rounded-md hover:bg-accent transition-colors">
            <Search className="h-4 w-4 text-muted-foreground" /> {t("nav.explore")}
          </Link>
          {CATEGORIES.map((cat) => (
            <Link key={cat.slug} to={`/categoria/${cat.slug}`} onClick={() => setMobileOpen(false)} className="block text-sm text-muted-foreground py-2 px-4 rounded-md hover:bg-accent transition-colors">
              {cat.label}
            </Link>
          ))}
          <Link to="/planos" onClick={() => setMobileOpen(false)} className="block text-sm text-foreground py-2.5 px-2 rounded-md hover:bg-accent transition-colors">{t("nav.plans")}</Link>
          <Link to="/sobre" onClick={() => setMobileOpen(false)} className="block text-sm text-foreground py-2.5 px-2 rounded-md hover:bg-accent transition-colors">{t("nav.about")}</Link>
          <div className="border-t border-border/30 pt-3 mt-2">
            {user ? (
              <>
                <Link to={dashboardPath} onClick={() => setMobileOpen(false)} className="block text-sm text-foreground py-2.5 px-2 rounded-md hover:bg-accent transition-colors">{t("nav.dashboard")}</Link>
                <button onClick={() => { signOut(); setMobileOpen(false); }} className="block w-full text-left text-sm text-muted-foreground py-2.5 px-2 rounded-md hover:bg-accent transition-colors">{t("nav.sign_out")}</button>
              </>
            ) : (
              <>
                <Link to="/login" onClick={() => setMobileOpen(false)} className="block text-sm text-foreground py-2.5 px-2 rounded-md hover:bg-accent transition-colors">{t("nav.sign_in")}</Link>
                <Link to="/cadastro" onClick={() => setMobileOpen(false)} className="block text-sm text-primary font-medium py-2.5 px-2 rounded-md hover:bg-accent transition-colors">{t("nav.get_started")}</Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
