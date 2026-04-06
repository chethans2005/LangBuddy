import { create } from "zustand";
import { axiosInstance } from "@/lib/axios";
import toast from "react-hot-toast";

interface Rating {
  fromUserId?: {
    _id: string;
    name: string;
    avatar: string;
  };
  score: number;
  comment?: string;
  createdAt: string;
}

interface RatingsData {
  avgRating: number;
  totalRatings: number;
  ratings: Rating[];
}

interface ProfileState {
  user: any | null;
  ratings: RatingsData | null;
  isLoading: boolean;
  fetchUserProfile: (userId: string) => Promise<void>;
  fetchUserRatings: (userId: string) => Promise<void>;
  updateProficiencyLevel: (userId: string, levels: any) => Promise<void>;
  addRating: (userId: string, score: number, comment: string) => Promise<void>;
  clearProfile: () => void;
}

export const useProfileStore = create<ProfileState>((set) => ({
  user: null,
  ratings: null,
  isLoading: false,

  fetchUserProfile: async (userId: string) => {
    set({ isLoading: true });
    try {
      const res = await axiosInstance.get(`/users/${userId}`);
      set({ user: res.data });
    } catch (e) {
      toast.error("Failed to load profile");
    } finally {
      set({ isLoading: false });
    }
  },

  fetchUserRatings: async (userId: string) => {
    try {
      const res = await axiosInstance.get(`/users/${userId}/ratings`);
      set({ ratings: res.data });
    } catch (e) {
      toast.error("Failed to load ratings");
    }
  },

  updateProficiencyLevel: async (userId: string, levels: any) => {
    try {
      const res = await axiosInstance.put(`/users/${userId}/profile`, {
        proficiencyLevels: levels,
      });
      set({ user: res.data });
      toast.success("Proficiency level updated");
    } catch (e) {
      toast.error("Failed to update proficiency level");
    }
  },

  addRating: async (userId: string, score: number, comment: string) => {
    try {
      await axiosInstance.post(`/users/${userId}/ratings`, { score, comment });
      await axiosInstance.get(`/users/${userId}/ratings`).then((res) => {
        set({ ratings: res.data });
      });
      toast.success("Rating submitted");
    } catch (e) {
      toast.error("Failed to submit rating");
    }
  },

  clearProfile: () => set({ user: null, ratings: null }),
}));
