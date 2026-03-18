import { Link } from "react-router-dom";
import { useAuth, getRoleDashboard } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { LogOut, LayoutDashboard, Search } from "lucide-react";

export default function Navbar() {
  const { user, userRole, signOut } = useAuth();

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

        <div className="flex items-center gap-3">
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
      </div>
    </nav>
  );
}
