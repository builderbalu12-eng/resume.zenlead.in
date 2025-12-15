import React, { useState } from "react";
import { RESUME_TEMPLATES, getTemplateCategories } from "@/data/templates";
import { ChevronRight } from "lucide-react";

export const TemplatesShowcase: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const categories = getTemplateCategories();

  const filteredTemplates =
    activeCategory === "all"
      ? RESUME_TEMPLATES
      : RESUME_TEMPLATES.filter((t) => t.category === activeCategory);

  return (
    <div className="w-full bg-gradient-to-br from-background to-muted/30 rounded-xl border border-border p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold font-heading mb-2">
            Professional Resume Templates
          </h2>
          <p className="text-muted-foreground text-lg">
            Choose from 8 professionally designed templates for your industry
          </p>
        </div>

        {/* Category Filter */}
        <div className="mb-8">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setActiveCategory("all")}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                activeCategory === "all"
                  ? "bg-primary text-primary-foreground"
                  : "bg-card border border-border hover:border-primary"
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
                    : "bg-card border border-border hover:border-primary"
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* Templates Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {filteredTemplates.map((template) => (
            <div
              key={template.id}
              className="group bg-card border border-border rounded-lg overflow-hidden hover:shadow-glow hover:border-primary transition-all cursor-pointer flex flex-col"
            >
              {/* Template Preview for Entry Level Modern */}
              {template.id === "entry-level-modern" && (
                <div className="w-full h-48 bg-gradient-to-b from-gray-100 to-gray-50 flex p-2">
                  {/* Sidebar */}
                  <div className="w-1/3 bg-gray-300 p-2 rounded">
                    <div className="text-xs font-bold text-blue-600 mb-1">HARSH</div>
                    <div className="text-xs text-gray-700 mb-2 font-medium">Engineer</div>
                    <div className="flex gap-1 flex-wrap mb-2">
                      {["A", "B", "C"].map((s) => (
                        <div
                          key={s}
                          className="w-5 h-5 rounded-full border-2 border-blue-600 flex items-center justify-center text-xs font-bold text-gray-700"
                        >
                          {s}
                        </div>
                      ))}
                    </div>
                    <div className="text-xs font-semibold text-gray-700">Edu</div>
                  </div>
                  {/* Main Content */}
                  <div className="flex-1 bg-white p-2 ml-1 rounded">
                    <div className="text-xs font-bold text-blue-600 mb-1">Exp</div>
                    <div className="h-px bg-blue-600 mb-2"></div>
                    <div className="text-xs font-semibold text-gray-700">2017</div>
                    <div className="text-xs text-gray-600 space-y-1">
                      <div>• Item 1</div>
                      <div>• Item 2</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Card Content */}
              <div className="p-5 flex-1 flex flex-col">
                {/* Color Swatches */}
                <div className="flex gap-2 mb-4">
                <div
                  className="w-5 h-5 rounded-full shadow-sm"
                  style={{ backgroundColor: template.colors.primary }}
                  title="Primary color"
                />
                <div
                  className="w-5 h-5 rounded-full shadow-sm"
                  style={{ backgroundColor: template.colors.secondary }}
                  title="Secondary color"
                />
                <div
                  className="w-5 h-5 rounded-full shadow-sm"
                  style={{ backgroundColor: template.colors.accent }}
                  title="Accent color"
                />
              </div>

              {/* Template Name */}
              <h3 className="font-semibold text-base mb-2 group-hover:text-primary transition-colors">
                {template.name}
              </h3>

              {/* Description */}
              <p className="text-xs text-muted-foreground mb-4 line-clamp-2">
                {template.description}
              </p>

              {/* Features */}
              <div className="mb-4 space-y-2">
                <p className="text-xs font-medium text-muted-foreground">
                  Key Features:
                </p>
                <div className="flex flex-wrap gap-1">
                  {template.features.slice(0, 2).map((feature) => (
                    <span
                      key={feature}
                      className="px-2 py-0.5 bg-primary/10 text-primary text-xs rounded-full"
                    >
                      {feature}
                    </span>
                  ))}
                </div>
              </div>

              {/* Best For */}
              <p className="text-xs text-muted-foreground mb-4">
                <span className="font-medium">Best for:</span>{" "}
                {template.bestFor.slice(0, 2).join(", ")}
              </p>

              {/* Formats & CTA */}
              <div className="flex items-center justify-between pt-4 border-t border-border mt-auto">
                <div className="flex gap-1">
                  {template.formats.map((format) => (
                    <span
                      key={format}
                      className="px-1.5 py-0.5 bg-secondary/10 text-secondary text-xs rounded"
                      title={format}
                    >
                      {format.toUpperCase()}
                    </span>
                  ))}
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
            </div>
            </div>
          ))}
        </div>

        {/* Call to Action */}
        <div className="mt-12 text-center p-8 bg-primary/5 border border-primary/20 rounded-lg">
          <h3 className="text-xl font-semibold mb-2">
            Ready to Tailor Your Resume?
          </h3>
          <p className="text-muted-foreground mb-6">
            All templates become available once you tailor a resume for a job.
            Choose your preferred format and download your professional resume.
          </p>
          <a
            href="/tailor"
            className="inline-block px-6 py-3 rounded-lg bg-gradient-primary text-primary-foreground font-semibold hover:shadow-glow transition-all"
          >
            Start Tailoring Your Resume
          </a>
        </div>

        {/* Template Details Legend */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
          <div className="flex gap-3">
            <div className="w-6 h-6 flex-shrink-0 rounded-full bg-primary/20 flex items-center justify-center">
              <span className="text-primary font-semibold">📊</span>
            </div>
            <div>
              <p className="font-semibold mb-1">ATS Optimized</p>
              <p className="text-muted-foreground">
                Designed to pass Applicant Tracking Systems
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <div className="w-6 h-6 flex-shrink-0 rounded-full bg-secondary/20 flex items-center justify-center">
              <span className="text-secondary font-semibold">🎨</span>
            </div>
            <div>
              <p className="font-semibold mb-1">Professional Design</p>
              <p className="text-muted-foreground">
                Created by design professionals for impact
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <div className="w-6 h-6 flex-shrink-0 rounded-full bg-accent/20 flex items-center justify-center">
              <span className="text-accent font-semibold">📥</span>
            </div>
            <div>
              <p className="font-semibold mb-1">Easy Export</p>
              <p className="text-muted-foreground">
                Download as DOCX, PDF, or LaTeX format
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
