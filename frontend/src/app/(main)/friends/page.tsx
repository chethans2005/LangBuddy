"use client";

import { useEffect, useState } from "react";
import { axiosInstance } from "@/lib/axios";
import { FiMessageSquare, FiUsers } from "react-icons/fi";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import Link from "next/link";

export default function FriendsPage() {
  const [friends, setFriends] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchFriends = async () => {
      try {
        const res = await axiosInstance.get("/users/friends");
        setFriends(res.data);
      } catch (error) {
        toast.error("Failed to load friends");
      } finally {
        setIsLoading(false);
      }
    };
    fetchFriends();
  }, []);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-[50vh]">
        <div className="animate-spin w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto pb-12 pt-6">
      <header className="mb-10">
        <h1 className="text-4xl font-extrabold text-white mb-2 tracking-tight">Your Friends</h1>
        <p className="text-zinc-400 text-lg">Connect and chat with your language partners</p>
      </header>

      {friends.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 bg-[#18181b] rounded-3xl border border-white/5 shadow-xl relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-purple-500/5 to-transparent pointer-events-none" />
          <div className="w-20 h-20 bg-zinc-800/50 rounded-full flex items-center justify-center mb-6 text-zinc-500 border border-white/5">
            <FiUsers className="w-10 h-10" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">No friends yet</h2>
          <p className="text-zinc-400 max-w-md mx-auto mb-6 text-center">Head over to the home page to discover language partners and send friend requests.</p>
          <Link href="/" className="px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white font-medium rounded-xl transition-colors shadow-lg shadow-purple-500/20 text-sm">
            Find Partners
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {friends.map((friend, idx) => (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.1, ease: "easeOut" }}
              key={friend._id}
              className="bg-[#18181b] p-6 rounded-3xl border border-white/5 hover:border-indigo-500/30 transition-all shadow-xl hover:shadow-indigo-500/10 group"
            >
              <div className="flex items-center space-x-4 mb-5">
                <div className="w-16 h-16 rounded-full bg-zinc-800 flex items-center justify-center overflow-hidden border-2 border-[#27272a] group-hover:border-indigo-500 transition-colors shadow-lg">
                  {friend.avatar ? (
                    <img src={friend.avatar} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-2xl font-bold text-zinc-400">{friend.name.charAt(0)}</span>
                  )}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">{friend.name}</h3>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className="px-2 py-0.5 bg-purple-500/10 text-purple-400 text-[10px] font-bold uppercase tracking-wider rounded border border-purple-500/20">
                      {friend.nativeLanguage}
                    </span>
                    <span className="text-zinc-600 text-xs">↔</span>
                    <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 text-[10px] font-bold uppercase tracking-wider rounded border border-emerald-500/20">
                      {friend.learningLanguage}
                    </span>
                  </div>
                </div>
              </div>

              <Link
                href={`/chat?user=${friend._id}`}
                className="w-full flex items-center justify-center space-x-2 py-3 bg-indigo-600/10 hover:bg-indigo-600 text-indigo-400 hover:text-white rounded-xl transition-all font-semibold text-sm border border-indigo-500/20 hover:border-transparent"
              >
                <FiMessageSquare className="w-4 h-4" />
                <span>Message</span>
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
