import { create } from "zustand";
import { HubConnection, HubConnectionBuilder } from "@microsoft/signalr";
import { useAuthStore } from "./authStore";
import Toast from "react-native-toast-message";
import { Notification } from "@/src/shared/type";

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
      .withUrl("http://10.0.3.2:6969/notificationsHub")
      .withAutomaticReconnect()
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
      notifications: [notification, ...state.notifications],
    })),
}));
