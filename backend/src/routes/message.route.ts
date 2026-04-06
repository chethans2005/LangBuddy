// @ts-nocheck
import express from "express";
import Message from "../models/Message";
import Notification from "../models/Notification";
import { protectRoute, AuthRequest } from "../middleware/auth.middleware";
import { getReceiverSocketId, io } from "../lib/socket";
import { isAllowedGroup } from "../lib/groups";

const router = express.Router();

router.get("/direct/:id", protectRoute, async (req: AuthRequest, res) => {
  try {
    const userToChatId = req.params.id;
    const myId = req.user._id;

    const messages = await Message.find({
      $or: [
        { senderId: myId, receiverId: userToChatId },
        { senderId: userToChatId, receiverId: myId },
      ],
    }).sort({ createdAt: 1 }).populate("senderId", "name avatar nativeLanguage learningLanguage bio");

    res.status(200).json(messages);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/direct/:id", protectRoute, async (req: AuthRequest, res) => {
  try {
    const { text } = req.body;
    const receiverId = req.params.id;
    const senderId = req.user._id;

    const newMessage = new Message({
      senderId,
      receiverId,
      text,
    });

    await newMessage.save();
    await newMessage.populate("senderId", "name avatar nativeLanguage learningLanguage bio");

    const receiverSocketId = getReceiverSocketId(receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("newMessage", newMessage);
    }

    // create notification for direct message receiver
    try {
      const notif = new Notification({
        sender: senderId,
        recipient: receiverId,
        type: "MESSAGE",
        content: (text || "").slice(0, 200),
      });
      await notif.save();
      if (receiverSocketId) {
        io.to(receiverSocketId).emit("newNotification", notif);
      }
    } catch (e) {
      // ignore notification errors
    }

    res.status(201).json(newMessage);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/group/:groupId", protectRoute, async (req: AuthRequest, res) => {
  try {
    const { groupId } = req.params;
    if (!isAllowedGroup(groupId)) {
      return res.status(400).json({ message: "Invalid group" });
    }

    const messages = await Message.find({ groupId })
      .sort({ createdAt: 1 })
      .populate("senderId", "name avatar nativeLanguage learningLanguage bio");

    res.status(200).json(messages);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/group/:groupId", protectRoute, async (req: AuthRequest, res) => {
  try {
    const { text } = req.body;
    const { groupId } = req.params;
    const senderId = req.user._id;

    if (!isAllowedGroup(groupId)) {
      return res.status(400).json({ message: "Invalid group" });
    }

    const newMessage = new Message({
      senderId,
      groupId,
      text,
    });

    await newMessage.save();
    await newMessage.populate("senderId", "name avatar nativeLanguage learningLanguage bio");

    io.to(groupId).emit("newMessage", newMessage);

    res.status(201).json(newMessage);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Mark message as read
router.put("/:id/read", protectRoute, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    
    const message = await Message.findByIdAndUpdate(
      id,
      { $addToSet: { "readBy": { userId, readAt: new Date() } } },
      { new: true }
    ).populate("senderId", "name avatar");
    
    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }
    
    res.status(200).json(message);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Edit message
router.put("/:id", protectRoute, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { text } = req.body;
    const userId = req.user._id;
    
    const message = await Message.findById(id);
    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }
    
    if (message.senderId.toString() !== userId.toString()) {
      return res.status(403).json({ message: "Not authorized to edit this message" });
    }
    
    if (!text || !text.trim()) {
      return res.status(400).json({ message: "Message text cannot be empty" });
    }
    
    // Save edit history
    message.editHistory.push({ oldText: message.text, editedAt: new Date() });
    message.text = text.trim();
    message.isEdited = true;
    
    await message.save();
    await message.populate("senderId", "name avatar");
    
    // Emit update to recipients
    if (message.receiverId) {
      const receiverSocketId = getReceiverSocketId(message.receiverId.toString());
      if (receiverSocketId) {
        io.to(receiverSocketId).emit("messageEdited", { messageId: id, updatedMessage: message });
      }
    } else if (message.groupId) {
      io.to(message.groupId).emit("messageEdited", { messageId: id, updatedMessage: message });
    }
    
    res.status(200).json(message);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Delete message
router.delete("/:id", protectRoute, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    
    const message = await Message.findById(id);
    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }
    
    if (message.senderId.toString() !== userId.toString()) {
      return res.status(403).json({ message: "Not authorized to delete this message" });
    }
    
    await Message.findByIdAndDelete(id);
    
    // Emit deletion to recipients
    if (message.receiverId) {
      const receiverSocketId = getReceiverSocketId(message.receiverId.toString());
      if (receiverSocketId) {
        io.to(receiverSocketId).emit("messageDeleted", { messageId: id });
      }
    } else if (message.groupId) {
      io.to(message.groupId).emit("messageDeleted", { messageId: id });
    }
    
    res.status(200).json({ message: "Message deleted" });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Add reaction to message
router.post("/:id/reactions/:emoji", protectRoute, async (req: AuthRequest, res) => {
  try {
    const { id, emoji } = req.params;
    const userId = req.user._id;
    
    const message = await Message.findByIdAndUpdate(
      id,
      { $addToSet: { reactions: { userId, emoji } } },
      { new: true }
    ).populate("senderId", "name avatar");
    
    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }
    
    res.status(200).json(message);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Remove reaction from message
router.delete("/:id/reactions/:emoji", protectRoute, async (req: AuthRequest, res) => {
  try {
    const { id, emoji } = req.params;
    const userId = req.user._id;
    
    const message = await Message.findByIdAndUpdate(
      id,
      { $pull: { reactions: { userId, emoji } } },
      { new: true }
    ).populate("senderId", "name avatar");
    
    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }
    
    res.status(200).json(message);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Search messages in a direct or group chat
router.get("/search/:conversationId", protectRoute, async (req: AuthRequest, res) => {
  try {
    const { conversationId } = req.params;
    const { q, isGroup } = req.query;
    const userId = req.user._id;
    
    if (!q || typeof q !== "string") {
      return res.status(400).json({ message: "Search query required" });
    }
    
    let query: any = { text: { $regex: q, $options: "i" } };
    
    if (isGroup === "true") {
      query.groupId = conversationId;
    } else {
      query.$or = [
        { senderId: userId, receiverId: conversationId },
        { senderId: conversationId, receiverId: userId },
      ];
    }
    
    const messages = await Message.find(query)
      .sort({ createdAt: -1 })
      .limit(50)
      .populate("senderId", "name avatar");
    
    res.status(200).json(messages);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
