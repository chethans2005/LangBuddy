"use client";

import { useState } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { FiGlobe, FiMessageCircle, FiUser } from "react-icons/fi";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { axiosInstance } from "@/lib/axios";
import toast from "react-hot-toast";

export default function OnboardingPage() {
  const [nativeLanguage, setNativeLanguage] = useState("");
  const [learningLanguage, setLearningLanguage] = useState("");
  const [bio, setBio] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const { authUser } = useAuthStore();

  const handleOnboard = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await axiosInstance.post("/auth/onboard", {
        nativeLanguage,
        learningLanguage,
        bio,
      });
      toast.success("Profile setup complete!");
      // reload to refresh global auth state
      window.location.href = "/";
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#09090b] relative overflow-hidden py-12 px-4">
      <div className="absolute top-[0%] left-[20%] w-[60%] h-[60%] bg-emerald-600/10 blur-[150px] rounded-full" />

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-lg p-8 bg-[#18181b]/80 backdrop-blur-xl border border-white/5 rounded-3xl shadow-2xl relative z-10"
      >
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-500/30">
            <FiGlobe className="w-10 h-10" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Set up your profile</h1>
          <p className="text-zinc-400">Tell us about your language preferences</p>
        </div>

        <form onSubmit={handleOnboard} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-300 ml-1">Native Language</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <FiMessageCircle className="text-zinc-500" />
              </div>
              <input
                type="text"
                required
                value={nativeLanguage}
                onChange={(e) => setNativeLanguage(e.target.value)}
                className="w-full bg-[#27272a]/50 border border-white/10 text-white rounded-xl py-3 pl-11 pr-4 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all placeholder:text-zinc-600"
                placeholder="e.g. English, Spanish"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-300 ml-1">Language You Want to Learn</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <FiMessageCircle className="text-zinc-500" />
              </div>
              <input
                type="text"
                required
                value={learningLanguage}
                onChange={(e) => setLearningLanguage(e.target.value)}
                className="w-full bg-[#27272a]/50 border border-white/10 text-white rounded-xl py-3 pl-11 pr-4 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all placeholder:text-zinc-600"
                placeholder="e.g. French, Japanese"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-300 ml-1">Short Bio</label>
            <div className="relative">
              <div className="absolute top-3 left-0 pl-4 pointer-events-none">
                <FiUser className="text-zinc-500" />
              </div>
              <textarea
                required
                rows={3}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="w-full bg-[#27272a]/50 border border-white/10 text-white rounded-xl py-3 pl-11 pr-4 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all placeholder:text-zinc-600 resize-none"
                placeholder="Hi, I want to learn French. I can help you with English!"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full mt-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold rounded-xl py-3 shadow-lg shadow-emerald-500/25 transition-all transform active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {isSubmitting ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              "Complete Setup"
            )}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
