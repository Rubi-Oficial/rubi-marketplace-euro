import { useState } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/lib/supabase";
import { CheckCircle, Loader2 } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import { usePageMeta } from "@/hooks/usePageMeta";

const contactSchema = z.object({
  name: z.string().trim().min(1).max(100),
  email: z.string().trim().email().max(255),
  message: z.string().trim().min(1).max(2000),
});

type FieldErrors = Partial<Record<keyof z.infer<typeof contactSchema>, string>>;

export default function ContactPage() {
  const { t } = useLanguage();

  usePageMeta({
    title: t("contact.title"),
    description: "Contact Rubi Girls. Send us a message for support, feedback or partnership inquiries.",
    path: "/contato",
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "ContactPage",
      name: "Contact Rubi Girls",
      url: "https://rubigirls.fun/contato",
    },
  });
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setSubmitError(null);

    const result = contactSchema.safeParse({ name, email, message });
    if (!result.success) {
      const fieldErrors: FieldErrors = {};
      result.error.issues.forEach((issue) => {
        const field = issue.path[0] as keyof FieldErrors;
        if (!fieldErrors[field]) fieldErrors[field] = issue.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setSending(true);
    const { error } = await supabase
      .from("contact_messages")
      .insert({ name: result.data.name, email: result.data.email, message: result.data.message });

    setSending(false);

    if (error) {
      setSubmitError(t("contact.error"));
      return;
    }

    setSent(true);
  };

  if (sent) {
    return (
      <div className="container mx-auto max-w-xl px-4 py-12 animate-fade-in">
        <div className="flex flex-col items-center text-center py-16">
          <CheckCircle className="h-12 w-12 text-primary mb-4" />
          <h1 className="font-display text-3xl font-bold text-foreground">{t("contact.sent_title")}</h1>
          <p className="mt-2 text-muted-foreground">{t("contact.sent_desc")}</p>
          <Button variant="outline" className="mt-6" onClick={() => { setSent(false); setName(""); setEmail(""); setMessage(""); }}>
            {t("contact.send_another")}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-xl px-4 py-12 animate-fade-in">
      <h1 className="font-display text-4xl font-bold text-foreground">{t("contact.title")}</h1>
      <p className="mt-2 text-muted-foreground">{t("contact.desc")}</p>

      {submitError && (
        <Alert variant="destructive" className="mt-6">
          <AlertDescription>{submitError}</AlertDescription>
        </Alert>
      )}

      <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
        <div className="space-y-2">
          <Label htmlFor="name">{t("contact.name")}</Label>
          <Input id="name" placeholder={t("contact.name_placeholder")} value={name} onChange={(e) => setName(e.target.value)} />
          {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">{t("contact.email")}</Label>
          <Input id="email" type="email" placeholder={t("contact.email_placeholder")} value={email} onChange={(e) => setEmail(e.target.value)} />
          {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="message">{t("contact.message")}</Label>
          <Textarea id="message" placeholder={t("contact.message_placeholder")} rows={5} value={message} onChange={(e) => setMessage(e.target.value)} />
          {errors.message && <p className="text-sm text-destructive">{errors.message}</p>}
        </div>
        <Button variant="premium" className="w-full" disabled={sending}>
          {sending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{t("contact.sending")}</> : t("contact.send")}
        </Button>
      </form>
    </div>
  );
}
