import { useAuth } from "@/contexts/AuthContext";

export default function ClientDashboard() {
  const { user } = useAuth();

  return (
    <div className="animate-fade-in">
      <h1 className="font-display text-2xl font-bold text-foreground">
        Bem-vindo, {user?.user_metadata?.full_name || "Cliente"}
      </h1>
      <p className="mt-1 text-muted-foreground">
        Seu painel de cliente
      </p>

      <div className="mt-8 grid gap-4 md:grid-cols-3">
        <StatCard label="Favoritos" value="0" />
        <StatCard label="Visualizações hoje" value="—" />
        <StatCard label="Conta desde" value={user?.created_at ? new Date(user.created_at).toLocaleDateString("pt-BR") : "—"} />
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 font-display text-2xl font-bold tabular-nums text-foreground">{value}</p>
    </div>
  );
}
