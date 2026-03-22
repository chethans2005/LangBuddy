import { create } from "zustand";

type Theme = "dark" | "light";

interface ThemeState {
  theme: Theme;
  toggleTheme: () => void;
}

export const useThemeStore = create<ThemeState>((set) => ({
  theme: "dark",

  toggleTheme: () =>
    set((state) => {
      const next: Theme = state.theme === "dark" ? "light" : "dark";
      if (typeof window !== "undefined") {
        localStorage.setItem("langbuddy-theme", next);
        const root = document.documentElement;
        root.classList.toggle("dark", next === "dark");
        root.classList.toggle("light", next === "light");
      }
      return { theme: next };
    }),
}));
