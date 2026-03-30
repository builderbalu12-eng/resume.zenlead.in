import * as React from "react";
import { AlertTriangle, Loader2, Sparkles } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { PremiumCard } from "./PremiumCard";

export function LoadingState({
  title = "Loading…",
  description,
  className,
}: {
  title?: string;
  description?: string;
  className?: string;
}) {
  return (
    <PremiumCard className={cn("p-8", className)} hover={false}>
      <div className="flex items-center gap-4">
        <div className="grid size-11 place-items-center rounded-2xl bg-primary/10 text-primary">
          <Loader2 className="size-5 animate-spin" />
        </div>
        <div className="min-w-0">
          <p className="font-semibold">{title}</p>
          {description ? (
            <p className="text-sm text-muted-foreground">{description}</p>
          ) : null}
        </div>
      </div>
    </PremiumCard>
  );
}

export function EmptyState({
  title,
  description,
  action,
  className,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <PremiumCard className={cn("p-10 text-center", className)} hover={false}>
      <div className="mx-auto mb-4 grid size-12 place-items-center rounded-2xl bg-secondary/10 text-secondary">
        <Sparkles className="size-5" />
      </div>
      <p className="text-base font-semibold">{title}</p>
      {description ? (
        <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
          {description}
        </p>
      ) : null}
      {action ? <div className="mt-5 flex justify-center">{action}</div> : null}
    </PremiumCard>
  );
}

export function ErrorState({
  title = "Something went wrong",
  description,
  onRetry,
  className,
}: {
  title?: string;
  description?: string;
  onRetry?: () => void;
  className?: string;
}) {
  return (
    <PremiumCard className={cn("p-8", className)} hover={false}>
      <div className="flex items-start gap-4">
        <div className="mt-0.5 grid size-11 place-items-center rounded-2xl bg-destructive/10 text-destructive">
          <AlertTriangle className="size-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-semibold">{title}</p>
          {description ? (
            <p className="mt-1 text-sm text-muted-foreground whitespace-pre-wrap">
              {description}
            </p>
          ) : null}
          {onRetry ? (
            <div className="mt-4">
              <Button variant="outline" onClick={onRetry}>
                Try again
              </Button>
            </div>
          ) : null}
        </div>
      </div>
    </PremiumCard>
  );
}

