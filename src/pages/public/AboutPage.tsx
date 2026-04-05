import { useLanguage } from "@/i18n/LanguageContext";
import { usePageMeta, SITE_URL } from "@/hooks/usePageMeta";
import { Link } from "react-router-dom";

export default function AboutPage() {
  const { t } = useLanguage();

  usePageMeta({
    title: t("about.title"),
    description: "Learn about Rubi Girls — a premium platform for independent professionals across Europe. Our mission, values and commitment to privacy.",
    path: "/sobre",
    breadcrumbs: [
      { name: "Home", url: SITE_URL },
      { name: t("about.title"), url: `${SITE_URL}/sobre` },
    ],
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "AboutPage",
      name: "About Rubi Girls",
      url: `${SITE_URL}/sobre`,
      mainEntity: {
        "@type": "Organization",
        name: "Rubi Girls",
        url: SITE_URL,
      },
    },
  });

  return (
    <div className="container mx-auto max-w-3xl px-4 py-12 animate-fade-in">
      <nav aria-label="Breadcrumb" className="mb-6 text-xs text-muted-foreground">
        <ol className="flex items-center gap-1.5">
          <li><Link to="/" className="hover:text-foreground transition-colors">Home</Link></li>
          <li className="text-border">/</li>
          <li className="text-foreground">{t("about.title")}</li>
        </ol>
      </nav>

      <h1 className="font-display text-4xl font-bold text-foreground">{t("about.title")}</h1>
      <div className="mt-8 space-y-6 text-muted-foreground leading-relaxed">
        <p>{t("about.p1")}</p>
        <p>{t("about.p2")}</p>
        <p>{t("about.p3")}</p>
      </div>
    </div>
  );
}