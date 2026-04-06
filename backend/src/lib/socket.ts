import { Server } from "socket.io";
import http from "http";
import express from "express";
import jwt from "jsonwebtoken";
import { FRONTEND_ORIGIN, JWT_SECRET } from "./env";
import { isAllowedGroup } from "./groups";

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: FRONTEND_ORIGIN,
    methods: ["GET", "POST"],
    credentials: true,
  },
});

const parseCookies = (cookieHeader?: string) => {
  const parsed: Record<string, string> = {};
  if (!cookieHeader) return parsed;

  for (const pair of cookieHeader.split(";")) {
    const [rawKey, ...rawValue] = pair.trim().split("=");
    if (!rawKey) continue;
    parsed[rawKey] = decodeURIComponent(rawValue.join("="));
  }
  return parsed;
};

const userSocketMap: { [userId: string]: string } = {};

export const getReceiverSocketId = (receiverId: string) => {
  return userSocketMap[receiverId];
};

io.use((socket, next) => {
  try {
    const cookies = parseCookies(socket.handshake.headers.cookie);
    const token = cookies.jwt;

    if (!token) {
      return next(new Error("Unauthorized"));
    }

    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    socket.data.userId = decoded.userId;
    next();
  } catch {
    next(new Error("Unauthorized"));
  }
});

io.on("connection", (socket) => {
  const userId = socket.data.userId as string;

  if (userId && userId !== "undefined") {
    userSocketMap[userId] = socket.id;
  }

  io.emit("getOnlineUsers", Object.keys(userSocketMap));

  socket.on("joinGroup", (groupId: string) => {
    if (!isAllowedGroup(groupId)) return;
    socket.join(groupId);
  });

  socket.on("leaveGroup", (groupId: string) => {
    if (!isAllowedGroup(groupId)) return;
    socket.leave(groupId);
  });

  // Typing indicator events
  socket.on("typing", (data: { conversationId: string; name: string; isGroup?: boolean }) => {
    if (data.isGroup) {
      socket.to(data.conversationId).emit("typing", { userId, name: data.name });
    } else {
      const receiverSocketId = getReceiverSocketId(data.conversationId);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit("typing", { userId, name: data.name });
      }
    }
  });

  socket.on("stopTyping", (data: { conversationId: string; isGroup?: boolean }) => {
    if (data.isGroup) {
      socket.to(data.conversationId).emit("stopTyping", { userId });
    } else {
      const receiverSocketId = getReceiverSocketId(data.conversationId);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit("stopTyping", { userId });
      }
    }
  });

  // Message read receipt
  socket.on("messageRead", (data: { messageId: string; conversationId: string; isGroup?: boolean }) => {
    if (data.isGroup) {
      socket.to(data.conversationId).emit("messageRead", { messageId: data.messageId, userId });
    } else {
      const receiverSocketId = getReceiverSocketId(data.conversationId);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit("messageRead", { messageId: data.messageId, userId });
      }
    }
  });

  // Message reactions
  socket.on("messageReaction", (data: { messageId: string; emoji: string; conversationId: string; isGroup?: boolean }) => {
    if (data.isGroup) {
      socket.to(data.conversationId).emit("messageReaction", { messageId: data.messageId, emoji: data.emoji, userId });
    } else {
      const receiverSocketId = getReceiverSocketId(data.conversationId);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit("messageReaction", { messageId: data.messageId, emoji: data.emoji, userId });
      }
    }
  });

  socket.on("removeReaction", (data: { messageId: string; emoji: string; conversationId: string; isGroup?: boolean }) => {
    if (data.isGroup) {
      socket.to(data.conversationId).emit("removeReaction", { messageId: data.messageId, emoji: data.emoji, userId });
    } else {
      const receiverSocketId = getReceiverSocketId(data.conversationId);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit("removeReaction", { messageId: data.messageId, emoji: data.emoji, userId });
      }
    }
  });

  socket.on("disconnect", () => {
    if (userId) {
      delete userSocketMap[userId];
    }
    io.emit("getOnlineUsers", Object.keys(userSocketMap));
  });
});

export { io, server, app };
