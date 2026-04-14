import { Outlet, Link, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import PageTransition from "@/components/shared/PageTransition";
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
import BrandLogo from "@/components/shared/BrandLogo";

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
    <nav className="flex flex-col gap-0.5" aria-label="Dashboard navigation">
      {items.map((item) => {
        const isActive = location.pathname === item.path;
        return (
          <Link
            key={item.path}
            to={item.path}
            onClick={onNavigate}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "group/nav relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all duration-200",
              isActive
                ? "bg-primary/12 text-primary font-medium shadow-[inset_0_0_0_1px_hsl(var(--primary)_/_0.15)]"
                : "text-muted-foreground hover:bg-accent/40 hover:text-foreground"
            )}
          >
            {/* Active indicator bar */}
            {isActive && (
              <motion.div
                layoutId="sidebar-indicator"
                className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-[3px] rounded-full bg-primary"
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
              />
            )}
            <span className={cn(
              "transition-colors duration-200",
              isActive ? "text-primary" : "text-muted-foreground group-hover/nav:text-foreground"
            )}>
              {item.icon}
            </span>
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

interface DashboardLayoutProps {
  role: "client" | "escort" | "admin";
}

export default function DashboardLayout({ role }: DashboardLayoutProps) {
  const { signOut, user } = useAuth();
  const { t } = useLanguage();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navItems = useNavItems(role);
  const roleLabel = role === "admin" ? t("dash.role_admin") : role === "escort" ? t("dash.role_escort") : t("dash.role_client");

  const sidebarContent = (
    <>
      <div className="flex h-16 items-center justify-between px-6 border-b border-border/40">
        <Link to="/" className="shrink-0" aria-label="Velvet Escorts VIP — Home">
          <BrandLogo imgClassName="h-9" />
        </Link>
        <button
          className="md:hidden text-muted-foreground hover:text-foreground transition-colors rounded-lg p-1"
          onClick={() => setSidebarOpen(false)}
          aria-label="Close sidebar"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="px-4 py-3">
        <span className="inline-flex items-center rounded-full bg-primary/10 border border-primary/20 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-primary">
          {roleLabel}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-1">
        <SidebarNav items={navItems} onNavigate={() => setSidebarOpen(false)} />
      </div>

      <div className="border-t border-border/40 p-4 space-y-2">
        <div className="flex items-center gap-3 px-1">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold uppercase">
            {user?.email?.charAt(0) || "?"}
          </div>
          <p className="truncate text-xs text-muted-foreground flex-1">{user?.email}</p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
          onClick={signOut}
        >
          <LogOut className="h-4 w-4" />
          {t("dash.signout")}
        </Button>
      </div>
    </>
  );

  return (
    <div className="flex min-h-screen bg-background">
      {/* Mobile header */}
      <div className="fixed top-0 left-0 right-0 z-50 flex h-14 items-center justify-between border-b border-border/40 bg-card/95 px-4 backdrop-blur-md md:hidden shadow-[0_1px_8px_hsl(274_36%_4%_/_0.3)]">
        <Link to="/" className="shrink-0" aria-label="Velvet Escorts VIP — Home">
          <BrandLogo imgClassName="h-8" />
        </Link>
        <button
          onClick={() => setSidebarOpen(true)}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-foreground hover:bg-accent/40 transition-colors"
          aria-label="Open menu"
          aria-expanded={sidebarOpen}
        >
          <Menu className="h-5 w-5" />
        </button>
      </div>

      {/* Mobile overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <div className="fixed inset-0 z-50 md:hidden">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-0 bg-background/60 backdrop-blur-sm"
              onClick={() => setSidebarOpen(false)}
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
              className="absolute inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-border/40 bg-card shadow-[8px_0_32px_hsl(274_36%_4%_/_0.5)]"
            >
              {sidebarContent}
            </motion.aside>
          </div>
        )}
      </AnimatePresence>

      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-border/40 bg-card md:flex">
        {sidebarContent}
      </aside>

      <main className="flex-1 p-4 pt-18 md:ml-64 md:p-8 md:pt-8 lg:p-10">
        <AnimatePresence mode="wait">
          <PageTransition key={location.pathname}>
            <Outlet />
          </PageTransition>
        </AnimatePresence>
      </main>
    </div>
  );
}
