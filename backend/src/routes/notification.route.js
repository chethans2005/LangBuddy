import express from "express";
import {
  getNotifications,
  createNotification,
  migrateNotifications,
  deleteNotification,
} from "../controllers/notification.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";

const router = express.Router();

router.use(protectRoute);

router.get("/", getNotifications);
router.post("/", createNotification);
router.post("/migrate", migrateNotifications);
router.delete("/:id", deleteNotification);

export default router;
