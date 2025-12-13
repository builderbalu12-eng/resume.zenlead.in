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

// Generate DOCX with template styling
async function generateTemplateDocx(
  resume: ResumeData,
  template: ResumeTemplate,
  company: string,
  jobTitle: string,
): Promise<Blob> {
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

// Generate PDF with template styling
async function generateTemplatePDF(
  resume: ResumeData,
  template: ResumeTemplate,
  company: string,
  jobTitle: string,
): Promise<Blob> {
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
