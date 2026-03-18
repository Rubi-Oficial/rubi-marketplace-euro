import { Outlet, Link, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  Heart,
  Settings,
  LogOut,
  FileText,
  Image,
  CreditCard,
  Users,
  Shield,
  BarChart3,
  Link2,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
}

const clientNav: NavItem[] = [
  { label: "Painel", path: "/client", icon: <LayoutDashboard className="h-4 w-4" /> },
  { label: "Favoritos", path: "/client/favorites", icon: <Heart className="h-4 w-4" /> },
  { label: "Configurações", path: "/client/settings", icon: <Settings className="h-4 w-4" /> },
];

const escortNav: NavItem[] = [
  { label: "Painel", path: "/escort", icon: <LayoutDashboard className="h-4 w-4" /> },
  { label: "Meu Anúncio", path: "/escort/listing", icon: <FileText className="h-4 w-4" /> },
  { label: "Fotos", path: "/escort/photos", icon: <Image className="h-4 w-4" /> },
  { label: "Assinatura", path: "/escort/subscription", icon: <CreditCard className="h-4 w-4" /> },
  { label: "Configurações", path: "/escort/settings", icon: <Settings className="h-4 w-4" /> },
];

const adminNav: NavItem[] = [
  { label: "Painel", path: "/admin", icon: <LayoutDashboard className="h-4 w-4" /> },
  { label: "Moderação", path: "/admin/moderation", icon: <Shield className="h-4 w-4" /> },
  { label: "Usuários", path: "/admin/users", icon: <Users className="h-4 w-4" /> },
  { label: "Analytics", path: "/admin/analytics", icon: <BarChart3 className="h-4 w-4" /> },
  { label: "Afiliados", path: "/admin/affiliates", icon: <Link2 className="h-4 w-4" /> },
];

function SidebarNav({ items }: { items: NavItem[] }) {
  const location = useLocation();

  return (
    <nav className="flex flex-col gap-1">
      {items.map((item) => (
        <Link
          key={item.path}
          to={item.path}
          className={cn(
            "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
            location.pathname === item.path
              ? "bg-primary/10 text-primary font-medium"
              : "text-muted-foreground hover:bg-accent hover:text-foreground"
          )}
        >
          {item.icon}
          {item.label}
        </Link>
      ))}
    </nav>
  );
}

interface DashboardLayoutProps {
  role: "client" | "escort" | "admin";
}

export default function DashboardLayout({ role }: DashboardLayoutProps) {
  const { signOut, user } = useAuth();
  const navItems = role === "admin" ? adminNav : role === "escort" ? escortNav : clientNav;
  const roleLabel = role === "admin" ? "Administrador" : role === "escort" ? "Acompanhante" : "Cliente";

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 flex w-60 flex-col border-r border-border bg-card">
        <div className="flex h-16 items-center px-6">
          <Link to="/" className="font-display text-xl font-bold tracking-tight text-primary">
            AURA
          </Link>
        </div>

        <div className="px-4 pb-2">
          <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {roleLabel}
          </span>
        </div>

        <div className="flex-1 overflow-y-auto px-3">
          <SidebarNav items={navItems} />
        </div>

        <div className="border-t border-border p-4">
          <div className="mb-3 truncate text-sm text-muted-foreground">
            {user?.email}
          </div>
          <Button variant="ghost" size="sm" className="w-full justify-start" onClick={signOut}>
            <LogOut className="mr-2 h-4 w-4" />
            Sair
          </Button>
        </div>
      </aside>

      {/* Main content */}
      <main className="ml-60 flex-1 p-8">
        <Outlet />
      </main>
    </div>
  );
}
