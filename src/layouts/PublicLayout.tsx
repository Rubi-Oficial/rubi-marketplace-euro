import { Outlet } from "react-router-dom";
import Navbar from "@/components/shared/Navbar";
import { Link } from "react-router-dom";
import { useLanguage } from "@/i18n/LanguageContext";
import logoRubiGirls from "@/assets/logo-rubi-girls.png";

export default function PublicLayout() {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-[6.5rem]">
        <main>
          <Outlet />
        </main>
      </div>
      <footer className="border-t border-border/50 py-10 mt-8 bg-secondary/30">
        <div className="container mx-auto px-4">
          <div className="grid gap-10 md:grid-cols-4">
            <div>
              <Link to="/" className="inline-block">
                <img src={logoRubiGirls} alt="Rubi Girls" className="h-6" />
              </Link>
              <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
                {t("footer.desc")}
              </p>
            </div>
            <div>
              <h4 className="font-display text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t("footer.platform")}</h4>
              <nav className="mt-4 flex flex-col gap-2.5 text-sm text-muted-foreground">
                <Link to="/buscar" className="hover:text-foreground transition-colors">{t("footer.explore")}</Link>
                <Link to="/planos" className="hover:text-foreground transition-colors">{t("footer.plans")}</Link>
                <Link to="/blog" className="hover:text-foreground transition-colors">{t("footer.blog")}</Link>
              </nav>
            </div>
            <div>
              <h4 className="font-display text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t("footer.company")}</h4>
              <nav className="mt-4 flex flex-col gap-2.5 text-sm text-muted-foreground">
                <Link to="/sobre" className="hover:text-foreground transition-colors">{t("footer.about")}</Link>
                <Link to="/contato" className="hover:text-foreground transition-colors">{t("footer.contact")}</Link>
              </nav>
            </div>
            <div>
              <h4 className="font-display text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t("footer.legal")}</h4>
              <nav className="mt-4 flex flex-col gap-2.5 text-sm text-muted-foreground">
                <Link to="/termos" className="hover:text-foreground transition-colors">{t("footer.terms")}</Link>
                <Link to="/privacidade" className="hover:text-foreground transition-colors">{t("footer.privacy")}</Link>
                <Link to="/cookies" className="hover:text-foreground transition-colors">{t("footer.cookies")}</Link>
              </nav>
            </div>
          </div>
          <div className="mt-8 border-t border-border/20 pt-5 text-center text-xs text-muted-foreground">
            © {new Date().getFullYear()} Rubi Girls. {t("footer.rights")}
          </div>
        </div>
      </footer>
    </div>
  );
}
