"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { axiosInstance } from "@/lib/axios";
import { FiGlobe, FiUser, FiInfo, FiRefreshCw } from "react-icons/fi";
import { motion } from "framer-motion";
import toast from "react-hot-toast";

const LANGUAGES = [
  "English", "Spanish", "French", "German", "Italian", "Portuguese", 
  "Russian", "Japanese", "Korean", "Chinese", "Arabic", "Hindi", 
  "Turkish", "Dutch"
];

export default function OnboardingPage() {
  const router = useRouter();
  const [nativeLanguage, setNativeLanguage] = useState("");
  const [learningLanguage, setLearningLanguage] = useState("");
  const [otherNative, setOtherNative] = useState("");
  const [otherLearning, setOtherLearning] = useState("");
  const [bio, setBio] = useState("");
  const [avatar, setAvatar] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const generateRandomAvatar = () => {
    const randomSeed = Math.random().toString(36).substring(7);
    setAvatar(`https://api.dicebear.com/9.x/bottts-neutral/svg?seed=${randomSeed}`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const finalNative = nativeLanguage === "Other" ? otherNative : nativeLanguage;
    const finalLearning = learningLanguage === "Other" ? otherLearning : learningLanguage;

    if (!finalNative || !finalLearning) {
      toast.error("Please fill in your languages");
      return;
    }

    setIsSubmitting(true);

    try {
      await axiosInstance.post("/auth/onboard", {
        nativeLanguage: finalNative,
        learningLanguage: finalLearning,
        bio,
        avatar
      });
      toast.success("Profile setup complete!");
      window.location.href = "/";
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to save profile");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#09090b] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-[#18181b] rounded-3xl p-8 border border-white/5 shadow-2xl relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 to-indigo-500" />
        
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">Setup Profile</h1>
          <p className="text-zinc-400">Tell us a bit about yourself to get perfectly matched!</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 flex flex-col items-center">
          
          <div className="w-full flex flex-col items-center justify-center mb-2">
            <div className="w-24 h-24 rounded-full bg-zinc-800 border-2 border-white/10 overflow-hidden mb-3 relative flex items-center justify-center">
              {avatar ? (
                <img src={avatar} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <FiUser className="w-10 h-10 text-zinc-500" />
              )}
            </div>
            <button 
              type="button" 
              onClick={generateRandomAvatar}
              className="text-xs font-semibold text-purple-400 hover:text-purple-300 flex items-center gap-1 transition-colors"
            >
              <FiRefreshCw className="w-3 h-3" />
              Generate Random Avatar
            </button>
          </div>

          <div className="w-full">
            <label className="block text-sm font-medium text-zinc-300 mb-1.5 flex items-center gap-2">
              <FiGlobe className="text-zinc-500" /> Native Language
            </label>
            <select
              value={nativeLanguage}
              onChange={(e) => setNativeLanguage(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-xl bg-[#27272a]/50 border border-white/5 text-white focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50 appearance-none transition-all"
            >
              <option value="" disabled>Select your native language</option>
              {LANGUAGES.map(lang => <option key={lang} value={lang}>{lang}</option>)}
              <option value="Other">Other...</option>
            </select>
            {nativeLanguage === "Other" && (
              <input
                type="text"
                placeholder="Type your native language"
                value={otherNative}
                onChange={(e) => setOtherNative(e.target.value)}
                required
                className="w-full mt-2 px-4 py-3 rounded-xl bg-[#27272a]/50 border border-white/5 text-white focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50 transition-all"
              />
            )}
          </div>

          <div className="w-full">
            <label className="block text-sm font-medium text-zinc-300 mb-1.5 flex items-center gap-2">
              <FiGlobe className="text-zinc-500" /> Learning Language
            </label>
            <select
              value={learningLanguage}
              onChange={(e) => setLearningLanguage(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-xl bg-[#27272a]/50 border border-white/5 text-white focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 appearance-none transition-all"
            >
              <option value="" disabled>Select the language you are learning</option>
              {LANGUAGES.map(lang => <option key={lang} value={lang}>{lang}</option>)}
              <option value="Other">Other...</option>
            </select>
            {learningLanguage === "Other" && (
              <input
                type="text"
                placeholder="Type the language you are learning"
                value={otherLearning}
                onChange={(e) => setOtherLearning(e.target.value)}
                required
                className="w-full mt-2 px-4 py-3 rounded-xl bg-[#27272a]/50 border border-white/5 text-white focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all"
              />
            )}
          </div>

          <div className="w-full">
            <label className="block text-sm font-medium text-zinc-300 mb-1.5 flex items-center gap-2">
              <FiInfo className="text-zinc-500" /> Bio <span className="text-zinc-500 text-xs">(Optional)</span>
            </label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Hi! I love learning new languages..."
              rows={3}
              className="w-full px-4 py-3 rounded-xl bg-[#27272a]/50 border border-white/5 text-white placeholder:text-zinc-600 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50 transition-all resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl font-bold tracking-wide shadow-lg shadow-purple-500/25 transition-all active:scale-[0.98] mt-4 disabled:opacity-50"
          >
            {isSubmitting ? "Saving..." : "Complete Setup"}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
