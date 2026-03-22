import express from "express";
import {
  getNotifications,
  createNotification,
  migrateNotifications,
  deleteNotification,
  debugCreateForFirstUser,
} from "../controllers/notification.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";

const router = express.Router();
// debug route (unprotected) - local testing only
router.post("/debug-create-first", debugCreateForFirstUser);

router.use(protectRoute);

router.get("/", getNotifications);
router.post("/", createNotification);
router.post("/migrate", migrateNotifications);
router.delete("/:id", deleteNotification);

export default router;
