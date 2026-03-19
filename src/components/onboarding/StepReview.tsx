import type { ProfileDraft } from "./types";

interface Props {
  form: ProfileDraft;
}

function Field({ label, value }: { label: string; value: string }) {
  return value ? (
    <div className="flex justify-between border-b border-border py-2 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-foreground">{value}</span>
    </div>
  ) : null;
}

export default function StepReview({ form }: Props) {
  return (
    <div className="space-y-1">
      <p className="mb-3 text-sm text-muted-foreground">
        Revise as informações antes de salvar.
      </p>
      <Field label="Nome" value={form.display_name} />
      <Field label="Idade" value={form.age} />
      <Field label="Cidade" value={form.city} />
      <Field label="País" value={form.country} />
      <Field label="Categoria" value={form.category} />
      <Field label="Idiomas" value={form.languages} />
      <Field label="Bio" value={form.bio} />
      <Field label="Preço a partir de" value={form.pricing_from ? `R$ ${form.pricing_from}` : ""} />
      <Field label="WhatsApp" value={form.whatsapp} />
      <Field label="Telegram" value={form.telegram} />
    </div>
  );
}
