import { useLanguage } from "@/i18n/LanguageContext";
import { usePageMeta } from "@/hooks/usePageMeta";

export default function AboutPage() {
  const { t } = useLanguage();

  usePageMeta({
    title: t("about.title"),
    description: "Learn about Rubi Girls — a premium platform for independent professionals across Europe. Our mission, values and commitment to privacy.",
    path: "/sobre",
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "AboutPage",
      name: "About Rubi Girls",
      url: "https://rubi-marketplace-euro.lovable.app/sobre",
    },
  });

  return (
    <div className="container mx-auto max-w-3xl px-4 py-12 animate-fade-in">
      <h1 className="font-display text-4xl font-bold text-foreground">{t("about.title")}</h1>
      <div className="mt-8 space-y-6 text-muted-foreground leading-relaxed">
        <p>{t("about.p1")}</p>
        <p>{t("about.p2")}</p>
        <p>{t("about.p3")}</p>
      </div>
    </div>
  );
}
