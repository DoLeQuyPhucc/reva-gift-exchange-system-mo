import { create } from "zustand";
import { HubConnection, HubConnectionBuilder } from "@microsoft/signalr";
import { useAuthStore } from "./authStore";
import Toast from "react-native-toast-message";
import axiosInstance from "../api/axiosInstance";
import { API_GET_ALL_NOTIFICATION, API_SIGNALR_URL } from "@env";
import { useNavigation } from "../hooks/useNavigation";

export interface Notification {
  id: string;
  type: string;
  data: string;
  read: boolean;
  createdAt: string | Date;
  status: string;
}

export interface NotificationData {
  entityId: string;
  type: string;
  message: string;
  title: string;
  entity: string;
}

export interface NotificationResponse {
  isSuccess: boolean;
  code: number;
  message: string;
  data: {
    totalItems: number;
    pageSize: number;
    currentPage: number;
    totalPage: number;
    data: Notification[];
  };
}

const MAX_NOTIFICATIONS = 100;

interface NotificationState {
  connection: HubConnection | null;
  notifications: Notification[];
  initializeConnection: () => Promise<void>;
  disconnectSignalR: () => Promise<void>;
  setNotifications: (notifications: Notification[]) => void;
  addNotification: (notification: Notification) => void;
  fetchInitialNotifications: (
    pageIndex: number,
    sizeIndex: number
  ) => Promise<void>;
  clearNotifications: () => void;
  sendNotification: (userId: string, data: NotificationData) => Promise<void>;
}

let navigationRef: any = null;

export const setNavigationRef = (ref: any) => {
  navigationRef = ref;
};

export const useNotificationStore = create<NotificationState>((set, get) => ({
  connection: null,
  notifications: [],
  initializeConnection: async () => {
    const userId = useAuthStore.getState().userId;
    if (!userId) return;
    const newConnection = new HubConnectionBuilder()
      .withUrl(`${API_SIGNALR_URL}`, {
        accessTokenFactory: () => useAuthStore.getState().accessToken || "",
      })
      .withAutomaticReconnect([0, 2000, 5000, 10000, 20000])
      .build();
    try {
      await newConnection.start();
      console.log("SignalR Connection Established");
      await newConnection.invoke("JoinNotificationGroup", userId);

      await get().fetchInitialNotifications(1, 10);

      newConnection.on("ReceiveNotification", (notification: string) => {
        console.log("Received notification:", notification);
        const parsedNotification = JSON.parse(notification);
        const notificationObj: NotificationData = {
          title: parsedNotification.title || parsedNotification.Title,
          type: parsedNotification.type || parsedNotification.Type,
          message: parsedNotification.message || parsedNotification.Message,
          entity: parsedNotification.entity || parsedNotification.Entity,
          entityId: parsedNotification.id || parsedNotification.EntityId,
        };
        // Convert NotificationData to Notification
        const newNotification: Notification = {
          id: Math.random().toString(),
          type: notificationObj.type,
          data: JSON.stringify(notificationObj),
          read: false,
          createdAt: new Date(),
          status: "Active",
        };

        get().addNotification(newNotification);
        Toast.show({
          type: notificationObj.type.toLowerCase(),
          text1: `Thông báo ${notificationObj.title}`,
          text2: notificationObj.message,
          onPress: () => {
            if (!navigationRef) return;

            switch (notificationObj.entity) {
              case "Item":
                navigationRef.navigate("ProductDetail", {
                  productId: notificationObj.entityId,
                });
                break;
              case "Request":
                console.log("Navigate to request detail");
                break;
              case "Transaction":
                navigationRef.navigate("MyTransactions", {
                  requestId: notificationObj.entityId,
                });
                break;
            }
          },
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
  setNotifications: (notifications) => {
    const processedNotifications = notifications.map((notification) => ({
      ...notification,
      createdAt: notification.createdAt
        ? new Date(notification.createdAt)
        : new Date(),
    }));
    set({ notifications: processedNotifications });
  },
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
  fetchInitialNotifications: async (
    pageIndex: number = 1,
    sizeIndex: number = 10
  ) => {
    try {
      const response = await axiosInstance.get(
        `${API_GET_ALL_NOTIFICATION}?pageIndex=${pageIndex}&sizeIndex=${sizeIndex}`
      );
      const notificationResponse: NotificationResponse = response.data;

      if (notificationResponse.isSuccess) {
        const processedNotifications = notificationResponse.data.data.map(
          (notification: Notification) => ({
            ...notification,
            createdAt: notification.createdAt
              ? new Date(notification.createdAt)
              : new Date(),
          })
        );
        set({ notifications: processedNotifications });
      }
    } catch (error) {
      console.error("Error fetching initial notifications:", error);
    }
  },
  clearNotifications: () => set({ notifications: [] }),
  sendNotification: async (userId: string, data: NotificationData) => {
    try {
      await axiosInstance.post(`notification/send?userId=${userId}`, data);
    } catch (error) {
      console.error("Error sending notification:", error);
    }
  },
}));
