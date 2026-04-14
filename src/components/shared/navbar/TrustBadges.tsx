import { Shield, Lock, HeadphonesIcon } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";

interface TrustBadgesProps {
  size?: "sm" | "md";
}

export default function TrustBadges({ size = "md" }: TrustBadgesProps) {
  const { t } = useLanguage();
  const iconSize = size === "sm" ? "h-2.5 w-2.5" : "h-3 w-3";
  const iconColor = size === "sm" ? "text-primary/40" : "text-primary/50";
  const textColor = size === "sm" ? "text-muted-foreground/60" : "text-muted-foreground/70";

  return (
    <>
      <span className={`flex items-center gap-1 text-[10px] ${textColor}`}>
        <Shield className={`${iconSize} ${iconColor}`} />
        {t("landing.quick_trust_verified")}
      </span>
      <span className={`flex items-center gap-1 text-[10px] ${textColor}`}>
        <Lock className={`${iconSize} ${iconColor}`} />
        {t("landing.quick_trust_privacy")}
      </span>
      <span className={`flex items-center gap-1 text-[10px] ${textColor}`}>
        <HeadphonesIcon className={`${iconSize} ${iconColor}`} />
        {t("landing.quick_trust_support")}
      </span>
    </>
  );
}
