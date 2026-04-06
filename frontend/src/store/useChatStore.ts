import { create } from "zustand";
import { io, Socket } from "socket.io-client";
import { useAuthStore } from "./useAuthStore";
import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:5000";

interface ChatState {
  socket: Socket | null;
  onlineUsers: string[];
  messages: any[];
  selectedChat: string | null; 
  isGroupChat: boolean;
  isConnecting: boolean;
  isLoadingMessages: boolean;

  connectSocket: () => void;
  disconnectSocket: () => void;
  setSelectedChat: (id: string | null, isGroup: boolean) => void;
  fetchMessages: (id: string, isGroup: boolean) => Promise<void>;
  sendMessage: (text: string) => Promise<void>;
  subscribeToMessages: () => void;
  unsubscribeFromMessages: () => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  socket: null,
  onlineUsers: [],
  messages: [],
  selectedChat: null,
  isGroupChat: false,
  isConnecting: false,
  isLoadingMessages: false,

  connectSocket: () => {
    const { authUser } = useAuthStore.getState();
    if (!authUser || get().socket?.connected) return;

    set({ isConnecting: true });

    const socket = io(SOCKET_URL, {
      withCredentials: true,
    });

    socket.connect();
    set({ socket });

    socket.on("getOnlineUsers", (userIds: string[]) => {
      set({ onlineUsers: userIds });
    });

    socket.on("connect", () => {
      set({ isConnecting: false });
    });

    // listen for incoming notifications (friend requests, messages, etc.)
    socket.on("newNotification", (notification: any) => {
      try {
        // small UX: show a toast and dispatch a DOM event so interested components can refresh
        // avoid importing UI code here; use browser events and toast
        // @ts-ignore
        window.dispatchEvent(new CustomEvent("notification:received", { detail: notification }));
      } catch (e) {
        // ignore
      }
    });
    socket.on("friendRequestHandled", (payload: any) => {
      try {
        const { action, recipient } = payload || {};
        // notify the user who sent the request that it's been handled
        // @ts-ignore
        window.dispatchEvent(new CustomEvent("notification:received", { detail: { type: "FRIEND_HANDLED", action, recipient } }));
      } catch (e) {
        // ignore
      }
    });
  },

  disconnectSocket: () => {
    const { socket, selectedChat, isGroupChat } = get();
    if (socket?.connected) {
      if (isGroupChat && selectedChat) {
        socket.emit("leaveGroup", selectedChat);
      }
      socket.disconnect();
    }
    set({ socket: null, onlineUsers: [] });
  },

  setSelectedChat: (id, isGroup) => {
    const { socket, selectedChat, isGroupChat } = get();
    
    if (isGroupChat && selectedChat && socket) {
      socket.emit("leaveGroup", selectedChat);
    }

    set({ selectedChat: id, isGroupChat: isGroup });
    
    if (id) {
      if (isGroup && socket) {
        socket.emit("joinGroup", id);
      }
      get().fetchMessages(id, isGroup);
    } else {
      set({ messages: [] });
    }
  },

  fetchMessages: async (id, isGroup) => {
    set({ isLoadingMessages: true });
    try {
      const endpoint = isGroup ? `/messages/group/${id}` : `/messages/direct/${id}`;
      const res = await axiosInstance.get(endpoint);
      set({ messages: res.data });
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to fetch messages");
    } finally {
      set({ isLoadingMessages: false });
    }
  },

  sendMessage: async (text) => {
    const { selectedChat, isGroupChat, messages } = get();
    if (!selectedChat) return;

    try {
      const endpoint = isGroupChat ? `/messages/group/${selectedChat}` : `/messages/direct/${selectedChat}`;
      const res = await axiosInstance.post(endpoint, { text });
      
      if (!isGroupChat) {
        set({ messages: [...messages, res.data] });
      }
    } catch (error) {
      toast.error("Failed to send message");
    }
  },

  subscribeToMessages: () => {
    const { socket } = get();
    if (!socket) return;

     socket.on("newMessage", (newMessage: any) => {
      const { selectedChat, isGroupChat } = get();

      if (isGroupChat && newMessage.groupId === selectedChat) {
        set({ messages: [...get().messages, newMessage] });
        return;
      }

      // handle direct messages: senderId may be populated object or id string
      const senderId = newMessage?.senderId?._id || newMessage?.senderId;
      if (!isGroupChat && senderId === selectedChat) {
        set({ messages: [...get().messages, newMessage] });
      }
     });
  },

  unsubscribeFromMessages: () => {
    const { socket } = get();
    if (socket) {
      socket.off("newMessage");
    }
  }
}));
