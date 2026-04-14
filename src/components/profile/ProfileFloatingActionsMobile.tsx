import { Button } from "@/components/ui/button";
import { MessageCircle, Send } from "lucide-react";

interface ProfileFloatingActionsMobileProps {
  whatsapp: string | null;
  telegram: string | null;
  onWhatsappClick: () => void;
  onTelegramClick: () => void;
}

export function ProfileFloatingActionsMobile({
  whatsapp,
  telegram,
  onWhatsappClick,
  onTelegramClick,
}: ProfileFloatingActionsMobileProps) {
  if (!whatsapp && !telegram) return null;

  const singleChannel = Boolean(whatsapp) !== Boolean(telegram);

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border/30 bg-background/90 px-4 pb-[calc(0.65rem+env(safe-area-inset-bottom))] pt-2.5 shadow-[0_-8px_24px_rgba(0,0,0,0.12)] backdrop-blur-2xl md:hidden"
      role="region"
      aria-label="Ações rápidas de contato"
    >
      <div className={`mx-auto flex max-w-xl gap-2 ${singleChannel ? "justify-center" : ""}`}>
        {whatsapp && (
          <Button size="lg" className={`h-11 bg-green-600 text-sm font-semibold hover:bg-green-700 ${singleChannel ? "w-full" : "flex-1"}`} asChild>
            <a
              href={`https://wa.me/${whatsapp.replace(/\D/g, "")}`}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Entrar em contato por WhatsApp"
              onClick={onWhatsappClick}
            >
              <MessageCircle className="mr-1.5 h-4 w-4" /> Falar no WhatsApp
            </a>
          </Button>
        )}
        {telegram && (
          <Button size="lg" variant="outline" className={`h-11 border-border/40 text-sm font-semibold ${singleChannel ? "w-full" : "flex-1"}`} asChild>
            <a
              href={`https://t.me/${telegram.replace("@", "")}`}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Entrar em contato por Telegram"
              onClick={onTelegramClick}
            >
              <Send className="mr-1.5 h-4 w-4" /> Conversar no Telegram
            </a>
          </Button>
        )}
      </div>
    </div>
  );
}
