import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Copy, MousePointerClick, UserPlus, CreditCard, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AffiliateStats {
  referralCode: string | null;
  clicks: number;
  signups: number;
  conversions: {
    id: string;
    referred_user_id: string;
    conversion_type: string;
    commission_amount: number;
    commission_rate: number;
    status: string;
    created_at: string;
  }[];
  commissionPending: number;
  commissionApproved: number;
  commissionPaid: number;
}

function useAffiliateData(): AffiliateStats & { loading: boolean } {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<AffiliateStats>({
    referralCode: null,
    clicks: 0,
    signups: 0,
    conversions: [],
    commissionPending: 0,
    commissionApproved: 0,
    commissionPaid: 0,
  });

  useEffect(() => {
    if (!user) return;

    const load = async () => {
      const [userRes, clicksRes, signupsRes, conversionsRes] = await Promise.all([
        supabase.from("users").select("referral_code").eq("id", user.id).single(),
        supabase.from("referral_clicks").select("id", { count: "exact", head: true }).eq("referrer_user_id", user.id),
        supabase.from("users").select("id", { count: "exact", head: true }).eq("referred_by_user_id", user.id),
        supabase.from("referral_conversions").select("*").eq("referrer_user_id", user.id).order("created_at", { ascending: false }),
      ]);

      const conversions = conversionsRes.data || [];

      setStats({
        referralCode: userRes.data?.referral_code ?? null,
        clicks: clicksRes.count ?? 0,
        signups: signupsRes.count ?? 0,
        conversions,
        commissionPending: conversions.filter((c) => c.status === "pending").reduce((s, c) => s + Number(c.commission_amount), 0),
        commissionApproved: conversions.filter((c) => c.status === "approved").reduce((s, c) => s + Number(c.commission_amount), 0),
        commissionPaid: conversions.filter((c) => c.status === "paid").reduce((s, c) => s + Number(c.commission_amount), 0),
      });
      setLoading(false);
    };

    load();
  }, [user]);

  return { ...stats, loading };
}

export default function AffiliateDashboard() {
  const data = useAffiliateData();

  const referralLink = data.referralCode
    ? `${window.location.origin}/cadastro?ref=${data.referralCode}`
    : null;

  const copyLink = () => {
    if (!referralLink) return;
    navigator.clipboard.writeText(referralLink);
    toast.success("Link copiado!");
  };

  if (data.loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  const fmt = (v: number) =>
    v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  return (
    <div className="animate-fade-in">
      <h1 className="font-display text-2xl font-bold text-foreground">Programa de Afiliados</h1>
      <p className="mt-1 text-muted-foreground">
        Indique novos usuários e ganhe 15% de comissão sobre o primeiro pagamento.
      </p>

      {/* Referral link */}
      <div className="mt-6 rounded-lg border border-primary/20 bg-primary/5 p-5">
        <p className="text-sm font-medium text-foreground">Seu link de indicação</p>
        {referralLink ? (
          <div className="mt-2 flex items-center gap-2">
            <code className="flex-1 truncate rounded bg-muted px-3 py-2 text-sm text-foreground">
              {referralLink}
            </code>
            <Button size="sm" onClick={copyLink}>
              <Copy className="mr-1.5 h-3.5 w-3.5" />
              Copiar
            </Button>
          </div>
        ) : (
          <p className="mt-1 text-sm text-muted-foreground">Carregando...</p>
        )}
      </div>

      {/* Stats cards */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={<MousePointerClick className="h-4 w-4" />}
          label="Cliques"
          value={data.clicks.toString()}
        />
        <StatCard
          icon={<UserPlus className="h-4 w-4" />}
          label="Cadastros gerados"
          value={data.signups.toString()}
        />
        <StatCard
          icon={<CreditCard className="h-4 w-4" />}
          label="Pagamentos convertidos"
          value={data.conversions.length.toString()}
        />
        <StatCard
          icon={<DollarSign className="h-4 w-4" />}
          label="Total em comissões"
          value={fmt(data.commissionPending + data.commissionApproved + data.commissionPaid)}
        />
      </div>

      {/* Commission breakdown */}
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-border bg-card p-5">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Pendente</p>
          <p className="mt-1 font-display text-2xl font-bold tabular-nums text-foreground">
            {fmt(data.commissionPending)}
          </p>
        </div>
        <div className="rounded-lg border border-border bg-card p-5">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Aprovada</p>
          <p className="mt-1 font-display text-2xl font-bold tabular-nums text-primary">
            {fmt(data.commissionApproved)}
          </p>
        </div>
        <div className="rounded-lg border border-border bg-card p-5">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Paga</p>
          <p className="mt-1 font-display text-2xl font-bold tabular-nums text-green-500">
            {fmt(data.commissionPaid)}
          </p>
        </div>
      </div>

      {/* Conversion history */}
      <div className="mt-8">
        <h2 className="mb-4 font-display text-lg font-semibold text-foreground">
          Histórico de indicações
        </h2>

        {data.conversions.length === 0 ? (
          <div className="rounded-lg border border-border bg-card p-8 text-center">
            <p className="text-muted-foreground">
              Nenhuma conversão registrada ainda. Compartilhe seu link!
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Data</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Tipo</th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">Comissão</th>
                  <th className="px-4 py-3 text-center font-medium text-muted-foreground">Status</th>
                </tr>
              </thead>
              <tbody>
                {data.conversions.map((c) => (
                  <tr key={c.id} className="border-b border-border last:border-0">
                    <td className="px-4 py-3 text-foreground">
                      {new Date(c.created_at).toLocaleDateString("pt-BR")}
                    </td>
                    <td className="px-4 py-3 text-foreground capitalize">{c.conversion_type}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-foreground">
                      {fmt(Number(c.commission_amount))}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <StatusBadge status={c.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <div className="flex items-center gap-2 text-muted-foreground">
        {icon}
        <p className="text-sm">{label}</p>
      </div>
      <p className="mt-1 font-display text-2xl font-bold tabular-nums text-foreground">{value}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    pending: "bg-yellow-500/10 text-yellow-600",
    approved: "bg-primary/10 text-primary",
    paid: "bg-green-500/10 text-green-600",
    rejected: "bg-destructive/10 text-destructive",
  };

  const labels: Record<string, string> = {
    pending: "Pendente",
    approved: "Aprovada",
    paid: "Paga",
    rejected: "Rejeitada",
  };

  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${styles[status] || ""}`}>
      {labels[status] || status}
    </span>
  );
}
