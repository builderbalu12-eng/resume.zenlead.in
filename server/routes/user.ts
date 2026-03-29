import { Request, Response } from "express";
import { AuthRequest } from "../middleware/auth";
import { User as UserModel } from "../db";

export const getMe = async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  // Remove password from response for security
  const userResponse = { ...req.user.toObject ? req.user.toObject() : req.user };
  delete userResponse.password;

  // Return response in proper format
  res.json({
    status: 200,
    success: true,
    message: "User retrieved successfully",
    data: {
      user: userResponse,
    },
  });
};

export const updateMe = async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const { firstName, lastName } = req.body;

  try {
    const user = await UserModel.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;

    await user.save();

    // Remove password from response for security
    const userResponse = user.toObject();
    delete userResponse.password;

    // Return response in proper format
    res.json({
      status: 200,
      success: true,
      message: "Profile updated successfully",
      data: {
        user: userResponse,
      },
    });
  } catch (err: any) {
    res.status(500).json({
      status: 500,
      success: false,
      message: err.message || "Failed to update user"
    });
  }
};

export const changePassword = async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const { current_password, new_password, confirm_password } = req.body;

  if (new_password !== confirm_password) {
    return res.status(400).json({
      status: 400,
      success: false,
      message: "New password and confirm password do not match"
    });
  }

  if (!new_password || new_password.length < 6) {
    return res.status(400).json({
      status: 400,
      success: false,
      message: "New password must be at least 6 characters"
    });
  }

  try {
    // Need to select password field explicitly since it's set to select: false in schema
    const user = await UserModel.findById(req.user._id).select("+password");
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Check auth provider
    if (user.auth_provider === "google") {
      return res.status(400).json({
        status: 400,
        success: false,
        message: "Password change not available for Google login accounts"
      });
    }

    // Check current password
    if (!user.password || user.password !== current_password) {
      return res.status(401).json({
        status: 401,
        success: false,
        message: "Current password is incorrect"
      });
    }

    user.password = new_password;
    await user.save();

    res.json({
      status: 200,
      success: true,
      message: "Password changed successfully"
    });
  } catch (err: any) {
    res.status(500).json({
      status: 500,
      success: false,
      message: err.message || "Failed to update password"
    });
  }
};
