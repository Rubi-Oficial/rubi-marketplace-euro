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
    <nav className="fixed top-0 left-0 right-0 z-50 glass">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-6">
          <Link to="/" className="font-display text-2xl font-bold tracking-tight text-primary">
            AURA
          </Link>
          <div className="hidden items-center gap-4 md:flex">
            <Link to="/buscar" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
              <Search className="h-3.5 w-3.5" />
              Buscar
            </Link>
            <Link to="/planos" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Planos
            </Link>
            <Link to="/sobre" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Sobre
            </Link>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-3">
          {user ? (
            <>
              <Button variant="ghost" size="sm" asChild>
                <Link to={dashboardPath}>
                  <LayoutDashboard className="mr-1.5 h-4 w-4" />
                  Dashboard
                </Link>
              </Button>
              <Button variant="ghost" size="icon" onClick={signOut}>
                <LogOut className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/login">Entrar</Link>
              </Button>
              <Button variant="premium" size="sm" asChild>
                <Link to="/cadastro">Cadastrar</Link>
              </Button>
            </>
          )}
        </div>

        {/* Mobile menu button */}
        <button className="md:hidden text-foreground" onClick={() => setMobileOpen(!mobileOpen)}>
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-border bg-card/95 backdrop-blur-md px-4 py-4 space-y-3 animate-fade-in">
          <Link to="/buscar" onClick={() => setMobileOpen(false)} className="block text-sm text-foreground py-2">Buscar</Link>
          <Link to="/planos" onClick={() => setMobileOpen(false)} className="block text-sm text-foreground py-2">Planos</Link>
          <Link to="/sobre" onClick={() => setMobileOpen(false)} className="block text-sm text-foreground py-2">Sobre</Link>
          <div className="border-t border-border pt-3">
            {user ? (
              <>
                <Link to={dashboardPath} onClick={() => setMobileOpen(false)} className="block text-sm text-foreground py-2">Dashboard</Link>
                <button onClick={() => { signOut(); setMobileOpen(false); }} className="block text-sm text-muted-foreground py-2">Sair</button>
              </>
            ) : (
              <>
                <Link to="/login" onClick={() => setMobileOpen(false)} className="block text-sm text-foreground py-2">Entrar</Link>
                <Link to="/cadastro" onClick={() => setMobileOpen(false)} className="block text-sm text-primary font-medium py-2">Cadastrar</Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
