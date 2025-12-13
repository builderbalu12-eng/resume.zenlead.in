import React, { useState } from "react";
import { Loader2, Download, Check } from "lucide-react";
import { ResumeData, JobDescription } from "@/types";
import {
  RESUME_TEMPLATES,
  getTemplateCategories,
  getTemplatesByCategory,
} from "@/data/templates";
import { generateResumeInTemplate } from "@/services/templateGenerator";

interface TemplateSelectorProps {
  resume: ResumeData;
  jobData: JobDescription;
  onClose: () => void;
}

type ExportFormat = "docx" | "pdf" | "latex";

export const TemplateSelector: React.FC<TemplateSelectorProps> = ({
  resume,
  jobData,
  onClose,
}) => {
  const [selectedTemplate, setSelectedTemplate] = useState<string>(
    "classic-professional",
  );
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>("docx");
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [isDownloading, setIsDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const categories = getTemplateCategories();
  const currentTemplate = RESUME_TEMPLATES.find(
    (t) => t.id === selectedTemplate,
  );

  const filteredTemplates =
    activeCategory === "all"
      ? RESUME_TEMPLATES
      : getTemplatesByCategory(
          activeCategory as
            | "classic"
            | "modern"
            | "creative"
            | "minimal"
            | "academic",
        );

  const handleDownload = async () => {
    if (!currentTemplate) return;

    setIsDownloading(true);
    setError(null);

    try {
      const blob = await generateResumeInTemplate(
        resume,
        currentTemplate,
        selectedFormat,
        jobData.company,
        jobData.title,
      );

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const today = new Date().toISOString().split("T")[0];

      const fileExtension =
        selectedFormat === "latex"
          ? "tex"
          : selectedFormat === "pdf"
            ? "pdf"
            : "docx";

      a.href = url;
      a.download = `Resume_${currentTemplate.name.replace(/\s+/g, "_")}_${jobData.company}_${today}.${fileExtension}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : "Failed to generate resume";
      setError(errorMsg);
      console.error("Download error:", err);
    } finally {
      setIsDownloading(false);
    }
  };

  const getFormatLabel = (format: ExportFormat): string => {
    const labels: Record<ExportFormat, string> = {
      docx: "Microsoft Word (.docx)",
      pdf: "PDF Document (.pdf)",
      latex: "LaTeX (.tex)",
    };
    return labels[format];
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-background rounded-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto border border-border shadow-xl">
        {/* Header */}
        <div className="sticky top-0 bg-background border-b border-border p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold font-heading">
                Choose Your Resume Template
              </h2>
              <p className="text-muted-foreground mt-1">
                Select a professional template and export format
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground text-2xl font-bold"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Category Filter */}
          <div className="mb-8">
            <h3 className="text-sm font-semibold mb-3 text-muted-foreground">
              FILTER BY CATEGORY
            </h3>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setActiveCategory("all")}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  activeCategory === "all"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted hover:bg-muted/80"
                }`}
              >
                All Templates
              </button>
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setActiveCategory(category)}
                  className={`px-4 py-2 rounded-lg font-medium transition-all capitalize ${
                    activeCategory === category
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted hover:bg-muted/80"
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Templates Grid */}
            <div className="lg:col-span-2">
              <h3 className="text-sm font-semibold mb-4 text-muted-foreground">
                AVAILABLE TEMPLATES ({filteredTemplates.length})
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {filteredTemplates.map((template) => (
                  <button
                    key={template.id}
                    onClick={() => setSelectedTemplate(template.id)}
                    className={`p-4 rounded-lg border-2 transition-all text-left ${
                      selectedTemplate === template.id
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50 bg-card"
                    }`}
                  >
                    {/* Color Preview */}
                    <div className="flex gap-2 mb-3">
                      <div
                        className="w-4 h-4 rounded"
                        style={{ backgroundColor: template.colors.primary }}
                      />
                      <div
                        className="w-4 h-4 rounded"
                        style={{ backgroundColor: template.colors.secondary }}
                      />
                      <div
                        className="w-4 h-4 rounded"
                        style={{ backgroundColor: template.colors.accent }}
                      />
                    </div>

                    {/* Template Info */}
                    <h4 className="font-semibold text-sm mb-1">
                      {template.name}
                    </h4>
                    <p className="text-xs text-muted-foreground mb-3">
                      {template.description}
                    </p>

                    {/* Features */}
                    <div className="flex flex-wrap gap-1 mb-3">
                      {template.features.slice(0, 2).map((feature) => (
                        <span
                          key={feature}
                          className="px-2 py-0.5 bg-primary/10 text-primary text-xs rounded-full"
                        >
                          {feature}
                        </span>
                      ))}
                    </div>

                    {/* Best For */}
                    <p className="text-xs font-medium text-muted-foreground mb-2">
                      Best for: {template.bestFor.slice(0, 2).join(", ")}
                    </p>

                    {/* Formats */}
                    <div className="flex gap-1 flex-wrap">
                      {template.formats.map((format) => (
                        <span
                          key={format}
                          className="px-2 py-0.5 bg-secondary/10 text-secondary text-xs rounded"
                        >
                          {format.toUpperCase()}
                        </span>
                      ))}
                    </div>

                    {/* Selected Indicator */}
                    {selectedTemplate === template.id && (
                      <div className="absolute top-2 right-2">
                        <Check className="h-5 w-5 text-primary" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Right Panel: Preview & Download */}
            <div className="lg:col-span-1">
              {currentTemplate && (
                <div className="sticky top-20 space-y-6">
                  {/* Preview Card */}
                  <div className="bg-card border border-border rounded-lg p-6">
                    <h3 className="text-sm font-semibold mb-4">
                      TEMPLATE PREVIEW
                    </h3>

                    {/* Sample Layout Preview */}
                    <div
                      className="border border-border rounded-lg p-4 bg-white mb-4 text-xs"
                      style={{ backgroundColor: "#f9f9f9" }}
                    >
                      <div
                        style={{
                          borderBottom: `2px solid ${currentTemplate.colors.primary}`,
                          paddingBottom: "8px",
                          marginBottom: "8px",
                        }}
                      >
                        <div
                          style={{ color: currentTemplate.colors.primary }}
                          className="font-bold text-sm"
                        >
                          JOHN DOE
                        </div>
                        <div
                          style={{ color: currentTemplate.colors.secondary }}
                        >
                          john@example.com • (555) 123-4567
                        </div>
                      </div>

                      <div
                        style={{
                          borderBottom: `1px solid ${currentTemplate.colors.accent}`,
                        }}
                        className="mb-2 pb-2"
                      >
                        <div
                          style={{ color: currentTemplate.colors.primary }}
                          className="font-semibold"
                        >
                          EXPERIENCE
                        </div>
                        <div
                          style={{ color: currentTemplate.colors.secondary }}
                        >
                          Senior Manager
                        </div>
                        <div style={{ color: currentTemplate.colors.accent }}>
                          Tech Corp | 2020 - Present
                        </div>
                      </div>

                      <div>
                        <div
                          style={{ color: currentTemplate.colors.primary }}
                          className="font-semibold"
                        >
                          SKILLS
                        </div>
                        <div
                          style={{ color: currentTemplate.colors.secondary }}
                        >
                          Leadership • Strategy • Innovation
                        </div>
                      </div>
                    </div>

                    {/* Template Details */}
                    <div className="space-y-3">
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground">
                          LAYOUT
                        </p>
                        <p className="text-sm capitalize">
                          {currentTemplate.layout.replace("-", " ")}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs font-semibold text-muted-foreground">
                          FEATURES
                        </p>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {currentTemplate.features.map((feature) => (
                            <span
                              key={feature}
                              className="px-2 py-1 bg-primary/10 text-primary text-xs rounded-full"
                            >
                              {feature}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Format Selection */}
                  <div className="bg-card border border-border rounded-lg p-6">
                    <h3 className="text-sm font-semibold mb-4">
                      EXPORT FORMAT
                    </h3>

                    <div className="space-y-2">
                      {currentTemplate.formats.map((format) => (
                        <label
                          key={format}
                          className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-muted/50 cursor-pointer transition-colors"
                        >
                          <input
                            type="radio"
                            name="format"
                            value={format}
                            checked={selectedFormat === format}
                            onChange={(e) =>
                              setSelectedFormat(e.target.value as ExportFormat)
                            }
                            className="w-4 h-4 accent-primary"
                          />
                          <span className="text-sm">
                            {getFormatLabel(format)}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Error Message */}
                  {error && (
                    <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
                      <p className="text-sm text-destructive">{error}</p>
                    </div>
                  )}

                  {/* Download Button */}
                  <button
                    onClick={handleDownload}
                    disabled={isDownloading}
                    className="w-full px-6 py-3 rounded-lg bg-gradient-primary text-primary-foreground font-semibold hover:shadow-glow transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isDownloading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Download className="h-4 w-4" />
                        Download Resume
                      </>
                    )}
                  </button>

                  {/* Info */}
                  <p className="text-xs text-muted-foreground text-center">
                    Your tailored resume will be ready to download
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
