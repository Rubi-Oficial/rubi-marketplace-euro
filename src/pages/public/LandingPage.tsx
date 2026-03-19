import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Shield, Star, Users, ArrowRight, Search, MapPin, ChevronRight } from "lucide-react";
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

  useEffect(() => {
    fetchEligibleProfiles().then((data) => setProfiles(data.slice(0, 12)));
    fetchServices().then(setServices);
  }, []);

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
      {/* Compact hero with search */}
      <section className="relative pb-6 pt-8 sm:pt-12 sm:pb-10">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_hsl(35_60%_55%_/_0.06)_0%,_transparent_50%)]" />
        <div className="relative container mx-auto px-4 text-center animate-fade-in">
          <h1 className="font-display text-3xl font-bold text-foreground sm:text-4xl md:text-5xl leading-[1.1]">
            Discover <span className="text-primary">top professionals</span>
          </h1>
          <p className="mx-auto mt-3 max-w-md text-sm text-muted-foreground sm:text-base">
            Verified profiles across Europe. Browse, connect, book.
          </p>

          {/* Search bar */}
          <form onSubmit={handleSearch} className="mx-auto mt-6 flex max-w-lg gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by name, city..."
                className="pl-10 h-11 bg-card border-border/60"
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
              />
            </div>
            <Button type="submit" variant="premium" className="h-11 px-6">
              Search
            </Button>
          </form>

          {/* Quick filters: cities + services */}
          <div className="mx-auto mt-4 flex max-w-2xl flex-wrap items-center justify-center gap-2">
            {CITIES.slice(0, 5).map((city) => (
              <Link
                key={city.slug}
                to={`/cidade/${city.slug}`}
                className="inline-flex items-center gap-1 rounded-full border border-border/50 bg-card/50 px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:border-primary/30 hover:text-foreground"
              >
                <MapPin className="h-3 w-3 text-primary/60" />
                {city.name}
              </Link>
            ))}
            {services.slice(0, 3).map((svc) => (
              <Link
                key={svc.slug}
                to={`/buscar?service=${svc.slug}`}
                className="inline-flex items-center rounded-full border border-border/50 bg-card/50 px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:border-primary/30 hover:text-foreground"
              >
                {svc.name}
              </Link>
            ))}
            <Link
              to="/buscar"
              className="inline-flex items-center gap-0.5 text-xs text-primary hover:underline"
            >
              View all <ChevronRight className="h-3 w-3" />
            </Link>
          </div>
        </div>
      </section>

      {/* Profiles grid */}
      {profiles.length > 0 && (
        <section className="pb-16">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-display text-lg font-semibold text-foreground sm:text-xl">
                Featured Profiles
              </h2>
              <Link
                to="/buscar"
                className="flex items-center gap-1 text-xs text-primary hover:underline"
              >
                View all <ArrowRight className="h-3 w-3" />
              </Link>
            </div>

            <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {profiles.map((p) => (
                <ProfileCard key={p.id} profile={p} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Browse by city */}
      <section className="border-t border-border/30 py-14">
        <div className="container mx-auto px-4">
          <h2 className="font-display text-lg font-semibold text-foreground sm:text-xl mb-6">
            Browse by City
          </h2>
          <div className="grid gap-2 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
            {CITIES.map((city) => (
              <Link
                key={city.slug}
                to={`/cidade/${city.slug}`}
                className="group flex items-center gap-3 rounded-lg border border-border/40 bg-card/50 p-3.5 transition-all hover:border-primary/30 hover:bg-card"
              >
                <MapPin className="h-4 w-4 text-primary/60 shrink-0 group-hover:text-primary transition-colors" />
                <span className="text-sm font-medium text-foreground truncate">{city.name}</span>
                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/40 ml-auto shrink-0 group-hover:text-muted-foreground transition-colors" />
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Browse by service */}
      {services.length > 0 && (
        <section className="border-t border-border/30 py-14">
          <div className="container mx-auto px-4">
            <h2 className="font-display text-lg font-semibold text-foreground sm:text-xl mb-6">
              Browse by Service
            </h2>
            <div className="grid gap-2 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
              {services.map((svc) => (
                <Link
                  key={svc.slug}
                  to={`/buscar?service=${svc.slug}`}
                  className="group flex items-center justify-between rounded-lg border border-border/40 bg-card/50 p-3.5 transition-all hover:border-primary/30 hover:bg-card"
                >
                  <span className="text-sm font-medium text-foreground">{svc.name}</span>
                  <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/40 group-hover:text-muted-foreground transition-colors" />
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Features */}
      <section className="border-t border-border/30 py-14">
        <div className="container mx-auto px-4">
          <div className="grid gap-6 sm:grid-cols-3">
            {[
              { icon: <Shield className="h-5 w-5" />, title: "Verified Profiles", desc: "Human-moderated. No fakes." },
              { icon: <Star className="h-5 w-5" />, title: "Premium Visibility", desc: "SEO-optimised with priority placement." },
              { icon: <Users className="h-5 w-5" />, title: "Affiliate Programme", desc: "Earn 15% on referrals." },
            ].map((f) => (
              <div key={f.title} className="flex items-start gap-3 p-3">
                <div className="shrink-0 rounded-md bg-primary/10 p-2 text-primary">{f.icon}</div>
                <div>
                  <h3 className="font-display text-sm font-semibold text-foreground">{f.title}</h3>
                  <p className="mt-0.5 text-xs text-muted-foreground">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-border/30 py-14">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-xl text-center">
            <h2 className="font-display text-xl font-bold text-foreground sm:text-2xl">
              Ready to grow your business?
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Create your verified profile in minutes. Plans from €49/month.
            </p>
            <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button variant="premium" size="lg" asChild>
                <Link to="/cadastro?role=professional">
                  Create Your Profile
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/planos">View Plans</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
