// @ts-nocheck
import express from "express";
import bcrypt from "bcryptjs";
import User from "../models/User";
import { generateToken } from "../lib/jwt";
import { protectRoute, AuthRequest } from "../middleware/auth.middleware";
import { OAuth2Client } from "google-auth-library";

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const router = express.Router();

router.post("/signup", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      res.status(400).json({ message: "All fields are required" });
      return;
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      res.status(400).json({ message: "User already exists" });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({ name, email, password: hashedPassword });
    if (newUser) {
      await newUser.save();
      generateToken(newUser._id.toString(), res);
      res.status(201).json({ _id: newUser._id, name: newUser.name, email: newUser.email, avatar: newUser.avatar, isOnboarded: newUser.isOnboarded });
    } else {
      res.status(400).json({ message: "Invalid user data" });
    }
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/google", async (req, res) => {
  try {
    const { token } = req.body;
    
    // Fallback if env variable is missing
    const clientId = process.env.GOOGLE_CLIENT_ID || "invalid_client_id";
    const client = new OAuth2Client(clientId);

    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: clientId,
    });
    
    const payload = ticket.getPayload();
    if (!payload) {
      res.status(400).json({ message: "Invalid Google Token" });
      return;
    }

    const { email, name, picture } = payload;
    let user = await User.findOne({ email });
    
    if (!user) {
      const randomPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8);
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(randomPassword, salt);

      user = new User({
        name: name || "Google User",
        email,
        password: hashedPassword,
        avatar: picture || "",
        isOnboarded: false
      });
      await user.save();
    }

    generateToken(user._id.toString(), res);
    res.status(200).json({ _id: user._id, name: user.name, email: user.email, avatar: user.avatar, isOnboarded: user.isOnboarded });

  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      res.status(400).json({ message: "Invalid credentials" });
      return;
    }

    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    if (!isPasswordCorrect) {
      res.status(400).json({ message: "Invalid credentials" });
      return;
    }

    generateToken(user._id.toString(), res);
    res.status(200).json({ _id: user._id, name: user.name, email: user.email, avatar: user.avatar, isOnboarded: user.isOnboarded });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/logout", (req, res) => {
  res.cookie("jwt", "", { maxAge: 0 });
  res.status(200).json({ message: "Logged out successfully" });
});

router.get("/me", protectRoute, (req: AuthRequest, res) => {
  res.status(200).json(req.user);
});

router.post("/onboard", protectRoute, async (req: AuthRequest, res) => {
  try {
    const { nativeLanguage, learningLanguage, bio, avatar } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { nativeLanguage, learningLanguage, bio, avatar, isOnboarded: true },
      { new: true }
    ).select("-password");
    res.status(200).json(user);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

router.put("/profile", protectRoute, async (req: AuthRequest, res) => {
  try {
    const { name, bio, avatar, nativeLanguage, learningLanguage } = req.body;
    const userId = req.user?._id;

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { name, bio, avatar, nativeLanguage, learningLanguage },
      { new: true }
    ).select("-password");

    res.status(200).json(updatedUser);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
