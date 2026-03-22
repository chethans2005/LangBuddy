import jwt from "jsonwebtoken";
import { Response } from "express";

const JWT_SECRET = process.env.JWT_SECRET || "my_super_secret_fallback_key";

export const generateToken = (userId: string, res: Response) => {
  const token = jwt.sign({ userId }, JWT_SECRET, {
    expiresIn: "15d",
  });

  res.cookie("jwt", token, {
    maxAge: 15 * 24 * 60 * 60 * 1000,
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV !== "development",
  });

  return token;
};
