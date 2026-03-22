"use client";

import { useAuthStore } from "@/store/useAuthStore";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Sidebar from "@/components/Sidebar";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const { authUser } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!authUser) {
      router.push("/login");
    } else if (!authUser.isOnboarded) {
      router.push("/onboarding");
    }
  }, [authUser, router]);

  if (!authUser || !authUser.isOnboarded) return null; // Wait for redirect

  return (
    <div className="flex min-h-screen bg-[#09090b]">
      <Sidebar />
      <main className="flex-1 ml-64 p-6 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
