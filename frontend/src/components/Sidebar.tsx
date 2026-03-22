"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import { FiHome, FiUsers, FiMessageSquare, FiBell, FiLogOut } from "react-icons/fi";

export default function Sidebar() {
  const pathname = usePathname();
  const { logout, authUser } = useAuthStore();

  const links = [
    { name: "Home", href: "/", icon: FiHome },
    { name: "Friends", href: "/friends", icon: FiUsers },
    { name: "Chat", href: "/chat", icon: FiMessageSquare },
    { name: "Notifications", href: "/notifications", icon: FiBell },
  ];

  return (
    <div className="w-64 h-screen bg-[#18181b] border-r border-white/5 hidden md:flex flex-col p-4 fixed left-0 top-0 text-zinc-300 z-50 shadow-2xl">
      <div className="flex items-center space-x-3 px-4 py-6 mb-4">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-purple-500 to-indigo-500 flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-purple-500/30">L</div>
        <span className="text-xl font-extrabold text-white tracking-tight">LangBuddy</span>
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

      <div className="mt-auto px-4 py-4 border-t border-white/5">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-[#27272a] flex items-center justify-center overflow-hidden border border-white/10">
            {authUser?.avatar ? (
              <img src={authUser.avatar} alt="avatar" className="w-full h-full object-cover" />
            ) : (
              <span className="text-zinc-400 font-bold">{authUser?.name?.charAt(0).toUpperCase()}</span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white truncate">{authUser?.name}</p>
            <p className="text-xs text-zinc-500 truncate">{authUser?.email}</p>
          </div>
        </div>
        <button
          onClick={logout}
          className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-red-500/80 hover:text-red-400 hover:bg-red-500/10 transition-all font-medium border border-transparent hover:border-red-500/20"
        >
          <FiLogOut className="w-5 h-5" />
          <span>Log Out</span>
        </button>
      </div>
    </div>
  );
}
