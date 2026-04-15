/**
 * GlowBorder — animated pulsing gradient border for the popular plan card.
 * Aceternity-style. Pure Tailwind + CSS animation, no extra packages.
 */
import { cn } from "@/lib/utils";

interface GlowBorderProps {
  children: React.ReactNode;
  className?: string;
  active?: boolean;
}

export function GlowBorder({ children, className, active = true }: GlowBorderProps) {
  if (!active) return <div className={className}>{children}</div>;

  return (
    <div className={cn("relative rounded-2xl p-[2px] overflow-hidden", className)}>
      {/* Animated gradient border */}
      <div
        className="absolute inset-0 rounded-2xl animate-gradient-x"
        style={{
          background:
            "linear-gradient(135deg, #6366f1, #8b5cf6, #a78bfa, #6366f1)",
          backgroundSize: "300% 300%",
        }}
      />
      {/* Glow pulse layer */}
      <div className="absolute inset-0 rounded-2xl animate-glow-pulse opacity-60" />
      {/* Inner card */}
      <div className={cn("relative rounded-[14px] bg-background z-10 h-full")}>
        {children}
      </div>
    </div>
  );
}
