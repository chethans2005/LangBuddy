// @ts-nocheck
import express from "express";
import User from "../models/User";
import Notification from "../models/Notification";
import { protectRoute, AuthRequest } from "../middleware/auth.middleware";
import { getReceiverSocketId, io } from "../lib/socket";
import nodemailer from "nodemailer";

const router = express.Router();

const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

router.get("/search", protectRoute, async (req: AuthRequest, res) => {
  try {
    const { q } = req.query;
    if (!q || typeof q !== "string") return res.status(200).json([]);

    const safeQuery = escapeRegex(q.trim().slice(0, 64));
    if (!safeQuery) return res.status(200).json([]);

    const users = await User.find({
      name: { $regex: safeQuery, $options: "i" },
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
    const nativeLanguage = escapeRegex(String(currentUser.nativeLanguage || "").trim());
    const learningLanguage = escapeRegex(String(currentUser.learningLanguage || "").trim());

    if (!nativeLanguage || !learningLanguage) {
      return res.status(200).json([]);
    }
    
    const recommendations = await User.find({
      _id: { $ne: currentUser._id, $nin: currentUser.friends },
      isOnboarded: true,
      $or: [
        { learningLanguage: { $regex: `^${nativeLanguage}$`, $options: "i" } },
        { nativeLanguage: { $regex: `^${learningLanguage}$`, $options: "i" } }
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
    // emit real-time notification to recipient if they're online
    try {
      const receiverSocketId = getReceiverSocketId(recipientId);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit("newNotification", notification);
      }
    } catch (e) {
      // non-fatal, continue
    }

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

// Phase 2: User Profile endpoints

// Get public user profile
router.get("/:id", async (req: AuthRequest, res) => {
  try {
    const user = await User.findById(req.params.id)
      .populate("friends", "name avatar nativeLanguage learningLanguage")
      .select("-password");
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json(user);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Update proficiency levels
router.put("/:id/profile", protectRoute, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    // Only allow users to update their own profile
    if (id !== userId.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }

    const { nativeLanguage, learningLanguage, bio, proficiencyLevels } = req.body;

    const updatedUser = await User.findByIdAndUpdate(
      id,
      {
        ...(nativeLanguage && { nativeLanguage }),
        ...(learningLanguage && { learningLanguage }),
        ...(bio && { bio }),
        ...(proficiencyLevels && { proficiencyLevels }),
      },
      { new: true }
    ).select("-password");

    res.status(200).json(updatedUser);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Add or update rating for a user
router.post("/:id/ratings", protectRoute, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { score, comment } = req.body;
    const fromUserId = req.user._id;

    if (!score || score < 1 || score > 5) {
      return res.status(400).json({ message: "Rating must be between 1 and 5" });
    }

    if (id === fromUserId.toString()) {
      return res.status(400).json({ message: "Cannot rate yourself" });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Remove existing rating from this user if any
    const existingRatingIndex = user.ratings.findIndex(
      (r: any) => r.fromUserId.toString() === fromUserId.toString()
    );

    if (existingRatingIndex !== -1) {
      user.ratings[existingRatingIndex] = {
        fromUserId,
        score,
        comment: comment || "",
        createdAt: new Date(),
      };
    } else {
      user.ratings.push({
        fromUserId,
        score,
        comment: comment || "",
        createdAt: new Date(),
      });
    }

    // Recalculate average rating
    const totalScore = user.ratings.reduce((sum: number, r: any) => sum + r.score, 0);
    user.avgRating = Number((totalScore / user.ratings.length).toFixed(1));
    user.totalRatings = user.ratings.length;

    await user.save();
    res.status(200).json({
      message: "Rating saved",
      avgRating: user.avgRating,
      totalRatings: user.totalRatings,
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Get ratings for a user
router.get("/:id/ratings", async (req: AuthRequest, res) => {
  try {
    const user = await User.findById(req.params.id).populate(
      "ratings.fromUserId",
      "name avatar"
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({
      avgRating: user.avgRating,
      totalRatings: user.totalRatings,
      ratings: user.ratings || [],
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
