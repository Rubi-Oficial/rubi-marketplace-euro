import React from "react";

interface ProfileOverviewSectionProps {
  bio: string | null;
  sectionStyle: React.CSSProperties;
}

export const ProfileOverviewSection = React.memo(function ProfileOverviewSection({
  bio,
  sectionStyle,
}: ProfileOverviewSectionProps) {
  return (
    <section id="overview" style={sectionStyle} className="rounded-2xl border border-border/30 bg-card/60 p-5">
      <h2 className="font-display text-xl font-semibold text-foreground">Resumo do perfil</h2>
      <p className="mt-2 max-w-3xl whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">
        {bio || "Perfil com atendimento dedicado. Entre em contato para confirmar agenda e detalhes do atendimento."}
      </p>
    </section>
  );
});
