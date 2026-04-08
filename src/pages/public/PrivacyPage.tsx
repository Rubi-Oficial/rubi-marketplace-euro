import { useLanguage } from "@/i18n/LanguageContext";
import { usePageMeta, SITE_URL } from "@/hooks/usePageMeta";
import { Link } from "react-router-dom";

export default function PrivacyPage() {
  const { t } = useLanguage();

  usePageMeta({
    title: t("privacy.title"),
    description: "the platform Privacy Policy. Learn how we protect your personal data in compliance with GDPR.",
    path: "/privacidade",
    breadcrumbs: [
      { name: "Home", url: SITE_URL },
      { name: t("privacy.title"), url: `${SITE_URL}/privacidade` },
    ],
  });

  return (
    <div className="container mx-auto max-w-3xl px-4 py-12 animate-fade-in">
      <nav aria-label="Breadcrumb" className="mb-6 text-xs text-muted-foreground">
        <ol className="flex items-center gap-1.5">
          <li><Link to="/" className="hover:text-foreground transition-colors">Home</Link></li>
          <li className="text-border">/</li>
          <li className="text-foreground">{t("privacy.title")}</li>
        </ol>
      </nav>

      <h1 className="font-display text-4xl font-bold text-foreground">{t("privacy.title")}</h1>
      <div className="mt-8 space-y-4 text-sm text-muted-foreground leading-relaxed">
        <p>{t("privacy.updated")}</p>
        <p>{t("privacy.p1")}</p>
        <p>{t("privacy.p2")}</p>
      </div>
    </div>
  );
}