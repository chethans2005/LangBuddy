import { create } from "zustand";
import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";

interface AuthState {
  authUser: any;
  isCheckingAuth: boolean;
  isLoggingIn: boolean;
  isSigningUp: boolean;

  checkAuth: () => Promise<void>;
  signup: (data: any) => Promise<void>;
  login: (data: any) => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  authUser: null,
  isCheckingAuth: true,
  isLoggingIn: false,
  isSigningUp: false,

  checkAuth: async () => {
    try {
      const res = await axiosInstance.get("/auth/me");
      set({ authUser: res.data });
    } catch (error) {
      set({ authUser: null });
    } finally {
      set({ isCheckingAuth: false });
    }
  },

  signup: async (data: any) => {
    set({ isSigningUp: true });
    try {
      const res = await axiosInstance.post("/auth/signup", data);
      set({ authUser: res.data });
      toast.success("Account created successfully");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "An error occurred");
    } finally {
      set({ isSigningUp: false });
    }
  },

  login: async (data: any) => {
    set({ isLoggingIn: true });
    try {
      const res = await axiosInstance.post("/auth/login", data);
      set({ authUser: res.data });
      toast.success("Logged in successfully");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "An error occurred");
    } finally {
      set({ isLoggingIn: false });
    }
  },

  logout: async () => {
    try {
      await axiosInstance.post("/auth/logout");
      set({ authUser: null });
      toast.success("Logged out successfully");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "An error occurred");
    }
  },
}));
