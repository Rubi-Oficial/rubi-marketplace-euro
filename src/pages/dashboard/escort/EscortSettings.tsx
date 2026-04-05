import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useLanguage } from "@/i18n/LanguageContext";

export default function EscortSettings() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [changingPw, setChangingPw] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase.from("users").select("full_name, phone").eq("id", user.id).single()
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
    const { error } = await supabase.from("users").update({ full_name: fullName, phone }).eq("id", user.id);
    setSaving(false);
    if (error) { console.error("[EscortSettings] Save error:", error.message); toast.error(t("settings.save_error") || "Não foi possível guardar. Tente novamente."); return; }
    toast.success(t("settings.data_updated"));
  };

  const changePassword = async () => {
    if (newPassword.length < 6) { toast.error(t("settings.password_min")); return; }
    setChangingPw(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setChangingPw(false);
    if (error) { console.error("[EscortSettings] Password error:", error.message); toast.error(t("settings.password_error") || "Não foi possível alterar a senha. Tente novamente."); return; }
    setNewPassword("");
    toast.success(t("settings.password_changed"));
  };

  return (
    <div className="animate-fade-in space-y-8">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">{t("settings.title")}</h1>
        <p className="mt-1 text-muted-foreground">{t("settings.manage")}</p>
      </div>

      <div className="rounded-lg border border-border bg-card p-6 space-y-4">
        <h2 className="font-display text-lg font-semibold text-foreground">{t("settings.personal")}</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="fullName">{t("settings.full_name")}</Label>
            <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">{t("settings.phone")}</Label>
            <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+55 11 99999-9999" />
          </div>
        </div>
        <Button onClick={saveProfile} disabled={saving}>{saving ? t("common.saving") : t("common.save")}</Button>
      </div>

      <div className="rounded-lg border border-border bg-card p-6 space-y-4">
        <h2 className="font-display text-lg font-semibold text-foreground">{t("settings.change_password")}</h2>
        <div className="max-w-sm space-y-2">
          <Label htmlFor="newPassword">{t("settings.new_password")}</Label>
          <Input id="newPassword" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder={t("settings.password_placeholder")} />
        </div>
        <Button variant="outline" onClick={changePassword} disabled={changingPw}>{changingPw ? t("settings.changing") : t("settings.change_password")}</Button>
      </div>
    </div>
  );
}
