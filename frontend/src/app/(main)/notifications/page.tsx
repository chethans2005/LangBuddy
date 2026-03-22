"use client";

import { useEffect, useState } from "react";
import { axiosInstance } from "@/lib/axios";
import { FiCheck, FiX, FiBellOff } from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await axiosInstance.get("/notifications");
      setNotifications(res.data);
    } catch (error) {
      toast.error("Failed to load notifications");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAction = async (id: string, action: "ACCEPT" | "DECLINE") => {
    try {
      await axiosInstance.put(`/notifications/${id}`, { action });
      toast.success(`Request ${action.toLowerCase()}ed`);
      setNotifications((prev) => prev.filter((n) => n._id !== id));
    } catch (error) {
      toast.error("An error occurred");
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
        <p className="text-zinc-400 text-lg">Manage your friend requests and alerts</p>
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
                className="bg-[#18181b] p-6 rounded-2xl border border-white/5 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-6"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-14 h-14 rounded-full bg-zinc-800 flex items-center justify-center overflow-hidden border border-white/10 shrink-0">
                    {notification.sender?.avatar ? (
                      <img src={notification.sender.avatar} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-xl font-bold text-zinc-400">{notification.sender?.name?.charAt(0)}</span>
                    )}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white mb-1">
                      {notification.sender?.name} <span className="text-zinc-400 font-normal text-sm">wants to connect</span>
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      <span className="text-xs text-zinc-500 font-medium">Native: <span className="text-purple-400">{notification.sender?.nativeLanguage}</span></span>
                      <span className="text-zinc-700 text-xs">•</span>
                      <span className="text-xs text-zinc-500 font-medium">Learning: <span className="text-emerald-400">{notification.sender?.learningLanguage}</span></span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-3 w-full sm:w-auto">
                  <button
                    onClick={() => handleAction(notification._id, "ACCEPT")}
                    className="flex-1 sm:flex-none flex items-center justify-center space-x-2 px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white rounded-xl transition-all font-semibold shadow-lg shadow-emerald-500/20 active:scale-95"
                  >
                    <FiCheck className="w-5 h-5" />
                    <span>Accept</span>
                  </button>
                  <button
                    onClick={() => handleAction(notification._id, "DECLINE")}
                    className="flex-1 sm:flex-none flex items-center justify-center space-x-2 px-5 py-2.5 bg-[#27272a] hover:bg-red-500/20 text-zinc-300 hover:text-red-400 rounded-xl transition-all font-medium border border-transparent hover:border-red-500/30 active:scale-95"
                  >
                    <FiX className="w-5 h-5" />
                    <span>Decline</span>
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
