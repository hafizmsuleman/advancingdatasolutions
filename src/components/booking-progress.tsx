import { Check } from "lucide-react";

import { cn } from "@/lib/utils";

export interface BookingStep {
  label: string;
}

interface BookingProgressProps {
  steps: BookingStep[];
  currentStep: number; // 0-based index of the active step
}

export function BookingProgress({ steps, currentStep }: BookingProgressProps) {
  return (
    <nav aria-label="Booking progress" className="w-full">
      <ol className="flex items-center gap-2">
        {steps.map((step, index) => {
          const isComplete = index < currentStep;
          const isCurrent = index === currentStep;
          return (
            <li key={step.label} className="flex flex-1 items-center gap-2 last:flex-none">
              <span
                className={cn(
                  "flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-xs font-medium tnums",
                  isComplete && "border-primary bg-primary text-primary-foreground",
                  isCurrent && "border-primary bg-card text-primary",
                  !isComplete && !isCurrent && "border-border bg-card text-muted-foreground",
                )}
                aria-current={isCurrent ? "step" : undefined}
              >
                {isComplete ? <Check className="h-3.5 w-3.5" aria-hidden /> : index + 1}
              </span>
              <span
                className={cn(
                  "hidden text-sm sm:inline",
                  isCurrent ? "font-medium text-foreground" : "text-muted-foreground",
                )}
              >
                {step.label}
              </span>
              {index < steps.length - 1 && (
                <span
                  aria-hidden
                  className={cn(
                    "h-px flex-1",
                    index < currentStep ? "bg-primary" : "bg-border",
                  )}
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
