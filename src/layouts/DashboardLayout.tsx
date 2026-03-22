import { Outlet, Link, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/i18n/LanguageContext";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard, Settings, LogOut, FileText, Image, CreditCard,
  Users, UserCog, Shield, BarChart3, Link2, Heart, ClipboardList,
  Wallet, LineChart, Menu, X, Mail, Eye,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useMemo } from "react";

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
}

function useNavItems(role: "client" | "escort" | "admin") {
  const { t } = useLanguage();

  return useMemo(() => {
    if (role === "client") return [
      { label: t("dash.panel"), path: "/cliente", icon: <LayoutDashboard className="h-4 w-4" /> },
      { label: "Favoritos", path: "/cliente/favoritos", icon: <Heart className="h-4 w-4" /> },
      { label: t("dash.affiliates"), path: "/cliente/afiliados", icon: <Link2 className="h-4 w-4" /> },
      { label: t("dash.settings"), path: "/cliente/configuracoes", icon: <Settings className="h-4 w-4" /> },
    ];
    if (role === "escort") return [
      { label: t("dash.panel"), path: "/app", icon: <LayoutDashboard className="h-4 w-4" /> },
      { label: t("dash.my_profile"), path: "/app/perfil", icon: <FileText className="h-4 w-4" /> },
      { label: t("dash.photos_videos"), path: "/app/fotos", icon: <Image className="h-4 w-4" /> },
      { label: t("dash.preview"), path: "/app/preview", icon: <Eye className="h-4 w-4" /> },
      { label: t("dash.plan"), path: "/app/plano", icon: <CreditCard className="h-4 w-4" /> },
      { label: t("dash.metrics"), path: "/app/metricas", icon: <LineChart className="h-4 w-4" /> },
      { label: t("dash.affiliates"), path: "/app/afiliados", icon: <Link2 className="h-4 w-4" /> },
      { label: t("dash.settings"), path: "/app/configuracoes", icon: <Settings className="h-4 w-4" /> },
    ];
    return [
      { label: t("dash.panel"), path: "/admin", icon: <LayoutDashboard className="h-4 w-4" /> },
      { label: t("dash.profiles"), path: "/admin/perfis", icon: <Users className="h-4 w-4" /> },
      { label: "Usuários", path: "/admin/usuarios", icon: <UserCog className="h-4 w-4" /> },
      { label: t("dash.pending"), path: "/admin/perfis/pendentes", icon: <Shield className="h-4 w-4" /> },
      { label: t("dash.messages"), path: "/admin/mensagens", icon: <Mail className="h-4 w-4" /> },
      { label: t("dash.plans"), path: "/admin/planos", icon: <ClipboardList className="h-4 w-4" /> },
      { label: t("dash.payments"), path: "/admin/pagamentos", icon: <Wallet className="h-4 w-4" /> },
      { label: t("dash.affiliates"), path: "/admin/afiliados", icon: <Link2 className="h-4 w-4" /> },
      { label: t("dash.reports"), path: "/admin/relatorios", icon: <BarChart3 className="h-4 w-4" /> },
      { label: t("dash.settings"), path: "/admin/configuracoes", icon: <Settings className="h-4 w-4" /> },
    ];
  }, [role, t]);
}

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
  const { t } = useLanguage();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navItems = useNavItems(role);
  const roleLabel = role === "admin" ? t("dash.role_admin") : role === "escort" ? t("dash.role_escort") : t("dash.role_client");

  const sidebarContent = (
    <>
      <div className="flex h-16 items-center justify-between px-6">
        <Link to="/" className="font-display text-xl font-bold tracking-tight text-primary">
          <span className="font-bold">Rubi</span> <span className="font-medium text-foreground/80">Girls</span>
        </Link>
        <button className="md:hidden text-muted-foreground" onClick={() => setSidebarOpen(false)}>
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="px-4 pb-2">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{roleLabel}</p>
      </div>

      <div className="flex-1 overflow-y-auto px-3">
        <SidebarNav items={navItems} onNavigate={() => setSidebarOpen(false)} />
      </div>

      <div className="border-t border-border p-4">
        <p className="mb-2 truncate text-xs text-muted-foreground">{user?.email}</p>
        <Button variant="ghost" size="sm" className="w-full justify-start gap-2 text-muted-foreground" onClick={signOut}>
          <LogOut className="h-4 w-4" />
          {t("dash.signout")}
        </Button>
      </div>
    </>
  );

  return (
    <div className="flex min-h-screen bg-background">
      <div className="fixed top-0 left-0 right-0 z-50 flex h-14 items-center justify-between border-b border-border bg-card px-4 md:hidden">
        <Link to="/" className="font-display text-lg font-bold text-primary">
          <span className="font-bold">Rubi</span> <span className="font-medium text-foreground/80">Girls</span>
        </Link>
        <button onClick={() => setSidebarOpen(true)} className="text-foreground">
          <Menu className="h-5 w-5" />
        </button>
      </div>

      {sidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
          <aside className="absolute inset-y-0 left-0 z-50 flex w-60 flex-col border-r border-border bg-card animate-fade-in">
            {sidebarContent}
          </aside>
        </div>
      )}

      <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 flex-col border-r border-border bg-card md:flex">
        {sidebarContent}
      </aside>

      <main className="flex-1 p-4 pt-20 md:ml-60 md:p-8 md:pt-8">
        <Outlet />
      </main>
    </div>
  );
}
