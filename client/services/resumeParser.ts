import { ResumeData, ContactInfo, Experience, Education } from "@/types";
import mammoth from "mammoth";

/**
 * Extract raw text from resume file (without parsing/structuring)
 * Structuring is done by backend via apiClient.extractResume()
 */
export async function parseFile(file: File): Promise<string> {
  let text = "";

  if (file.name.endsWith(".docx")) {
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    text = result.value;
  } else if (file.type === "text/plain" || file.name.endsWith(".txt")) {
    text = await file.text();
  } else if (file.type === "application/pdf" || file.name.endsWith(".pdf")) {
    text = await extractTextFromPDF(file);
  } else {
    throw new Error(
      "Unsupported file format. Please upload .docx, .txt, or .pdf file.",
    );
  }

  if (!text || text.trim().length === 0) {
    throw new Error(
      "Could not extract text from file. Please check the file format.",
    );
  }

  return text;
}

async function extractTextFromPDF(file: File): Promise<string> {
  try {
    const pdfjsLib = await import("pdfjs-dist");
    pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
      "pdfjs-dist/build/pdf.worker.min.mjs",
      import.meta.url,
    ).toString();

    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) }).promise;

    let fullText = "";
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const pageText = content.items
        .filter((item: any) => "str" in item)
        .map((item: any) => item.str)
        .join(" ");
      fullText += pageText + "\n\n";
    }

    if (!fullText.trim()) {
      throw new Error(
        "No readable text found in this PDF. The file may be image-based (scanned). Please convert to DOCX or use a text-based PDF.",
      );
    }

    return fullText.trim();
  } catch (error) {
    console.error("Error extracting PDF text:", error);
    if (error instanceof Error) throw error;
    throw new Error("Could not process PDF file.");
  }
}

function parseResumeText(text: string): ResumeData {
  const lines = text.split("\n").filter((line) => line.trim());

  // Extract contact info from first lines
  const contact: ContactInfo = {
    name: lines[0] || "Unknown",
    email: extractEmail(text),
    phone: extractPhone(text),
    location: "",
    website: extractUrl(text),
  };

  // Extract sections
  const skills = extractSection(text, "skills", "experience");
  const experience = extractExperience(text);
  const education = extractEducation(text);
  const summary = extractSection(
    text,
    "summary|profile|objective",
    "experience",
  );

  return {
    contact,
    summary: summary.join(" "),
    skills,
    experience,
    education,
  };
}

function extractEmail(text: string): string {
  const match = text.match(/[\w\.-]+@[\w\.-]+\.\w+/);
  return match ? match[0] : "";
}

function extractPhone(text: string): string {
  const match = text.match(
    /(\+\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/,
  );
  return match ? match[0] : "";
}

function extractUrl(text: string): string {
  const match = text.match(/(https?:\/\/[^\s]+|www\.[^\s]+)/i);
  return match ? match[0] : "";
}

function extractSection(
  text: string,
  startKeyword: string,
  endKeyword: string,
): string[] {
  const startRegex = new RegExp(startKeyword, "i");
  const endRegex = new RegExp(endKeyword, "i");

  const startIdx = text.search(startRegex);
  const endIdx = text.search(endRegex);

  if (startIdx === -1) return [];

  const sectionText =
    endIdx === -1 ? text.substring(startIdx) : text.substring(startIdx, endIdx);

  return sectionText
    .split(/[,\n]/)
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}

function extractExperience(text: string): Experience[] {
  const experiences: Experience[] = [];

  const experienceRegex =
    /([A-Z][a-z\s]+)\s+(?:at|@)?\s+([A-Z][a-z\s&\-\.]+)(\d{4})?[-–](\d{4}|present|now)?/gi;
  let match;

  while ((match = experienceRegex.exec(text)) !== null) {
    experiences.push({
      title: match[1].trim(),
      company: match[2].trim(),
      startDate: match[3] || "Unknown",
      endDate: match[4] || undefined,
      isCurrentlyWorking: /present|now|current/i.test(match[4] || ""),
      description: [],
    });
  }

  return experiences;
}

function extractEducation(text: string): Education[] {
  const educations: Education[] = [];

  const degreeRegex =
    /(Bachelor|Master|PhD|B\.S\.|M\.S\.|B\.A\.|M\.A\.|Associate).*?(?:in|of)?\s+([A-Za-z\s]+?)(?:from|at|,|\()?([A-Z][a-z\s\-\.&]+(?:University|College|Institute))/gi;
  let match;

  while ((match = degreeRegex.exec(text)) !== null) {
    educations.push({
      degree: match[1].trim(),
      field: match[2].trim(),
      institution: match[3].trim(),
      graduationDate: "Unknown",
    });
  }

  return educations;
}

export function validateResume(resume: ResumeData): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!resume.contact.name?.trim()) {
    errors.push("Missing name");
  }

  if (!resume.contact.email?.trim()) {
    errors.push("Missing email");
  }

  // Phone is optional if email exists
  if (!resume.contact.phone?.trim() && !resume.contact.email?.trim()) {
    errors.push("Missing contact information (phone or email)");
  }

  // Skills must exist
  if (!resume.skills || resume.skills.length === 0) {
    errors.push("No skills listed");
  }

  // Experience must exist
  if (!resume.experience || resume.experience.length === 0) {
    errors.push("No experience listed");
  }

  // Education is optional if experience exists
  if (
    (!resume.education || resume.education.length === 0) &&
    (!resume.experience || resume.experience.length === 0)
  ) {
    errors.push("No education or experience listed");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
