export const COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--muted-foreground))",
  "hsl(var(--destructive))",
  "hsl(var(--primary) / 0.4)",
];

export const DEVICE_COLORS: Record<string, string> = {
  desktop: "hsl(var(--primary))",
  mobile: "hsl(var(--primary) / 0.6)",
  tablet: "hsl(var(--primary) / 0.3)",
  unknown: "hsl(var(--muted-foreground))",
};

export const ROLE_LABELS: Record<string, string> = {
  client: "Cliente",
  professional: "Profissional",
  admin: "Admin",
};

export const fmtCurrency = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "EUR" });
