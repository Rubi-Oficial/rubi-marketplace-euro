import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export interface StepConfig {
  label: string;
}

interface StepperProps {
  steps: StepConfig[];
  currentStep: number;
}

export default function Stepper({ steps, currentStep }: StepperProps) {
  return (
    <div className="flex items-center justify-center gap-2">
      {steps.map((step, i) => (
        <div key={i} className="flex items-center gap-2">
          <div
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-full text-xs font-medium transition-colors",
              i < currentStep
                ? "bg-primary text-primary-foreground"
                : i === currentStep
                ? "border-2 border-primary text-primary"
                : "border border-border text-muted-foreground"
            )}
          >
            {i < currentStep ? <Check className="h-4 w-4" /> : i + 1}
          </div>
          {i < steps.length - 1 && (
            <div
              className={cn(
                "hidden h-px w-8 sm:block",
                i < currentStep ? "bg-primary" : "bg-border"
              )}
            />
          )}
        </div>
      ))}
    </div>
  );
}
