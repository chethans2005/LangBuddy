import { create } from "zustand";
import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";

interface AuthState {
  authUser: any;
  isCheckingAuth: boolean;
  isLoggingIn: boolean;
  isSigningUp: boolean;

  checkAuth: () => Promise<void>;
  signup: (data: any) => Promise<boolean>;
  login: (data: any) => Promise<boolean>;
  googleAuth: (token: string) => Promise<boolean>;
  updateProfile: (data: any) => Promise<boolean>;
  logout: () => Promise<boolean>;
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
      return true;
    } catch (error: any) {
      toast.error(error.response?.data?.message || "An error occurred");
      return false;
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
      return true;
    } catch (error: any) {
      toast.error(error.response?.data?.message || "An error occurred");
      return false;
    } finally {
      set({ isLoggingIn: false });
    }
  },

  googleAuth: async (token: string) => {
    try {
      const res = await axiosInstance.post("/auth/google", { token });
      set({ authUser: res.data });
      toast.success("Authenticated with Google");
      return true;
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Google auth failed");
      return false;
    }
  },

  updateProfile: async (data: any) => {
    try {
      const res = await axiosInstance.put("/auth/profile", data);
      set({ authUser: res.data });
      toast.success("Profile updated successfully");
      return true;
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to update profile");
      return false;
    }
  },

  logout: async () => {
    try {
      await axiosInstance.post("/auth/logout");
      set({ authUser: null });
      toast.success("Logged out successfully");
      return true;
    } catch (error: any) {
      toast.error(error.response?.data?.message || "An error occurred");
      return false;
    }
  },
}));
