import { RequestHandler } from "express";
import { ResumeData, User, ApplicationRecord } from "@shared/api";
import { User as UserModel } from "../db";

// Mock database for applications - in production, use real MongoDB
const applications = new Map<string, ApplicationRecord[]>();

export const getUserResume: RequestHandler = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await UserModel.findById(userId);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(user.masterResume || null);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const saveUserResume: RequestHandler = async (req, res) => {
  try {
    const { userId } = req.params;
    const resume: ResumeData = req.body;

    let user = await UserModel.findById(userId);
    if (!user) {
      user = new UserModel({
        _id: userId,
        email: "",
        masterResume: resume,
        credits: 0,
      });
    } else {
      user.masterResume = resume;
    }

    await user.save();
    res.json(user);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const saveUser: RequestHandler = async (req, res) => {
  try {
    const userData: User = req.body;
    const userId = userData._id || `user_${Date.now()}`;

    let user = await UserModel.findById(userId);
    if (!user) {
      user = new UserModel({
        _id: userId,
        ...userData,
        credits: userData.credits || 0,
      });
    } else {
      user.email = userData.email || user.email;
      user.masterResume = userData.masterResume || user.masterResume;
      user.credits = userData.credits || user.credits;
    }

    await user.save();
    res.json(user);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const getApplicationHistory: RequestHandler = (req, res) => {
  const { userId } = req.query;

  if (!userId || typeof userId !== "string") {
    return res.status(400).json({ error: "userId required" });
  }

  const apps = applications.get(userId) || [];
  res.json(apps);
};

export const saveApplication: RequestHandler = (req, res) => {
  const app: ApplicationRecord = req.body;
  const userId = app.userId;

  let userApps = applications.get(userId) || [];
  app._id = `app_${Date.now()}`;
  app.createdAt = new Date();
  userApps.push(app);

  applications.set(userId, userApps);
  res.json(app);
};

export const updateApplicationStatus: RequestHandler = (req, res) => {
  const { appId } = req.params;
  const { status } = req.body;

  for (const [userId, apps] of applications.entries()) {
    const app = apps.find((a) => a._id === appId);
    if (app) {
      app.status = status;
      app.updatedAt = new Date();
      res.json(app);
      return;
    }
  }

  res.status(404).json({ error: "Application not found" });
};
