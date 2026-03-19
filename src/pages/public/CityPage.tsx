import { useParams, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { fetchEligibleProfiles, fetchServices, ProfileCard, type EligibleProfile } from "@/components/public/ProfileCard";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { CITIES } from "@/components/onboarding/types";

export default function CityPage() {
  const { slug } = useParams();
  const [profiles, setProfiles] = useState<EligibleProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [services, setServices] = useState<{ id: string; name: string; slug: string }[]>([]);
  const [activeService, setActiveService] = useState<string>("");

  const cityObj = CITIES.find((c) => c.slug === slug);
  const cityName = cityObj?.name || slug?.replace(/-/g, " ") || "";

  useEffect(() => {
    fetchServices().then(setServices);
  }, []);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    fetchEligibleProfiles({
      city_slug: slug,
      service_slug: activeService || undefined,
    }).then((data) => {
      setProfiles(data);
      setLoading(false);
    });
  }, [slug, activeService]);

  useEffect(() => {
    document.title = `Professionals in ${cityName} | AURA`;
    const desc = document.querySelector('meta[name="description"]');
    if (desc) desc.setAttribute("content", `Find verified professionals in ${cityName}. Browse profiles with photos and direct contact.`);
    return () => { document.title = "AURA"; };
  }, [cityName]);

  return (
    <div className="container mx-auto px-4 py-6 animate-fade-in">
      <div className="mb-6">
        <Link to="/buscar" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mb-3 transition-colors">
          <ArrowLeft className="h-3 w-3" /> Back to explore
        </Link>
        <h1 className="font-display text-xl font-bold text-foreground capitalize sm:text-2xl">
          Professionals in {cityName}
        </h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          {loading ? "Loading..." : `${profiles.length} profile(s) found`}
        </p>
      </div>

      {/* Service filter chips */}
      {services.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-6">
          <button
            onClick={() => setActiveService("")}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
              !activeService
                ? "bg-primary text-primary-foreground"
                : "bg-card border border-border/40 text-muted-foreground hover:border-primary/30 hover:text-foreground"
            }`}
          >
            All
          </button>
          {services.map((s) => (
            <button
              key={s.slug}
              onClick={() => setActiveService(activeService === s.slug ? "" : s.slug)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
                activeService === s.slug
                  ? "bg-primary text-primary-foreground"
                  : "bg-card border border-border/40 text-muted-foreground hover:border-primary/30 hover:text-foreground"
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
        <div className="rounded-xl border border-border/40 bg-card/50 p-16 text-center">
          <p className="text-muted-foreground">No profiles found{activeService ? " for this service" : " in this city"}.</p>
          <Button variant="ghost" size="sm" className="mt-4" onClick={() => setActiveService("")}>
            {activeService ? "Clear filter" : ""}
          </Button>
          <Button variant="ghost" size="sm" className="mt-4" asChild>
            <Link to="/buscar">Browse all profiles</Link>
          </Button>
        </div>
      ) : (
        <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {profiles.map((p) => (
            <ProfileCard key={p.id} profile={p} />
          ))}
        </div>
      )}

      <div className="mt-16 mx-auto max-w-lg text-center">
        <h2 className="font-display text-lg font-semibold text-foreground">Professional in {cityName}?</h2>
        <p className="mt-1.5 text-sm text-muted-foreground">Create your profile and reach new clients.</p>
        <Button variant="premium" className="mt-4" asChild>
          <Link to="/cadastro?role=professional">
            Get Started <ArrowRight className="ml-1.5 h-4 w-4" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
