import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Upload, Wand2 } from "lucide-react";
import { UploadResume } from "./UploadResume";
import { TailorResume } from "./TailorResume";
import { Button } from "@/components/ui/button";

type ResumeWorkspaceView = "upload" | "tailor";

type ResumeWorkspaceProps = {
  initialView?: ResumeWorkspaceView;
};

export const ResumeWorkspace: React.FC<ResumeWorkspaceProps> = ({
  initialView = "upload",
}) => {
  const location = useLocation();
  const navigate = useNavigate();

  const getViewFromPath = React.useCallback((): ResumeWorkspaceView => {
    if (location.pathname === "/tailor") return "tailor";
    if (location.pathname === "/upload") return "upload";
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
    <div className="space-y-6">
      <div className="flex items-center gap-2 rounded-xl border border-border bg-card p-2 w-fit">
        <Button
          type="button"
          variant={activeView === "upload" ? "gradient" : "ghost"}
          onClick={() => handleSwitch("upload")}
          className="rounded-lg"
        >
          <Upload className="h-4 w-4" />
          Upload resume
        </Button>
        <Button
          type="button"
          variant={activeView === "tailor" ? "gradient" : "ghost"}
          onClick={() => handleSwitch("tailor")}
          className="rounded-lg"
        >
          <Wand2 className="h-4 w-4" />
          Tailor resume
        </Button>
      </div>

      {activeView === "upload" ? <UploadResume /> : <TailorResume />}
    </div>
  );
};
