import { Link } from "react-router-dom";
import { useAuth, getRoleDashboard } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { LogOut, LayoutDashboard, CreditCard, Megaphone } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import { LanguageSelectorDropdown } from "./LanguageSelector";

export default function DesktopNav() {
  const { user, userRole, signOut } = useAuth();
  const { t } = useLanguage();
  const dashboardPath = getRoleDashboard(userRole as any);

  return (
    <>
      {/* Quick access links */}
      <div className="hidden lg:flex items-center gap-1 shrink-0">
        <Button variant="ghost" size="sm" asChild className="text-[12px] rounded-full h-8 px-3 text-muted-foreground hover:text-foreground">
          <Link to="/planos">
            <CreditCard className="mr-1 h-3 w-3" />
            {t("landing.quick_plans")}
          </Link>
        </Button>
        <Button variant="ghost" size="sm" asChild className="text-[12px] rounded-full h-8 px-3 text-muted-foreground hover:text-foreground">
          <Link to="/cadastro?role=professional">
            <Megaphone className="mr-1 h-3 w-3" />
            {t("landing.quick_publish")}
          </Link>
        </Button>
      </div>

      {/* Auth + language */}
      <div className="hidden md:flex items-center gap-2 shrink-0">
        <LanguageSelectorDropdown />

        {user ? (
          <>
            <Button variant="ghost" size="sm" asChild className="text-[13px] rounded-full">
              <Link to={dashboardPath}>
                <LayoutDashboard className="mr-1.5 h-3.5 w-3.5" />
                {t("nav.dashboard")}
              </Link>
            </Button>
            <Button variant="ghost" size="icon" onClick={signOut} className="h-8 w-8 rounded-full" aria-label={t("nav.sign_out")}>
              <LogOut className="h-3.5 w-3.5" />
            </Button>
          </>
        ) : (
          <>
            <Button variant="ghost" size="sm" asChild className="text-[13px] rounded-full">
              <Link to="/login">{t("nav.sign_in")}</Link>
            </Button>
            <Button variant="premium" size="sm" asChild className="text-[13px] h-8 px-4 rounded-full shadow-md">
              <Link to="/cadastro">{t("nav.get_started")}</Link>
            </Button>
          </>
        )}
      </div>
    </>
  );
}
