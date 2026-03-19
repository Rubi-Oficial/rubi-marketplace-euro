import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Shield, Star, Users, Zap, ArrowRight, Search, MapPin } from "lucide-react";
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
            Plataforma Premium para Profissionais
          </div>

          <h1 className="font-display text-4xl font-bold leading-tight text-foreground sm:text-5xl md:text-7xl">
            Conecte-se com{" "}
            <span className="text-primary">excelência</span>
          </h1>

          <p className="mx-auto mt-6 max-w-xl text-lg text-muted-foreground text-pretty">
            A plataforma de referência para profissionais independentes.
            Segurança, privacidade e visibilidade premium.
          </p>

          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Button variant="premium" size="lg" asChild>
              <Link to="/cadastro?role=professional">Anunciar Agora</Link>
            </Button>
            <Button variant="outline-gold" size="lg" asChild>
              <Link to="/buscar">
                <Search className="mr-2 h-4 w-4" />
                Explorar Perfis
              </Link>
            </Button>
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
                  Perfis em Destaque
                </h2>
                <p className="mt-1 text-muted-foreground">Profissionais verificadas e ativas.</p>
              </div>
              <Button variant="ghost" asChild className="hidden sm:flex">
                <Link to="/buscar">
                  Ver todos <ArrowRight className="ml-1.5 h-4 w-4" />
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
                <Link to="/buscar">Ver todos os perfis</Link>
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
              Buscar por Cidade
            </h2>
            <p className="mt-1 mb-8 text-muted-foreground">Encontre profissionais perto de você.</p>

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
              Buscar por Categoria
            </h2>
            <p className="mt-1 mb-8 text-muted-foreground">Encontre o perfil ideal.</p>

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
            Por que escolher a AURA?
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-center text-muted-foreground">
            Construída para profissionais que exigem o melhor.
          </p>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: <Shield className="h-6 w-6" />,
                title: "Verificação Real",
                desc: "Cada perfil passa por moderação humana. Sem perfis falsos, sem surpresas.",
              },
              {
                icon: <Star className="h-6 w-6" />,
                title: "Visibilidade Premium",
                desc: "Anúncios otimizados com fotos de alta qualidade e posicionamento prioritário.",
              },
              {
                icon: <Users className="h-6 w-6" />,
                title: "Programa de Afiliados",
                desc: "Indique profissionais e ganhe comissões recorrentes sobre suas assinaturas.",
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
              É profissional?
            </h2>
            <p className="mt-3 text-muted-foreground">
              Crie seu perfil verificado e alcance milhares de clientes com a AURA.
              Planos a partir de R$ 99,90/mês.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button variant="premium" size="lg" asChild>
                <Link to="/cadastro?role=professional">Começar Agora</Link>
              </Button>
              <Button variant="ghost" size="lg" asChild>
                <Link to="/planos">Ver Planos</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
