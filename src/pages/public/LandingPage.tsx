import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Shield, Star, Users, Zap, ArrowRight, Search, MapPin, CheckCircle } from "lucide-react";
import { useReferralCapture } from "@/hooks/useReferralCapture";
import { useEffect, useState } from "react";
import { fetchEligibleProfiles, fetchFilterOptions, ProfileCard, type EligibleProfile } from "@/components/public/ProfileCard";

export default function LandingPage() {
  useReferralCapture();

  const [featured, setFeatured] = useState<EligibleProfile[]>([]);
  const [cities, setCities] = useState<string[]>([]);
  const [categories, setCategories] = useState<string[]>([]);

  useEffect(() => {
    fetchEligibleProfiles().then((profiles) => setFeatured(profiles.slice(0, 8)));
    fetchFilterOptions().then(({ cities, categories }) => {
      setCities(cities.slice(0, 6));
      setCategories(categories.slice(0, 6));
    });
  }, []);

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative flex min-h-[80vh] items-center justify-center overflow-hidden">
        <div className="absolute inset-0 surface-gradient" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_hsl(35_60%_55%_/_0.08)_0%,_transparent_60%)]" />

        <div className="relative z-10 mx-auto max-w-3xl px-4 text-center animate-fade-in">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-xs font-medium text-primary">
            <Zap className="h-3 w-3" />
            The Leading Platform for Independent Professionals in Europe
          </div>

          <h1 className="font-display text-4xl font-bold leading-tight text-foreground sm:text-5xl md:text-7xl">
            Where clients find{" "}
            <span className="text-primary">top professionals</span>
          </h1>

          <p className="mx-auto mt-6 max-w-xl text-lg text-muted-foreground text-pretty">
            Verified profiles, premium visibility and dedicated support.
            Join thousands of professionals already growing with AURA.
          </p>

          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Button variant="premium" size="lg" asChild>
              <Link to="/cadastro?role=professional">
                Create Your Profile — It's Free
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button variant="outline-gold" size="lg" asChild>
              <Link to="/buscar">
                <Search className="mr-2 h-4 w-4" />
                Explore Profiles
              </Link>
            </Button>
          </div>

          <div className="mt-6 flex items-center justify-center gap-6 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><CheckCircle className="h-3 w-3 text-primary" /> Verified profiles</span>
            <span className="flex items-center gap-1"><CheckCircle className="h-3 w-3 text-primary" /> Cancel anytime</span>
            <span className="flex items-center gap-1"><CheckCircle className="h-3 w-3 text-primary" /> GDPR compliant</span>
          </div>
        </div>
      </section>

      {/* Featured profiles */}
      {featured.length > 0 && (
        <section className="border-t border-border py-20">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between mb-10">
              <div>
                <h2 className="font-display text-2xl font-bold text-foreground sm:text-3xl">
                  Featured Profiles
                </h2>
                <p className="mt-1 text-muted-foreground">Verified and active professionals.</p>
              </div>
              <Button variant="ghost" asChild className="hidden sm:flex">
                <Link to="/buscar">
                  View all <ArrowRight className="ml-1.5 h-4 w-4" />
                </Link>
              </Button>
            </div>

            <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
              {featured.map((p) => (
                <ProfileCard key={p.id} profile={p} />
              ))}
            </div>

            <div className="mt-8 text-center sm:hidden">
              <Button variant="outline" asChild>
                <Link to="/buscar">View all profiles</Link>
              </Button>
            </div>
          </div>
        </section>
      )}

      {/* Browse by city */}
      {cities.length > 0 && (
        <section className="border-t border-border py-20">
          <div className="container mx-auto px-4">
            <h2 className="font-display text-2xl font-bold text-foreground sm:text-3xl">
              Browse by City
            </h2>
            <p className="mt-1 mb-8 text-muted-foreground">Find professionals near you.</p>

            <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
              {cities.map((city) => (
                <Link
                  key={city}
                  to={`/cidade/${city.toLowerCase().replace(/\s+/g, "-")}`}
                  className="flex items-center gap-2 rounded-lg border border-border bg-card p-4 transition-colors hover:border-primary/30 hover:bg-primary/5"
                >
                  <MapPin className="h-4 w-4 text-primary shrink-0" />
                  <span className="text-sm font-medium text-foreground truncate">{city}</span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Browse by category */}
      {categories.length > 0 && (
        <section className="border-t border-border py-20">
          <div className="container mx-auto px-4">
            <h2 className="font-display text-2xl font-bold text-foreground sm:text-3xl">
              Browse by Category
            </h2>
            <p className="mt-1 mb-8 text-muted-foreground">Find the perfect profile.</p>

            <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
              {categories.map((cat) => (
                <Link
                  key={cat}
                  to={`/categoria/${cat.toLowerCase().replace(/\s+/g, "-")}`}
                  className="rounded-lg border border-border bg-card p-4 text-center transition-colors hover:border-primary/30 hover:bg-primary/5"
                >
                  <span className="text-sm font-medium text-foreground">{cat}</span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Features */}
      <section className="border-t border-border py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-center font-display text-2xl font-bold text-foreground sm:text-3xl">
            Why Choose AURA?
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-center text-muted-foreground">
            Built for professionals who demand the best.
          </p>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: <Shield className="h-6 w-6" />,
                title: "Real Verification",
                desc: "Every profile goes through human moderation. No fake profiles, no surprises.",
              },
              {
                icon: <Star className="h-6 w-6" />,
                title: "Premium Visibility",
                desc: "Optimised listings with high-quality photos, SEO-friendly pages and priority placement.",
              },
              {
                icon: <Users className="h-6 w-6" />,
                title: "Affiliate Programme",
                desc: "Refer professionals and earn 15% recurring commission on their first subscription payment.",
              },
            ].map((f) => (
              <div
                key={f.title}
                className="group rounded-lg border border-border bg-card p-6 transition-all hover:border-primary/30 hover:glow-gold"
              >
                <div className="mb-4 inline-flex rounded-md bg-primary/10 p-2.5 text-primary">
                  {f.icon}
                </div>
                <h3 className="font-display text-lg font-semibold text-foreground">{f.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground text-pretty">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA for professionals */}
      <section className="border-t border-border py-20">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-2xl text-center rounded-lg border border-primary/20 bg-primary/5 p-10">
            <h2 className="font-display text-2xl font-bold text-foreground sm:text-3xl">
              Ready to Grow Your Business?
            </h2>
            <p className="mt-3 text-muted-foreground">
              Create your verified profile in minutes and reach thousands of clients across Europe.
              Plans from €49/month — cancel anytime.
            </p>
            <div className="mt-4 flex flex-wrap items-center justify-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><CheckCircle className="h-3 w-3 text-primary" /> No setup fee</span>
              <span className="flex items-center gap-1"><CheckCircle className="h-3 w-3 text-primary" /> Live in 24h after verification</span>
              <span className="flex items-center gap-1"><CheckCircle className="h-3 w-3 text-primary" /> Dedicated support</span>
            </div>
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button variant="premium" size="lg" asChild>
                <Link to="/cadastro?role=professional">
                  Create Your Profile Now
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button variant="ghost" size="lg" asChild>
                <Link to="/planos">View Plans & Pricing</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
