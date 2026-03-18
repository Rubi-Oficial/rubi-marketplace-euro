import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export default function ContactPage() {
  return (
    <div className="container mx-auto max-w-xl px-4 py-12 animate-fade-in">
      <h1 className="font-display text-4xl font-bold text-foreground">Contacto</h1>
      <p className="mt-2 text-muted-foreground">Envie-nos uma mensagem.</p>

      <form className="mt-8 space-y-4" onSubmit={(e) => e.preventDefault()}>
        <div className="space-y-2">
          <Label htmlFor="name">Nome</Label>
          <Input id="name" placeholder="Seu nome" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" placeholder="seu@email.com" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="message">Mensagem</Label>
          <Textarea id="message" placeholder="Escreva sua mensagem..." rows={5} />
        </div>
        <Button variant="premium" className="w-full">Enviar</Button>
      </form>
    </div>
  );
}
