import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Users, Mail, Phone, Calendar, Shield, Clock,
  Pencil, Save, Eye, Link2,
} from "lucide-react";
import { type UserRow, ROLE_MAP, fmtDateTime } from "./UserTable";

export interface ProfileBrief {
  id: string;
  display_name: string | null;
  slug: string | null;
  category: string | null;
  status: string;
  city: string | null;
}

export interface AdminAction {
  id: string;
  action_type: string;
  notes: string | null;
  created_at: string;
}

interface UserDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: UserRow | null;
  userProfile: ProfileBrief | null;
  userActions: AdminAction[];
  onSave: (updates: Partial<UserRow>) => Promise<void>;
  saving: boolean;
}

export function UserDetailDialog({
  open, onOpenChange, user, userProfile, userActions, onSave, saving,
}: UserDetailDialogProps) {
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<UserRow>>({});

  const handleOpen = (isOpen: boolean) => {
    onOpenChange(isOpen);
    if (!isOpen) setEditing(false);
  };

  const startEditing = () => {
    if (user) setEditForm({ ...user });
    setEditing(true);
  };

  const cancelEditing = () => {
    if (user) setEditForm({ ...user });
    setEditing(false);
  };

  const hasChanges = user && (
    editForm.full_name !== user.full_name ||
    editForm.phone !== user.phone ||
    editForm.role !== user.role
  );

  const handleSave = async () => {
    if (!user) return;
    const updates: Partial<UserRow> = {};
    if (editForm.full_name !== user.full_name) updates.full_name = editForm.full_name ?? null;
    if (editForm.phone !== user.phone) updates.phone = editForm.phone ?? null;
    if (editForm.role !== user.role) updates.role = editForm.role as UserRow["role"];
    await onSave(updates);
    setEditing(false);
  };

  // Sync editForm when user changes
  if (user && !editing && editForm.id !== user.id) {
    setEditForm({ ...user });
  }

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            {editing ? "Editar Usuário" : "Detalhes do Usuário"}
          </DialogTitle>
        </DialogHeader>

        {user && (
          <Tabs defaultValue="info" className="mt-2">
            <TabsList className="w-full">
              <TabsTrigger value="info" className="flex-1">Informações</TabsTrigger>
              {user.role === "professional" && (
                <TabsTrigger value="profile" className="flex-1">Perfil</TabsTrigger>
              )}
              <TabsTrigger value="history" className="flex-1">Histórico</TabsTrigger>
            </TabsList>

            {/* ── Info Tab ── */}
            <TabsContent value="info" className="space-y-4 mt-4">
              <div className="flex gap-2 justify-end">
                {!editing ? (
                  <Button size="sm" variant="outline" onClick={startEditing}>
                    <Pencil className="mr-1.5 h-3.5 w-3.5" /> Editar
                  </Button>
                ) : (
                  <>
                    <Button size="sm" variant="ghost" onClick={cancelEditing}>Cancelar</Button>
                    <Button size="sm" onClick={handleSave} disabled={saving || !hasChanges}>
                      <Save className="mr-1.5 h-3.5 w-3.5" /> Salvar
                    </Button>
                  </>
                )}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Nome completo</Label>
                  {editing ? (
                    <Input value={editForm.full_name ?? ""} onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })} className="h-9" />
                  ) : (
                    <p className="text-sm font-medium">{user.full_name || "—"}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Email</Label>
                  <p className="text-sm font-medium flex items-center gap-1.5">
                    <Mail className="h-3.5 w-3.5 text-muted-foreground" /> {user.email}
                  </p>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Telefone</Label>
                  {editing ? (
                    <Input value={editForm.phone ?? ""} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} className="h-9" placeholder="(XX) XXXXX-XXXX" />
                  ) : (
                    <p className="text-sm font-medium flex items-center gap-1.5">
                      <Phone className="h-3.5 w-3.5 text-muted-foreground" /> {user.phone || "—"}
                    </p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Tipo / Role</Label>
                  {editing ? (
                    <Select value={editForm.role} onValueChange={(v) => setEditForm({ ...editForm, role: v as UserRow["role"] })}>
                      <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="client">Cliente</SelectItem>
                        <SelectItem value="professional">Profissional</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <Badge variant={ROLE_MAP[user.role]?.variant ?? "secondary"}>
                      {ROLE_MAP[user.role]?.label ?? user.role}
                    </Badge>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Data de cadastro</Label>
                  <p className="text-sm flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5 text-muted-foreground" /> {fmtDateTime(user.created_at)}
                  </p>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Última atualização</Label>
                  <p className="text-sm flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-muted-foreground" /> {fmtDateTime(user.updated_at)}
                  </p>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Login com Google</Label>
                  <p className="text-sm">{user.google_auth_enabled ? "Sim ✓" : "Não"}</p>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Código de referência</Label>
                  <p className="text-sm flex items-center gap-1.5">
                    <Link2 className="h-3.5 w-3.5 text-muted-foreground" /> {user.referral_code || "—"}
                  </p>
                </div>
              </div>

              <Separator />

              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">ID do usuário</Label>
                <p className="text-xs font-mono text-muted-foreground break-all">{user.id}</p>
              </div>

              {user.referred_by_user_id && (
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Referido por</Label>
                  <p className="text-xs font-mono text-muted-foreground break-all">{user.referred_by_user_id}</p>
                </div>
              )}
            </TabsContent>

            {/* ── Profile Tab ── */}
            {user.role === "professional" && (
              <TabsContent value="profile" className="space-y-4 mt-4">
                {userProfile ? (
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">Nome do perfil</Label>
                      <p className="text-sm font-medium">{userProfile.display_name || "—"}</p>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">Slug</Label>
                      <p className="text-sm font-mono">{userProfile.slug || "—"}</p>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">Categoria</Label>
                      <p className="text-sm">{userProfile.category || "—"}</p>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">Cidade</Label>
                      <p className="text-sm">{userProfile.city || "—"}</p>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">Status</Label>
                      <Badge variant="outline">{userProfile.status}</Badge>
                    </div>
                    <div className="col-span-full">
                      <Button variant="outline" size="sm" asChild>
                        <a href={`/admin/perfis/${userProfile.id}`}>
                          <Eye className="mr-1.5 h-3.5 w-3.5" /> Ver perfil completo
                        </a>
                      </Button>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground py-4 text-center">
                    Nenhum perfil profissional encontrado.
                  </p>
                )}
              </TabsContent>
            )}

            {/* ── History Tab ── */}
            <TabsContent value="history" className="mt-4">
              {userActions.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">
                  Nenhuma ação registrada.
                </p>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {userActions.map((a) => (
                    <div key={a.id} className="flex items-start gap-3 rounded-md border border-border p-3 text-sm">
                      <Shield className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                      <div className="min-w-0">
                        <p className="font-medium">{a.action_type}</p>
                        {a.notes && <p className="text-xs text-muted-foreground mt-0.5">{a.notes}</p>}
                        <p className="text-xs text-muted-foreground mt-1">{fmtDateTime(a.created_at)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
}
