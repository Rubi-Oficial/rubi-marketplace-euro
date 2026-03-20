import { useParams, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { fetchEligibleProfiles, fetchServices, ProfileCard, type EligibleProfile } from "@/components/public/ProfileCard";
import { ServiceSlugBar } from "@/components/public/ServiceSlugBar";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { CATEGORIES } from "@/components/shared/CategoryBar";

export default function CategoryPage() {
  const { slug } = useParams();
  const [profiles, setProfiles] = useState<EligibleProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [services, setServices] = useState<{ id: string; name: string; slug: string }[]>([]);
  const [serviceFilter, setServiceFilter] = useState("");

  const categoryMeta = CATEGORIES.find((c) => c.slug === slug);
  const categoryName = categoryMeta?.label || slug?.replace(/-/g, " ") || "";

  useEffect(() => {
    fetchServices().then(setServices);
  }, []);

  useEffect(() => {
    if (!categoryName) return;
    setLoading(true);
    fetchEligibleProfiles({ category: categoryName, service_slug: serviceFilter || undefined }).then((data) => {
      setProfiles(data);
      setLoading(false);
    });
  }, [categoryName, serviceFilter]);

  useEffect(() => {
    document.title = `${categoryName} — Professionals | AURA`;
    const desc = document.querySelector('meta[name="description"]');
    if (desc) desc.setAttribute("content", `Find verified ${categoryName} professionals. Browse profiles with photos and direct contact.`);
    return () => { document.title = "AURA"; };
  }, [categoryName]);

  return (
    <div className="container mx-auto px-4 py-6 animate-fade-in">
      <div className="mb-6">
        <Link to="/buscar" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mb-3 transition-colors">
          <ArrowLeft className="h-3 w-3" /> Back to explore
        </Link>
        <h1 className="font-display text-xl font-bold text-foreground capitalize sm:text-2xl">
          {categoryName}
        </h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          {loading ? "Loading..." : `${profiles.length} profile(s)`}
        </p>
      </div>

      <ServiceSlugBar
        services={services}
        activeService={serviceFilter}
        onServiceClick={setServiceFilter}
      />

      {loading ? (
        <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="aspect-[3/4] animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      ) : profiles.length === 0 ? (
        <div className="rounded-xl border border-border/40 bg-card/50 p-16 text-center">
          <p className="text-muted-foreground">No profiles found in this category.</p>
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
        <h2 className="font-display text-lg font-semibold text-foreground">Are you a professional?</h2>
        <p className="mt-1.5 text-sm text-muted-foreground">Create your profile and reach clients across Europe.</p>
        <Button variant="premium" className="mt-4" asChild>
          <Link to="/cadastro?role=professional">
            Get Started <ArrowRight className="ml-1.5 h-4 w-4" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
