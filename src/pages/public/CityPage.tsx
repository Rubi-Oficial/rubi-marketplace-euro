import { useParams, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { fetchEligibleProfiles, fetchServices, ProfileCard, type EligibleProfile } from "@/components/public/ProfileCard";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useLocations } from "@/hooks/useLocations";
import { useLanguage } from "@/i18n/LanguageContext";

export default function CityPage() {
  const { t } = useLanguage();
  const { slug } = useParams();
  const [profiles, setProfiles] = useState<EligibleProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [services, setServices] = useState<{ id: string; name: string; slug: string }[]>([]);
  const [activeService, setActiveService] = useState<string>("");

  const { cities, countries } = useLocations();
  const cityObj = cities.find((c) => c.slug === slug);
  const cityName = cityObj?.name || slug?.replace(/-/g, " ") || "";
  const countryObj = cityObj ? countries.find((c) => c.id === cityObj.country_id) : null;

  useEffect(() => { fetchServices().then(setServices); }, []);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    fetchEligibleProfiles({
      city_slug: slug,
      service_slug: activeService || undefined,
    }).then((data) => { setProfiles(data); setLoading(false); });
  }, [slug, activeService]);

  useEffect(() => {
    document.title = `${cityName} | Rubi Girls`;
    const desc = document.querySelector('meta[name="description"]');
    if (desc) desc.setAttribute("content", `Find verified professionals in ${cityName}. Browse profiles with photos and direct contact.`);
    return () => { document.title = "Rubi Girls"; };
  }, [cityName]);

  return (
    <div className="container mx-auto px-4 py-6 animate-fade-in">
      <div className="mb-4">
        <Link to="/buscar" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mb-3 transition-colors">
          <ArrowLeft className="h-3 w-3" /> {t("city.back")}
        </Link>
        <h1 className="font-display text-xl font-bold text-foreground capitalize sm:text-2xl">{cityName}</h1>
        {countryObj && (
          <p className="text-xs text-muted-foreground mt-0.5">{countryObj.name}</p>
        )}
        <p className="mt-0.5 text-xs text-muted-foreground">
          {loading ? t("search.loading") : `${profiles.length} ${t("category.profiles")}`}
        </p>
      </div>

      {services.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-5">
          <button
            onClick={() => setActiveService("")}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
              !activeService ? "bg-primary text-primary-foreground" : "bg-card border border-border/40 text-muted-foreground hover:border-primary/30 hover:text-foreground"
            }`}
          >
            {t("city.all")}
          </button>
          {services.map((s) => (
            <button
              key={s.slug}
              onClick={() => setActiveService(activeService === s.slug ? "" : s.slug)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
                activeService === s.slug ? "bg-primary text-primary-foreground" : "bg-card border border-border/40 text-muted-foreground hover:border-primary/30 hover:text-foreground"
              }`}
            >
              {s.name}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="aspect-[3/4] animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      ) : profiles.length === 0 ? (
        <div className="rounded-xl border border-border/30 bg-card/50 p-16 text-center">
          <p className="text-muted-foreground">{t("city.no_profiles")}{activeService ? t("city.no_service") : t("city.no_city")}.</p>
          {activeService && (
            <Button variant="ghost" size="sm" className="mt-4" onClick={() => setActiveService("")}>{t("city.clear_filter")}</Button>
          )}
          <Button variant="ghost" size="sm" className="mt-4" asChild>
            <Link to="/buscar">{t("category.browse_all")}</Link>
          </Button>
        </div>
      ) : (
        <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {profiles.map((p) => (
            <ProfileCard key={p.id} profile={p} />
          ))}
        </div>
      )}

      <div className="mt-14 mx-auto max-w-lg text-center">
        <h2 className="font-display text-lg font-semibold text-foreground">{t("city.cta_title", { city: cityName })}</h2>
        <p className="mt-1.5 text-sm text-muted-foreground">{t("city.cta_desc")}</p>
        <Button variant="premium" className="mt-4" asChild>
          <Link to="/cadastro?role=professional">
            {t("nav.get_started")} <ArrowRight className="ml-1.5 h-4 w-4" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
