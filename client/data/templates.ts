export interface ResumeTemplate {
  id: string;
  name: string;
  description: string;
  category: "classic" | "modern" | "creative" | "minimal" | "academic";
  colors: {
    primary: string;
    secondary: string;
    accent: string;
  };
  features: string[];
  bestFor: string[];
  formats: ("docx" | "pdf" | "latex")[];
  layout: "single-column" | "two-column" | "three-column";
}

export const RESUME_TEMPLATES: ResumeTemplate[] = [
  {
    id: "classic-professional",
    name: "Classic Professional",
    description:
      "Traditional, ATS-optimized resume layout ideal for corporate roles",
    category: "classic",
    colors: {
      primary: "#0E5484",
      secondary: "#4D4D4D",
      accent: "#B9B9B9",
    },
    features: [
      "ATS-friendly",
      "Time-tested format",
      "Professional appearance",
      "Easy to read",
    ],
    bestFor: ["Corporate", "Finance", "Legal", "Government"],
    formats: ["docx", "pdf"],
    layout: "single-column",
  },
  {
    id: "modern-tech",
    name: "Modern Tech",
    description:
      "Bold, contemporary design perfect for tech and creative professionals",
    category: "modern",
    colors: {
      primary: "#2196F3",
      secondary: "#1976D2",
      accent: "#64B5F6",
    },
    features: [
      "Eye-catching",
      "Modern aesthetic",
      "Visual hierarchy",
      "Tech-friendly",
    ],
    bestFor: ["Technology", "Software", "Design", "Startup"],
    formats: ["docx", "pdf"],
    layout: "two-column",
  },
  {
    id: "minimalist-clean",
    name: "Minimalist Clean",
    description: "Elegant and simple design focusing on content quality",
    category: "minimal",
    colors: {
      primary: "#333333",
      secondary: "#666666",
      accent: "#CCCCCC",
    },
    features: [
      "Clean lines",
      "Focus on content",
      "Elegant typography",
      "Minimal distractions",
    ],
    bestFor: ["Academic", "Writer", "Consultant", "Creative"],
    formats: ["docx", "pdf"],
    layout: "single-column",
  },
  {
    id: "twenty-seconds-cv",
    name: "Twenty Seconds CV",
    description:
      "Professional two-column design with sidebar and skill bubbles - LaTeX format",
    category: "modern",
    colors: {
      primary: "#0395DE",
      secondary: "#4D4D4D",
      accent: "#E7E7E7",
    },
    features: [
      "Sidebar layout",
      "Skill bubbles",
      "Professional typography",
      "High-impact design",
    ],
    bestFor: ["Executive", "Data Professional", "Engineer", "Academic"],
    formats: ["latex", "pdf"],
    layout: "two-column",
  },
  {
    id: "executive-summary",
    name: "Executive Summary",
    description:
      "Designed for leadership and executive roles with emphasis on achievements",
    category: "classic",
    colors: {
      primary: "#1A3A52",
      secondary: "#2C5282",
      accent: "#90CDF4",
    },
    features: [
      "Leadership focus",
      "Achievement-driven",
      "Executive presence",
      "Impact metrics",
    ],
    bestFor: ["Manager", "Director", "Executive", "C-Suite"],
    formats: ["docx", "pdf"],
    layout: "single-column",
  },
  {
    id: "creative-portfolio",
    name: "Creative Portfolio",
    description:
      "Colorful and visually appealing design for creative professionals",
    category: "creative",
    colors: {
      primary: "#D3A4F9",
      secondary: "#9C27B0",
      accent: "#E1BEE7",
    },
    features: [
      "Colorful design",
      "Visual elements",
      "Portfolio-friendly",
      "Creative expression",
    ],
    bestFor: ["Designer", "Artist", "Photographer", "Marketer"],
    formats: ["docx", "pdf"],
    layout: "two-column",
  },
  {
    id: "academic-research",
    name: "Academic & Research",
    description: "Comprehensive layout for academics, researchers, and PhDs",
    category: "academic",
    colors: {
      primary: "#003366",
      secondary: "#336699",
      accent: "#CCDDEE",
    },
    features: [
      "Publications section",
      "Research highlights",
      "Academic credentials",
      "Comprehensive",
    ],
    bestFor: ["Professor", "Researcher", "PhD", "Scientist"],
    formats: ["docx", "pdf", "latex"],
    layout: "single-column",
  },
  {
    id: "startup-founder",
    name: "Startup Founder",
    description:
      "Dynamic layout emphasizing entrepreneurial achievements and growth metrics",
    category: "modern",
    colors: {
      primary: "#FF6B35",
      secondary: "#F7931E",
      accent: "#FDB833",
    },
    features: [
      "Metrics-driven",
      "Growth-focused",
      "Dynamic layout",
      "Bold typography",
    ],
    bestFor: ["Entrepreneur", "Founder", "Business Owner", "Intrapreneur"],
    formats: ["docx", "pdf"],
    layout: "two-column",
  },
];

export function getTemplateById(id: string): ResumeTemplate | undefined {
  return RESUME_TEMPLATES.find((t) => t.id === id);
}

export function getTemplatesByCategory(
  category: ResumeTemplate["category"],
): ResumeTemplate[] {
  return RESUME_TEMPLATES.filter((t) => t.category === category);
}

export function getTemplateCategories(): ResumeTemplate["category"][] {
  const categories = new Set(RESUME_TEMPLATES.map((t) => t.category));
  return Array.from(categories) as ResumeTemplate["category"][];
}
