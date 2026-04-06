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
  typingUsers: string[];
  typingTimeout: NodeJS.Timeout | null;

  connectSocket: () => void;
  disconnectSocket: () => void;
  setSelectedChat: (id: string | null, isGroup: boolean) => void;
  fetchMessages: (id: string, isGroup: boolean) => Promise<void>;
  sendMessage: (text: string) => Promise<void>;
  editMessage: (id: string, newText: string) => Promise<void>;
  deleteMessage: (id: string) => Promise<void>;
  addReaction: (id: string, emoji: string) => Promise<void>;
  removeReaction: (id: string, emoji: string) => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  sendTypingIndicator: () => void;
  searchMessages: (query: string) => Promise<any[]>;
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
  typingUsers: [],
  typingTimeout: null,

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
        // @ts-ignore
        window.dispatchEvent(new CustomEvent("notification:received", { detail: notification }));
      } catch (e) {
        // ignore
      }
    });
    socket.on("friendRequestHandled", (payload: any) => {
      try {
        const { action, recipient } = payload || {};
        // @ts-ignore
        window.dispatchEvent(new CustomEvent("notification:received", { detail: { type: "FRIEND_HANDLED", action, recipient } }));
      } catch (e) {
        // ignore
      }
    });
  },

  disconnectSocket: () => {
    const { socket, selectedChat, isGroupChat, typingTimeout } = get();
    if (typingTimeout) clearTimeout(typingTimeout);
    if (socket?.connected) {
      if (isGroupChat && selectedChat) {
        socket.emit("leaveGroup", selectedChat);
      }
      socket.disconnect();
    }
    set({ socket: null, onlineUsers: [], typingTimeout: null });
  },

  setSelectedChat: (id, isGroup) => {
    const { socket, selectedChat, isGroupChat, typingTimeout } = get();
    
    if (typingTimeout) clearTimeout(typingTimeout);
    
    if (isGroupChat && selectedChat && socket) {
      socket.emit("leaveGroup", selectedChat);
    }

    set({ selectedChat: id, isGroupChat: isGroup, typingUsers: [], typingTimeout: null });
    
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
    const { selectedChat, isGroupChat, messages, socket } = get();
    if (!selectedChat) return;

    try {
      // Stop typing indicator
      if (socket) {
        socket.emit("stopTyping", { conversationId: selectedChat, isGroup: isGroupChat });
      }
      set({ typingTimeout: null });

      const endpoint = isGroupChat ? `/messages/group/${selectedChat}` : `/messages/direct/${selectedChat}`;
      const res = await axiosInstance.post(endpoint, { text });
      
      if (!isGroupChat) {
        set({ messages: [...messages, res.data] });
      }
    } catch (error) {
      toast.error("Failed to send message");
    }
  },

  editMessage: async (id, newText) => {
    try {
      const res = await axiosInstance.put(`/messages/${id}`, { text: newText });
      set({
        messages: get().messages.map((m) => (m._id === id ? res.data : m)),
      });
      toast.success("Message edited");
    } catch (error) {
      toast.error("Failed to edit message");
    }
  },

  deleteMessage: async (id) => {
    try {
      await axiosInstance.delete(`/messages/${id}`);
      set({
        messages: get().messages.filter((m) => m._id !== id),
      });
      toast.success("Message deleted");
    } catch (error) {
      toast.error("Failed to delete message");
    }
  },

  addReaction: async (id, emoji) => {
    const { socket, selectedChat, isGroupChat } = get();
    try {
      const res = await axiosInstance.post(`/messages/${id}/reactions/${emoji}`);
      set({
        messages: get().messages.map((m) => (m._id === id ? res.data : m)),
      });
      if (socket) {
        socket.emit("messageReaction", { messageId: id, emoji, conversationId: selectedChat, isGroup: isGroupChat });
      }
    } catch (error) {
      // silent fail
    }
  },

  removeReaction: async (id, emoji) => {
    const { socket, selectedChat, isGroupChat } = get();
    try {
      const res = await axiosInstance.delete(`/messages/${id}/reactions/${emoji}`);
      set({
        messages: get().messages.map((m) => (m._id === id ? res.data : m)),
      });
      if (socket) {
        socket.emit("removeReaction", { messageId: id, emoji, conversationId: selectedChat, isGroup: isGroupChat });
      }
    } catch (error) {
      // silent fail
    }
  },

  markAsRead: async (id) => {
    const { socket, selectedChat, isGroupChat } = get();
    try {
      await axiosInstance.put(`/messages/${id}/read`);
      if (socket) {
        socket.emit("messageRead", { messageId: id, conversationId: selectedChat, isGroup: isGroupChat });
      }
    } catch (error) {
      // silent fail
    }
  },

  sendTypingIndicator: () => {
    const { socket, selectedChat, isGroupChat, typingTimeout } = get();
    if (!socket || !selectedChat) return;

    if (typingTimeout) clearTimeout(typingTimeout);

    socket.emit("typing", { conversationId: selectedChat, name: "User", isGroup: isGroupChat });

    const newTimeout = setTimeout(() => {
      socket.emit("stopTyping", { conversationId: selectedChat, isGroup: isGroupChat });
      set({ typingTimeout: null });
    }, 3000);

    set({ typingTimeout: newTimeout });
  },

  searchMessages: async (query) => {
    const { selectedChat, isGroupChat } = get();
    if (!selectedChat || !query.trim()) return [];

    try {
      const res = await axiosInstance.get(`/messages/search/${selectedChat}?q=${query}&isGroup=${isGroupChat}`);
      return res.data;
    } catch (error) {
      toast.error("Search failed");
      return [];
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

      const senderId = newMessage?.senderId?._id || newMessage?.senderId;
      if (!isGroupChat && senderId === selectedChat) {
        set({ messages: [...get().messages, newMessage] });
      }
    });

    // Typing indicators
    socket.on("typing", (data: any) => {
      set({
        typingUsers: [...new Set([...get().typingUsers, data.userId])],
      });
    });

    socket.on("stopTyping", (data: any) => {
      set({
        typingUsers: get().typingUsers.filter((id) => id !== data.userId),
      });
    });

    // Message edits
    socket.on("messageEdited", (data: any) => {
      set({
        messages: get().messages.map((m) => (m._id === data.messageId ? data.updatedMessage : m)),
      });
    });

    // Message deletes
    socket.on("messageDeleted", (data: any) => {
      set({
        messages: get().messages.filter((m) => m._id !== data.messageId),
      });
    });

    // Reactions
    socket.on("messageReaction", (data: any) => {
      set({
        messages: get().messages.map((m) => {
          if (m._id === data.messageId) {
            return {
              ...m,
              reactions: [...(m.reactions || []), { userId: data.userId, emoji: data.emoji }],
            };
          }
          return m;
        }),
      });
    });

    socket.on("removeReaction", (data: any) => {
      set({
        messages: get().messages.map((m) => {
          if (m._id === data.messageId) {
            return {
              ...m,
              reactions: m.reactions.filter(
                (r: any) => !(r.userId === data.userId && r.emoji === data.emoji)
              ),
            };
          }
          return m;
        }),
      });
    });

    // Read receipts
    socket.on("messageRead", (data: any) => {
      set({
        messages: get().messages.map((m) => {
          if (m._id === data.messageId) {
            return {
              ...m,
              readBy: [...(m.readBy || []), { userId: data.userId }],
            };
          }
          return m;
        }),
      });
    });
  },

  unsubscribeFromMessages: () => {
    const { socket } = get();
    if (socket) {
      socket.off("newMessage");
      socket.off("typing");
      socket.off("stopTyping");
      socket.off("messageEdited");
      socket.off("messageDeleted");
      socket.off("messageReaction");
      socket.off("removeReaction");
      socket.off("messageRead");
    }
  }
}));
