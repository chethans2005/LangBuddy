"use client";
import { useEffect } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { Toaster } from "react-hot-toast";

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const { checkAuth, isCheckingAuth } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  if (isCheckingAuth) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-[#09090b]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
        <p className="mt-4 text-zinc-400 font-medium tracking-wide animate-pulse">Initializing...</p>
      </div>
    );
  }

  return (
    <>
      {children}
      <Toaster 
        position="top-center" 
        toastOptions={{ 
          style: { background: '#18181b', color: '#fff', border: '1px solid #27272a' } 
        }} 
      />
    </>
  );
}
