import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, ArrowRight } from "lucide-react";
import { useReferralCapture } from "@/hooks/useReferralCapture";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchEligibleProfiles, fetchServices, ProfileCard, type EligibleProfile } from "@/components/public/ProfileCard";
import { CITIES } from "@/components/onboarding/types";

export default function LandingPage() {
  useReferralCapture();
  const navigate = useNavigate();

  const [profiles, setProfiles] = useState<EligibleProfile[]>([]);
  const [services, setServices] = useState<{ id: string; name: string; slug: string }[]>([]);
  const [searchValue, setSearchValue] = useState("");
  const [activeCity, setActiveCity] = useState("");
  const [activeService, setActiveService] = useState("");

  useEffect(() => {
    fetchServices().then(setServices);
  }, []);

  useEffect(() => {
    fetchEligibleProfiles({
      city_slug: activeCity || undefined,
      service_slug: activeService || undefined,
    }).then((data) => setProfiles(data.slice(0, 20)));
  }, [activeCity, activeService]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchValue.trim()) {
      navigate(`/buscar?q=${encodeURIComponent(searchValue.trim())}`);
    } else {
      navigate("/buscar");
    }
  };

  return (
    <div className="min-h-screen">
      {/* Compact hero */}
      <section className="relative pt-6 pb-4 sm:pt-8 sm:pb-6">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_hsl(350_65%_52%_/_0.06)_0%,_transparent_50%)]" />
        <div className="relative container mx-auto px-4 text-center animate-fade-in">
          <h1 className="font-display text-2xl font-bold text-foreground sm:text-3xl">
            <span className="text-primary">Rubi</span> Girls
          </h1>
          <p className="mx-auto mt-1.5 max-w-sm text-sm text-muted-foreground">
            Premium European catalogue. Browse, connect, book.
          </p>

          {/* Search */}
          <form onSubmit={handleSearch} className="mx-auto mt-5 flex max-w-lg gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by name, city..."
                className="pl-10 h-10 bg-card border-border/50"
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
              />
            </div>
            <Button type="submit" variant="premium" className="h-10 px-5">
              Search
            </Button>
          </form>
        </div>
      </section>

      {/* Filters */}
      <section className="border-b border-border/20 pb-4">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap items-center gap-1.5">
            {/* City filters */}
            {CITIES.map((city) => (
              <button
                key={city.slug}
                onClick={() => setActiveCity(activeCity === city.slug ? "" : city.slug)}
                className={`rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
                  activeCity === city.slug
                    ? "bg-primary text-primary-foreground"
                    : "bg-card border border-border/40 text-muted-foreground hover:border-primary/30 hover:text-foreground"
                }`}
              >
                {city.name}
              </button>
            ))}
            <span className="mx-1 h-4 w-px bg-border/30" />
            {/* Service filters */}
            {services.map((svc) => (
              <button
                key={svc.slug}
                onClick={() => setActiveService(activeService === svc.slug ? "" : svc.slug)}
                className={`rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
                  activeService === svc.slug
                    ? "bg-primary text-primary-foreground"
                    : "bg-card border border-border/40 text-muted-foreground hover:border-primary/30 hover:text-foreground"
                }`}
              >
                {svc.name}
              </button>
            ))}
            {(activeCity || activeService) && (
              <button
                onClick={() => { setActiveCity(""); setActiveService(""); }}
                className="text-xs text-primary hover:underline ml-1"
              >
                Clear
              </button>
            )}
            <Link
              to="/buscar"
              className="ml-auto text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Advanced search →
            </Link>
          </div>
        </div>
      </section>

      {/* Profiles grid */}
      <section className="py-6">
        <div className="container mx-auto px-4">
          {profiles.length > 0 ? (
            <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {profiles.map((p) => (
                <ProfileCard key={p.id} profile={p} />
              ))}
            </div>
          ) : (
            <div className="py-20 text-center text-muted-foreground text-sm">
              No profiles available at the moment.
            </div>
          )}

          {profiles.length > 0 && (
            <div className="mt-8 text-center">
              <Button variant="outline" asChild>
                <Link to="/buscar">
                  View all profiles <ArrowRight className="ml-1.5 h-4 w-4" />
                </Link>
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* Minimal CTA */}
      <section className="border-t border-border/20 py-10">
        <div className="container mx-auto px-4 text-center">
          <h2 className="font-display text-lg font-semibold text-foreground">
            Ready to grow your business?
          </h2>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Create your verified profile in minutes.
          </p>
          <Button variant="premium" className="mt-5" asChild>
            <Link to="/cadastro?role=professional">
              Create Your Profile <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
