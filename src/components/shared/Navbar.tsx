import { Link } from "react-router-dom";
import { useAuth, getRoleDashboard } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { LogOut, LayoutDashboard, Search, Menu, X } from "lucide-react";
import { useState } from "react";

export default function Navbar() {
  const { user, userRole, signOut } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const dashboardPath = getRoleDashboard(userRole as any);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/60 backdrop-blur-xl border-b border-border/40">
      <div className="container mx-auto flex h-14 items-center justify-between px-4">
        <div className="flex items-center gap-8">
          <Link to="/" className="font-display text-xl font-bold tracking-[0.15em] text-primary">
            AURA
          </Link>
          <div className="hidden items-center gap-6 md:flex">
            <Link to="/buscar" className="flex items-center gap-1.5 text-[13px] text-muted-foreground hover:text-foreground transition-colors">
              <Search className="h-3.5 w-3.5" />
              Explore
            </Link>
            <Link to="/planos" className="text-[13px] text-muted-foreground hover:text-foreground transition-colors">
              Plans
            </Link>
            <Link to="/sobre" className="text-[13px] text-muted-foreground hover:text-foreground transition-colors">
              About
            </Link>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-2">
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

        {/* Mobile menu button */}
        <button className="md:hidden text-foreground p-1" onClick={() => setMobileOpen(!mobileOpen)}>
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-border/40 bg-background/95 backdrop-blur-xl px-4 py-4 space-y-1 animate-fade-in">
          <Link to="/buscar" onClick={() => setMobileOpen(false)} className="flex items-center gap-2 text-sm text-foreground py-2.5 px-2 rounded-md hover:bg-accent transition-colors">
            <Search className="h-4 w-4 text-muted-foreground" /> Explore
          </Link>
          <Link to="/planos" onClick={() => setMobileOpen(false)} className="block text-sm text-foreground py-2.5 px-2 rounded-md hover:bg-accent transition-colors">Plans</Link>
          <Link to="/sobre" onClick={() => setMobileOpen(false)} className="block text-sm text-foreground py-2.5 px-2 rounded-md hover:bg-accent transition-colors">About</Link>
          <div className="border-t border-border/40 pt-3 mt-2">
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
