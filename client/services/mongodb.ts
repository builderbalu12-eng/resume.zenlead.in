import { User, ResumeData, ApplicationRecord } from "@/types";
import {
  saveToStorage,
  getFromStorage,
  setMasterResume,
  getMasterResume,
} from "@/utils/storage";
import { APIClient } from "@/services/api";

const API_BASE_URL = (
  (import.meta as any).env?.VITE_API_URL ||
  ((import.meta as any).env?.DEV ? "http://localhost:8000" : "")
).replace(/\/$/, "");

function getApiClient(): APIClient {
  return new APIClient(API_BASE_URL);
}

const STORAGE_KEYS = {
  USER_DATA: "resumematch_user_data",
  APPLICATIONS: "resumematch_applications",
};

export async function saveUser(userData: User): Promise<User> {
  try {
    await saveToStorage(STORAGE_KEYS.USER_DATA, userData);
    return userData;
  } catch (error) {
    console.error("Error saving user:", error);
    throw error;
  }
}

export async function getUser(): Promise<User | null> {
  try {
    return await getFromStorage(STORAGE_KEYS.USER_DATA);
  } catch (error) {
    console.error("Error fetching user:", error);
    return null;
  }
}

export async function getUserResume(): Promise<ResumeData | null> {
  try {
    return await getMasterResume();
  } catch (error) {
    console.error("Error fetching resume:", error);
    return null;
  }
}

export async function saveResume(resume: ResumeData): Promise<ResumeData> {
  try {
    await setMasterResume(resume);
    return resume;
  } catch (error) {
    console.error("Error saving resume:", error);
    throw error;
  }
}

export async function saveApplication(
  application: ApplicationRecord,
): Promise<ApplicationRecord> {
  try {
    const client = getApiClient();
    const res = await client.saveApplication({
      jobTitle: application.jobTitle || "",
      company: application.company || "",
      location: (application as any).location || "",
      jobUrl: (application as any).jobUrl || "",
      atsScoreBefore: (application as any).atsScoreBefore || 0,
      atsScoreAfter: application.atsScore || (application as any).atsScoreAfter || 0,
      matchPercentage: application.matchPercentage || 0,
      matchedKeywords: (application as any).matchedKeywords || [],
      missingKeywords: (application as any).missingKeywords || [],
      status: application.status || "applied",
    });
    return { ...application, id: res.id };
  } catch (error) {
    console.error("Error saving application:", error);
    throw error;
  }
}

export async function getApplicationHistory(): Promise<ApplicationRecord[]> {
  try {
    const client = getApiClient();
    const docs = await client.getApplicationHistory();
    return docs.map((d: any) => ({
      id: d._id || d.id,
      _id: d._id || d.id,
      userId: d.userId || "",
      jobTitle: d.jobTitle || "",
      company: d.company || "",
      location: d.location || "",
      jobUrl: d.jobUrl || "",
      jobDescription: { description: "" } as any,
      originalResume: {} as any,
      tailoredResume: {} as any,
      atsScore: d.atsScoreAfter || 0,
      atsScoreBefore: d.atsScoreBefore || 0,
      atsScoreAfter: d.atsScoreAfter || 0,
      matchPercentage: d.matchPercentage || 0,
      matchedKeywords: d.matchedKeywords || [],
      missingKeywords: d.missingKeywords || [],
      appliedDate: d.createdAt || new Date().toISOString(),
      status: d.status || "applied",
      createdAt: d.createdAt ? new Date(d.createdAt) : new Date(),
    }));
  } catch (error) {
    console.error("Error fetching application history:", error);
    return [];
  }
}

export async function updateApplicationStatus(
  applicationId: string,
  status: ApplicationRecord["status"],
): Promise<ApplicationRecord> {
  try {
    const applications = await getApplicationHistory();
    const applicationIndex = applications.findIndex(
      (app) => app.id === applicationId,
    );
    if (applicationIndex === -1) {
      throw new Error("Application not found");
    }
    applications[applicationIndex].status = status;
    applications[applicationIndex].updatedAt = new Date();
    await saveToStorage(STORAGE_KEYS.APPLICATIONS, applications);
    return applications[applicationIndex];
  } catch (error) {
    console.error("Error updating application status:", error);
    throw error;
  }
}
