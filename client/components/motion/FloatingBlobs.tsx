/**
 * FloatingBlobs — soft animated gradient circles for hero background.
 * Aceternity BackgroundBeams-lite style. Pure Framer Motion.
 */
import { motion } from "framer-motion";

interface FloatingBlobsProps {
  className?: string;
}

const blobs = [
  {
    className: "top-[-80px] left-[-60px] w-[420px] h-[420px]",
    color: "rgba(99,102,241,0.18)",
    duration: 9,
    delay: 0,
  },
  {
    className: "bottom-[-60px] right-[-80px] w-[380px] h-[380px]",
    color: "rgba(139,92,246,0.15)",
    duration: 11,
    delay: 1.5,
  },
  {
    className: "top-[40%] left-[55%] w-[260px] h-[260px]",
    color: "rgba(167,139,250,0.12)",
    duration: 13,
    delay: 3,
  },
];

export function FloatingBlobs({ className }: FloatingBlobsProps) {
  return (
    <div
      className={`pointer-events-none absolute inset-0 overflow-hidden ${className ?? ""}`}
      aria-hidden
    >
      {blobs.map((b, i) => (
        <motion.div
          key={i}
          className={`absolute rounded-full blur-3xl ${b.className}`}
          style={{ background: `radial-gradient(circle, ${b.color}, transparent 70%)` }}
          animate={{
            x: [0, 20, -15, 0],
            y: [0, -15, 10, 0],
            scale: [1, 1.06, 0.97, 1],
          }}
          transition={{
            duration: b.duration,
            delay: b.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}
