import { useLanguage } from "@/i18n/LanguageContext";

export default function PrivacyPage() {
  const { t } = useLanguage();

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
