import React from "react";
import { MessageCircle, Send } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ProfileContactSectionProps {
  whatsapp: string | null;
  telegram: string | null;
  sectionStyle: React.CSSProperties;
  onWhatsappClick: () => void;
  onTelegramClick: () => void;
}

export const ProfileContactSection = React.memo(function ProfileContactSection({
  whatsapp,
  telegram,
  sectionStyle,
  onWhatsappClick,
  onTelegramClick,
}: ProfileContactSectionProps) {
  return (
    <section id="contact" style={sectionStyle} className="rounded-2xl border border-border/30 bg-card/60 p-5">
      <h2 className="font-display text-xl font-semibold text-foreground">Contato direto</h2>
      <p className="mt-1 text-sm text-muted-foreground">Resposta pelos canais oficiais do perfil.</p>
      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        {whatsapp && (
          <Button className="bg-green-600 hover:bg-green-700 sm:flex-1" asChild>
            <a
              href={`https://wa.me/${whatsapp.replace(/\D/g, "")}`}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Entrar em contato por WhatsApp"
              onClick={onWhatsappClick}
            >
              <MessageCircle className="mr-2 h-4 w-4" /> Falar no WhatsApp
            </a>
          </Button>
        )}
        {telegram && (
          <Button variant="outline" className="sm:flex-1" asChild>
            <a
              href={`https://t.me/${telegram.replace("@", "")}`}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Entrar em contato por Telegram"
              onClick={onTelegramClick}
            >
              <Send className="mr-2 h-4 w-4" /> Conversar no Telegram
            </a>
          </Button>
        )}
      </div>
    </section>
  );
});
