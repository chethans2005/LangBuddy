// @ts-nocheck
import express from "express";
import Notification from "../models/Notification";
import User from "../models/User";
import { protectRoute, AuthRequest } from "../middleware/auth.middleware";
import { getReceiverSocketId, io } from "../lib/socket";

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

// return unread count
router.get("/count", protectRoute, async (req: AuthRequest, res) => {
  try {
    const count = await Notification.countDocuments({ recipient: req.user._id, read: false });
    res.status(200).json({ count });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// mark all as read
router.put("/read-all", protectRoute, async (req: AuthRequest, res) => {
  try {
    await Notification.updateMany({ recipient: req.user._id, read: false }, { $set: { read: true } });
    res.status(200).json({ message: "all marked read" });
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

    if (notification.type !== "FRIEND_REQUEST") {
      res.status(400).json({ message: "Action is only supported for friend requests" });
      return;
    }

    if (!["ACCEPT", "DECLINE"].includes(action)) {
      res.status(400).json({ message: "Invalid action" });
      return;
    }

    if (action === "ACCEPT") {
      await User.findByIdAndUpdate(req.user._id, { $addToSet: { friends: notification.sender } });
      await User.findByIdAndUpdate(notification.sender, { $addToSet: { friends: req.user._id } });
    }

    // notify sender if they are online that their friend request was handled
    try {
      const senderId = notification.sender?.toString();
      if (senderId) {
        const senderSocketId = getReceiverSocketId(senderId);
        if (senderSocketId) {
          io.to(senderSocketId).emit("friendRequestHandled", { recipient: req.user._id, action });
        }
      }
    } catch (e) {
      // ignore emit errors
    }

    await Notification.findByIdAndDelete(notificationId);
    res.status(200).json({ message: `Request ${action.toLowerCase()}ed` });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// mark single notification as read
router.put('/:id/read', protectRoute, async (req: AuthRequest, res) => {
  try {
    const notificationId = req.params.id;
    const notification = await Notification.findById(notificationId);
    if (!notification || notification.recipient.toString() !== req.user._id.toString()) {
      res.status(404).json({ message: 'Not found' });
      return;
    }
    notification.read = true;
    await notification.save();
    res.status(200).json(notification);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// dismiss notification (useful for message notifications)
router.delete('/:id', protectRoute, async (req: AuthRequest, res) => {
  try {
    const notificationId = req.params.id;
    const notification = await Notification.findById(notificationId);
    if (!notification || notification.recipient.toString() !== req.user._id.toString()) {
      res.status(404).json({ message: 'Not found' });
      return;
    }
    await Notification.findByIdAndDelete(notificationId);
    res.status(200).json({ message: 'Notification removed' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
