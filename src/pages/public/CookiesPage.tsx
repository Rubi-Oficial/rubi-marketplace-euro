import { useLanguage } from "@/i18n/LanguageContext";
import { usePageMeta } from "@/hooks/usePageMeta";

export default function CookiesPage() {
  const { t } = useLanguage();

  usePageMeta({
    title: t("cookies.title"),
    description: "Rubi Girls Cookie Policy. Understand how we use cookies to improve your experience.",
    path: "/cookies",
  });

  return (
    <div className="container mx-auto max-w-3xl px-4 py-12 animate-fade-in">
      <h1 className="font-display text-4xl font-bold text-foreground">{t("cookies.title")}</h1>
      <div className="mt-8 space-y-4 text-sm text-muted-foreground leading-relaxed">
        <p>{t("cookies.updated")}</p>
        <p>{t("cookies.p1")}</p>
        <p>{t("cookies.p2")}</p>
      </div>
    </div>
  );
}
