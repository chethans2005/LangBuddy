import Notification from "../models/Notification.js";
import User from "../models/User.js";

export async function getNotifications(req, res) {
  try {
    const userId = req.user._id;
    const notes = await Notification.find({ user: userId }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, notifications: notes });
  } catch (error) {
    console.error("Error fetching notifications:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

// Debug helper: create a notification for the first user in DB (unprotected) - for local testing only
export async function debugCreateForFirstUser(req, res) {
  try {
    const user = await User.findOne();
    if (!user) return res.status(404).json({ message: "No users found" });
    const note = await Notification.create({
      user: user._id,
      senderId: "debug",
      senderName: "Debug",
      text: "This is a debug notification",
      channelCid: "debug-channel",
    });
    res.status(201).json({ success: true, notification: note });
  } catch (err) {
    console.error("Error in debugCreateForFirstUser:", err.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function createNotification(req, res) {
  try {
    const userId = req.user._id;
    const { senderId, senderName, text, channelCid } = req.body;
    console.log("[notifications] createNotification called for user:", userId.toString(), { senderId, senderName, text, channelCid });
    const note = await Notification.create({
      user: userId,
      senderId,
      senderName,
      text,
      channelCid,
    });
    console.log("[notifications] created:", note._id.toString());
    res.status(201).json({ success: true, notification: note });
  } catch (error) {
    console.error("Error creating notification:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

// migrate array of client notifications (used at login)
export async function migrateNotifications(req, res) {
  try {
    const userId = req.user._id;
    const { notifications } = req.body;
    console.log("[notifications] migrateNotifications called for user:", userId.toString(), "count:", Array.isArray(notifications) ? notifications.length : 0);
    if (!Array.isArray(notifications) || notifications.length === 0)
      return res.status(200).json({ success: true, created: 0 });

    const created = [];
    for (const n of notifications) {
      const note = await Notification.create({
        user: userId,
        senderId: n.senderId,
        senderName: n.senderName,
        text: n.text,
        channelCid: n.channelCid,
        createdAt: n.createdAt || Date.now(),
      });
      created.push(note);
    }

    res.status(201).json({ success: true, createdCount: created.length });
  } catch (error) {
    console.error("Error migrating notifications:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function deleteNotification(req, res) {
  try {
    const userId = req.user._id;
    const id = req.params.id;
    const note = await Notification.findById(id);
    if (!note) return res.status(404).json({ message: "Not found" });
    if (note.user.toString() !== userId.toString()) return res.status(403).json({ message: "Forbidden" });
    await Notification.deleteOne({ _id: id });
    res.status(200).json({ success: true });
  } catch (error) {
    console.error("Error deleting notification:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}
