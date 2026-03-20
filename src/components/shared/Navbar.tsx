import { Link, useNavigate } from "react-router-dom";
import { useAuth, getRoleDashboard } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LogOut, LayoutDashboard, Search, Menu, X } from "lucide-react";
import { useState } from "react";
import { CATEGORIES } from "@/components/shared/CategoryBar";

export default function Navbar() {
  const { user, userRole, signOut } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const dashboardPath = getRoleDashboard(userRole as any);
  const navigate = useNavigate();

  const [searchValue, setSearchValue] = useState("");

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
      <div className="container mx-auto flex h-14 items-center justify-between gap-4 px-4">
        <Link to="/" className="font-display text-lg tracking-tight text-foreground shrink-0">
          <span className="font-bold text-primary">Rubi</span>
          <span className="font-medium text-foreground/80"> Girls</span>
        </Link>

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

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-border/50 bg-card/95 backdrop-blur-xl px-4 py-4 space-y-1 animate-fade-in shadow-lg">
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
          {CATEGORIES.map((cat) => (
            <Link key={cat.slug} to={`/categoria/${cat.slug}`} onClick={() => setMobileOpen(false)} className="block text-sm text-muted-foreground py-2 px-4 rounded-md hover:bg-accent transition-colors">
              {cat.label}
            </Link>
          ))}
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
