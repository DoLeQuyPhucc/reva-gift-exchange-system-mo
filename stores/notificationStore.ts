import { create } from "zustand";
import { HubConnection, HubConnectionBuilder } from "@microsoft/signalr";
import { useAuthStore } from "./authStore";
import Toast from "react-native-toast-message";
import { Notification } from "@/src/shared/type";

// Constants
const SIGNALR_URL = "http://10.0.3.2:6969/notificationsHub";
const MAX_NOTIFICATIONS = 100; // Giới hạn số lượng thông báo để tránh memory leaks

// Types
interface NotificationState {
  connection: HubConnection | null;
  notifications: Notification[];
  isConnecting: boolean;
  initializeConnection: () => Promise<void>;
  disconnectSignalR: () => Promise<void>;
  setNotifications: (notifications: Notification[]) => void;
  addNotification: (notification: Notification) => void;
  clearNotifications: () => void;
}

// Helper functions
const showToast = (title: string, message: string) => {
  Toast.show({
    type: "info",
    text1: title,
    text2: message,
  });
};

export const useNotificationStore = create<NotificationState>((set, get) => ({
  connection: null,
  notifications: [],
  isConnecting: false,

  initializeConnection: async () => {
    const userId = useAuthStore.getState().userId;
    if (!userId) {
      console.warn("Cannot initialize connection: No user ID found");
      return;
    }

    // Prevent multiple connection attempts
    if (get().isConnecting || get().connection?.state === "Connected") {
      return;
    }

    set({ isConnecting: true });

    try {
      const newConnection = new HubConnectionBuilder()
        .withUrl(SIGNALR_URL, {
          // Add access token if needed
          accessTokenFactory: () => useAuthStore.getState().accessToken || "",
        })
        .withAutomaticReconnect([0, 2000, 5000, 10000, 20000]) // Retry strategy
        .build();

      // Setup connection error handling
      newConnection.onclose((error) => {
        console.error("SignalR Connection closed:", error);
        set({ connection: null, isConnecting: false });
      });

      // Setup reconnecting handler
      newConnection.onreconnecting((error) => {
        console.warn("SignalR Reconnecting:", error);
        showToast("Connection lost", "Attempting to reconnect...");
      });

      // Setup reconnected handler
      newConnection.onreconnected(async () => {
        console.log("SignalR Reconnected");
        showToast("Connection restored", "You're back online");
        
        // Rejoin notification group after reconnection
        const currentUserId = useAuthStore.getState().userId;
        if (currentUserId) {
          await newConnection.invoke("JoinNotificationGroup", currentUserId);
        }
      });

      await newConnection.start();
      console.log("SignalR Connected successfully");

      await newConnection.invoke("JoinNotificationGroup", userId);
      console.log("Joined notification group with userId:", userId);

      // Setup notification handler
      newConnection.on("ReceiveNotification", (notification: string) => {
        const notificationObj: Notification = { 
          id: Date.now().toString(), // Add unique ID
          data: notification,
          timestamp: new Date().toISOString(),
          isRead: false
        };

        get().addNotification(notificationObj);
        showToast("New Notification", notification);
      });

      set({ connection: newConnection, isConnecting: false });
    } catch (error) {
      console.error("SignalR Connection Error:", error);
      set({ isConnecting: false });
      showToast("Connection Error", "Failed to connect to notification service");
    }
  },

  disconnectSignalR: async () => {
    const { connection } = get();
    if (!connection) return;

    try {
      await connection.stop();
      console.log("SignalR Disconnected successfully");
    } catch (error) {
      console.error("Error disconnecting SignalR:", error);
    } finally {
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

// Export types for better TypeScript support
export type NotificationStore = ReturnType<typeof useNotificationStore>;