import { Request, Response, NextFunction } from "express";
import { User as UserModel } from "../db";

export interface AuthRequest extends Request {
  user?: any;
}

export const authMiddleware = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Missing authorization header" });
  }

  const token = authHeader.split(" ")[1];

  // In a real app, you'd verify a JWT here. 
  // For this mock/starter, we'll assume the token IS the user ID or a valid session identifier.
  // We'll try to find a user by ID.

  try {
    const user = await UserModel.findById(token);
    if (!user) {
      return res.status(401).json({ error: "Invalid token" });
    }
    req.user = user;
    next();
  } catch (err) {
    res.status(500).json({ error: "Server error during authentication" });
  }
};
