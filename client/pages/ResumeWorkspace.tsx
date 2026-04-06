import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Upload, Wand2, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { UploadResume } from "./UploadResume";
import { TailorResume } from "./TailorResume";
import { History } from "./History";

type ResumeWorkspaceView = "upload" | "tailor" | "history";

type ResumeWorkspaceProps = {
  initialView?: ResumeWorkspaceView;
};

const TABS: { id: ResumeWorkspaceView; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: "upload", label: "Upload Resume", icon: Upload },
  { id: "tailor", label: "Tailor Resume", icon: Wand2 },
  { id: "history", label: "History", icon: Clock },
];

export const ResumeWorkspace: React.FC<ResumeWorkspaceProps> = ({
  initialView = "upload",
}) => {
  const location = useLocation();
  const navigate = useNavigate();

  const getViewFromPath = React.useCallback((): ResumeWorkspaceView => {
    if (location.pathname === "/tailor") return "tailor";
    if (location.pathname === "/upload") return "upload";
    if (location.pathname === "/history") return "history";
    return initialView;
  }, [initialView, location.pathname]);

  const [activeView, setActiveView] = React.useState<ResumeWorkspaceView>(
    getViewFromPath(),
  );

  React.useEffect(() => {
    setActiveView(getViewFromPath());
  }, [getViewFromPath]);

  const handleSwitch = (view: ResumeWorkspaceView) => {
    setActiveView(view);
    navigate("/resume", { replace: location.pathname !== "/resume" });
  };

  return (
    <div>
      {/* Tab Bar */}
      <div className="border-b border-border">
        <nav className="flex">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => handleSwitch(id)}
              className={cn(
                "relative flex items-center gap-2 px-5 py-3.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                activeView === id
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
              {activeView === id && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-t-full" />
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      <div className="pt-6">
        {activeView === "upload" && <UploadResume />}
        {activeView === "tailor" && <TailorResume />}
        {activeView === "history" && <History embedded />}
      </div>
    </div>
  );
};
