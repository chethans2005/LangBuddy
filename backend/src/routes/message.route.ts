// @ts-nocheck
import express from "express";
import Message from "../models/Message";
import { protectRoute, AuthRequest } from "../middleware/auth.middleware";
import { getReceiverSocketId, io } from "../lib/socket";

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

    res.status(201).json(newMessage);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/group/:groupId", protectRoute, async (req: AuthRequest, res) => {
  try {
    const { groupId } = req.params;

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

export default router;
