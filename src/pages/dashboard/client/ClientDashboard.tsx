import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { useLanguage } from "@/i18n/LanguageContext";
import {
  Copy,
  Link2,
  MousePointerClick,
  UserPlus,
  CreditCard,
  DollarSign,
  Clock,
  CheckCircle2,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface ClientStats {
  fullName: string | null;
  createdAt: string | null;
  referralCode: string | null;
  clicks: number;
  signups: number;
  conversions: {
    id: string;
    conversion_type: string;
    commission_amount: number;
    status: string;
    created_at: string;
  }[];
  commissionPending: number;
  commissionApproved: number;
  commissionPaid: number;
}

function useClientData() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<ClientStats>({
    fullName: null,
    createdAt: null,
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
        supabase.from("users").select("full_name, created_at, referral_code").eq("id", user.id).single(),
        supabase.from("referral_clicks").select("id", { count: "exact", head: true }).eq("referrer_user_id", user.id),
        supabase.from("users").select("id", { count: "exact", head: true }).eq("referred_by_user_id", user.id),
        supabase.from("referral_conversions").select("*").eq("referrer_user_id", user.id).order("created_at", { ascending: false }),
      ]);

      const conversions = conversionsRes.data || [];

      setStats({
        fullName: userRes.data?.full_name ?? null,
        createdAt: userRes.data?.created_at ?? null,
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

const fmt = (v: number) =>
  v.toLocaleString("de-DE", { style: "currency", currency: "EUR" });

export default function ClientDashboard() {
  const data = useClientData();
  const { t } = useLanguage();

  const referralLink = data.referralCode
    ? `${window.location.origin}/cadastro?ref=${data.referralCode}`
    : null;

  const copyLink = () => {
    if (!referralLink) return;
    navigator.clipboard.writeText(referralLink);
    toast.success(t("client.copied"));
  };

  if (data.loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  const memberDate = data.createdAt
    ? new Date(data.createdAt).toLocaleDateString("pt-BR", { month: "long", year: "numeric" })
    : "—";

  return (
    <div className="animate-fade-in space-y-8">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">
          {t("client.welcome", { name: data.fullName || t("client.default_name") })}
        </h1>
        <p className="mt-1 text-muted-foreground">
          {t("client.member_since", { date: memberDate })}
        </p>
      </div>

      <div className="rounded-lg border border-primary/20 bg-primary/5 p-5">
        <div className="flex items-center gap-2 mb-3">
          <Link2 className="h-4 w-4 text-primary" />
          <p className="text-sm font-medium text-foreground">{t("client.referral_link")}</p>
        </div>
        {referralLink ? (
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <code className="flex-1 truncate rounded bg-muted px-3 py-2 text-sm text-foreground">
              {referralLink}
            </code>
            <Button size="sm" onClick={copyLink} className="shrink-0">
              <Copy className="mr-1.5 h-3.5 w-3.5" />
              {t("client.copy_link")}
            </Button>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">{t("client.no_link")}</p>
        )}
      </div>

      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <StatCard icon={<MousePointerClick className="h-4 w-4" />} label={t("client.clicks")} value={data.clicks.toString()} />
        <StatCard icon={<UserPlus className="h-4 w-4" />} label={t("client.signups")} value={data.signups.toString()} />
        <StatCard icon={<CreditCard className="h-4 w-4" />} label={t("client.payments")} value={data.conversions.length.toString()} />
        <StatCard icon={<DollarSign className="h-4 w-4" />} label={t("client.total_commissions")} value={fmt(data.commissionPending + data.commissionApproved + data.commissionPaid)} />
      </div>

      <div>
        <h2 className="mb-4 font-display text-lg font-semibold text-foreground">{t("client.commissions")}</h2>
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
          <CommissionCard icon={<Clock className="h-4 w-4" />} label={t("client.estimated")} value={fmt(data.commissionPending)} colorClass="text-yellow-500" />
          <CommissionCard icon={<CheckCircle2 className="h-4 w-4" />} label={t("client.approved")} value={fmt(data.commissionApproved)} colorClass="text-primary" />
          <CommissionCard icon={<Wallet className="h-4 w-4" />} label={t("client.paid")} value={fmt(data.commissionPaid)} colorClass="text-green-500" />
        </div>
      </div>

      <div>
        <h2 className="mb-4 font-display text-lg font-semibold text-foreground">{t("client.history")}</h2>
        {data.conversions.length === 0 ? (
          <div className="rounded-lg border border-border bg-card p-8 text-center">
            <p className="text-muted-foreground">{t("client.no_conversions")}</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">{t("client.date")}</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">{t("client.type")}</th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">{t("client.commission")}</th>
                  <th className="px-4 py-3 text-center font-medium text-muted-foreground">{t("client.status")}</th>
                </tr>
              </thead>
              <tbody>
                {data.conversions.map((c) => (
                  <tr key={c.id} className="border-b border-border last:border-0">
                    <td className="px-4 py-3 text-foreground">{new Date(c.created_at).toLocaleDateString("pt-BR")}</td>
                    <td className="px-4 py-3 text-foreground capitalize">{c.conversion_type}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-foreground">{fmt(Number(c.commission_amount))}</td>
                    <td className="px-4 py-3 text-center"><StatusBadge status={c.status} /></td>
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

function CommissionCard({ icon, label, value, colorClass }: { icon: React.ReactNode; label: string; value: string; colorClass: string }) {
  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <div className="flex items-center gap-2 text-muted-foreground">
        {icon}
        <p className="text-xs font-medium uppercase tracking-wider">{label}</p>
      </div>
      <p className={`mt-1 font-display text-2xl font-bold tabular-nums ${colorClass}`}>{value}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const { t } = useLanguage();
  const styles: Record<string, string> = {
    pending: "bg-yellow-500/10 text-yellow-600",
    approved: "bg-primary/10 text-primary",
    paid: "bg-green-500/10 text-green-600",
    rejected: "bg-destructive/10 text-destructive",
  };
  const labelKey: Record<string, string> = {
    pending: "client.status_pending",
    approved: "client.status_approved",
    paid: "client.status_paid",
    rejected: "client.status_rejected",
  };
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${styles[status] || ""}`}>
      {t(labelKey[status] || status)}
    </span>
  );
}