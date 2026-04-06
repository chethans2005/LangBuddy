import { create } from "zustand";
import { axiosInstance } from "@/lib/axios";
import toast from "react-hot-toast";

interface NotificationState {
  unreadCount: number;
  fetchCount: () => Promise<void>;
  increment: () => void;
  reset: () => void;
  subscribeToEvents: () => (() => void) | void;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  unreadCount: 0,
  fetchCount: async () => {
    try {
      const res = await axiosInstance.get("/notifications");
      set({ unreadCount: Array.isArray(res.data) ? res.data.length : 0 });
    } catch (e) {
      toast.error("Failed to load notifications");
    }
  },
  increment: () => set((s) => ({ unreadCount: s.unreadCount + 1 })),
  reset: () => set({ unreadCount: 0 }),
  subscribeToEvents: () => {
    if (typeof window === "undefined") return;
    const handler = () => get().increment();
    window.addEventListener("notification:received", handler as EventListener);
    return () => window.removeEventListener("notification:received", handler as EventListener);
  },
}));
