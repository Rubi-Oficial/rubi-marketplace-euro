/**
 * Reusable status → color-class mappings for profile, subscription, and moderation statuses.
 * Uses semantic Tailwind tokens to keep consistency across dashboards.
 */

export const profileStatusColor: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  pending_review: "bg-accent text-accent-foreground",
  approved: "bg-primary/20 text-primary",
  rejected: "bg-destructive/20 text-destructive",
  paused: "bg-muted text-muted-foreground",
};

export const subscriptionStatusColor: Record<string, string> = {
  pending: "bg-accent text-accent-foreground",
  active: "bg-primary/20 text-primary",
  past_due: "bg-destructive/20 text-destructive",
  canceled: "bg-muted text-muted-foreground",
  expired: "bg-muted text-muted-foreground",
};

export const moderationStatusColor: Record<string, string> = {
  pending: "bg-accent text-accent-foreground",
  approved: "bg-primary/20 text-primary",
  rejected: "bg-destructive/20 text-destructive",
};

export function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    draft: "Rascunho",
    pending_review: "Em revisão",
    approved: "Aprovado",
    rejected: "Rejeitado",
    paused: "Pausado",
    pending: "Pendente",
    active: "Ativo",
    past_due: "Em atraso",
    canceled: "Cancelado",
    expired: "Expirado",
  };
  return labels[status] ?? status;
}
