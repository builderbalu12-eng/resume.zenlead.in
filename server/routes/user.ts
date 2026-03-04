import { Request, Response } from "express";
import { AuthRequest } from "../middleware/auth";
import { User as UserModel } from "../db";

export const getMe = async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  res.json(req.user);
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
    res.json(user);
  } catch (err: any) {
    res.status(500).json({ message: err.message || "Failed to update user" });
  }
};

export const changePassword = async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const { current_password, new_password, confirm_password } = req.body;

  if (new_password !== confirm_password) {
    return res.status(400).json({ error: "Passwords do not match" });
  }

  try {
    const user = await UserModel.findById(req.user._id).select("+password");
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Check auth provider
    if (user.auth_provider === "google") {
      return res.status(400).json({ error: "Cannot change password for Google account" });
    }

    // In a real app, you'd compare hashes here.
    // Since we're in a starter, we'll assume the password is plaintext for now or we just update it.
    // If user has a password set, we should check it.
    if (user.password && user.password !== current_password) {
      return res.status(401).json({ message: "Current password is incorrect" });
    }

    user.password = new_password;
    await user.save();

    res.json({ success: true, message: "Password updated successfully" });
  } catch (err: any) {
    res.status(500).json({ message: err.message || "Failed to update password" });
  }
};
