import { Request, Response } from "express";
import { AuthRequest } from "../middleware/auth";
import { User as UserModel } from "../db";
import fs from "fs";
import path from "path";

// Mock Telegram status handler
export const getStatus = async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const user = await UserModel.findById(req.user._id);
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  res.json({ linked: !!user.telegramLinked });
};

// Mock Telegram link handler
export const getLink = async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const user = await UserModel.findById(req.user._id);
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  // Create a unique token for this user
  const token = `token_${user._id.slice(-6)}`;
  user.telegramToken = token;
  await user.save();

  // In a real app, this would be your bot's link
  res.json({ link: `https://t.me/ResumeMatchProBot?start=${token}` });
};

// Mock Telegram QR code handler
export const getQR = async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  // We'll return a placeholder QR code image
  // In a real app, you'd generate a QR from the bot link
  const qrPlaceholderPath = path.join(process.cwd(), "public", "telegram-qr-placeholder.png");

  // If the file doesn't exist, we'll send a 404 or a simple buffer if we had one.
  // For the sake of the exercise, let's just send a tiny base64 encoded png or similar if we can,
  // but simpler to just use a real file if available.
  // Actually, let's just send a generic image from a URL via fetch if we want to be fancy, 
  // but better to just send a dummy buffer.

  const dummyImageBuffer = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAMgAAADICAYAAACtWK6eAAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAALEwAACxMBAJqcGAAAADh6VFh0U29mdHdhcmUAbWF0cGxvdGxpYiB2ZXJzaW9uIDMuNS4yLCBodHRwczovL21hdHBsb3RsaWIub3JnL/6847wAAABJREFUeJzt0BAJAAAIA7H/P90XBhB8B9YfAQAAAAAASUVORK5CYII=",
    "base64"
  );

  res.set("Content-Type", "image/png");
  res.send(dummyImageBuffer);
};

// Mock Telegram unlink handler
export const unlink = async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const user = await UserModel.findById(req.user._id);
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  user.telegramLinked = false;
  user.telegramChatId = undefined;
  user.telegramToken = undefined;
  await user.save();

  res.json({ success: true, message: "Telegram unlinked successfully" });
};
