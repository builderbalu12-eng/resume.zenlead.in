import { cn } from "@/lib/utils";
import type { Collaborator } from "@/contexts/AppConfigContext";

interface AvatarGroupProps {
  collaborators: Collaborator[];
  max?: number;
  size?: "sm" | "md";
}

export function AvatarGroup({ collaborators, max = 4, size = "sm" }: AvatarGroupProps) {
  const visible = collaborators.slice(0, max);
  const overflow = collaborators.length - max;
  const sizeClass = size === "sm" ? "h-8 w-8 text-xs" : "h-10 w-10 text-sm";

  if (collaborators.length === 0) return null;

  return (
    <div className="flex items-center">
      {visible.map((c, i) => (
        <div
          key={i}
          title={`${c.name}${c.role ? " · " + c.role : ""}`}
          className={cn(
            "relative rounded-full border-2 border-slate-900 overflow-hidden flex-shrink-0",
            sizeClass,
            i > 0 && "-ml-2"
          )}
        >
          {c.image_url ? (
            <img
              src={c.image_url}
              alt={c.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-purple-600 flex items-center justify-center text-white font-bold">
              {c.name.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
      ))}
      {overflow > 0 && (
        <div
          className={cn(
            "-ml-2 rounded-full border-2 border-slate-900 bg-slate-700 flex items-center justify-center text-white font-bold flex-shrink-0",
            sizeClass
          )}
        >
          +{overflow}
        </div>
      )}
    </div>
  );
}
