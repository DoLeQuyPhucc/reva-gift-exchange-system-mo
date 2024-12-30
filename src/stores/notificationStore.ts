import { create } from "zustand";
import { HubConnection, HubConnectionBuilder } from "@microsoft/signalr";
import { useAuthStore } from "./authStore";
import Toast from "react-native-toast-message";
import axiosInstance from "../api/axiosInstance";
import { API_GET_ALL_NOTIFICATION, API_SIGNALR_URL } from "@env";

export interface Notification {
  id: string;
  type: string;
  data: string;
  read: boolean;
  createdAt: string | Date;
  status: string;
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
  sendNotification: (
    userId: string,
    type: string,
    data: string
  ) => Promise<void>;
}
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
        // const parsedNotification = JSON.parse(notification);
        // const notificationObj: Notification = {
        //   id: parsedNotification.id,
        //   type: parsedNotification.type,
        //   data: parsedNotification.data,
        //   read: false,
        //   createdAt: new Date(parsedNotification.createdAt),
        //   status: parsedNotification.status,
        // };
        // console.log("Received notificationObj:", notificationObj);
        // get().addNotification(notificationObj);
        Toast.show({
          type: "info",
          text1: "Thông báo",
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
  sendNotification: async (userId: string, type: string, data: string) => {
    try {
      await axiosInstance.post(
        `notification/send?userId=${userId}&type=${type}&data=${data}`
      );
    } catch (error) {
      console.error("Error sending notification:", error);
    }
  },
}));
