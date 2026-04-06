import { create } from "zustand";
import { axiosInstance } from "@/lib/axios";
import toast from "react-hot-toast";

interface NotificationState {
  unreadCount: number;
  fetchCount: () => Promise<void>;
  increment: () => void;
  decrement: () => void;
  reset: () => void;
  markAsRead: (id: string) => Promise<void>;
  subscribeToEvents: () => (() => void) | void;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  unreadCount: 0,
  fetchCount: async () => {
    try {
      const res = await axiosInstance.get("/notifications/count");
      set({ unreadCount: typeof res.data?.count === "number" ? res.data.count : 0 });
    } catch (e) {
      toast.error("Failed to load notifications");
    }
  },
  increment: () => set((s) => ({ unreadCount: s.unreadCount + 1 })),
  decrement: () => set((s) => ({ unreadCount: Math.max(0, s.unreadCount - 1) })),
  reset: () => set({ unreadCount: 0 }),
  markAsRead: async (id: string) => {
    try {
      await axiosInstance.put(`/notifications/${id}/read`);
      get().decrement();
    } catch (e) {
      // silent fail
    }
  },
  subscribeToEvents: () => {
    if (typeof window === "undefined") return;
    const handler = (event: Event) => {
      const detail = (event as CustomEvent)?.detail as any;
      const type = detail?.type;
      // increment only for persisted notification types
      if (type === "FRIEND_REQUEST" || type === "MESSAGE") {
        get().increment();
      }
    };
    window.addEventListener("notification:received", handler as EventListener);
    return () => window.removeEventListener("notification:received", handler as EventListener);
  },
}));
