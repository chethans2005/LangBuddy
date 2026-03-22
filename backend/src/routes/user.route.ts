// @ts-nocheck
import express from "express";
import User from "../models/User";
import Notification from "../models/Notification";
import { protectRoute, AuthRequest } from "../middleware/auth.middleware";
import nodemailer from "nodemailer";

const router = express.Router();

router.get("/search", protectRoute, async (req: AuthRequest, res) => {
  try {
    const { q } = req.query;
    if (!q || typeof q !== "string") return res.status(200).json([]);
    const users = await User.find({
      name: { $regex: q, $options: "i" },
      _id: { $ne: req.user?._id },
    }).select("name avatar nativeLanguage learningLanguage bio");
    res.status(200).json(users);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/recommendations", protectRoute, async (req: AuthRequest, res) => {
  try {
    const currentUser = req.user;
    
    const recommendations = await User.find({
      _id: { $ne: currentUser._id, $nin: currentUser.friends },
      isOnboarded: true,
      $or: [
        { learningLanguage: { $regex: new RegExp(`^${currentUser.nativeLanguage}$`, "i") } },
        { nativeLanguage: { $regex: new RegExp(`^${currentUser.learningLanguage}$`, "i") } }
      ]
    }).limit(10).select("-password -friends");

    res.status(200).json(recommendations);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/add-friend/:id", protectRoute, async (req: AuthRequest, res) => {
  try {
    const recipientId = req.params.id;
    const senderId = req.user._id;

    if (senderId.toString() === recipientId) {
      res.status(400).json({ message: "You cannot add yourself" });
      return;
    }

    if (req.user.friends.includes(recipientId)) {
      res.status(400).json({ message: "Already friends" });
      return;
    }

    const existingReq = await Notification.findOne({
      sender: senderId,
      recipient: recipientId,
      type: "FRIEND_REQUEST",
    });

    if (existingReq) {
      res.status(400).json({ message: "Request already sent" });
      return;
    }

    const notification = new Notification({
      sender: senderId,
      recipient: recipientId,
      type: "FRIEND_REQUEST",
      content: `${req.user.name} sent you a friend request.`,
    });

    await notification.save();
    res.status(200).json({ message: "Friend request sent" });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/friends", protectRoute, async (req: AuthRequest, res) => {
  try {
    const user = await User.findById(req.user._id).populate("friends", "name avatar nativeLanguage learningLanguage bio");
    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }
    res.status(200).json(user.friends);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/request-language", protectRoute, async (req: AuthRequest, res) => {
  try {
    const { language } = req.body;
    if (!language) {
      res.status(400).json({ message: "Language is required" });
      return;
    }

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.ADMIN_EMAIL,
        pass: process.env.ADMIN_EMAIL_PASSWORD,
      },
    });

    await transporter.sendMail({
      from: process.env.ADMIN_EMAIL,
      to: process.env.ADMIN_EMAIL,
      subject: `New Language Group Request: ${language}`,
      text: `User ${req.user.name} (${req.user.email}) has requested to create a new language group for: ${language}.`,
    });

    res.status(200).json({ message: "Request sent successfully" });
  } catch (error: any) {
    res.status(500).json({ message: "Failed to send request email" });
  }
});

export default router;
