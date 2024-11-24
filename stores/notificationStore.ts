import { create } from "zustand";
import { HubConnection, HubConnectionBuilder } from "@microsoft/signalr";
import { useAuthStore } from "./authStore";
import Toast from "react-native-toast-message";
export interface Notification {
  id?: string;
  type?: string;
  data: string;
  read?: boolean;
  createdAt?: string | Date;
}

const SIGNALR_URL = "http://10.0.3.2:6900/notificationsHub";
const MAX_NOTIFICATIONS = 100; // Giới hạn số lượng thông báo để tránh memory leaks

interface NotificationState {
  connection: HubConnection | null;
  notifications: Notification[];
  initializeConnection: () => Promise<void>;
  disconnectSignalR: () => Promise<void>;
  setNotifications: (notifications: Notification[]) => void;
  addNotification: (notification: Notification) => void;
}
export const useNotificationStore = create<NotificationState>((set, get) => ({
  connection: null,
  notifications: [],
  initializeConnection: async () => {
    const userId = useAuthStore.getState().userId;
    if (!userId) return;
    const newConnection = new HubConnectionBuilder()
    .withUrl(SIGNALR_URL, {
      // Add access token if needed
      accessTokenFactory: () => useAuthStore.getState().accessToken || "",
    })
    .withAutomaticReconnect([0, 2000, 5000, 10000, 20000]) // Retry strategy
    .build();
    try {
      await newConnection.start();
      console.log("SignalR Connected!");
      await newConnection.invoke("JoinNotificationGroup", userId);
      console.log("Joined notification group with userId:", userId);
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
      notifications: [notification, ...state.notifications].slice(0, MAX_NOTIFICATIONS),
    })),

  clearNotifications: () => set({ notifications: [] }),
}));