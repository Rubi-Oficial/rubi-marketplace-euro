import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import {
  Copy,
  Share2,
  MousePointerClick,
  UserPlus,
  CreditCard,
  TrendingUp,
  Gift,
  Target,
  Megaphone,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface ReferredUser {
  id: string;
  display_name: string | null;
  role: string;
  created_at: string;
}

interface AffiliateStats {
  referralCode: string | null;
  clicks: number;
  signups: number;
  referredUsers: ReferredUser[];
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
    referredUsers: [],
    conversions: [],
    commissionPending: 0,
    commissionApproved: 0,
    commissionPaid: 0,
  });

  useEffect(() => {
    if (!user) return;

    const load = async () => {
      const [userRes, clicksRes, referralsRes, conversionsRes] = await Promise.all([
        supabase.from("users").select("referral_code").eq("id", user.id).single(),
        supabase.from("referral_clicks").select("id", { count: "exact", head: true }).eq("referrer_user_id", user.id),
        supabase.rpc("get_my_referrals"),
        supabase.from("referral_conversions").select("*").eq("referrer_user_id", user.id).order("created_at", { ascending: false }),
      ]);

      const conversions = conversionsRes.data || [];
      const referredUsers: ReferredUser[] = (referralsRes.data || []).map((u: any) => ({
        id: u.id,
        display_name: u.display_name,
        role: u.role,
        created_at: u.created_at,
      }));

      setStats({
        referralCode: userRes.data?.referral_code ?? null,
        clicks: clicksRes.count ?? 0,
        signups: referredUsers.length,
        referredUsers,
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

const fmt = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "EUR" });

const roleLabel: Record<string, string> = { client: "Cliente", professional: "Profissional", admin: "Admin" };

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

  const shareLink = async () => {
    if (!referralLink) return;
    if (navigator.share) {
      try {
        await navigator.share({
          title: "AURA — Convite exclusivo",
          text: "Junte-se à AURA, a plataforma premium para profissionais independentes na Europa.",
          url: referralLink,
        });
      } catch {
        copyLink();
      }
    } else {
      copyLink();
    }
  };

  if (data.loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  const totalEarned = data.commissionPending + data.commissionApproved + data.commissionPaid;
  const hasFirstConversion = data.conversions.length > 0;
  const conversionRate = data.clicks > 0 ? ((data.signups / data.clicks) * 100).toFixed(1) : "0";
  const paymentRate = data.signups > 0 ? ((data.conversions.length / data.signups) * 100).toFixed(1) : "0";

  return (
    <div className="animate-fade-in space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">Programa de Afiliados</h1>
        <p className="mt-1 text-muted-foreground">
          Indique profissionais e ganhe <span className="text-primary font-semibold">15% de comissão</span> sobre o primeiro pagamento.
        </p>
      </div>

      {/* Referral link — prominent CTA */}
      <div className="rounded-xl border-2 border-primary/30 bg-gradient-to-br from-primary/5 to-primary/10 p-6">
        <div className="flex items-center gap-2 mb-2">
          <Megaphone className="h-5 w-5 text-primary" />
          <p className="text-base font-semibold text-foreground">Seu link exclusivo de indicação</p>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          Partilhe este link por WhatsApp, redes sociais ou email. Cada profissional que assinar gera comissão para si.
        </p>
        {referralLink ? (
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <code className="flex-1 truncate rounded-lg bg-background/80 border border-border px-4 py-3 text-sm text-foreground font-mono select-all">
              {referralLink}
            </code>
            <div className="flex gap-2">
              <Button variant="premium" size="lg" onClick={copyLink} className="flex-1 sm:flex-none">
                <Copy className="mr-2 h-4 w-4" />
                Copiar Link
              </Button>
              <Button size="lg" variant="outline-gold" onClick={shareLink} className="flex-1 sm:flex-none">
                <Share2 className="mr-2 h-4 w-4" />
                Partilhar
              </Button>
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Carregando seu link...</p>
        )}
      </div>

      {/* How it works */}
      {!hasFirstConversion && (
        <div className="rounded-lg border border-primary/20 bg-card p-6">
          <div className="flex items-start gap-4">
            <div className="rounded-full bg-primary/10 p-2.5 shrink-0">
              <Target className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-base font-semibold text-foreground">Como funciona?</p>
              <p className="mt-1 text-sm text-muted-foreground">
                É simples: partilhe o link, o profissional cadastra-se e quando assinar um plano, receberá 15% de comissão automaticamente.
              </p>
              <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { step: "1", label: "Partilhe o link", icon: <Share2 className="h-4 w-4" /> },
                  { step: "2", label: "Cadastro realizado", icon: <UserPlus className="h-4 w-4" /> },
                  { step: "3", label: "Pagamento confirmado", icon: <CreditCard className="h-4 w-4" /> },
                  { step: "4", label: "Comissão creditada", icon: <Gift className="h-4 w-4" /> },
                ].map((s) => (
                  <div key={s.step} className="flex flex-col items-center gap-1.5 rounded-lg border border-border bg-muted/30 p-3 text-center">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                      {s.icon}
                    </div>
                    <span className="text-xs font-medium text-foreground">{s.label}</span>
                  </div>
                ))}
              </div>
              <Button variant="premium" size="sm" className="mt-4" onClick={copyLink}>
                <Copy className="mr-2 h-3.5 w-3.5" />
                Copiar link e começar a indicar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Funnel stats */}
      <div>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Funil de Conversão</h2>
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          <StatCard icon={<MousePointerClick className="h-4 w-4" />} label="Cliques no link" value={data.clicks.toString()} sublabel="Visitantes que clicaram" />
          <StatCard icon={<UserPlus className="h-4 w-4" />} label="Cadastros gerados" value={data.signups.toString()} sublabel={`${conversionRate}% de conversão`} />
          <StatCard icon={<CreditCard className="h-4 w-4" />} label="Pagamentos convertidos" value={data.conversions.length.toString()} sublabel={`${paymentRate}% dos cadastros`} />
          <StatCard icon={<TrendingUp className="h-4 w-4" />} label="Total em comissões" value={fmt(totalEarned)} sublabel="Acumulado geral" highlight />
        </div>
      </div>

      {/* Commission breakdown */}
      <div>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Comissões</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <CommissionCard label="Pendente" sublabel="Aguardando aprovação" amount={data.commissionPending} variant="pending" />
          <CommissionCard label="Aprovada" sublabel="Pronta para pagamento" amount={data.commissionApproved} variant="approved" />
          <CommissionCard label="Paga" sublabel="Já recebida" amount={data.commissionPaid} variant="paid" />
        </div>
      </div>

      {/* Referred users list */}
      <div>
        <h2 className="mb-4 font-display text-lg font-semibold text-foreground">
          Cadastros Indicados ({data.referredUsers.length})
        </h2>

        {data.referredUsers.length === 0 ? (
          <div className="rounded-lg border border-border bg-card p-8 text-center">
            <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-muted">
              <UserPlus className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">Nenhum cadastro realizado através do seu link ainda.</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Nome</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Tipo</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Data</th>
                </tr>
              </thead>
              <tbody>
                {data.referredUsers.map((ru) => (
                  <tr key={ru.id} className="border-b border-border last:border-0">
                    <td className="px-4 py-3">
                      <p className="text-foreground font-medium">{ru.display_name || "Utilizador"}</p>
                      <p className="text-xs text-muted-foreground">{ru.role === "professional" ? "Profissional" : "Cliente"}</p>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground capitalize">{roleLabel[ru.role] || ru.role}</td>
                    <td className="px-4 py-3 tabular-nums text-muted-foreground">{new Date(ru.created_at).toLocaleDateString("pt-BR")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Conversion history */}
      <div>
        <h2 className="mb-4 font-display text-lg font-semibold text-foreground">
          Histórico de Conversões ({data.conversions.length})
        </h2>

        {data.conversions.length === 0 ? (
          <div className="rounded-lg border border-border bg-card p-10 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <Gift className="h-6 w-6 text-primary" />
            </div>
            <p className="font-medium text-foreground">Nenhuma conversão financeira ainda</p>
            <p className="mt-1 text-sm text-muted-foreground max-w-sm mx-auto">
              Quando um dos seus indicados assinar um plano, a comissão aparecerá aqui.
            </p>
            <Button variant="premium" size="sm" className="mt-4" onClick={copyLink}>
              <Copy className="mr-2 h-3.5 w-3.5" />
              Copiar link e começar agora
              <ArrowRight className="ml-2 h-3.5 w-3.5" />
            </Button>
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
                    <td className="px-4 py-3 text-foreground tabular-nums">
                      {new Date(c.created_at).toLocaleDateString("pt-BR")}
                    </td>
                    <td className="px-4 py-3 text-foreground capitalize">
                      {c.conversion_type === "subscription" ? "Assinatura" : c.conversion_type}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums font-medium text-foreground">
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

function StatCard({ icon, label, value, sublabel, highlight }: { icon: React.ReactNode; label: string; value: string; sublabel?: string; highlight?: boolean }) {
  return (
    <div className={`rounded-lg border bg-card p-5 ${highlight ? "border-primary/30" : "border-border"}`}>
      <div className="flex items-center gap-2 text-muted-foreground">
        {icon}
        <p className="text-xs sm:text-sm">{label}</p>
      </div>
      <p className={`mt-1 font-display text-2xl font-bold tabular-nums ${highlight ? "text-primary" : "text-foreground"}`}>{value}</p>
      {sublabel && <p className="mt-0.5 text-xs text-muted-foreground">{sublabel}</p>}
    </div>
  );
}

function CommissionCard({ label, sublabel, amount, variant }: { label: string; sublabel: string; amount: number; variant: "pending" | "approved" | "paid" }) {
  const styles = { pending: "border-yellow-500/20", approved: "border-primary/20", paid: "border-green-500/20" };
  const valueStyles = { pending: "text-foreground", approved: "text-primary", paid: "text-green-600" };

  return (
    <div className={`rounded-lg border bg-card p-5 ${styles[variant]}`}>
      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className={`mt-1 font-display text-2xl font-bold tabular-nums ${valueStyles[variant]}`}>{fmt(amount)}</p>
      <p className="mt-0.5 text-xs text-muted-foreground">{sublabel}</p>
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
  const labels: Record<string, string> = { pending: "Pendente", approved: "Aprovada", paid: "Paga", rejected: "Rejeitada" };

  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${styles[status] || ""}`}>
      {labels[status] || status}
    </span>
  );
}
