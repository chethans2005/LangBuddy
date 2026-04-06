"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { axiosInstance } from "@/lib/axios";
import { useNotificationStore } from "@/store/useNotificationStore";
import { FiCheck, FiX, FiBellOff, FiMessageSquare, FiClock } from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";

// Helper to format relative time
const getRelativeTime = (timestamp: string) => {
  const date = new Date(timestamp);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  
  return date.toLocaleDateString();
};

export default function NotificationsPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actioningIds, setActioningIds] = useState<Set<string>>(new Set());
  const fetchUnreadCount = useNotificationStore((s) => s.fetchCount);
  const markAsRead = useNotificationStore((s) => s.markAsRead);

  useEffect(() => {
    fetchNotifications();
  }, []);

  useEffect(() => {
    const handler = () => fetchNotifications();
    window.addEventListener("notification:received", handler as EventListener);
    return () => window.removeEventListener("notification:received", handler as EventListener);
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await axiosInstance.get("/notifications");
      // Sort unread first
      const sorted = res.data.sort((a: any, b: any) => {
        if (a.read === b.read) return 0;
        return a.read ? 1 : -1;
      });
      setNotifications(sorted);
    } catch (error) {
      toast.error("Failed to load notifications");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAction = async (id: string, action: "ACCEPT" | "DECLINE") => {
    setActioningIds((prev) => new Set(prev).add(id));
    try {
      await axiosInstance.put(`/notifications/${id}`, { action });
      toast.success(`Request ${action.toLowerCase()}ed`);
      setNotifications((prev) => prev.filter((n) => n._id !== id));
      fetchUnreadCount();
    } catch (error) {
      toast.error("An error occurred");
    } finally {
      setActioningIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  const handleDismiss = async (id: string) => {
    setActioningIds((prev) => new Set(prev).add(id));
    try {
      await axiosInstance.delete(`/notifications/${id}`);
      setNotifications((prev) => prev.filter((n) => n._id !== id));
      fetchUnreadCount();
      toast.success("Notification removed");
    } catch (error) {
      toast.error("Failed to remove notification");
    } finally {
      setActioningIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  const handleGoToChat = async (id: string, senderId: string) => {
    try {
      await markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, read: true } : n))
      );
      router.push(`/chat?userId=${senderId}`);
    } catch (error) {
      toast.error("Failed to open chat");
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-[50vh]">
        <div className="animate-spin w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto pb-12 pt-6">
      <header className="mb-10">
        <h1 className="text-4xl font-extrabold text-white mb-2 tracking-tight">Notifications</h1>
        <p className="text-zinc-400 text-lg">Manage your friend requests and messages</p>
      </header>

      {notifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 bg-[#18181b] rounded-3xl border border-white/5 shadow-xl relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/5 to-transparent pointer-events-none" />
          <div className="w-20 h-20 bg-zinc-800/50 rounded-full flex items-center justify-center mb-6 text-zinc-500 border border-white/5">
            <FiBellOff className="w-10 h-10" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">You're all caught up!</h2>
          <p className="text-zinc-400">No new notifications at the moment.</p>
        </div>
      ) : (
        <div className="space-y-4">
          <AnimatePresence>
            {notifications.map((notification) => (
              <motion.div
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95, height: 0 }}
                transition={{ duration: 0.2 }}
                key={notification._id}
                className={`p-6 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-6 shadow-lg transition-all ${
                  notification.read
                    ? "bg-[#18181b] border-white/5"
                    : "bg-gradient-to-r from-purple-500/5 to-blue-500/5 border-purple-500/30 shadow-purple-500/10"
                }`}
              >
                <div className="flex items-start space-x-4 flex-1 min-w-0">
                  <div className="relative shrink-0">
                    <div className="w-14 h-14 rounded-full bg-zinc-800 flex items-center justify-center overflow-hidden border border-white/10">
                      {notification.sender?.avatar ? (
                        <img src={notification.sender.avatar} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-xl font-bold text-zinc-400">{notification.sender?.name?.charAt(0)}</span>
                      )}
                    </div>
                    {!notification.read && (
                      <div className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-red-500 rounded-full border border-[#18181b]" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-bold text-white mb-1">
                      {notification.type === "FRIEND_REQUEST" ? (
                        <>
                          {notification.sender?.name} <span className="text-zinc-400 font-normal text-sm">wants to connect</span>
                        </>
                      ) : (
                        <>
                          {notification.sender?.name} <span className="text-zinc-400 font-normal text-sm">sent you a message</span>
                        </>
                      )}
                    </h3>
                    {notification.type === "MESSAGE" && notification.content && (
                      <p className="text-sm text-zinc-300 mb-2 line-clamp-2">{notification.content}</p>
                    )}
                    <div className="flex flex-wrap gap-2 mb-2">
                      <span className="text-xs text-zinc-500 font-medium">Native: <span className="text-purple-400">{notification.sender?.nativeLanguage}</span></span>
                      <span className="text-zinc-700 text-xs">•</span>
                      <span className="text-xs text-zinc-500 font-medium">Learning: <span className="text-emerald-400">{notification.sender?.learningLanguage}</span></span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-zinc-500">
                      <FiClock className="w-3 h-3" />
                      <span>{getRelativeTime(notification.createdAt)}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2 w-full sm:w-auto">
                  {notification.type === "FRIEND_REQUEST" ? (
                    <>
                      <button
                        onClick={() => handleAction(notification._id, "ACCEPT")}
                        disabled={actioningIds.has(notification._id)}
                        className="flex-1 sm:flex-none flex items-center justify-center space-x-2 px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl transition-all font-semibold shadow-lg shadow-emerald-500/20 active:scale-95"
                      >
                        {actioningIds.has(notification._id) ? (
                          <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                        ) : (
                          <FiCheck className="w-5 h-5" />
                        )}
                        <span>{actioningIds.has(notification._id) ? "..." : "Accept"}</span>
                      </button>
                      <button
                        onClick={() => handleAction(notification._id, "DECLINE")}
                        disabled={actioningIds.has(notification._id)}
                        className="flex-1 sm:flex-none flex items-center justify-center space-x-2 px-5 py-2.5 bg-[#27272a] hover:bg-red-500/20 disabled:opacity-50 disabled:cursor-not-allowed text-zinc-300 hover:text-red-400 rounded-xl transition-all font-medium border border-transparent hover:border-red-500/30 active:scale-95"
                      >
                        {actioningIds.has(notification._id) ? (
                          <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                        ) : (
                          <FiX className="w-5 h-5" />
                        )}
                        <span>{actioningIds.has(notification._id) ? "..." : "Decline"}</span>
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => handleGoToChat(notification._id, notification.sender._id)}
                        disabled={actioningIds.has(notification._id)}
                        className="flex-1 sm:flex-none flex items-center justify-center space-x-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl transition-all font-semibold shadow-lg shadow-blue-500/20 active:scale-95"
                      >
                        {actioningIds.has(notification._id) ? (
                          <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                        ) : (
                          <FiMessageSquare className="w-5 h-5" />
                        )}
                        <span>{actioningIds.has(notification._id) ? "..." : "Go to Chat"}</span>
                      </button>
                      <button
                        onClick={() => handleDismiss(notification._id)}
                        disabled={actioningIds.has(notification._id)}
                        className="flex-1 sm:flex-none flex items-center justify-center space-x-2 px-5 py-2.5 bg-[#27272a] hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed text-zinc-300 hover:text-white rounded-xl transition-all font-medium border border-transparent hover:border-white/20 active:scale-95"
                      >
                        <FiX className="w-5 h-5" />
                        <span>Dismiss</span>
                      </button>
                    </>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
