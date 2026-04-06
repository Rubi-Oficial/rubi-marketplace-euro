import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { User, Lock } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";

export default function ClientSettings() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("users")
      .select("full_name, phone")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data, error }) => {
        if (error) {
          console.error("[ClientSettings] Failed to load user data:", error.message);
          toast.error(t("settings.save_error") || "Erro ao carregar dados.");
          return;
        }
        if (data) {
          setFullName(data.full_name || "");
          setPhone(data.phone || "");
        }
      })
      .catch((err) => {
        console.error("[ClientSettings] Unexpected error:", err);
      });
  }, [user]);

  const saveProfile = async () => {
    if (!user) return;
    if (fullName.trim().length > 100) { toast.error("Nome deve ter no máximo 100 caracteres."); return; }
    if (phone.trim().length > 20) { toast.error("Telefone deve ter no máximo 20 caracteres."); return; }
    setSaving(true);
    try {
      const { error } = await supabase
        .from("users")
        .update({ full_name: fullName.trim(), phone: phone.trim() })
        .eq("id", user.id);
      if (error) {
        console.error("[ClientSettings] Save error:", error.message);
        toast.error(t("settings.save_error"));
      } else {
        toast.success(t("settings.data_updated"));
      }
    } catch (err) {
      console.error("[ClientSettings] Unexpected save error:", err);
      toast.error("Ocorreu um erro inesperado. Tente novamente.");
    } finally {
      setSaving(false);
    }
  };

  const changePassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      toast.error(t("settings.password_min_new"));
      return;
    }
    setChangingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) {
        console.error("[ClientSettings] Password error:", error.message);
        toast.error(t("settings.password_error") || "Não foi possível alterar a senha. Tente novamente.");
      } else {
        toast.success(t("settings.password_changed_success"));
        setCurrentPassword("");
        setNewPassword("");
      }
    } catch (err) {
      console.error("[ClientSettings] Unexpected password error:", err);
      toast.error("Ocorreu um erro inesperado. Tente novamente.");
    } finally {
      setChangingPassword(false);
    }
  };

  return (
    <div className="animate-fade-in space-y-8 max-w-xl">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">{t("settings.title")}</h1>
        <p className="mt-1 text-muted-foreground">{t("settings.manage")}</p>
      </div>

      <div className="rounded-lg border border-border bg-card p-6 space-y-5">
        <div className="flex items-center gap-2 text-foreground">
          <User className="h-5 w-5 text-primary" />
          <h2 className="font-display text-lg font-semibold">{t("settings.personal")}</h2>
        </div>

        <div className="space-y-1">
          <Label className="text-muted-foreground text-sm">{t("settings.email")}</Label>
          <p className="text-sm text-foreground">{user?.email}</p>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="fullName">{t("settings.full_name")}</Label>
          <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="phone">{t("settings.phone")}</Label>
          <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+55 11 99999-0000" />
        </div>

        <Button onClick={saveProfile} disabled={saving}>
          {saving ? t("common.saving") : t("settings.save_changes")}
        </Button>
      </div>

      <div className="rounded-lg border border-border bg-card p-6 space-y-5">
        <div className="flex items-center gap-2 text-foreground">
          <Lock className="h-5 w-5 text-primary" />
          <h2 className="font-display text-lg font-semibold">{t("settings.change_password")}</h2>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="newPassword">{t("settings.new_password")}</Label>
          <Input id="newPassword" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder={t("settings.password_placeholder")} />
        </div>

        <Button variant="outline" onClick={changePassword} disabled={changingPassword}>
          {changingPassword ? t("settings.changing") : t("settings.change_password")}
        </Button>
      </div>
    </div>
  );
}
