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
    const { email, firstName, lastName, password } = userData;

    // Check if user already exists
    const existingUser = await UserModel.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        status: 400,
        success: false,
        message: "User with this email already exists"
      });
    }

    // Generate user ID
    const userId = userData._id || `user_${Date.now()}`;

    // Create new user
    const user = new UserModel({
      _id: userId,
      firstName,
      lastName,
      email,
      password,
      auth_provider: "local",
      credits: 150,
    });

    await user.save();

    // Remove password from response
    const userResponse = user.toObject();
    delete userResponse.password;

    // Return response in auth format with token = userId
    res.status(201).json({
      status: 201,
      success: true,
      message: "User registered successfully",
      data: {
        user: userResponse,
        access_token: userId,
        token_type: "bearer",
      },
    });
  } catch (error: any) {
    res.status(500).json({
      status: 500,
      success: false,
      message: error.message || "Registration failed"
    });
  }
};

// NEW: Login endpoint
export const loginUser: RequestHandler = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        status: 400,
        success: false,
        message: "Email and password required"
      });
    }

    // Find user by email with password field selected
    const user = await UserModel.findOne({ email }).select("+password");
    if (!user) {
      return res.status(401).json({
        status: 401,
        success: false,
        message: "Invalid email or password"
      });
    }

    // Check password (in production, use bcrypt)
    if (!user.password || user.password !== password) {
      return res.status(401).json({
        status: 401,
        success: false,
        message: "Invalid email or password"
      });
    }

    // Remove password from response before sending
    const userResponse = user.toObject();
    delete userResponse.password;

    // Return response in auth format with token = userId
    res.json({
      status: 200,
      success: true,
      message: "Login successful",
      data: {
        user: userResponse,
        access_token: user._id,
        token_type: "bearer",
      },
    });
  } catch (error: any) {
    res.status(500).json({
      status: 500,
      success: false,
      message: error.message
    });
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
