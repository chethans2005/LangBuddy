"use client";

import { useEffect } from "react";
import { useThemeStore } from "@/store/useThemeStore";

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { theme, toggleTheme: _ } = useThemeStore();

  // On mount: read saved preference from localStorage and apply it
  useEffect(() => {
    const saved = (localStorage.getItem("langbuddy-theme") as "dark" | "light") || "dark";
    // Sync Zustand store with saved value
    useThemeStore.setState({ theme: saved });
    const root = document.documentElement;
    root.classList.toggle("dark", saved === "dark");
    root.classList.toggle("light", saved === "light");
  }, []);

  // Whenever theme changes (via toggle), apply to <html>
  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("dark", theme === "dark");
    root.classList.toggle("light", theme === "light");
  }, [theme]);

  return <>{children}</>;
}
