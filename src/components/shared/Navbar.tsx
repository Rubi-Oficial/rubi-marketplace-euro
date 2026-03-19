import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth, getRoleDashboard } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LogOut, LayoutDashboard, Search, Menu, X } from "lucide-react";
import { useState, useEffect } from "react";
import { CITIES } from "@/components/onboarding/types";
import { fetchServices } from "@/components/public/ProfileCard";
import { supabase } from "@/lib/supabase";

export default function Navbar() {
  const { user, userRole, signOut } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const dashboardPath = getRoleDashboard(userRole as any);
  const location = useLocation();
  const navigate = useNavigate();
  const isHome = location.pathname === "/";

  const [searchValue, setSearchValue] = useState("");
  const [services, setServices] = useState<{ id: string; name: string; slug: string }[]>([]);
  const [activeCity, setActiveCity] = useState("");
  const [activeService, setActiveService] = useState("");
  const [cityCounts, setCityCounts] = useState<Record<string, number>>({});
  const [serviceCounts, setServiceCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!isHome) return;
    fetchServices().then(setServices);

    // Fetch city counts from eligible profiles
    supabase
      .from("eligible_profiles")
      .select("city_slug")
      .then(({ data }) => {
        if (!data) return;
        const counts: Record<string, number> = {};
        data.forEach((p: any) => {
          if (p.city_slug) counts[p.city_slug] = (counts[p.city_slug] || 0) + 1;
        });
        setCityCounts(counts);
      });

    // Fetch service counts (only for eligible profiles)
    supabase
      .from("profile_services")
      .select("service_id, profile_id")
      .then(async ({ data: psData }) => {
        if (!psData || psData.length === 0) return;
        const { data: eligible } = await supabase.from("eligible_profiles").select("id");
        if (!eligible) return;
        const eligibleIds = new Set(eligible.map((e: any) => e.id));
        const { data: svcs } = await supabase.from("services").select("id, slug").eq("is_active", true);
        if (!svcs) return;
        const idToSlug: Record<string, string> = {};
        svcs.forEach((s: any) => { idToSlug[s.id] = s.slug; });
        const counts: Record<string, number> = {};
        psData.forEach((ps: any) => {
          if (eligibleIds.has(ps.profile_id) && idToSlug[ps.service_id]) {
            const slug = idToSlug[ps.service_id];
            counts[slug] = (counts[slug] || 0) + 1;
          }
        });
        setServiceCounts(counts);
      });
  }, [isHome]);

  // Expose filter state to LandingPage via custom event
  useEffect(() => {
    if (isHome) {
      window.dispatchEvent(new CustomEvent("rubi-filters", { detail: { activeCity, activeService } }));
    }
  }, [activeCity, activeService, isHome]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchValue.trim()) {
      navigate(`/buscar?q=${encodeURIComponent(searchValue.trim())}`);
    } else {
      navigate("/buscar");
    }
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-xl border-b border-border/30">
      {/* Row 1: Logo + Search + Auth */}
      <div className="container mx-auto flex h-14 items-center justify-between gap-4 px-4">
        <Link to="/" className="font-display text-lg font-bold tracking-wide text-foreground shrink-0">
          <span className="text-primary">Rubi</span> Girls
        </Link>

        {/* Search bar — always visible */}
        <form onSubmit={handleSearch} className="hidden sm:flex flex-1 max-w-md items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by name, city..."
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
          {user ? (
            <>
              <Button variant="ghost" size="sm" asChild className="text-[13px]">
                <Link to={dashboardPath}>
                  <LayoutDashboard className="mr-1.5 h-3.5 w-3.5" />
                  Dashboard
                </Link>
              </Button>
              <Button variant="ghost" size="icon" onClick={signOut} className="h-8 w-8">
                <LogOut className="h-3.5 w-3.5" />
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" asChild className="text-[13px]">
                <Link to="/login">Sign In</Link>
              </Button>
              <Button variant="premium" size="sm" asChild className="text-[13px] h-8 px-4">
                <Link to="/cadastro">Get Started</Link>
              </Button>
            </>
          )}
        </div>

        <button className="md:hidden text-foreground p-1" onClick={() => setMobileOpen(!mobileOpen)}>
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Row 2: Filter tabs — only on homepage */}
      {isHome && (
        <div className="border-t border-border/20 bg-background/90">
          <div className="container mx-auto px-4 flex items-center gap-1 overflow-x-auto scrollbar-hide py-2">
            {CITIES.map((city) => (
              <button
                key={city.slug}
                onClick={() => setActiveCity(activeCity === city.slug ? "" : city.slug)}
                className={`whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium transition-all shrink-0 ${
                  activeCity === city.slug
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent"
                }`}
              >
                {city.name}
                {cityCounts[city.slug] ? (
                  <span className={`ml-1.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-semibold ${
                    activeCity === city.slug
                      ? "bg-primary-foreground/20 text-primary-foreground"
                      : "bg-primary/10 text-primary"
                  }`}>
                    {cityCounts[city.slug]}
                  </span>
                ) : null}
              </button>
            ))}
            <span className="mx-1 h-4 w-px bg-border/30 shrink-0" />
            {services.map((svc) => (
              <button
                key={svc.slug}
                onClick={() => setActiveService(activeService === svc.slug ? "" : svc.slug)}
                className={`whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium transition-all shrink-0 inline-flex items-center ${
                  activeService === svc.slug
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent"
                }`}
              >
                {svc.name}
                {serviceCounts[svc.slug] ? (
                  <span className={`ml-1.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-semibold ${
                    activeService === svc.slug
                      ? "bg-primary-foreground/20 text-primary-foreground"
                      : "bg-primary/10 text-primary"
                  }`}>
                    {serviceCounts[svc.slug]}
                  </span>
                ) : null}
              </button>
            ))}
            {(activeCity || activeService) && (
              <button
                onClick={() => { setActiveCity(""); setActiveService(""); }}
                className="text-xs text-primary hover:underline ml-1 shrink-0"
              >
                Clear
              </button>
            )}
            <Link
              to="/buscar"
              className="ml-auto text-xs text-muted-foreground hover:text-foreground transition-colors shrink-0"
            >
              Advanced →
            </Link>
          </div>
        </div>
      )}

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-border/30 bg-background/95 backdrop-blur-xl px-4 py-4 space-y-1 animate-fade-in">
          {/* Mobile search */}
          <form onSubmit={(e) => { handleSearch(e); setMobileOpen(false); }} className="flex gap-2 mb-3 sm:hidden">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search..."
                className="pl-9 h-9 bg-card border-border/40 text-sm"
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
              />
            </div>
            <Button type="submit" variant="premium" size="sm" className="h-9 px-3">
              <Search className="h-3.5 w-3.5" />
            </Button>
          </form>
          <Link to="/buscar" onClick={() => setMobileOpen(false)} className="flex items-center gap-2 text-sm text-foreground py-2.5 px-2 rounded-md hover:bg-accent transition-colors">
            <Search className="h-4 w-4 text-muted-foreground" /> Explore
          </Link>
          <Link to="/planos" onClick={() => setMobileOpen(false)} className="block text-sm text-foreground py-2.5 px-2 rounded-md hover:bg-accent transition-colors">Plans</Link>
          <Link to="/sobre" onClick={() => setMobileOpen(false)} className="block text-sm text-foreground py-2.5 px-2 rounded-md hover:bg-accent transition-colors">About</Link>
          <div className="border-t border-border/30 pt-3 mt-2">
            {user ? (
              <>
                <Link to={dashboardPath} onClick={() => setMobileOpen(false)} className="block text-sm text-foreground py-2.5 px-2 rounded-md hover:bg-accent transition-colors">Dashboard</Link>
                <button onClick={() => { signOut(); setMobileOpen(false); }} className="block w-full text-left text-sm text-muted-foreground py-2.5 px-2 rounded-md hover:bg-accent transition-colors">Sign Out</button>
              </>
            ) : (
              <>
                <Link to="/login" onClick={() => setMobileOpen(false)} className="block text-sm text-foreground py-2.5 px-2 rounded-md hover:bg-accent transition-colors">Sign In</Link>
                <Link to="/cadastro" onClick={() => setMobileOpen(false)} className="block text-sm text-primary font-medium py-2.5 px-2 rounded-md hover:bg-accent transition-colors">Get Started</Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
