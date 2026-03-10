import React, { useState } from "react";
import { Upload, FileText, AlertCircle, CheckCircle2 } from "lucide-react";
import { parseFile } from "@/services/resumeParser";
import { ResumeData } from "@/types";
import { apiClient } from "@/services/api";

interface ResumeUploadProps {
  onUploadSuccess: (resume: ResumeData) => void;
  isLoading?: boolean;
  onApiKeyMissing?: () => void;
}

type LoadingStep =
  | "idle"
  | "validating-key"
  | "extracting"
  | "parsing"
  | "validating"
  | "complete"
  | "error";

export const ResumeUpload: React.FC<ResumeUploadProps> = ({
  onUploadSuccess,
  isLoading = false,
  onApiKeyMissing,
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingStep, setLoadingStep] = useState<LoadingStep>("idle");
  const [loadingMessage, setLoadingMessage] = useState("");
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const timeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  const handleFile = async (file: File) => {
    // Clear any previous timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    try {
      // Validate file extension first
      const validExtensions = [".docx", ".txt", ".pdf"];
      const hasValidExtension = validExtensions.some((ext) =>
        file.name.toLowerCase().endsWith(ext),
      );

      if (!hasValidExtension) {
        setLoadingStep("error");
        setError(
          "❌ Invalid file format. Please upload a .docx, .txt, or .pdf file",
        );
        return;
      }

      setError(null);

      // Start timeout - if parsing takes longer than 120 seconds, show error
      timeoutRef.current = setTimeout(() => {
        setLoadingStep("error");
        setError(
          "⏱️ Resume parsing took too long. Please try again or contact support.",
        );
      }, 120000);

      setLoadingStep("extracting");
      setLoadingMessage("Extracting text from your resume...");

      // Parse the file locally first to get text
      const resumeText = await parseFile(file);

      // Send to backend for structure extraction
      setLoadingStep("parsing");
      setLoadingMessage("Processing resume with AI...");

      const extractedData = await apiClient.extractResume(resumeText);

      setLoadingStep("validating");
      setLoadingMessage("Validating resume data...");

      // The extracted data from backend should be in the expected format
      const resume: ResumeData = extractedData;

      if (!resume || !resume.contact) {
        setLoadingStep("error");
        setError(
          `❌ Resume validation failed:\n\nCould not extract valid resume data.\n\nPlease ensure your resume is clearly formatted.`,
        );
        return;
      }

      // Clear timeout on success
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      setLoadingStep("complete");
      setLoadingMessage("Resume processed successfully!");
      onUploadSuccess(resume);
    } catch (err) {
      // Clear timeout on error
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      setLoadingStep("error");
      const errorMessage = err instanceof Error ? err.message : String(err);

      if (errorMessage.includes("Insufficient credits")) {
        setError(
          `💳 Insufficient credits:\n\n${errorMessage}\n\nPlease purchase more credits to continue.`,
        );
      } else if (errorMessage.includes("Unauthorized")) {
        setError(
          `🔐 Authentication error:\n\nPlease log in again to continue.`,
        );
      } else if (
        errorMessage.toLowerCase().includes("api key") ||
        errorMessage.toLowerCase().includes("apikey")
      ) {
        onApiKeyMissing?.();
        setError(
          `🔑 API key/config missing:\n\n${errorMessage}\n\nOpen Settings to configure and try again.`,
        );
      } else if (errorMessage.includes("Could not extract")) {
        setError(
          `📄 File Processing Error:\n\n${errorMessage}\n\nTry uploading a different file or check the file format.`,
        );
      } else {
        setError(
          `❌ Error: ${errorMessage || "Failed to parse resume. Please try another file."}`,
        );
      }
      console.error("Resume parsing error:", err);
    }
  };

  React.useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFile(files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) {
      handleFile(e.target.files[0]);
    }
  };

  const getStepProgress = (): number => {
    switch (loadingStep) {
      case "extracting":
        return 40;
      case "parsing":
        return 60;
      case "validating":
        return 85;
      case "complete":
        return 100;
      default:
        return 0;
    }
  };

  const getStepColor = (): string => {
    switch (loadingStep) {
      case "error":
        return "text-red-600";
      case "complete":
        return "text-green-600";
      default:
        return "text-primary";
    }
  };

  return (
    <div className="w-full">
      <input
        ref={fileInputRef}
        type="file"
        accept=".docx,.txt,.pdf"
        onChange={handleChange}
        className="hidden"
        disabled={isLoading || loadingStep !== "idle"}
      />

      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => loadingStep === "idle" && fileInputRef.current?.click()}
        className={`
          relative w-full rounded-lg border-2 border-dashed p-8
          transition-all duration-200
          ${
            dragActive
              ? "border-primary bg-primary/5 scale-105"
              : "border-muted hover:border-primary/50"
          }
          ${loadingStep !== "idle" ? "opacity-90 cursor-not-allowed" : "cursor-pointer"}
        `}
      >
        <div className="flex flex-col items-center justify-center gap-6">
          {loadingStep === "idle" ? (
            <>
              <div className="rounded-full bg-primary/10 p-4">
                <Upload className="h-8 w-8 text-primary" />
              </div>
              <div className="text-center">
                <h3 className="font-semibold text-lg">
                  Upload Your Master Resume
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Drag and drop your resume or click to browse
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  Supported formats: .docx, .txt, .pdf
                </p>
              </div>
            </>
          ) : loadingStep === "complete" ? (
            <>
              <div className="rounded-full bg-green-100 dark:bg-green-900/20 p-4 animate-bounce">
                <CheckCircle2 className="h-8 w-8 text-green-600" />
              </div>
              <div className="text-center">
                <h3 className="font-semibold text-lg text-green-600">
                  Resume Processed Successfully!
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Your resume is ready to use
                </p>
              </div>
            </>
          ) : loadingStep === "error" ? (
            <>
              <div className="rounded-full bg-red-100 dark:bg-red-900/20 p-4">
                <AlertCircle className="h-8 w-8 text-red-600" />
              </div>
              <div className="text-center">
                <h3 className={`font-semibold text-lg ${getStepColor()}`}>
                  Processing Failed
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Please check the error message below and try again
                </p>
              </div>
            </>
          ) : (
            <>
              <div className="rounded-full bg-primary/20 p-6">
                <div
                  className={`animate-spin rounded-full h-10 w-10 border-4 border-primary border-t-transparent`}
                />
              </div>
              <div className="text-center w-full">
                <h3 className={`font-semibold text-lg ${getStepColor()}`}>
                  {loadingMessage || "Processing your resume..."}
                </h3>
                <p className="text-sm text-muted-foreground mt-2">
                  {loadingStep === "validating-key" &&
                    "Verifying API configuration..."}
                  {loadingStep === "extracting" &&
                    "Reading file and extracting text from your resume..."}
                  {loadingStep === "parsing" &&
                    "Using AI to parse and structure your resume data..."}
                  {loadingStep === "validating" &&
                    "Validating all resume sections..."}
                </p>

                {/* Progress bar */}
                <div className="mt-6 w-full max-w-xs mx-auto">
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all duration-300"
                      style={{ width: `${getStepProgress()}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    {getStepProgress()}% complete
                  </p>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {error && (
        <div className="mt-4 flex gap-3 rounded-lg bg-destructive/10 p-4 border border-destructive/20">
          <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-destructive whitespace-pre-wrap">
              {error}
            </p>
            {loadingStep === "error" && (
              <button
                onClick={() => {
                  setLoadingStep("idle");
                  setError(null);
                  fileInputRef.current?.click();
                }}
                className="text-xs text-destructive hover:underline mt-2 font-medium"
              >
                Try again →
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
