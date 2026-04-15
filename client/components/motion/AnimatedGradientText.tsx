/**
 * AnimatedGradientText — gradient shimmer sweeps across the text.
 * Magic UI / Aceternity style. Pure CSS animation.
 */
import { cn } from "@/lib/utils";

interface AnimatedGradientTextProps {
  children: React.ReactNode;
  className?: string;
  from?: string;
  via?: string;
  to?: string;
}

export function AnimatedGradientText({
  children,
  className,
  from = "#6366f1",
  via = "#a78bfa",
  to = "#8b5cf6",
}: AnimatedGradientTextProps) {
  return (
    <span
      className={cn("animate-gradient-x", className)}
      style={{
        background: `linear-gradient(135deg, ${from} 0%, ${via} 40%, ${to} 60%, ${from} 100%)`,
        backgroundSize: "300% 300%",
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent",
        backgroundClip: "text",
      }}
    >
      {children}
    </span>
  );
}
