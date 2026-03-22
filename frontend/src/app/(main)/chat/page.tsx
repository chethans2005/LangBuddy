"use client";

import { useEffect, useState, useRef } from "react";
import { useChatStore } from "@/store/useChatStore";
import { useAuthStore } from "@/store/useAuthStore";
import { axiosInstance } from "@/lib/axios";
import { FiSend, FiGlobe, FiMessageSquare, FiUserPlus, FiX } from "react-icons/fi";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";

const LANGUAGES = [
  "English", "Spanish", "French", "German", "Italian", "Portuguese", 
  "Russian", "Japanese", "Korean", "Chinese", "Arabic", "Hindi", 
  "Turkish", "Dutch"
];

export default function ChatPage() {
  const { authUser } = useAuthStore();
  const { 
    messages, selectedChat, isGroupChat, isLoadingMessages, 
    setSelectedChat, sendMessage, subscribeToMessages, unsubscribeFromMessages,
    connectSocket, disconnectSocket, onlineUsers 
  } = useChatStore();

  const [text, setText] = useState("");
  const [friends, setFriends] = useState<any[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [requestLang, setRequestLang] = useState("");

  useEffect(() => {
    connectSocket();
    return () => disconnectSocket();
  }, [connectSocket, disconnectSocket]);

  useEffect(() => {
    const fetchFriends = async () => {
      try {
        const res = await axiosInstance.get("/users/friends");
        setFriends(res.data);
      } catch (err) {}
    };
    fetchFriends();
  }, []);

  useEffect(() => {
    if (selectedChat) {
      subscribeToMessages();
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
    return () => unsubscribeFromMessages();
  }, [selectedChat, subscribeToMessages, unsubscribeFromMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    await sendMessage(text.trim());
    setText("");
  };

  const handleAddFriend = async (userId: string) => {
    try {
      await axiosInstance.post(`/users/add-friend/${userId}`);
      toast.success("Friend request sent!");
      setSelectedUser(null);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Error adding friend");
    }
  };

  const handleDirectMessage = (user: any) => {
    setSelectedUser(null);
    setSelectedChat(user._id, false);
  };

  const isFriend = (userId: string) => {
    return friends.some((f) => f._id === userId);
  };

  const handleRequestGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!requestLang.trim()) return;
    try {
      await axiosInstance.post("/users/request-language", { language: requestLang });
      toast.success("Request sent to admin!");
      setShowRequestModal(false);
      setRequestLang("");
    } catch (err: any) {
      toast.error("Failed to send request");
    }
  };

  return (
    <div className="flex h-[calc(100vh-3rem)] rounded-2xl overflow-hidden border border-white/5 shadow-2xl bg-[#09090b] relative">
      
      <div className="w-72 bg-[#18181b] border-r border-white/5 flex flex-col shrink-0">
        <div className="p-4 border-b border-white/5 flex items-center justify-between">
          <h2 className="text-xl font-bold text-white tracking-tight">Chats</h2>
        </div>
        
        <div className="flex-1 overflow-y-auto w-full custom-scrollbar">
          <div className="p-3">
            <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2 px-2">Language Groups</h3>
            <div className="space-y-1">
              {LANGUAGES.map((lang) => {
                const isActive = selectedChat === lang && isGroupChat;
                return (
                  <button
                    key={lang}
                    onClick={() => setSelectedChat(lang, true)}
                    className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl transition-all ${
                      isActive ? "bg-purple-600 border border-purple-500/50 shadow-md shadow-purple-500/20" : "hover:bg-[#27272a] border border-transparent"
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isActive ? "bg-white/20 text-white" : "bg-purple-500/10 text-purple-400"}`}>
                      <FiGlobe className="w-4 h-4" />
                    </div>
                    <span className={`font-medium ${isActive ? "text-white" : "text-zinc-300"}`}>{lang}</span>
                  </button>
                );
              })}
            </div>
            
            <div className="mt-3">
              <button
                onClick={() => setShowRequestModal(true)}
                className="w-full py-2.5 rounded-xl border border-white/10 hover:bg-white/5 transition-colors text-xs font-semibold text-zinc-400 hover:text-white"
              >
                + Request New Language
              </button>
            </div>
          </div>

          <div className="h-px bg-white/5 mx-4 my-2" />

          <div className="p-3">
             <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2 px-2">Direct Messages</h3>
             {friends.length === 0 ? (
               <p className="text-xs text-zinc-500 px-2">No friends yet. Add one from a group!</p>
             ) : (
               <div className="space-y-1">
                {friends.map((friend) => {
                  const isActive = selectedChat === friend._id && !isGroupChat;
                  const isOnline = onlineUsers.includes(friend._id);
                  return (
                    <button
                      key={friend._id}
                      onClick={() => setSelectedChat(friend._id, false)}
                      className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl transition-all ${
                        isActive ? "bg-indigo-600 border border-indigo-500/50 shadow-md shadow-indigo-500/20" : "hover:bg-[#27272a] border border-transparent"
                      }`}
                    >
                      <div className="relative">
                        <div className="w-8 h-8 rounded-full overflow-hidden bg-zinc-800 shrink-0 border border-white/10">
                          {friend.avatar ? (
                            <img src={friend.avatar} alt="avatar" className="w-full h-full object-cover" />
                          ) : (
                            <span className="flex items-center justify-center h-full text-zinc-400 font-bold text-sm">
                              {friend.name.charAt(0)}
                            </span>
                          )}
                        </div>
                        {isOnline && (
                          <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-[#18181b]" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0 text-left">
                        <p className={`text-sm font-medium truncate ${isActive ? "text-white" : "text-zinc-300"}`}>{friend.name}</p>
                      </div>
                    </button>
                  );
                })}
               </div>
             )}
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col bg-[#09090b] relative">
        {!selectedChat ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
             <div className="w-24 h-24 bg-purple-500/10 rounded-full flex items-center justify-center text-purple-500 mb-6 border border-purple-500/20">
               <FiMessageSquare className="w-12 h-12" />
             </div>
             <h2 className="text-2xl font-bold text-white mb-2">Select a chat</h2>
             <p className="text-zinc-400 max-w-md">Choose a language group to practice with others or send a direct message to a friend.</p>
          </div>
        ) : (
           <>
             <div className="h-16 border-b border-white/5 bg-[#18181b]/50 backdrop-blur-md flex items-center px-6 sticky top-0 z-10">
               <div className="flex items-center space-x-3">
                 {isGroupChat ? (
                   <>
                     <div className="w-10 h-10 rounded-xl bg-purple-500 flex items-center justify-center text-white shadow-lg shadow-purple-500/20">
                       <FiGlobe className="w-5 h-5" />
                     </div>
                     <div>
                       <h2 className="text-lg font-bold text-white">{selectedChat} Chat</h2>
                       <p className="text-xs text-emerald-400 font-medium">Community Group</p>
                     </div>
                   </>
                 ) : (
                   (() => {
                     const friend = friends.find(f => f._id === selectedChat);
                     return friend ? (
                       <>
                         <div className="w-10 h-10 rounded-full overflow-hidden bg-zinc-800 border border-white/10">
                           {friend.avatar ? (
                             <img src={friend.avatar} className="w-full h-full object-cover" />
                           ) : (
                             <span className="flex items-center justify-center h-full text-zinc-400 font-bold text-lg">{friend.name.charAt(0)}</span>
                           )}
                         </div>
                         <div>
                           <h2 className="text-lg font-bold text-white">{friend.name}</h2>
                           <p className={`text-xs font-medium ${onlineUsers.includes(friend._id) ? "text-emerald-400" : "text-zinc-500"}`}>
                             {onlineUsers.includes(friend._id) ? "Online" : "Offline"}
                           </p>
                         </div>
                       </>
                     ) : (
                       <h2 className="text-lg font-bold text-white">Loading...</h2>
                     )
                   })()
                 )}
               </div>
             </div>

             <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-gradient-to-b from-[#09090b] to-[#18181b]/30">
                {isLoadingMessages ? (
                  <div className="flex justify-center items-center h-full">
                    <div className="animate-spin w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full" />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-zinc-500">
                    <p>No messages yet. Be the first to say hi!</p>
                  </div>
                ) : (
                  messages.map((message, idx) => {
                    const isMe = message.senderId._id === authUser?._id;
                    const showAvatar = isGroupChat && !isMe;
                    return (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2 }}
                        key={idx} 
                        className={`flex ${isMe ? "justify-end" : "justify-start"} w-full group`}
                      >
                        <div className={`flex max-w-[70%] ${isMe ? "flex-row-reverse" : "flex-row"} items-end gap-2`}>
                          
                          {showAvatar && (
                            <button 
                              onClick={() => setSelectedUser(message.senderId)}
                              className="w-8 h-8 rounded-full overflow-hidden bg-zinc-800 shrink-0 border border-white/10 hover:border-purple-500 transition-colors mb-1"
                            >
                              {message.senderId.avatar ? (
                                <img src={message.senderId.avatar} className="w-full h-full object-cover" />
                              ) : (
                                <span className="flex items-center justify-center h-full text-zinc-400 font-bold text-xs">{message.senderId.name?.charAt(0)}</span>
                              )}
                            </button>
                          )}

                          <div className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                            {showAvatar && (
                              <span className="text-xs text-zinc-500 mb-1 ml-1 cursor-pointer hover:underline" onClick={() => setSelectedUser(message.senderId)}>
                                {message.senderId.name}
                              </span>
                            )}
                            <div 
                              className={`px-4 py-2.5 rounded-2xl text-sm shadow-sm ${
                                isMe 
                                  ? "bg-purple-600 text-white rounded-br-sm" 
                                  : "bg-[#27272a] text-zinc-200 rounded-bl-sm border border-white/5"
                              }`}
                            >
                              {message.text}
                            </div>
                            <span className="text-[10px] text-zinc-500 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              {format(new Date(message.createdAt), "h:mm a")}
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    )
                  })
                )}
                <div ref={messagesEndRef} />
             </div>

             <div className="p-4 bg-[#18181b]/50 backdrop-blur-md border-t border-white/5 pb-6">
                <form onSubmit={handleSend} className="flex items-center gap-3 w-full bg-[#27272a]/50 p-2 rounded-2xl border border-white/10 focus-within:border-purple-500/50 focus-within:ring-1 focus-within:ring-purple-500/50 transition-all">
                  <input
                    type="text"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Message..."
                    className="flex-1 bg-transparent border-none text-white px-3 py-1 focus:outline-none text-sm placeholder:text-zinc-500"
                  />
                  <button 
                    type="submit" 
                    disabled={!text.trim()}
                    className="w-10 h-10 rounded-xl bg-purple-600 hover:bg-purple-500 flex items-center justify-center text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md active:scale-95"
                  >
                    <FiSend className="w-4 h-4" />
                  </button>
                </form>
             </div>
           </>
        )}
      </div>

      <AnimatePresence>
        {selectedUser && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedUser(null)}
          >
            <motion.div 
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[#18181b] border border-white/10 rounded-3xl p-6 w-full max-w-sm shadow-2xl relative"
            >
              <button 
                onClick={() => setSelectedUser(null)}
                className="absolute top-4 right-4 text-zinc-500 hover:text-white transition-colors bg-white/5 rounded-full p-1"
              >
                <FiX className="w-5 h-5" />
              </button>
              
              <div className="flex flex-col items-center mb-6 mt-4">
                <div className="w-24 h-24 rounded-full bg-zinc-800 flex items-center justify-center overflow-hidden border-4 border-[#27272a] shadow-xl mb-4">
                  {selectedUser.avatar ? (
                    <img src={selectedUser.avatar} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-3xl font-bold text-zinc-400">{selectedUser.name?.charAt(0)}</span>
                  )}
                </div>
                <h3 className="text-2xl font-bold text-white">{selectedUser.name}</h3>
                <div className="flex items-center gap-2 mt-3 bg-white/5 py-1 px-3 rounded-full border border-white/10 text-xs font-medium">
                  <span className="text-purple-400">{selectedUser.nativeLanguage}</span>
                  <span className="text-zinc-500">↔</span>
                  <span className="text-emerald-400">{selectedUser.learningLanguage}</span>
                </div>
              </div>

              {selectedUser.bio && (
                <div className="bg-white/5 rounded-2xl p-4 mb-6 border border-white/5">
                  <p className="text-sm text-zinc-300 text-center italic">"{selectedUser.bio}"</p>
                </div>
              )}

              {selectedUser._id !== authUser?._id && (
                isFriend(selectedUser._id) ? (
                  <button
                    onClick={() => handleDirectMessage(selectedUser)}
                    className="w-full flex items-center justify-center space-x-2 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition-all font-semibold shadow-lg shadow-indigo-500/25 active:scale-95"
                  >
                    <FiMessageSquare />
                    <span>Send Message</span>
                  </button>
                ) : (
                  <button
                    onClick={() => handleAddFriend(selectedUser._id)}
                    className="w-full flex items-center justify-center space-x-2 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl transition-all font-semibold shadow-lg shadow-emerald-500/25 active:scale-95"
                  >
                    <FiUserPlus />
                    <span>Add Friend</span>
                  </button>
                )
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showRequestModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowRequestModal(false)}
          >
            <motion.form 
              onSubmit={handleRequestGroup}
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[#18181b] border border-white/10 rounded-3xl p-6 w-full max-w-sm shadow-2xl relative"
            >
              <button 
                type="button"
                onClick={() => setShowRequestModal(false)}
                className="absolute top-4 right-4 text-zinc-500 hover:text-white transition-colors bg-white/5 rounded-full p-1"
              >
                <FiX className="w-5 h-5" />
              </button>

              <div className="mb-6 mt-2">
                <div className="w-12 h-12 bg-indigo-500/20 text-indigo-400 rounded-2xl flex items-center justify-center mb-4 border border-indigo-500/20">
                  <FiGlobe className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Request New Language</h3>
                <p className="text-sm text-zinc-400">Can't find your target language? Request the admin to add it to the community groups.</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1">Language Name</label>
                  <input 
                    type="text" 
                    value={requestLang}
                    onChange={(e) => setRequestLang(e.target.value)}
                    required
                    placeholder="e.g. Swedish, Greek..."
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-zinc-600 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all"
                  />
                </div>
                
                <button
                  type="submit"
                  disabled={!requestLang.trim()}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition-all font-semibold shadow-lg shadow-indigo-500/25 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed mt-2"
                >
                  Send Request
                </button>
              </div>
            </motion.form>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
