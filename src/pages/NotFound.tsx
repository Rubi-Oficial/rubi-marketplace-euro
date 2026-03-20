import { Link, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";

const NotFound = () => {
  const location = useLocation();
  const { t } = useLanguage();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
    document.title = `${t("notfound.title")} | AURA`;
    return () => { document.title = "AURA"; };
  }, [location.pathname, t]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="text-center">
        <p className="font-display text-7xl font-bold text-primary">{t("notfound.code")}</p>
        <h1 className="mt-4 font-display text-2xl font-bold text-foreground">
          {t("notfound.title")}
        </h1>
        <p className="mt-2 text-muted-foreground">
          {t("notfound.desc")}
        </p>
        <Button variant="outline" className="mt-6" asChild>
          <Link to="/">
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t("notfound.back")}
          </Link>
        </Button>
      </div>
    </div>
  );
};

export default NotFound;
