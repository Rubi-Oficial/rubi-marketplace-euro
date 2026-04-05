import { Input } from "@/components/ui/input";

/**
 * Read-only detail display with label and value.
 */
export function DetailField({ label, value, icon }: { label: string; value?: string | null; icon?: React.ReactNode }) {
  return (
    <div>
      <span className="text-muted-foreground text-xs flex items-center gap-1">{icon}{label}</span>
      <p className="text-foreground text-sm font-medium">{value || "—"}</p>
    </div>
  );
}

/**
 * Editable field with label and input.
 */
export function EditField({ label, value, onChange, type = "text" }: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <div>
      <label className="text-xs text-muted-foreground">{label}</label>
      <Input className="h-9 text-sm mt-1" type={type} value={value} onChange={e => onChange(e.target.value)} />
    </div>
  );
}
