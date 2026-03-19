import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { useReferralCapture } from "@/hooks/useReferralCapture";
import { useEffect, useState, useCallback } from "react";
import { fetchEligibleProfiles, ProfileCard, type EligibleProfile } from "@/components/public/ProfileCard";
import { VideoSection } from "@/components/public/VideoSection";

export default function LandingPage() {
  useReferralCapture();

  const [profiles, setProfiles] = useState<EligibleProfile[]>([]);
  const [filters, setFilters] = useState({ activeCity: "", activeService: "" });

  // Listen to filter changes from Navbar
  const handleFilters = useCallback((e: Event) => {
    const detail = (e as CustomEvent).detail;
    setFilters({ activeCity: detail.activeCity, activeService: detail.activeService });
  }, []);

  useEffect(() => {
    window.addEventListener("rubi-filters", handleFilters);
    return () => window.removeEventListener("rubi-filters", handleFilters);
  }, [handleFilters]);

  useEffect(() => {
    fetchEligibleProfiles({
      city_slug: filters.activeCity || undefined,
      service_slug: filters.activeService || undefined,
    }).then((data) => setProfiles(data.slice(0, 20)));
  }, [filters.activeCity, filters.activeService]);

  return (
    <div className="min-h-screen">
      {/* Profiles grid */}
      <section className="pt-4 pb-6">
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

      {/* Videos section — filters applied */}
      <VideoSection filters={filters} />

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
