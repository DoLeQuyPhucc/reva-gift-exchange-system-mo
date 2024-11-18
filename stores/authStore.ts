import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { User } from "@/src/shared/type";

interface AuthState {
  isAuthenticated: boolean;
  accessToken: string | null;
  userId: string | null;
  userRole: string | null;
  userData: User | null;
  setAuth: (data: {
    accessToken: string | null;
    userId: string | null;
    userRole: string | null;
  }) => void;
  setUserData: (data: User | null) => void;
  login: (data: {
    accessToken: string;
    refreshToken: string;
    userId: string;
    userRole: string;
    user: User;
  }) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: false,
  accessToken: null,
  userId: null,
  userRole: null,
  userData: null,

  setAuth: (data) =>
    set({
      isAuthenticated: !!data.accessToken && !!data.userId,
      accessToken: data.accessToken,
      userId: data.userId,
      userRole: data.userRole,
    }),

  setUserData: (data) => set({ userData: data }),

  login: async (data) => {
    try {
      await AsyncStorage.multiSet([
        ["accessToken", data.accessToken],
        ["refreshToken", data.refreshToken],
        ["userId", data.userId],
        ["userRole", data.userRole],
        ["user", JSON.stringify(data.user)],
      ]);

      set({
        isAuthenticated: true,
        accessToken: data.accessToken,
        userId: data.userId,
        userRole: data.userRole,
        userData: data.user,
      });
    } catch (error) {
      console.error("Error storing auth data:", error);
      throw error;
    }
  },

  logout: async () => {
    await AsyncStorage.multiRemove([
      "accessToken",
      "refreshToken",
      "userId",
      "userRole",
      "user",
    ]);
    set({
      isAuthenticated: false,
      accessToken: null,
      userId: null,
      userRole: null,
      userData: null,
    });
  },

  checkAuth: async () => {
    const [accessToken, userId, userRole] = await Promise.all([
      AsyncStorage.getItem("accessToken"),
      AsyncStorage.getItem("userId"),
      AsyncStorage.getItem("userRole"),
    ]);

    set({
      isAuthenticated: !!accessToken && !!userId,
      accessToken,
      userId,
      userRole,
    });
  },
}));
