import * as React from "react";

import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";

export function PremiumInput({
  className,
  ...props
}: React.ComponentProps<typeof Input>) {
  return (
    <Input
      className={cn("h-10 rounded-xl", className)}
      {...props}
    />
  );
}

