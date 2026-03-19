import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { ProfileDraft } from "./types";

interface Props {
  form: ProfileDraft;
  update: (field: keyof ProfileDraft, value: string) => void;
}

export default function StepDescription({ form, update }: Props) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="bio">Sobre você</Label>
        <Textarea
          id="bio"
          value={form.bio}
          onChange={(e) => update("bio", e.target.value)}
          placeholder="Descreva-se em poucas palavras..."
          rows={5}
          maxLength={1000}
        />
        <p className="text-xs text-muted-foreground">
          {form.bio.length}/1000 caracteres
        </p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="pricing_from">Valor a partir de (€)</Label>
        <Input
          id="pricing_from"
          type="number"
          min={0}
          value={form.pricing_from}
          onChange={(e) => update("pricing_from", e.target.value)}
          placeholder="200"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="whatsapp">WhatsApp</Label>
        <Input
          id="whatsapp"
          value={form.whatsapp}
          onChange={(e) => update("whatsapp", e.target.value)}
          placeholder="+55 11 99999-9999"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="telegram">Telegram</Label>
        <Input
          id="telegram"
          value={form.telegram}
          onChange={(e) => update("telegram", e.target.value)}
          placeholder="@seuuser"
        />
      </div>
    </div>
  );
}
