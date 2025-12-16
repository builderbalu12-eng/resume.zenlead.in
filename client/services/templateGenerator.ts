import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  BorderStyle,
  WidthType,
  PageBreak,
  AlignmentType,
} from "docx";
import { ResumeData } from "@/types";
import { ResumeTemplate } from "@/data/templates";

async function loadHtml2Pdf(): Promise<any> {
  return new Promise((resolve, reject) => {
    if ((window as any).html2pdf) {
      resolve((window as any).html2pdf);
      return;
    }

    const script = document.createElement("script");
    script.src =
      "https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js";
    script.onload = () => {
      resolve((window as any).html2pdf);
    };
    script.onerror = () => {
      reject(new Error("Failed to load html2pdf library"));
    };
    document.head.appendChild(script);
  });
}

function rgbToHex(r: number, g: number, b: number): string {
  return (
    "#" + [r, g, b].map((x) => x.toString(16).padStart(2, "0")).toUpperCase()
  );
}

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

// Generate Entry Level Modern DOCX
// ===== MODULAR TEMPLATE HELPER FUNCTIONS =====

interface ParagraphConfig {
  text: string;
  bold?: boolean;
  italics?: boolean;
  size: number;
  color?: string;
  spacing: { before?: number; after: number; line?: number };
  alignment?: AlignmentType;
  border?: any;
  indent?: any;
  shading?: any;
}

// Helper: Add section header with blue underline
function addSectionHeader(
  children: Paragraph[],
  title: string,
  color: string = "0395DE",
): void {
  children.push(
    new Paragraph({
      text: title.toUpperCase(),
      bold: true,
      size: 22,
      color: color,
      spacing: { before: 0, after: 50, line: 200 },
      border: {
        bottom: {
          color: color,
          space: 1,
          style: BorderStyle.SINGLE,
          size: 12,
        },
      },
    }),
  );
}

// Helper: Add contact information
function addContactSection(
  children: Paragraph[],
  contact: any,
): void {
  const contactLines = [
    contact.phone ? `📱 ${contact.phone}` : "",
    contact.website ? `🌐 ${contact.website}` : "",
    contact.email ? `✉️ ${contact.email}` : "",
    contact.linkedin ? `🔗 ${contact.linkedin}` : "",
    contact.github ? `💻 ${contact.github}` : "",
  ].filter(Boolean);

  if (contactLines.length > 0) {
    addSectionHeader(children, "CONTACT");

    contactLines.forEach((line) => {
      children.push(
        new Paragraph({
          text: line,
          size: 20,
          color: "4D4D4D",
          spacing: { after: 25, line: 200 },
        }),
      );
    });

    children.push(
      new Paragraph({
        text: "",
        spacing: { after: 60 },
      }),
    );
  }
}

// Helper: Add professional summary
function addSummarySection(
  children: Paragraph[],
  summary: string | undefined,
): void {
  if (summary && summary.trim()) {
    addSectionHeader(children, "SUMMARY");
    children.push(
      new Paragraph({
        text: summary,
        size: 20,
        spacing: { after: 70, line: 220 },
        alignment: AlignmentType.JUSTIFIED,
      }),
    );
  }
}

// Helper: Add skills with smart limiting (top 8-10)
function addSkillsSection(children: Paragraph[], skills: string[]): void {
  if (skills.length > 0) {
    addSectionHeader(children, "SKILLS");

    // Limit to top 8-10 skills for compact display
    const displaySkills = skills.slice(0, 10);
    children.push(
      new Paragraph({
        text: displaySkills.join(" • "),
        size: 20,
        spacing: { after: 80, line: 220 },
      }),
    );
  }
}

// Helper: Add experience section
function addExperienceSection(
  children: Paragraph[],
  experience: any[],
): void {
  if (experience.length > 0) {
    addSectionHeader(children, "EXPERIENCE");

    experience.forEach((exp) => {
      const dateRange =
        exp.endDate && !exp.isCurrentlyWorking
          ? `${exp.startDate} - ${exp.endDate}`
          : `${exp.startDate} - Present`;

      children.push(
        new Paragraph({
          text: exp.title,
          bold: true,
          size: 21,
          color: "4D4D4D",
          spacing: { after: 15, line: 200 },
        }),
        new Paragraph({
          text: `${exp.company} | ${dateRange}`,
          italics: true,
          size: 19,
          color: "666666",
          spacing: { after: 35, line: 200 },
        }),
      );

      exp.description.forEach((desc: string) => {
        children.push(
          new Paragraph({
            text: desc,
            size: 19,
            spacing: { after: 25, line: 220 },
            indent: { left: 360 },
          }),
        );
      });

      children.push(
        new Paragraph({
          text: "",
          spacing: { after: 45 },
        }),
      );
    });
  }
}

// Helper: Add education section
function addEducationSection(
  children: Paragraph[],
  education: any[],
): void {
  if (education.length > 0) {
    addSectionHeader(children, "EDUCATION");

    education.forEach((edu) => {
      children.push(
        new Paragraph({
          text: `${edu.degree} in ${edu.field}`,
          bold: true,
          size: 20,
          spacing: { after: 15, line: 200 },
        }),
        new Paragraph({
          text: edu.institution,
          size: 20,
          spacing: { after: 10, line: 200 },
          color: "666666",
        }),
      );

      if (edu.gpa) {
        children.push(
          new Paragraph({
            text: `GPA: ${edu.gpa}`,
            size: 18,
            spacing: { after: 10, line: 200 },
            color: "666666",
          }),
        );
      }

      children.push(
        new Paragraph({
          text: edu.graduationDate,
          size: 18,
          spacing: { after: 50, line: 200 },
          color: "666666",
        }),
      );
    });
  }
}

// Helper: Add projects section
function addProjectsSection(
  children: Paragraph[],
  projects: any[] | undefined,
): void {
  if (projects && projects.length > 0) {
    addSectionHeader(children, "PROJECTS");

    projects.forEach((proj) => {
      children.push(
        new Paragraph({
          text: proj.title,
          bold: true,
          size: 20,
          spacing: { after: 12, line: 200 },
        }),
      );

      if (proj.technologies && proj.technologies.length > 0) {
        children.push(
          new Paragraph({
            text: `Technologies: ${proj.technologies.join(", ")}`,
            italics: true,
            size: 18,
            color: "666666",
            spacing: { after: 18, line: 200 },
          }),
        );
      }

      children.push(
        new Paragraph({
          text: proj.description,
          size: 19,
          spacing: { after: 45, line: 220 },
          indent: { left: 360 },
        }),
      );
    });
  }
}

// Helper: Add custom sections
function addCustomSections(
  children: Paragraph[],
  customSections: Record<string, string> | undefined,
): void {
  if (customSections && Object.keys(customSections).length > 0) {
    for (const [sectionName, content] of Object.entries(customSections)) {
      if (content && content.trim()) {
        addSectionHeader(children, sectionName);
        children.push(
          new Paragraph({
            text: content,
            size: 19,
            spacing: { after: 75, line: 220 },
            alignment: AlignmentType.JUSTIFIED,
          }),
        );
      }
    }
  }
}

// ===== ENTRY LEVEL MODERN TEMPLATE =====
async function generateEntryLevelModernDocx(
  resume: ResumeData,
  template: ResumeTemplate,
): Promise<Blob> {
  const {
    contact,
    summary,
    skills,
    experience,
    education,
    projects,
    customSections,
  } = resume;

  const children: Paragraph[] = [];

  // Header - Name (reduced top spacing)
  children.push(
    new Paragraph({
      text: contact.name.toUpperCase(),
      bold: true,
      size: 48,
      color: "0395DE",
      spacing: { before: 0, after: 50, line: 220 },
    }),
  );

  // Location
  if (contact.location) {
    children.push(
      new Paragraph({
        text: contact.location,
        size: 22,
        color: "4D4D4D",
        spacing: { after: 100, line: 200 },
      }),
    );
  }

  // Contact Info
  addContactSection(children, contact);

  // Professional Summary
  addSummarySection(children, summary);

  // Skills (smart limiting to top 10)
  addSkillsSection(children, skills);

  // Experience (tailored content)
  addExperienceSection(children, experience);

  // Education
  addEducationSection(children, education);

  // Projects
  addProjectsSection(children, projects);

  // Custom Sections (from Settings)
  addCustomSections(children, customSections);

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margins: {
              top: 400,
              right: 720,
              bottom: 720,
              left: 720,
            },
          },
        },
        children: children,
      },
    ],
  });

  return await Packer.toBlob(doc);
}

// Generate DOCX with template styling
async function generateTemplateDocx(
  resume: ResumeData,
  template: ResumeTemplate,
  company: string,
  jobTitle: string,
): Promise<Blob> {
  if (template.id === "entry-level-modern") {
    return generateEntryLevelModernDocx(resume, template);
  }

  const { contact, summary, skills, experience, education, projects } = resume;

  const primaryRgb = hexToRgb(template.colors.primary);
  const primaryColor = primaryRgb
    ? `${primaryRgb.r.toString(16).padStart(2, "0")}${primaryRgb.g.toString(16).padStart(2, "0")}${primaryRgb.b.toString(16).padStart(2, "0")}`
    : "0E5484";

  const sections = [
    new Paragraph({
      text: contact.name,
      bold: true,
      size: 32,
      color: primaryColor,
      spacing: { after: 100 },
    }),
    new Paragraph({
      text: [
        contact.email ? `${contact.email} • ` : "",
        contact.phone ? `${contact.phone} • ` : "",
        contact.location ? `${contact.location}` : "",
      ]
        .filter(Boolean)
        .join(""),
      size: 20,
      spacing: { after: 400 },
      color: "666666",
    }),
  ];

  if (summary?.trim()) {
    sections.push(
      new Paragraph({
        text: "PROFESSIONAL SUMMARY",
        bold: true,
        size: 24,
        color: primaryColor,
        border: {
          bottom: {
            color: primaryColor,
            space: 1,
            style: BorderStyle.SINGLE,
            size: 6,
          },
        },
        spacing: { after: 200 },
      }),
      new Paragraph({
        text: summary,
        size: 22,
        spacing: { after: 400 },
        alignment: AlignmentType.JUSTIFIED,
      }),
    );
  }

  if (skills.length > 0) {
    sections.push(
      new Paragraph({
        text: "SKILLS",
        bold: true,
        size: 24,
        color: primaryColor,
        border: {
          bottom: {
            color: primaryColor,
            space: 1,
            style: BorderStyle.SINGLE,
            size: 6,
          },
        },
        spacing: { after: 200 },
      }),
      new Paragraph({
        text: skills.join(" • "),
        size: 22,
        spacing: { after: 400 },
      }),
    );
  }

  if (experience.length > 0) {
    sections.push(
      new Paragraph({
        text: "PROFESSIONAL EXPERIENCE",
        bold: true,
        size: 24,
        color: primaryColor,
        border: {
          bottom: {
            color: primaryColor,
            space: 1,
            style: BorderStyle.SINGLE,
            size: 6,
          },
        },
        spacing: { after: 200 },
      }),
    );

    experience.forEach((exp) => {
      const dateRange =
        exp.endDate && !exp.isCurrentlyWorking
          ? `${exp.startDate} – ${exp.endDate}`
          : `${exp.startDate} – Present`;

      sections.push(
        new Paragraph({
          text: exp.title,
          bold: true,
          size: 22,
          color: primaryColor,
          spacing: { after: 0 },
        }),
        new Paragraph({
          text: `${exp.company} | ${dateRange}`,
          italics: true,
          size: 20,
          spacing: { after: 200 },
          color: "666666",
        }),
      );

      exp.description.forEach((desc) => {
        sections.push(
          new Paragraph({
            text: desc,
            size: 22,
            spacing: { after: 100 },
            indent: { left: 720 },
          }),
        );
      });

      sections.push(
        new Paragraph({
          text: "",
          spacing: { after: 200 },
        }),
      );
    });
  }

  if (education.length > 0) {
    sections.push(
      new Paragraph({
        text: "EDUCATION",
        bold: true,
        size: 24,
        color: primaryColor,
        border: {
          bottom: {
            color: primaryColor,
            space: 1,
            style: BorderStyle.SINGLE,
            size: 6,
          },
        },
        spacing: { after: 200 },
      }),
    );

    education.forEach((edu) => {
      sections.push(
        new Paragraph({
          text: `${edu.degree} in ${edu.field}`,
          bold: true,
          size: 22,
          color: primaryColor,
          spacing: { after: 0 },
        }),
        new Paragraph({
          text: `${edu.institution} | Graduated: ${edu.graduationDate}`,
          italics: true,
          size: 20,
          spacing: { after: 400 },
          color: "666666",
        }),
      );
    });
  }

  if (projects && projects.length > 0) {
    sections.push(
      new Paragraph({
        text: "PROJECTS",
        bold: true,
        size: 24,
        color: primaryColor,
        border: {
          bottom: {
            color: primaryColor,
            space: 1,
            style: BorderStyle.SINGLE,
            size: 6,
          },
        },
        spacing: { after: 200 },
      }),
    );

    projects.forEach((project) => {
      sections.push(
        new Paragraph({
          text: project.title,
          bold: true,
          size: 22,
          color: primaryColor,
          spacing: { after: 0 },
        }),
        new Paragraph({
          text: project.description,
          size: 22,
          spacing: { after: 200 },
        }),
      );
    });
  }

  if (resume.customSections && Object.keys(resume.customSections).length > 0) {
    for (const [sectionName, sectionContent] of Object.entries(
      resume.customSections,
    )) {
      if (sectionContent && sectionContent.trim()) {
        sections.push(
          new Paragraph({
            text: sectionName.toUpperCase(),
            bold: true,
            size: 24,
            color: primaryColor,
            border: {
              bottom: {
                color: primaryColor,
                space: 1,
                style: BorderStyle.SINGLE,
                size: 6,
              },
            },
            spacing: { after: 200 },
          }),
          new Paragraph({
            text: sectionContent,
            size: 22,
            spacing: { after: 400 },
            alignment: AlignmentType.JUSTIFIED,
          }),
        );
      }
    }
  }

  const doc = new Document({
    sections: [
      {
        properties: {},
        children: sections,
      },
    ],
  });

  return await Packer.toBlob(doc);
}

// Section shortcode mapping
const SECTION_SHORTCODES: Record<string, string> = {
  experience: "EXP",
  education: "EDU",
  projects: "PRO",
  research: "RES",
  publications: "PUB",
  certifications: "CER",
  awards: "AWD",
  skills: "SKL",
};

// Generate Entry Level Modern PDF
async function generateEntryLevelModernPDF(
  resume: ResumeData,
  template: ResumeTemplate,
): Promise<Blob> {
  const { contact, skills, experience, education } = resume;

  const overviewSkills = skills.slice(0, 5);
  const programmingSkills = skills.slice(5);

  // Build skill bubbles HTML
  const skillBubblesHtml = overviewSkills
    .map(
      (skill) => `<div class="skill-bubble" data-edit="skill">${skill}</div>`,
    )
    .join("");

  // Build programming bars HTML
  const programmingBarsHtml = programmingSkills
    .map(
      (skill) =>
        `<div class="programming-item">
          <div class="programming-label" data-edit="skill">${skill}</div>
          <div class="programming-bar">
            <div class="programming-bar-fill"></div>
          </div>
        </div>`,
    )
    .join("");

  // Build education items HTML
  const educationHtml = education
    .map(
      (edu) =>
        `<div class="education-item">
          <div class="education-degree" data-edit="degree">${edu.degree} in ${edu.field}</div>
          <div class="education-school" data-edit="institution">${edu.institution}</div>
          ${edu.gpa ? `<div class="education-date">GPA: ${edu.gpa}</div>` : ""}
          <div class="education-date" data-edit="date">${edu.graduationDate}</div>
        </div>`,
    )
    .join("");

  // Build experience entries HTML
  const experienceHtml = experience
    .map((exp) => {
      const dateRange =
        exp.endDate && !exp.isCurrentlyWorking
          ? `${exp.startDate} - ${exp.endDate}`
          : `${exp.startDate} - Present`;
      return `
        <div class="experience-entry">
          <div class="experience-meta">
            <span class="experience-date" data-edit="date">${dateRange}</span>
            <span class="experience-company" data-edit="company">${exp.company}</span>
          </div>
          <div class="experience-title" data-edit="title">${exp.title}</div>
          <ul class="experience-descriptions">
            ${exp.description
              .map((desc) => `<li data-edit="description">${desc}</li>`)
              .join("")}
          </ul>
        </div>
      `;
    })
    .join("");

  const htmlContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    /* Complete inline styles for PDF rendering - NO external stylesheets */
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { width: 100%; height: 100%; }
    body {
      font-family: "ClearSans", "Segoe UI", Arial, sans-serif;
      color: #4d4d4d;
      background: white;
      line-height: 1.4;
    }
    table {
      width: 210mm;
      border-collapse: collapse;
      margin: 0;
      padding: 0;
    }
    td {
      padding: 0;
      margin: 0;
      vertical-align: top;
    }
    .sidebar {
      width: 85mm;
      background-color: #e7e7e7;
      padding: 20px;
      vertical-align: top;
    }
    .main {
      width: 125mm;
      padding: 20px 25px;
      background-color: #fff;
      vertical-align: top;
    }
    .sidebar-name {
      font-size: 22px;
      font-weight: 700;
      color: #0395de;
      line-height: 1.2;
      word-break: break-word;
      margin-bottom: 10px;
    }
    .sidebar-jobtitle {
      font-size: 13px;
      font-weight: 600;
      color: #4d4d4d;
      margin-bottom: 12px;
    }
    .sidebar-section {
      padding-top: 12px;
      border-top: 1px solid #ccc;
      margin-bottom: 12px;
    }
    .sidebar-section-title {
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      margin-bottom: 8px;
      color: #4d4d4d;
    }
    .contact-item {
      font-size: 9px;
      margin-bottom: 6px;
      line-height: 1.4;
      color: #4d4d4d;
    }
    .contact-icon { margin-right: 4px; }
    .skills-bubbles {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      justify-content: center;
    }
    .skill-bubble {
      width: 55px;
      height: 55px;
      border-radius: 50%;
      border: 2px solid #0395de;
      background: #fff;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 8px;
      font-weight: 700;
      text-align: center;
      padding: 4px;
      flex-shrink: 0;
      color: #4d4d4d;
    }
    .programming-item {
      margin-bottom: 8px;
    }
    .programming-label {
      font-size: 9px;
      font-weight: 600;
      margin-bottom: 2px;
      color: #4d4d4d;
    }
    .programming-bar {
      background: #d3d3d3;
      height: 6px;
      border-radius: 2px;
      overflow: hidden;
    }
    .programming-bar-fill {
      background: #0395de;
      height: 100%;
      width: 70%;
    }
    .education-item {
      font-size: 8px;
      margin-bottom: 8px;
      line-height: 1.3;
      color: #4d4d4d;
    }
    .education-degree {
      font-weight: 600;
      color: #4d4d4d;
    }
    .education-school {
      color: #666;
      font-size: 8px;
    }
    .education-date {
      color: #666;
      font-size: 8px;
    }
    .section {
      margin-bottom: 12px;
    }
    .section-header {
      display: flex;
      align-items: center;
      margin-bottom: 8px;
      gap: 8px;
    }
    .section-shortcode {
      background: #0395de;
      color: #fff;
      font-weight: 700;
      font-size: 10px;
      padding: 4px 8px;
      border-radius: 6px;
      text-transform: uppercase;
      min-width: 32px;
      text-align: center;
      flex-shrink: 0;
    }
    .section-title {
      font-size: 14px;
      font-weight: 700;
      color: #0395de;
      text-transform: uppercase;
    }
    .section-divider {
      width: 100%;
      height: 2px;
      background: #0395de;
      margin-bottom: 8px;
    }
    .experience-entry {
      margin-bottom: 12px;
    }
    .experience-meta {
      display: flex;
      justify-content: space-between;
      font-size: 10px;
      font-weight: 600;
      margin-bottom: 4px;
      color: #4d4d4d;
    }
    .experience-date {
      font-weight: 600;
    }
    .experience-company {
      font-weight: 600;
    }
    .experience-title {
      font-size: 10px;
      font-weight: 600;
      color: #4d4d4d;
      margin-bottom: 4px;
    }
    .experience-descriptions {
      font-size: 9px;
      margin-top: 4px;
      margin-left: 12px;
      color: #4d4d4d;
      list-style-position: inside;
    }
    .experience-descriptions li {
      margin-bottom: 2px;
      line-height: 1.3;
    }
    @media print {
      body { margin: 0; padding: 0; }
      table { page-break-inside: avoid; }
      .section { page-break-inside: avoid; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background: white;">
<table>
  <tr>
    <!-- Sidebar -->
    <td class="sidebar">
      <div class="sidebar-name" data-edit="name">${contact.name.toUpperCase()}</div>
      <div class="sidebar-jobtitle" data-edit="title">${contact.location || "Professional"}</div>

      <div class="sidebar-section">
        <div class="sidebar-section-title">Contact</div>
        ${contact.phone ? `<div class="contact-item"><span class="contact-icon">📱</span>${contact.phone}</div>` : ""}
        ${contact.website ? `<div class="contact-item"><span class="contact-icon">🌐</span>${contact.website}</div>` : ""}
        ${contact.email ? `<div class="contact-item"><span class="contact-icon">✉️</span>${contact.email}</div>` : ""}
        ${contact.linkedin ? `<div class="contact-item"><span class="contact-icon">🔗</span>${contact.linkedin}</div>` : ""}
        ${contact.github ? `<div class="contact-item"><span class="contact-icon">💻</span>${contact.github}</div>` : ""}
      </div>

      <div class="sidebar-section">
        <div class="sidebar-section-title">Skills - Overview</div>
        <div class="skills-bubbles">
          ${skillBubblesHtml}
        </div>
      </div>

      <div class="sidebar-section">
        <div class="sidebar-section-title">Skills - Programming</div>
        ${programmingBarsHtml}
      </div>

      ${
        education.length > 0
          ? `<div class="sidebar-section">
          <div class="sidebar-section-title">Education</div>
          ${educationHtml}
        </div>`
          : ""
      }
    </td>

    <!-- Main Content -->
    <td class="main">
      <!-- Experience Section -->
      <div class="section">
        <div class="section-header">
          <div class="section-shortcode">${SECTION_SHORTCODES.experience}</div>
          <div class="section-title">Experience</div>
        </div>
        <div class="section-divider"></div>
        ${experienceHtml || '<div style="font-size: 10px; color: #999;">No experience added</div>'}
      </div>
    </td>
  </tr>
</table>
</body>
</html>`;

  const element = document.createElement("div");
  element.innerHTML = htmlContent;
  element.style.position = "fixed";
  element.style.top = "0";
  element.style.left = "0";
  element.style.width = "210mm";
  element.style.backgroundColor = "white";
  element.style.zIndex = "-9999";
  element.style.visibility = "hidden";
  document.body.appendChild(element);

  try {
    const html2pdf = await loadHtml2Pdf();

    // Add delay to allow content to render
    await new Promise((resolve) => setTimeout(resolve, 500));

    return new Promise((resolve, reject) => {
      html2pdf()
        .set({
          margin: [0, 0, 0, 0],
          filename: "Resume_Entry_Level_Modern.pdf",
          image: { type: "jpeg", quality: 0.98 },
          html2canvas: {
            scale: 2,
            useCORS: true,
            allowTaint: true,
            backgroundColor: "#ffffff",
          },
          jsPDF: {
            orientation: "portrait",
            unit: "mm",
            format: "a4",
            compress: true,
          },
        })
        .from(element.querySelector("table") || element)
        .toPdf()
        .output("blob")
        .then((blob: Blob) => {
          document.body.removeChild(element);
          resolve(blob);
        })
        .catch((err: Error) => {
          document.body.removeChild(element);
          reject(err);
        });
    });
  } catch (error) {
    if (document.body.contains(element)) {
      document.body.removeChild(element);
    }
    throw error;
  }
}

// Generate PDF with template styling
async function generateTemplatePDF(
  resume: ResumeData,
  template: ResumeTemplate,
  company: string,
  jobTitle: string,
): Promise<Blob> {
  if (template.id === "entry-level-modern") {
    return generateEntryLevelModernPDF(resume, template);
  }

  const { contact, summary, skills, experience, education, projects } = resume;

  const htmlContent = `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; padding: 25px; max-width: 850px; margin: 0 auto;">
      <h1 style="margin: 0 0 8px 0; font-size: 32px; font-weight: 700; color: ${template.colors.primary};">${
        contact.name || "Resume"
      }</h1>
      <div style="font-size: 12px; margin-bottom: 18px; color: ${template.colors.secondary};">
        ${contact.email ? `<span>${contact.email}</span>` : ""}
        ${contact.phone ? `<span> • ${contact.phone}</span>` : ""}
        ${contact.location ? `<span> • ${contact.location}</span>` : ""}
      </div>

      ${
        summary?.trim()
          ? `
        <h2 style="font-size: 13px; font-weight: 700; text-transform: uppercase; margin: 16px 0 8px 0; border-bottom: 2px solid ${template.colors.primary}; padding-bottom: 4px; color: ${template.colors.primary};">Professional Summary</h2>
        <p style="font-size: 11px; margin-bottom: 14px; line-height: 1.6; color: #555;">${summary}</p>
      `
          : ""
      }

      ${
        skills && skills.length > 0
          ? `
        <h2 style="font-size: 13px; font-weight: 700; text-transform: uppercase; margin: 16px 0 8px 0; border-bottom: 2px solid ${template.colors.primary}; padding-bottom: 4px; color: ${template.colors.primary};">Skills</h2>
        <p style="font-size: 11px; margin-bottom: 14px; color: #555;">${skills.join(" • ")}</p>
      `
          : ""
      }

      ${
        experience && experience.length > 0
          ? `
        <h2 style="font-size: 13px; font-weight: 700; text-transform: uppercase; margin: 16px 0 8px 0; border-bottom: 2px solid ${template.colors.primary}; padding-bottom: 4px; color: ${template.colors.primary};">Professional Experience</h2>
        ${experience
          .map((exp) => {
            const dateRange =
              exp.endDate && !exp.isCurrentlyWorking
                ? `${exp.startDate} – ${exp.endDate}`
                : `${exp.startDate} – Present`;
            return `
              <div style="margin-bottom: 12px;">
                <div style="font-weight: 600; font-size: 12px; margin: 0; color: ${template.colors.primary};">${exp.title}</div>
                <div style="font-size: 11px; color: ${template.colors.secondary}; margin: 3px 0 6px 0;">${exp.company} | ${dateRange}</div>
                <ul style="margin: 0; padding-left: 20px; font-size: 11px; line-height: 1.5; color: #555;">
                  ${exp.description
                    .map(
                      (desc) => `<li style="margin-bottom: 3px;">${desc}</li>`,
                    )
                    .join("")}
                </ul>
              </div>
            `;
          })
          .join("")}
      `
          : ""
      }

      ${
        education && education.length > 0
          ? `
        <h2 style="font-size: 13px; font-weight: 700; text-transform: uppercase; margin: 16px 0 8px 0; border-bottom: 2px solid ${template.colors.primary}; padding-bottom: 4px; color: ${template.colors.primary};">Education</h2>
        ${education
          .map(
            (edu) => `
          <div style="font-size: 11px; margin-bottom: 8px;">
            <div style="font-weight: 600; margin: 0; color: ${template.colors.primary};">${edu.degree} in ${edu.field}</div>
            <div style="color: ${template.colors.secondary}; margin: 3px 0;">${edu.institution} | Graduated: ${edu.graduationDate}</div>
          </div>
        `,
          )
          .join("")}
      `
          : ""
      }

      ${
        projects && projects.length > 0
          ? `
        <h2 style="font-size: 13px; font-weight: 700; text-transform: uppercase; margin: 16px 0 8px 0; border-bottom: 2px solid ${template.colors.primary}; padding-bottom: 4px; color: ${template.colors.primary};">Projects</h2>
        ${projects
          .map(
            (project) => `
          <div style="font-size: 11px; margin-bottom: 8px;">
            <div style="font-weight: 600; margin: 0; color: ${template.colors.primary};">${project.title}</div>
            <div style="color: #555;">${project.description}</div>
          </div>
        `,
          )
          .join("")}
      `
          : ""
      }

      ${
        resume.customSections && Object.keys(resume.customSections).length > 0
          ? Object.entries(resume.customSections)
              .filter(([, content]) => content && content.trim())
              .map(
                ([sectionName, sectionContent]) => `
          <h2 style="font-size: 13px; font-weight: 700; text-transform: uppercase; margin: 16px 0 8px 0; border-bottom: 2px solid ${template.colors.primary}; padding-bottom: 4px; color: ${template.colors.primary};">${sectionName}</h2>
          <p style="font-size: 11px; margin-bottom: 14px; line-height: 1.6; color: #555;">${sectionContent}</p>
        `,
              )
              .join("")
          : ""
      }
    </div>
  `;

  const element = document.createElement("div");
  element.innerHTML = htmlContent;
  element.style.display = "none";
  document.body.appendChild(element);

  try {
    const html2pdf = await loadHtml2Pdf();

    return new Promise((resolve, reject) => {
      html2pdf()
        .set({
          margin: 10,
          filename: `Resume_${company || "Resume"}.pdf`,
          image: { type: "jpeg", quality: 0.98 },
          html2canvas: { scale: 2 },
          jsPDF: { orientation: "portrait", unit: "mm", format: "a4" },
        })
        .from(element)
        .toPdf()
        .output("blob")
        .then((blob: Blob) => {
          document.body.removeChild(element);
          resolve(blob);
        })
        .catch((err: Error) => {
          document.body.removeChild(element);
          reject(err);
        });
    });
  } catch (error) {
    document.body.removeChild(element);
    throw error;
  }
}

// Generate LaTeX format
function generateLatexResume(
  resume: ResumeData,
  template: ResumeTemplate,
): Blob {
  const { contact, summary, skills, experience, education, projects } = resume;

  if (template.id === "twenty-seconds-cv") {
    return generateTwentySecondsLatex(resume, template);
  }

  // Standard academic LaTeX format
  let latex = `\\documentclass[11pt,a4paper]{article}
\\usepackage[utf-8]{inputenc}
\\usepackage{geometry}
\\usepackage{hyperref}
\\usepackage{xcolor}
\\usepackage{tikz}

\\geometry{margin=0.75in}
\\pagestyle{empty}

\\definecolor{primarycolor}{HTML}{${template.colors.primary.slice(1)}}
\\definecolor{secondarycolor}{HTML}{${template.colors.secondary.slice(1)}}

\\newcommand{\\sectiontitle}[1]{%
  {\\Large\\bfseries\\color{primarycolor}#1}%
  \\vspace{-0.5em}\\hrule\\vspace{0.5em}%
}

\\begin{document}

% Header
{\\centering
{\\Large\\bfseries\\color{primarycolor}${contact.name}}\\\\
${
  contact.email || contact.phone || contact.location
    ? `${[contact.email, contact.phone, contact.location].filter(Boolean).join(" \\textbullet\\ ")}`
    : ""
}
\\par}

\\vspace{1em}

`;

  if (summary?.trim()) {
    latex += `\\sectiontitle{Professional Summary}
${summary}

\\vspace{0.5em}

`;
  }

  if (skills.length > 0) {
    latex += `\\sectiontitle{Skills}
${skills.join(", ")}

\\vspace{0.5em}

`;
  }

  if (experience.length > 0) {
    latex += `\\sectiontitle{Professional Experience}

`;
    experience.forEach((exp) => {
      const dateRange =
        exp.endDate && !exp.isCurrentlyWorking
          ? `${exp.startDate} -- ${exp.endDate}`
          : `${exp.startDate} -- Present`;
      latex += `\\noindent{\\bfseries\\color{primarycolor}${exp.title}}\\\\
\\textit{${exp.company} | ${dateRange}}

\\begin{itemize}
`;
      exp.description.forEach((desc) => {
        latex += `  \\item ${desc}
`;
      });
      latex += `\\end{itemize}

`;
    });

    latex += `\\vspace{0.5em}

`;
  }

  if (education.length > 0) {
    latex += `\\sectiontitle{Education}

`;
    education.forEach((edu) => {
      latex += `\\noindent{\\bfseries\\color{primarycolor}${edu.degree} in ${edu.field}}\\\\
\\textit{${edu.institution} | Graduated: ${edu.graduationDate}}\\\\

`;
    });

    latex += `\\vspace{0.5em}

`;
  }

  if (projects && projects.length > 0) {
    latex += `\\sectiontitle{Projects}

`;
    projects.forEach((project) => {
      latex += `\\noindent{\\bfseries\\color{primarycolor}${project.title}}\\\\
${project.description}\\\\

`;
    });
  }

  latex += `\\end{document}`;

  return new Blob([latex], { type: "text/plain" });
}

// Generate Twenty Seconds CV LaTeX format
function generateTwentySecondsLatex(
  resume: ResumeData,
  _template: ResumeTemplate,
): Blob {
  const { contact, summary, skills, experience, education } = resume;

  let latex = `%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
% ResumeMatch Pro - Twenty Seconds Resume/CV
% LaTeX Template
%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%

\\documentclass[letterpaper]{twentysecondcv}

\\newcommand\\skills{
  ~ \\smartdiagram[bubble diagram]{
    ${skills
      .slice(0, 5)
      .map((s) => `\\textbf{${s}}`)
      .join(", ")}
  }
}

\\programming{
  {${skills.slice(0, 3).join(" \\textbullet\\ ")} / 5},
  {${skills.slice(3, 6).join(" \\textbullet\\ ")} / 4}
}

\\education{
  ${
    education.length > 0
      ? education
          .map(
            (edu) => `\\textbf{${edu.degree}, ${edu.field}}\\\\
${edu.institution}\\\\
${edu.graduationDate}`,
          )
          .join(" ")
      : ""
  }
}

\\cvname{${contact.name.toUpperCase()}}
\\cvjobtitle{${contact.location || "Professional"}}
${contact.phone ? `\\cvnumberphone{${contact.phone}}` : ""}
${contact.website ? `\\cvsite{${contact.website}}` : ""}
${contact.email ? `\\cvmail{${contact.email}}` : ""}

\\begin{document}
\\makeprofile

\\section{Professional Summary}
${summary || "Dedicated professional with extensive experience in multiple domains."}

\\section{Experience}
\\begin{twenty}
${
  experience
    .map(
      (exp) => `\\twentyitem
    {${exp.startDate}}
    {${exp.endDate || "Present"}}
    {${exp.title}}
    {${exp.company}}
    {}
    {${exp.description.slice(0, 2).join(" ")}}`,
    )
    .join("\n  ") || "\\twentyitem{}{}{}{}{}{}"
}
\\end{twenty}

\\end{document}
`;

  return new Blob([latex], { type: "text/plain" });
}

// Main export function
export async function generateResumeInTemplate(
  resume: ResumeData,
  template: ResumeTemplate,
  format: "docx" | "pdf" | "latex",
  company: string,
  jobTitle: string,
): Promise<Blob> {
  try {
    switch (format) {
      case "docx":
        return await generateTemplateDocx(resume, template, company, jobTitle);
      case "pdf":
        return await generateTemplatePDF(resume, template, company, jobTitle);
      case "latex":
        return generateLatexResume(resume, template);
      default:
        throw new Error(`Unsupported format: ${format}`);
    }
  } catch (error) {
    console.error(`Failed to generate resume in ${format} format:`, error);
    throw error;
  }
}
