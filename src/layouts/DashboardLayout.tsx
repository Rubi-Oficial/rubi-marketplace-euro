import { Outlet, Link, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  Settings,
  LogOut,
  FileText,
  Image,
  CreditCard,
  Users,
  Shield,
  BarChart3,
  Link2,
  ClipboardList,
  Wallet,
  LineChart,
  Menu,
  X,
  Mail,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
}

const clientNav: NavItem[] = [
  { label: "Painel", path: "/cliente", icon: <LayoutDashboard className="h-4 w-4" /> },
  { label: "Afiliados", path: "/cliente/afiliados", icon: <Link2 className="h-4 w-4" /> },
  { label: "Configurações", path: "/cliente/configuracoes", icon: <Settings className="h-4 w-4" /> },
];

const escortNav: NavItem[] = [
  { label: "Painel", path: "/app", icon: <LayoutDashboard className="h-4 w-4" /> },
  { label: "Meu Perfil", path: "/app/perfil", icon: <FileText className="h-4 w-4" /> },
  { label: "Fotos", path: "/app/fotos", icon: <Image className="h-4 w-4" /> },
  { label: "Plano", path: "/app/plano", icon: <CreditCard className="h-4 w-4" /> },
  { label: "Métricas", path: "/app/metricas", icon: <LineChart className="h-4 w-4" /> },
  { label: "Afiliados", path: "/app/afiliados", icon: <Link2 className="h-4 w-4" /> },
  { label: "Configurações", path: "/app/configuracoes", icon: <Settings className="h-4 w-4" /> },
];

const adminNav: NavItem[] = [
  { label: "Painel", path: "/admin", icon: <LayoutDashboard className="h-4 w-4" /> },
  { label: "Perfis", path: "/admin/perfis", icon: <Users className="h-4 w-4" /> },
  { label: "Pendentes", path: "/admin/perfis/pendentes", icon: <Shield className="h-4 w-4" /> },
  { label: "Planos", path: "/admin/planos", icon: <ClipboardList className="h-4 w-4" /> },
  { label: "Pagamentos", path: "/admin/pagamentos", icon: <Wallet className="h-4 w-4" /> },
  { label: "Afiliados", path: "/admin/afiliados", icon: <Link2 className="h-4 w-4" /> },
  { label: "Relatórios", path: "/admin/relatorios", icon: <BarChart3 className="h-4 w-4" /> },
  { label: "Configurações", path: "/admin/configuracoes", icon: <Settings className="h-4 w-4" /> },
];

function SidebarNav({ items, onNavigate }: { items: NavItem[]; onNavigate?: () => void }) {
  const location = useLocation();

  return (
    <nav className="flex flex-col gap-1">
      {items.map((item) => (
        <Link
          key={item.path}
          to={item.path}
          onClick={onNavigate}
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
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navItems = role === "admin" ? adminNav : role === "escort" ? escortNav : clientNav;
  const roleLabel = role === "admin" ? "Administrador" : role === "escort" ? "Acompanhante" : "Cliente";

  const sidebarContent = (
    <>
      <div className="flex h-16 items-center justify-between px-6">
        <Link to="/" className="font-display text-xl font-bold tracking-tight text-primary">
          AURA
        </Link>
        <button className="md:hidden text-muted-foreground" onClick={() => setSidebarOpen(false)}>
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="px-4 pb-2">
        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {roleLabel}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto px-3">
        <SidebarNav items={navItems} onNavigate={() => setSidebarOpen(false)} />
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
    </>
  );

  return (
    <div className="flex min-h-screen bg-background">
      {/* Mobile header */}
      <div className="fixed top-0 left-0 right-0 z-50 flex h-14 items-center justify-between border-b border-border bg-card px-4 md:hidden">
        <Link to="/" className="font-display text-lg font-bold text-primary">AURA</Link>
        <button onClick={() => setSidebarOpen(true)} className="text-foreground">
          <Menu className="h-5 w-5" />
        </button>
      </div>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
          <aside className="absolute inset-y-0 left-0 z-50 flex w-60 flex-col border-r border-border bg-card animate-fade-in">
            {sidebarContent}
          </aside>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 flex-col border-r border-border bg-card md:flex">
        {sidebarContent}
      </aside>

      <main className="flex-1 p-4 pt-20 md:ml-60 md:p-8 md:pt-8">
        <Outlet />
      </main>
    </div>
  );
}
