import { useState, useEffect, forwardRef } from "react";
import { Link, useNavigate, useSearchParams, Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { useAuth, getRoleDashboard } from "@/contexts/AuthContext";
import { getStoredReferralCode } from "@/hooks/useReferralCapture";
import { saveOAuthPreState } from "@/lib/oauthState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useLanguage } from "@/i18n/LanguageContext";
import { Eye, EyeOff, User, Briefcase } from "lucide-react";
import BrandLogo from "@/components/shared/BrandLogo";

const RegisterPage = forwardRef<HTMLDivElement>(function RegisterPage(_props, ref) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<"client" | "professional">("client");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const referralCode = searchParams.get("ref") || getStoredReferralCode();
  const presetRole = searchParams.get("role");
  const { user, userRole, loading: authLoading } = useAuth();
  const { t } = useLanguage();

  useEffect(() => {
    if (presetRole === "professional") setRole("professional");
  }, [presetRole]);

  if (!authLoading && user && userRole) {
    return <Navigate to={getRoleDashboard(userRole)} replace />;
  }

  const isValidEmail = (email: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim());

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isValidEmail(email)) {
      toast.error(t("auth.invalid_email") || "Please enter a valid email address");
      return;
    }

    setLoading(true);

    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        emailRedirectTo: window.location.origin,
        data: {
          full_name: fullName,
          role,
          referral_code: referralCode,
        },
      },
    });

    setLoading(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    if (data.user) {
      toast.success(t("auth.register_success"));
      if (role === "professional") {
        navigate("/app/onboarding", { replace: true });
      } else {
        navigate("/cliente", { replace: true });
      }
    }
  };

  const handleGoogleRegister = async () => {
    saveOAuthPreState({ role, referral_code: referralCode || null });
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result?.error) toast.error(String(result.error));
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-8">
      <div className="w-full max-w-md animate-fade-in">
        <div className="mb-8 text-center">
          <Link to="/" className="inline-flex justify-center" aria-label="Velvet Escorts VIP — Home">
            <BrandLogo imgClassName="h-14 sm:h-16" />
          </Link>
          <p className="mt-2 text-muted-foreground">{t("auth.create_account")}</p>
        </div>

        <div className="rounded-2xl border border-border/60 bg-card p-6 sm:p-8 shadow-[0_10px_30px_hsl(274_36%_4%_/_0.35)]">
          <form onSubmit={handleRegister} className="space-y-4" noValidate>
            <div className="space-y-2">
              <Label htmlFor="fullName">{t("auth.full_name")}</Label>
              <Input
                id="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder={t("auth.your_name")}
                required
                autoComplete="name"
                className="rounded-lg"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">{t("auth.email")}</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t("auth.email_placeholder")}
                required
                autoComplete="email"
                className="rounded-lg"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">{t("auth.password")}</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t("auth.password_placeholder")}
                  minLength={6}
                  required
                  autoComplete="new-password"
                  className="pr-10 rounded-lg"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label>{t("auth.account_type")}</Label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setRole("client")}
                  className={`flex flex-col items-center gap-1.5 rounded-xl border-2 px-4 py-4 text-sm transition-all duration-200 ${
                    role === "client"
                      ? "border-primary bg-primary/8 text-primary shadow-sm"
                      : "border-border text-muted-foreground hover:border-primary/30 hover:bg-accent/50"
                  }`}
                  aria-pressed={role === "client"}
                >
                  <User className="h-5 w-5" />
                  <span className="font-medium">{t("auth.client")}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setRole("professional")}
                  className={`flex flex-col items-center gap-1.5 rounded-xl border-2 px-4 py-4 text-sm transition-all duration-200 ${
                    role === "professional"
                      ? "border-primary bg-primary/8 text-primary shadow-sm"
                      : "border-border text-muted-foreground hover:border-primary/30 hover:bg-accent/50"
                  }`}
                  aria-pressed={role === "professional"}
                >
                  <Briefcase className="h-5 w-5" />
                  <span className="font-medium">{t("auth.professional")}</span>
                </button>
              </div>
            </div>

            {referralCode && (
              <p className="text-xs text-primary">
                {t("auth.referral_code")}: {referralCode}
              </p>
            )}

            <Button type="submit" variant="premium" className="w-full rounded-lg h-11 text-sm font-semibold" disabled={loading}>
              {loading ? t("auth.creating") : t("auth.create")}
            </Button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-card px-2 text-muted-foreground">{t("auth.or_continue")}</span>
            </div>
          </div>

          <Button variant="outline" className="w-full rounded-lg h-11 text-sm" onClick={handleGoogleRegister}>
            <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
              <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
              <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Google
          </Button>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            {t("auth.has_account")}{" "}
            <Link to="/login" className="text-primary font-medium hover:underline">
              {t("auth.sign_in")}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
});

export default RegisterPage;
