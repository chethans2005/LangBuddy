import jwt from "jsonwebtoken";
import { cookies } from "next/headers";

const JWT_SECRET = process.env.JWT_SECRET || "my_super_secret_fallback_key";

export const generateTokenAndSetCookie = async (userId: string) => {
  const token = jwt.sign({ userId }, JWT_SECRET, {
    expiresIn: "15d",
  });
  
  const cookieStore = await cookies();
  cookieStore.set("jwt", token, {
    maxAge: 15 * 24 * 60 * 60, // 15 days in seconds
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV !== "development",
  });
};
