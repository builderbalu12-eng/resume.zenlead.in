import * as React from "react";

import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";

export function PremiumCard({
  className,
  hover = true,
  ...props
}: React.ComponentProps<typeof Card> & { hover?: boolean }) {
  return (
    <Card
      className={cn(
        "rounded-xl border-border/60 shadow-sm",
        "bg-card/80 backdrop-blur supports-[backdrop-filter]:bg-card/70",
        hover &&
          "transition-[transform,box-shadow,border-color] hover:-translate-y-0.5 hover:shadow-md hover:border-border",
        className,
      )}
      {...props}
    />
  );
}

