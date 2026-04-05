import { useLanguage } from "@/i18n/LanguageContext";
import { usePageMeta, SITE_URL } from "@/hooks/usePageMeta";
import { Link } from "react-router-dom";

export default function TermsPage() {
  const { t } = useLanguage();

  usePageMeta({
    title: t("terms.title"),
    description: "Rubi Girls Terms of Use. Read our terms and conditions for using the platform.",
    path: "/termos",
    breadcrumbs: [
      { name: "Home", url: SITE_URL },
      { name: t("terms.title"), url: `${SITE_URL}/termos` },
    ],
  });

  return (
    <div className="container mx-auto max-w-3xl px-4 py-12 animate-fade-in">
      <nav aria-label="Breadcrumb" className="mb-6 text-xs text-muted-foreground">
        <ol className="flex items-center gap-1.5">
          <li><Link to="/" className="hover:text-foreground transition-colors">Home</Link></li>
          <li className="text-border">/</li>
          <li className="text-foreground">{t("terms.title")}</li>
        </ol>
      </nav>

      <h1 className="font-display text-4xl font-bold text-foreground">{t("terms.title")}</h1>
      <div className="mt-8 space-y-4 text-sm text-muted-foreground leading-relaxed">
        <p>{t("terms.updated")}</p>
        <p>{t("terms.p1")}</p>
        <p>{t("terms.p2")}</p>
      </div>
    </div>
  );
}