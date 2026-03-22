import { Server } from "socket.io";
import http from "http";
import express from "express";

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

const userSocketMap: { [userId: string]: string } = {};

export const getReceiverSocketId = (receiverId: string) => {
  return userSocketMap[receiverId];
};

io.on("connection", (socket) => {
  const userId = socket.handshake.query.userId as string;

  if (userId && userId !== "undefined") {
    userSocketMap[userId] = socket.id;
  }

  io.emit("getOnlineUsers", Object.keys(userSocketMap));

  socket.on("joinGroup", (groupId: string) => {
    socket.join(groupId);
  });

  socket.on("leaveGroup", (groupId: string) => {
    socket.leave(groupId);
  });

  socket.on("disconnect", () => {
    if (userId) {
      delete userSocketMap[userId];
    }
    io.emit("getOnlineUsers", Object.keys(userSocketMap));
  });
});

export { io, server, app };
