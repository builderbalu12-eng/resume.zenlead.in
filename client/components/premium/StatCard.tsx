import * as React from "react";
import { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { PremiumCard } from "./PremiumCard";

export function StatCard({
  label,
  value,
  icon: Icon,
  trend,
  className,
}: {
  label: string;
  value: React.ReactNode;
  icon?: LucideIcon;
  trend?: React.ReactNode;
  className?: string;
}) {
  return (
    <PremiumCard className={cn("p-5", className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {label}
          </p>
          <div className="text-2xl font-semibold tracking-tight">{value}</div>
          {trend ? <div className="text-xs text-muted-foreground">{trend}</div> : null}
        </div>
        {Icon ? (
          <div className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary">
            <Icon className="size-5" />
          </div>
        ) : null}
      </div>
    </PremiumCard>
  );
}

