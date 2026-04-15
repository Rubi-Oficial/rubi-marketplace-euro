import React from "react";
import { ProfileServiceChips } from "@/components/profile/ProfileServiceChips";

interface ProfileServicesSectionProps {
  services: { name: string; slug: string }[];
  sectionStyle: React.CSSProperties;
}

export const ProfileServicesSection = React.memo(function ProfileServicesSection({
  services,
  sectionStyle,
}: ProfileServicesSectionProps) {
  if (services.length === 0) return null;

  return (
    <section id="services" style={sectionStyle} className="rounded-2xl border border-border/30 bg-card/60 p-5">
      <h2 className="font-display text-xl font-semibold text-foreground">Serviços em destaque</h2>
      <p className="mt-1 text-sm text-muted-foreground">Escolha o serviço e continue sua busca com filtros prontos.</p>
      <ProfileServiceChips services={services} className="mt-4" />
    </section>
  );
});
