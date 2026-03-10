import * as React from "react";

import { cn } from "@/lib/utils";

export function Page({
  children,
  className,
  size = "lg",
}: {
  children: React.ReactNode;
  className?: string;
  size?: "md" | "lg" | "xl";
}) {
  const max =
    size === "md"
      ? "max-w-3xl"
      : size === "xl"
        ? "max-w-7xl"
        : "max-w-6xl";

  return <div className={cn("mx-auto w-full", max, className)}>{children}</div>;
}

