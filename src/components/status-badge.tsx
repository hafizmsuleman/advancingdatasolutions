import { BadgeCheck, CalendarCheck, FileSignature, Clock } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

type BadgeKind = "verified" | "nda-signed" | "attendance-confirmed" | "attendance-pending";

const BADGE_CONFIG: Record<
  BadgeKind,
  { label: string; icon: LucideIcon; className: string }
> = {
  verified: {
    label: "Verified",
    icon: BadgeCheck,
    className: "border-success/30 bg-success/10 text-success",
  },
  "nda-signed": {
    label: "NDA signed",
    icon: FileSignature,
    className: "border-success/30 bg-success/10 text-success",
  },
  "attendance-confirmed": {
    label: "Attendance confirmed",
    icon: CalendarCheck,
    className: "border-success/30 bg-success/10 text-success",
  },
  "attendance-pending": {
    label: "Attendance pending",
    icon: Clock,
    className: "border-warning/30 bg-warning/10 text-warning",
  },
};

interface StatusBadgeProps {
  kind: BadgeKind;
  className?: string;
}

export function StatusBadge({ kind, className }: StatusBadgeProps) {
  const config = BADGE_CONFIG[kind];
  const Icon = config.icon;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium",
        config.className,
        className,
      )}
    >
      <Icon className="h-3.5 w-3.5" aria-hidden />
      {config.label}
    </span>
  );
}
