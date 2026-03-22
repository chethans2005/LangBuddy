"use client";

import { useEffect, useState } from "react";
import { axiosInstance } from "@/lib/axios";
import { useAuthStore } from "@/store/useAuthStore";
import { FiUserPlus } from "react-icons/fi";
import { motion } from "framer-motion";
import toast from "react-hot-toast";

export default function HomePage() {
  const { authUser } = useAuthStore();
  const [partners, setPartners] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchPartners = async () => {
      try {
        const res = await axiosInstance.get("/users/recommendations");
        setPartners(res.data);
      } catch (error) {
        toast.error("Failed to fetch language partners");
      } finally {
        setIsLoading(false);
      }
    };
    fetchPartners();
  }, []);

  const handleAddFriend = async (userId: string) => {
    try {
      await axiosInstance.post(`/users/add-friend/${userId}`);
      toast.success("Friend request sent!");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Error adding friend");
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-full min-h-[50vh]">
        <div className="animate-spin w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto pb-12 pt-6">
      <header className="mb-10">
        <h1 className="text-4xl font-extrabold text-white mb-2 tracking-tight">
          Welcome back, <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-400">{authUser?.name?.split(' ')[0]}</span> 👋
        </h1>
        <p className="text-zinc-400 text-lg">Here are some language partners you might like</p>
      </header>

      {partners.length === 0 ? (
        <div className="text-center py-24 bg-[#18181b] rounded-3xl border border-white/5 shadow-xl relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-purple-500/5 to-transparent pointer-events-none" />
          <div className="w-20 h-20 bg-purple-500/10 rounded-full flex items-center justify-center mx-auto mb-6 text-purple-400 border border-purple-500/20">
            <FiUserPlus className="w-10 h-10" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">No recommendations yet</h2>
          <p className="text-zinc-400 max-w-md mx-auto">Check back later or refine your profile to discover more language partners in the LangBuddy community.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {partners.map((partner, idx) => (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1, ease: "easeOut" }}
              key={partner._id}
              className="bg-[#18181b] p-6 rounded-3xl border border-white/5 hover:border-purple-500/30 transition-all shadow-xl hover:shadow-purple-500/10 relative overflow-hidden group"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 to-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity" />
              
              <div className="flex items-start space-x-4 mb-5">
                <div className="w-16 h-16 rounded-full bg-zinc-800 flex items-center justify-center overflow-hidden border-2 border-[#27272a] group-hover:border-purple-500 transition-colors shadow-lg">
                  {partner.avatar ? (
                    <img src={partner.avatar} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-2xl font-bold text-zinc-400">{partner.name.charAt(0)}</span>
                  )}
                </div>
                <div className="flex-1 min-w-0 pt-1">
                  <h3 className="text-lg font-bold text-white truncate">{partner.name}</h3>
                  <p className="text-sm text-zinc-500 truncate" title={partner.bio}>{partner.bio || "No bio available"}</p>
                </div>
              </div>

              <div className="flex flex-col gap-2 mb-6">
                <div className="flex items-center space-x-2">
                  <span className="w-2 h-2 rounded-full bg-purple-500" />
                  <span className="text-xs text-zinc-400 font-medium">Native:</span>
                  <span className="text-sm text-white font-medium">{partner.nativeLanguage}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="text-xs text-zinc-400 font-medium">Learning:</span>
                  <span className="text-sm text-white font-medium">{partner.learningLanguage}</span>
                </div>
              </div>

              <button
                onClick={() => handleAddFriend(partner._id)}
                className="w-full flex items-center justify-center space-x-2 py-3 bg-[#27272a]/50 hover:bg-gradient-to-r hover:from-purple-600 hover:to-indigo-600 text-white rounded-xl transition-all font-semibold text-sm border border-white/5 hover:border-transparent hover:shadow-lg hover:shadow-purple-500/25"
              >
                <FiUserPlus className="w-4 h-4" />
                <span>Send Request</span>
              </button>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
