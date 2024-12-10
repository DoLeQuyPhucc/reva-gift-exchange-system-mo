import { create } from "zustand";
import { HubConnection, HubConnectionBuilder } from "@microsoft/signalr";
import { useAuthStore } from "./authStore";
import Toast from "react-native-toast-message";
import axiosInstance from "../api/axiosInstance";
export interface Notification {
  id?: string;
  type?: string;
  data: string;
  read?: boolean;
  createdAt?: string | Date;
}

const SIGNALR_URL = "http://103.142.139.142:6900/notificationsHub";
const MAX_NOTIFICATIONS = 100; // Giới hạn số lượng thông báo để tránh memory leaks

interface NotificationState {
  connection: HubConnection | null;
  notifications: Notification[];
  initializeConnection: () => Promise<void>;
  disconnectSignalR: () => Promise<void>;
  setNotifications: (notifications: Notification[]) => void;
  addNotification: (notification: Notification) => void;
  fetchInitialNotifications: () => Promise<void>;
}
export const useNotificationStore = create<NotificationState>((set, get) => ({
  connection: null,
  notifications: [],
  initializeConnection: async () => {
    const userId = useAuthStore.getState().userId;
    if (!userId) return;
    const newConnection = new HubConnectionBuilder()
      .withUrl(SIGNALR_URL, {
        accessTokenFactory: () => useAuthStore.getState().accessToken || "",
      })
      .withAutomaticReconnect([0, 2000, 5000, 10000, 20000])
      .build();
    try {
      await newConnection.start();

      await newConnection.invoke("JoinNotificationGroup", userId);

      await get().fetchInitialNotifications();

      newConnection.on("ReceiveNotification", (notification: string) => {
        const notificationObj: Notification = { data: notification };
        get().addNotification(notificationObj);
        Toast.show({
          type: "info",
          text1: "You have new Notification",
          text2: notification,
        });
      });
      set({ connection: newConnection });
    } catch (error) {
      console.error("SignalR Connection Error:", error);
    }
  },
  disconnectSignalR: async () => {
    const connection = get().connection;
    if (connection) {
      await connection.stop();
      set({ connection: null });
    }
  },
  setNotifications: (notifications) => set({ notifications }),
  addNotification: (notification) =>
    set((state) => ({
      notifications: [
        {
          ...notification,
          read: false,
          createdAt: new Date(),
        },
        ...state.notifications,
      ].slice(0, MAX_NOTIFICATIONS),
    })),
  fetchInitialNotifications: async () => {
    try {
      const response = await axiosInstance.get("notification/all");
      if (response.data.isSuccess) {
        set({ notifications: response.data.data });
      }
    } catch (error) {
      console.error("Error fetching initial notifications:", error);
    }
  },
  clearNotifications: () => set({ notifications: [] }),
}));
