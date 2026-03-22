"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import { axiosInstance } from "@/lib/axios";
import { FiHome, FiUsers, FiMessageSquare, FiBell, FiLogOut, FiSearch, FiEdit3, FiRefreshCw, FiUserPlus, FiMessageCircle, FiX, FiSun, FiMoon } from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { useThemeStore } from "@/store/useThemeStore";

const LANGUAGES = [
  "🇬🇧 English", "🇪🇸 Spanish", "🇫🇷 French", "🇩🇪 German", "🇮🇹 Italian", "🇵🇹 Portuguese", 
  "🇷🇺 Russian", "🇯🇵 Japanese", "🇰🇷 Korean", "🇨🇳 Chinese", "🇸🇦 Arabic", "🇮🇳 Hindi", 
  "🇹🇷 Turkish", "🇳🇱 Dutch", "Other"
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { logout, authUser, updateProfile } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();
  
  // Search State
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  
  // Modals
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);

  // Edit Profile State
  const [editData, setEditData] = useState({
    name: "", bio: "", avatar: "", nativeLanguage: "", learningLanguage: ""
  });

  useEffect(() => {
    if (authUser) {
      setEditData({
        name: authUser.name || "",
        bio: authUser.bio || "",
        avatar: authUser.avatar || "",
        nativeLanguage: authUser.nativeLanguage || "",
        learningLanguage: authUser.learningLanguage || "",
      });
    }
  }, [authUser, isProfileOpen]);

  // Handle Search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    const delay = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await axiosInstance.get(`/users/search?q=${searchQuery}`);
        setSearchResults(res.data);
      } catch (error) {
        console.error("Search failed", error);
      } finally {
        setIsSearching(false);
      }
    }, 500);
    return () => clearTimeout(delay);
  }, [searchQuery]);

  const handleShuffleAvatar = () => {
    const randomSeed = Math.random().toString(36).substring(7);
    setEditData({ ...editData, avatar: `https://api.dicebear.com/9.x/bottts-neutral/svg?seed=${randomSeed}` });
  };

  const handleUpdateProfile = async (e: any) => {
    e.preventDefault();
    await updateProfile(editData);
    setIsProfileOpen(false);
  };

  const sendFriendRequest = async (targetId: string) => {
    try {
      await axiosInstance.post("/users/add-friend", { targetId });
      toast.success("Friend request sent!");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to send request");
    }
  };

  const links = [
    { name: "Home", href: "/", icon: FiHome },
    { name: "Friends", href: "/friends", icon: FiUsers },
    { name: "Chat", href: "/chat", icon: FiMessageSquare },
    { name: "Notifications", href: "/notifications", icon: FiBell },
  ];

  return (
    <>
      <div className="w-64 h-screen bg-[#18181b] border-r border-white/5 flex flex-col p-4 fixed left-0 top-0 text-zinc-300 z-40 shadow-2xl overflow-y-auto custom-scrollbar">
        <div className="flex items-center space-x-3 px-4 py-6 mb-2">
          <img src="/logo.png" alt="LangBuddy" className="w-8 h-8 rounded-lg object-cover shadow-lg shadow-purple-500/30" />
          <span className="text-xl font-extrabold text-white tracking-tight">LangBuddy</span>
        </div>

        {/* Global Search */}
        <div className="relative px-2 mb-6 z-50">
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#27272a]/50 border border-white/5 text-sm text-white rounded-xl py-2 pl-9 pr-3 focus:outline-none focus:ring-1 focus:ring-purple-500/50 transition-all placeholder:text-zinc-600"
            />
          </div>
          
          {/* Search Dropdown */}
          <AnimatePresence>
            {searchQuery && (
              <motion.div
                initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }}
                className="absolute top-full left-2 right-2 mt-2 bg-[#27272a] border border-white/10 rounded-xl shadow-2xl overflow-hidden max-h-60 overflow-y-auto custom-scrollbar"
              >
                {isSearching ? (
                  <div className="p-4 text-center text-xs text-zinc-500">Searching...</div>
                ) : searchResults.length > 0 ? (
                  searchResults.map((u: any) => (
                    <div 
                      key={u._id} 
                      onClick={() => { setSelectedUser(u); setSearchQuery(""); }}
                      className="flex items-center space-x-3 p-3 hover:bg-white/5 cursor-pointer transition-colors"
                    >
                      <img src={u.avatar || `https://api.dicebear.com/9.x/bottts-neutral/svg?seed=${u._id}`} alt="avatar" className="w-8 h-8 rounded-full bg-zinc-800 object-cover" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-white truncate">{u.name}</p>
                        <p className="text-xs text-zinc-400 truncate">{u.nativeLanguage} → {u.learningLanguage}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-4 text-center text-xs text-zinc-500">No users found.</div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <nav className="flex-1 space-y-2">
          {links.map((link) => {
            const isActive = pathname === link.href || (link.href !== "/" && pathname.startsWith(link.href));
            return (
              <Link
                key={link.name}
                href={link.href}
                className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all font-medium ${
                  isActive 
                    ? "bg-purple-500/10 text-purple-400 border border-purple-500/20 shadow-sm" 
                    : "hover:bg-[#27272a]/50 hover:text-white border border-transparent"
                }`}
              >
                <link.icon className={`w-5 h-5 ${isActive ? "text-purple-400" : "text-zinc-500"}`} />
                <span>{link.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto pt-4 border-t border-white/5 space-y-2">
          {/* Edit Profile Entry */}
          <button
            onClick={() => setIsProfileOpen(true)}
            className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl hover:bg-[#27272a]/50 transition-all font-medium text-zinc-300 hover:text-white text-left group"
          >
            <div className="w-10 h-10 flex-shrink-0 rounded-full bg-[#27272a] flex items-center justify-center overflow-hidden border border-white/10 group-hover:border-purple-500/50 transition-colors relative">
              {authUser?.avatar ? (
                <img src={authUser.avatar} alt="avatar" className="w-full h-full object-cover" />
              ) : (
                <span className="text-zinc-400 font-bold">{authUser?.name?.charAt(0).toUpperCase()}</span>
              )}
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <FiEdit3 className="w-4 h-4 text-white" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate">{authUser?.name}</p>
              <p className="text-xs text-zinc-500 truncate">Edit Profile</p>
            </div>
          </button>
          
          <button
            onClick={toggleTheme}
            title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
            className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl hover:bg-[#27272a]/50 transition-all font-medium text-zinc-400 hover:text-white"
          >
            {theme === "dark" ? <FiSun className="w-5 h-5" /> : <FiMoon className="w-5 h-5" />}
            <span>{theme === "dark" ? "Light Mode" : "Dark Mode"}</span>
          </button>

          <button
            onClick={logout}
            className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-red-500/80 hover:text-red-400 hover:bg-red-500/10 transition-all font-medium border border-transparent hover:border-red-500/20"
          >
            <FiLogOut className="w-5 h-5" />
            <span>Log Out</span>
          </button>
        </div>
      </div>

      {/* Edit Profile Modal */}
      <AnimatePresence>
        {isProfileOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={(e) => e.target === e.currentTarget && setIsProfileOpen(false)}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-[#18181b] border border-white/10 rounded-3xl p-6 shadow-2xl relative"
            >
              <button 
                onClick={() => setIsProfileOpen(false)}
                className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-white bg-white/5 rounded-full hover:bg-white/10 transition-colors"
              >
                <FiX />
              </button>
              
              <h2 className="text-2xl font-bold text-white mb-6">Edit Profile</h2>
              
              <form onSubmit={handleUpdateProfile} className="space-y-4">
                <div className="flex flex-col items-center">
                  <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-white/10 mb-2">
                    <img src={editData.avatar} alt="Avatar" className="w-full h-full object-cover" />
                  </div>
                  <button type="button" onClick={handleShuffleAvatar} className="flex items-center gap-2 text-sm text-purple-400 hover:text-purple-300 font-medium">
                    <FiRefreshCw className="w-3 h-3" /> Shuffle Avatar
                  </button>
                </div>

                <div>
                  <label className="text-xs font-medium text-zinc-400 ml-1">Name</label>
                  <input type="text" value={editData.name} onChange={e => setEditData({...editData, name: e.target.value})} className="w-full mt-1 bg-[#27272a]/50 border border-white/5 text-white rounded-xl py-2.5 px-3 focus:outline-none focus:border-purple-500/50" />
                </div>

                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="text-xs font-medium text-zinc-400 ml-1">Native Language</label>
                    <select value={editData.nativeLanguage} onChange={e => setEditData({...editData, nativeLanguage: e.target.value})} className="w-full mt-1 bg-[#27272a]/50 border border-white/5 text-white rounded-xl py-2.5 px-3 focus:outline-none focus:border-purple-500/50 appearance-none">
                      {LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
                    </select>
                  </div>
                  <div className="flex-1">
                    <label className="text-xs font-medium text-zinc-400 ml-1">Learning Language</label>
                    <select value={editData.learningLanguage} onChange={e => setEditData({...editData, learningLanguage: e.target.value})} className="w-full mt-1 bg-[#27272a]/50 border border-white/5 text-white rounded-xl py-2.5 px-3 focus:outline-none focus:border-indigo-500/50 appearance-none">
                      {LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-zinc-400 ml-1">Bio</label>
                  <textarea value={editData.bio} onChange={e => setEditData({...editData, bio: e.target.value})} className="w-full mt-1 bg-[#27272a]/50 border border-white/5 text-white rounded-xl py-2.5 px-3 focus:outline-none focus:border-purple-500/50 resize-none h-20" />
                </div>

                <button type="submit" className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold rounded-xl py-3 mt-4 shadow-lg active:scale-[0.98] transition-all">
                  Save Changes
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Searched User Profile Modal */}
      <AnimatePresence>
        {selectedUser && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={(e) => e.target === e.currentTarget && setSelectedUser(null)}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-sm bg-[#18181b] border border-white/10 rounded-3xl p-6 shadow-2xl relative text-center"
            >
              <button onClick={() => setSelectedUser(null)} className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-white bg-white/5 rounded-full hover:bg-white/10 transition-colors"><FiX /></button>
              
              <img src={selectedUser.avatar || `https://api.dicebear.com/9.x/bottts-neutral/svg?seed=${selectedUser._id}`} alt="avatar" className="w-24 h-24 rounded-full mx-auto mb-4 border-4 border-[#27272a] object-cover bg-zinc-800" />
              <h2 className="text-2xl font-bold text-white tracking-tight">{selectedUser.name}</h2>
              <div className="flex items-center justify-center gap-2 mt-2 font-medium text-sm">
                <span className="bg-purple-500/10 text-purple-400 border border-purple-500/20 px-3 py-1 rounded-full">{selectedUser.nativeLanguage}</span>
                <span className="text-zinc-500">→</span>
                <span className="bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-3 py-1 rounded-full">{selectedUser.learningLanguage}</span>
              </div>
              <p className="text-zinc-400 mt-4 text-sm">{selectedUser.bio || "No bio available."}</p>
              
              <div className="flex gap-3 mt-6">
                <button onClick={() => sendFriendRequest(selectedUser._id)} className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl py-3 font-semibold flex items-center justify-center gap-2 shadow-lg transition-all active:scale-[0.98]">
                  <FiUserPlus /> Add Friend
                </button>
                <button onClick={() => { setSelectedUser(null); router.push(`/chat?user=${selectedUser._id}`); }} className="flex-1 bg-[#27272a] hover:bg-[#3f3f46] border border-white/5 text-white rounded-xl py-3 font-semibold flex items-center justify-center gap-2 transition-all active:scale-[0.98]">
                  <FiMessageCircle /> Message
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
