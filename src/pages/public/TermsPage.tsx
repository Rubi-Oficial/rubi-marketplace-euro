import { useLanguage } from "@/i18n/LanguageContext";
import { usePageMeta } from "@/hooks/usePageMeta";

export default function TermsPage() {
  const { t } = useLanguage();

  usePageMeta({
    title: t("terms.title"),
    description: "Rubi Girls Terms of Use. Read our terms and conditions for using the platform.",
    path: "/termos",
  });

  return (
    <div className="container mx-auto max-w-3xl px-4 py-12 animate-fade-in">
      <h1 className="font-display text-4xl font-bold text-foreground">{t("terms.title")}</h1>
      <div className="mt-8 space-y-4 text-sm text-muted-foreground leading-relaxed">
        <p>{t("terms.updated")}</p>
        <p>{t("terms.p1")}</p>
        <p>{t("terms.p2")}</p>
      </div>
    </div>
  );
}
