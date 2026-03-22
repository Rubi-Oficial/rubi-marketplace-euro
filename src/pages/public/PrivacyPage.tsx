import { useLanguage } from "@/i18n/LanguageContext";
import { usePageMeta } from "@/hooks/usePageMeta";

export default function PrivacyPage() {
  const { t } = useLanguage();

  usePageMeta({
    title: t("privacy.title"),
    description: "Rubi Girls Privacy Policy. Learn how we protect your personal data in compliance with GDPR.",
    path: "/privacidade",
  });

  return (
    <div className="container mx-auto max-w-3xl px-4 py-12 animate-fade-in">
      <h1 className="font-display text-4xl font-bold text-foreground">{t("privacy.title")}</h1>
      <div className="mt-8 space-y-4 text-sm text-muted-foreground leading-relaxed">
        <p>{t("privacy.updated")}</p>
        <p>{t("privacy.p1")}</p>
        <p>{t("privacy.p2")}</p>
      </div>
    </div>
  );
}
