import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Shield, Star, Users, Zap } from "lucide-react";
import { useReferralCapture } from "@/hooks/useReferralCapture";

export default function LandingPage() {
  useReferralCapture();
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative flex min-h-[85vh] items-center justify-center overflow-hidden">
        <div className="absolute inset-0 surface-gradient" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_hsl(35_60%_55%_/_0.08)_0%,_transparent_60%)]" />

        <div className="relative z-10 mx-auto max-w-3xl px-4 text-center animate-fade-in">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-xs font-medium text-primary">
            <Zap className="h-3 w-3" />
            Plataforma Premium para Profissionais
          </div>

          <h1 className="font-display text-5xl font-bold leading-tight text-foreground md:text-7xl">
            Conecte-se com{" "}
            <span className="text-primary">excelência</span>
          </h1>

          <p className="mx-auto mt-6 max-w-xl text-lg text-muted-foreground text-pretty">
            A plataforma de referência para profissionais independentes na Europa.
            Segurança, privacidade e visibilidade premium.
          </p>

          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Button variant="premium" size="lg" asChild>
              <Link to="/cadastro?role=professional">Anunciar Agora</Link>
            </Button>
            <Button variant="outline-gold" size="lg" asChild>
              <Link to="/cadastro">Criar Conta Grátis</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-t border-border py-24">
        <div className="container mx-auto px-4">
          <h2 className="text-center font-display text-3xl font-bold text-foreground">
            Por que escolher a AURA?
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-center text-muted-foreground">
            Construída para profissionais que exigem o melhor.
          </p>

          <div className="mt-16 grid gap-6 md:grid-cols-3">
            {[
              {
                icon: <Shield className="h-6 w-6" />,
                title: "Verificação Real",
                description: "Cada perfil passa por moderação humana. Sem perfis falsos, sem surpresas.",
              },
              {
                icon: <Star className="h-6 w-6" />,
                title: "Visibilidade Premium",
                description: "Anúncios otimizados com fotos de alta qualidade e posicionamento prioritário.",
              },
              {
                icon: <Users className="h-6 w-6" />,
                title: "Programa de Afiliados",
                description: "Indique profissionais e ganhe comissões recorrentes sobre suas assinaturas.",
              },
            ].map((feature) => (
              <div
                key={feature.title}
                className="group rounded-lg border border-border bg-card p-6 transition-all hover:border-primary/30 hover:glow-gold"
              >
                <div className="mb-4 inline-flex rounded-md bg-primary/10 p-2.5 text-primary">
                  {feature.icon}
                </div>
                <h3 className="font-display text-lg font-semibold text-foreground">
                  {feature.title}
                </h3>
                <p className="mt-2 text-sm text-muted-foreground text-pretty">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
