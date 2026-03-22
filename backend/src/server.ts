import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import { connectDB } from "./lib/db";
import { app, server } from "./lib/socket";

import authRoutes from "./routes/auth.route";
import userRoutes from "./routes/user.route";
import notificationRoutes from "./routes/notification.route";
import messageRoutes from "./routes/message.route";

dotenv.config();

const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: "http://localhost:3000",
  credentials: true,
}));

app.use(express.json());
app.use(cookieParser());

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/messages", messageRoutes);

server.listen(PORT, () => {
  console.log(`Socket.io Server listening on port ${PORT}`);
  connectDB();
});
