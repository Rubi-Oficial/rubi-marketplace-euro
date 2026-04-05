import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Eye, ChevronLeft, ChevronRight } from "lucide-react";

export interface UserRow {
  id: string;
  full_name: string | null;
  email: string;
  phone: string | null;
  role: "client" | "professional" | "admin";
  referral_code: string | null;
  referral_link: string | null;
  referred_by_user_id: string | null;
  google_auth_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export const ROLE_MAP: Record<string, { label: string; variant: "default" | "secondary" | "outline" }> = {
  client: { label: "Cliente", variant: "secondary" },
  professional: { label: "Profissional", variant: "default" },
  admin: { label: "Admin", variant: "outline" },
};

export const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });

export const fmtDateTime = (d: string) =>
  new Date(d).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });

interface UserTableProps {
  users: UserRow[];
  loading: boolean;
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onOpenDetail: (user: UserRow) => void;
}

export function UserTable({ users, loading, page, totalPages, onPageChange, onOpenDetail }: UserTableProps) {
  return (
    <>
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Nome</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Email</th>
              <th className="px-4 py-3 text-center font-medium text-muted-foreground">Tipo</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden md:table-cell">Telefone</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden lg:table-cell">Cadastro</th>
              <th className="px-4 py-3 text-right font-medium text-muted-foreground">Ações</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              [1, 2, 3, 4, 5].map((i) => (
                <tr key={i}>
                  <td colSpan={6} className="px-4 py-3">
                    <div className="h-4 w-full animate-pulse rounded bg-muted" />
                  </td>
                </tr>
              ))
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                  Nenhum usuário encontrado.
                </td>
              </tr>
            ) : (
              users.map((u) => {
                const roleInfo = ROLE_MAP[u.role] || ROLE_MAP.client;
                return (
                  <tr key={u.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 text-foreground font-medium">
                      <button
                        onClick={() => onOpenDetail(u)}
                        className="hover:text-primary hover:underline transition-colors text-left"
                      >
                        {u.full_name || "—"}
                      </button>
                      {u.google_auth_enabled && (
                        <span className="ml-1.5 text-xs text-muted-foreground">(Google)</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">{u.email}</td>
                    <td className="px-4 py-3 text-center">
                      <Badge variant={roleInfo.variant}>{roleInfo.label}</Badge>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">
                      {u.phone || "—"}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground hidden lg:table-cell">
                      {fmtDate(u.created_at)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onOpenDetail(u)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Página {page + 1} de {totalPages}
          </p>
          <div className="flex gap-1">
            <Button variant="outline" size="sm" disabled={page === 0} onClick={() => onPageChange(page - 1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" disabled={page >= totalPages - 1} onClick={() => onPageChange(page + 1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
