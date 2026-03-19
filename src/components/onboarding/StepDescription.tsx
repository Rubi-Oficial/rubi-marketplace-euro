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
        <Label htmlFor="bio">About you</Label>
        <Textarea
          id="bio"
          value={form.bio}
          onChange={(e) => update("bio", e.target.value)}
          placeholder="Describe yourself in a few words..."
          rows={5}
          maxLength={1000}
        />
        <p className="text-xs text-muted-foreground">
          {form.bio.length}/1000 characters
        </p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="pricing_from">Starting price (€)</Label>
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
          placeholder="+31 6 12345678"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="telegram">Telegram</Label>
        <Input
          id="telegram"
          value={form.telegram}
          onChange={(e) => update("telegram", e.target.value)}
          placeholder="@youruser"
        />
      </div>
    </div>
  );
}
