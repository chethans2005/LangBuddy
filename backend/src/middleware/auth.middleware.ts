import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import User from "../models/User";

const JWT_SECRET = process.env.JWT_SECRET || "my_super_secret_fallback_key";

export interface AuthRequest extends Request {
  user?: any;
}

export const protectRoute = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const token = req.cookies.jwt;
    if (!token) {
      res.status(401).json({ message: "Unauthorized - No Token Provided" });
      return;
    }

    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    if (!decoded) {
      res.status(401).json({ message: "Unauthorized - Invalid Token" });
      return;
    }

    const user = await User.findById(decoded.userId).select("-password");
    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    req.user = user;
    next();
  } catch (error: any) {
    if (error.name === "TokenExpiredError") {
      res.status(401).json({ message: "Unauthorized - Token Expired" });
      return;
    }
    res.status(500).json({ message: "Internal server error" });
  }
};
