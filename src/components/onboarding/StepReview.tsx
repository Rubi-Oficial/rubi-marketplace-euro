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
        Review your information before saving.
      </p>
      <Field label="Name" value={form.display_name} />
      <Field label="Age" value={form.age} />
      <Field label="Country" value={form.country} />
      <Field label="City" value={form.city} />
      <Field label="Category" value={form.category} />
      <Field label="Languages" value={form.languages} />
      <Field label="Bio" value={form.bio} />
      <Field label="Starting price" value={form.pricing_from ? `R$\u00A0${form.pricing_from}` : ""} />
      <Field label="WhatsApp" value={form.whatsapp} />
      <Field label="Telegram" value={form.telegram} />
    </div>
  );
}
