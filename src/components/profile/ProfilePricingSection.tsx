import React from "react";

interface ProfilePricingSectionProps {
  pricingFrom: number | null;
  sectionStyle: React.CSSProperties;
}

export const ProfilePricingSection = React.memo(function ProfilePricingSection({
  pricingFrom,
  sectionStyle,
}: ProfilePricingSectionProps) {
  return (
    <section id="pricing" style={sectionStyle} className="rounded-2xl border border-border/30 bg-card/60 p-5">
      <h2 className="font-display text-xl font-semibold text-foreground">Faixa de valores</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        {pricingFrom
          ? `Atendimentos a partir de €${Number(pricingFrom).toLocaleString("de-DE")}. Valores podem variar conforme serviço e duração.`
          : "Valores sob consulta. Fale diretamente no WhatsApp ou Telegram para detalhes atualizados."}
      </p>
    </section>
  );
});
