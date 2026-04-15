/**
 * ShimmerButton — primary CTA with a sweeping shimmer on hover.
 * Pure Tailwind + Framer Motion, no extra packages.
 */
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import React from "react";

interface ShimmerButtonProps {
  children: React.ReactNode;
  className?: string;
  shimmerColor?: string;
  onClick?: () => void;
  disabled?: boolean;
  type?: "button" | "submit" | "reset";
}

export function ShimmerButton({
  children,
  className,
  shimmerColor = "rgba(255,255,255,0.25)",
  onClick,
  disabled,
  type = "button",
}: ShimmerButtonProps) {
  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={disabled}
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
      className={cn(
        "relative overflow-hidden rounded-xl px-6 py-3 font-semibold text-white",
        "gradient-primary shadow-glow transition-shadow hover:shadow-glow-lg",
        className
      )}
    >
      {/* Shimmer sweep overlay */}
      <motion.span
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background: `linear-gradient(105deg, transparent 40%, ${shimmerColor} 50%, transparent 60%)`,
          backgroundSize: "200% 100%",
        }}
        initial={{ backgroundPosition: "-200% 0" }}
        whileHover={{ backgroundPosition: "200% 0" }}
        transition={{ duration: 0.55, ease: "easeInOut" }}
      />
      <span className="relative z-10 flex items-center gap-2">{children}</span>
    </motion.button>
  );
}
