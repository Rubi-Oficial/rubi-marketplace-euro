import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ProfileDraft } from "./types";

interface Props {
  form: ProfileDraft;
  update: (field: keyof ProfileDraft, value: string) => void;
}

export default function StepBasicInfo({ form, update }: Props) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="display_name">Display name *</Label>
        <Input
          id="display_name"
          value={form.display_name}
          onChange={(e) => update("display_name", e.target.value)}
          placeholder="How would you like to be called"
          maxLength={60}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="age">Age</Label>
        <Input
          id="age"
          type="number"
          min={18}
          max={99}
          value={form.age}
          onChange={(e) => update("age", e.target.value)}
          placeholder="18"
        />
      </div>
    </div>
  );
}
