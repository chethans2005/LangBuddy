// @ts-nocheck
import express from "express";
import Notification from "../models/Notification";
import User from "../models/User";
import { protectRoute, AuthRequest } from "../middleware/auth.middleware";

const router = express.Router();

router.get("/", protectRoute, async (req: AuthRequest, res) => {
  try {
    const notifications = await Notification.find({ recipient: req.user._id })
      .populate("sender", "name avatar nativeLanguage learningLanguage")
      .sort({ createdAt: -1 });
    res.status(200).json(notifications);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

router.put("/:id", protectRoute, async (req: AuthRequest, res) => {
  try {
    const { action } = req.body;
    const notificationId = req.params.id;
    
    const notification = await Notification.findById(notificationId);
    if (!notification || notification.recipient.toString() !== req.user._id.toString()) {
      res.status(404).json({ message: "Not found" });
      return;
    }

    if (action === "ACCEPT" && notification.type === "FRIEND_REQUEST") {
      await User.findByIdAndUpdate(req.user._id, { $addToSet: { friends: notification.sender } });
      await User.findByIdAndUpdate(notification.sender, { $addToSet: { friends: req.user._id } });
    }

    await Notification.findByIdAndDelete(notificationId);
    res.status(200).json({ message: `Request ${action.toLowerCase()}ed` });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
