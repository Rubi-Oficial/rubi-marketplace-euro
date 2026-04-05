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
      .single()
      .then(({ data }) => {
        if (data) {
          setFullName(data.full_name || "");
          setPhone(data.phone || "");
        }
      });
  }, [user]);

  const saveProfile = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase
      .from("users")
      .update({ full_name: fullName, phone })
      .eq("id", user.id);
    setSaving(false);
    if (error) {
      toast.error(t("settings.save_error"));
    } else {
      toast.success(t("settings.data_updated"));
    }
  };

  const changePassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      toast.error(t("settings.password_min_new"));
      return;
    }
    setChangingPassword(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setChangingPassword(false);
    if (error) {
      console.error("[ClientSettings] Password error:", error.message);
      toast.error(t("settings.password_error") || "Não foi possível alterar a senha. Tente novamente.");
    } else {
      toast.success(t("settings.password_changed_success"));
      setCurrentPassword("");
      setNewPassword("");
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
