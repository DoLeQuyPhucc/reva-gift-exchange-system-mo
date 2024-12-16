import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ScrollView,
  ActivityIndicator,
  Animated,
} from "react-native";
import React, { useEffect, useState, useCallback, useRef } from "react";
import { useFocusEffect } from "@react-navigation/native";
import {
  Notification,
  useNotificationStore,
} from "@/src/stores/notificationStore";
import axiosInstance from "@/src/api/axiosInstance";
import { useAuthCheck } from "@/src/hooks/useAuth";
import { useNavigation } from "@/src/hooks/useNavigation";
import { Alert } from "react-native";
import { Swipeable } from "react-native-gesture-handler";
import Checkbox from "expo-checkbox";
import Toast from "react-native-toast-message";

export default function NotificationsScreen() {
  const { notifications, setNotifications } = useNotificationStore();
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const PAGE_SIZE = 10;

  const { isAuthenticated } = useAuthCheck();
  const navigation = useNavigation();

  useFocusEffect(
    useCallback(() => {
      return () => {
        setIsSelectionMode(false);
        setSelectedItems([]);
      };
    }, [])
  );

  const handleAuthenticatedNavigation = () => {
    if (!isAuthenticated) {
      Alert.alert(
        "Yêu cầu đăng nhập",
        "Vui lòng đăng nhập để sử dụng tính năng này",
        [
          { text: "Hủy", style: "cancel" },
          {
            text: "Đăng nhập",
            onPress: () => {
              try {
                navigation.navigate("LoginScreen", undefined);
              } catch (error) {
                console.error("Navigation error:", error);
                Alert.alert("Lỗi", "Không thể chuyển đến trang đăng nhập");
              }
            },
          },
        ]
      );
      return;
    }
  };

  const handleDeleteSingle = async (notificationId: string) => {
    try {
      const response = await axiosInstance.put(
        `notification/clear/${notificationId}`
      );
      if (response.data.isSuccess) {
        setNotifications(notifications.filter((n) => n.id !== notificationId));
        Toast.show({
          type: "success",
          text1: "Thành công",
          text2: "Đã xóa thông báo",
        });
      }
    } catch (error) {
      console.error("Error deleting notification:", error);
      Alert.alert("Lỗi", "Không thể xóa thông báo");
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedItems.length === 0) return;

    Alert.alert(
      "Xác nhận xóa",
      "Bạn có chắc chắn muốn xóa các thông báo đã chọn?",
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Xóa",
          style: "destructive",
          onPress: async () => {
            try {
              const response = await axiosInstance.put(
                "notification/clear-all"
              );
              if (response.data.isSuccess) {
                setNotifications([]);
                setSelectedItems([]);
                setIsSelectionMode(false);
                Toast.show({
                  type: "success",
                  text1: "Thành công",
                  text2: `Đã xóa ${selectedItems.length} thông báo`,
                });
              }
            } catch (error) {
              console.error("Error deleting notifications:", error);
              Alert.alert("Lỗi", "Không thể xóa thông báo");
            }
          },
        },
      ]
    );
  };

  const fadeAnim = useRef(new Animated.Value(0)).current;

  const fadeIn = useCallback(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  const fetchNotifications = async (page: number) => {
    try {
      if (!isAuthenticated) {
        handleAuthenticatedNavigation();
        return;
      }
      setError(null);
      const response = await axiosInstance.get(
        `notification/all?pageIndex=${page}&sizeIndex=${PAGE_SIZE}`
      );
      if (response.data.isSuccess) {
        const { data, totalItems } = response.data.data;

        if (page === 1) {
          setNotifications(data);
        } else {
          setNotifications([...notifications, ...(data as Notification[])]);
        }

        setTotalPages(Math.ceil(totalItems / PAGE_SIZE));
        fadeIn();
      } else {
        console.log("Error fetching notifications:", response.data.message);
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchNotifications(1);
    setRefreshing(false);
  };

  const loadMore = () => {
    if (!isLoading && currentPage < totalPages) {
      setCurrentPage((prev) => prev + 1);
      fetchNotifications(currentPage + 1);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      await axiosInstance.put(`notification/mark-as-read/${notificationId}`);
      setNotifications(
        notifications.map((notification) =>
          notification.id === notificationId
            ? { ...notification, read: true }
            : notification
        )
      );
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  useEffect(() => {
    fetchNotifications(1);
  }, []);

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return "Invalid date";
      }

      const now = new Date();
      const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

      if (diffInSeconds < 60) {
        return "Vừa xong";
      }
      if (diffInSeconds < 3600) {
        const minutes = Math.floor(diffInSeconds / 60);
        return `${minutes} phút trước`;
      }
      if (diffInSeconds < 86400) {
        const hours = Math.floor(diffInSeconds / 3600);
        return `${hours} giờ trước`;
      }
      if (diffInSeconds < 604800) {
        const days = Math.floor(diffInSeconds / 86400);
        return `${days} ngày trước`;
      }

      return date.toLocaleDateString("vi-VN", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (error) {
      console.error("Error formatting date:", error);
      return "Invalid date";
    }
  };

  const renderNotification = useCallback(
    ({ item: notification, index }: { item: Notification; index: number }) => {
      const renderRightActions = () => (
        <TouchableOpacity
          style={styles.deleteAction}
          onPress={() => notification.id && handleDeleteSingle(notification.id)}
        >
          <Text style={styles.deleteActionText}>Xóa</Text>
        </TouchableOpacity>
      );

      const formattedDate = notification.createdAt
        ? formatDate(notification.createdAt.toString())
        : "Unknown date";

      let parsedData;
      try {
        parsedData =
          typeof notification.data === "string"
            ? JSON.parse(notification.data)
            : { message: notification.data };
      } catch (error) {
        parsedData = { message: notification.data };
      }

      return (
        <Animated.View
          key={notification.id}
          style={[
            styles.notification,
            {
              opacity: fadeAnim,
              transform: [
                {
                  translateY: fadeAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [50, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <Swipeable renderRightActions={renderRightActions}>
            <TouchableOpacity
              onPress={() =>
                !notification.read &&
                notification.id &&
                markAsRead(notification.id)
              }
              style={[
                styles.notificationContent,
                !notification.read && styles.unreadNotification,
              ]}
            >
              <View style={styles.notificationHeader}>
                {isSelectionMode && (
                  <View style={styles.checkboxContainer}>
                    <Checkbox
                      value={
                        notification.id
                          ? selectedItems.includes(notification.id)
                          : false
                      }
                      onValueChange={(newValue) => {
                        if (notification.id) {
                          if (newValue) {
                            setSelectedItems([
                              ...selectedItems,
                              notification.id,
                            ]);
                          } else {
                            setSelectedItems(
                              selectedItems.filter(
                                (id) => id !== notification.id
                              )
                            );
                          }
                        }
                      }}
                      color={
                        selectedItems.includes(notification.id || "")
                          ? "#007AFF"
                          : undefined
                      }
                    />
                  </View>
                )}
                <Text style={styles.notificationTime}>{formattedDate}</Text>
                {!notification.read && <View style={styles.unreadIndicator} />}
              </View>

              <Text style={styles.notificationText}>{parsedData.message}</Text>

              {!notification.read && (
                <Text style={styles.tapToMark}>Nhấn để đánh dấu đã đọc!</Text>
              )}
            </TouchableOpacity>
          </Swipeable>
        </Animated.View>
      );
    },
    [fadeAnim, markAsRead, isSelectionMode, selectedItems]
  );

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={() => fetchNotifications(1)}
        >
          <Text style={styles.retryText}>Thử lại</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor="#007AFF"
        />
      }
      onScroll={({ nativeEvent }) => {
        const { layoutMeasurement, contentOffset, contentSize } = nativeEvent;
        const isCloseToBottom =
          layoutMeasurement.height + contentOffset.y >= contentSize.height - 20;

        if (isCloseToBottom) {
          loadMore();
        }
      }}
      scrollEventThrottle={400}
    >
      <View style={styles.notificationContainer}>
        <View style={styles.header}>
          <Text style={styles.title}>Thông báo</Text>
          {notifications.length > 0 && (
            <TouchableOpacity
              onPress={() => setIsSelectionMode(!isSelectionMode)}
              style={styles.selectButton}
            >
              <Text style={styles.selectButtonText}>
                {isSelectionMode ? "Hủy" : "Chọn"}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {isSelectionMode && notifications.length > 0 && (
          <View style={styles.selectionHeader}>
            <View style={styles.selectionActions}>
              <TouchableOpacity
                style={styles.selectAllButton}
                onPress={() => {
                  if (selectedItems.length === notifications.length) {
                    setSelectedItems([]);
                  } else {
                    setSelectedItems(
                      notifications.map((n) => n.id || "").filter(Boolean)
                    );
                  }
                }}
              >
                <Text style={styles.selectAllText}>
                  {selectedItems.length === notifications.length
                    ? "Bỏ chọn tất cả"
                    : "Chọn tất cả"}
                </Text>
              </TouchableOpacity>

              {selectedItems.length > 0 && (
                <TouchableOpacity
                  style={styles.deleteSelectedButton}
                  onPress={handleDeleteSelected}
                >
                  <Text style={styles.deleteSelectedText}>
                    Xóa ({selectedItems.length})
                  </Text>
                </TouchableOpacity>
              )}
            </View>
            <Text style={styles.selectionCount}>
              Đã chọn: {selectedItems.length}/{notifications.length}
            </Text>
          </View>
        )}

        {notifications.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Không có thông báo nào hết</Text>
          </View>
        ) : (
          notifications.map((notification) => (
            <View
              key={notification.id || `temp-${Date.now()}-${Math.random()}`}
            >
              {renderNotification({
                item: notification,
                index: notifications.indexOf(notification),
              })}
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingVertical: 16,
    backgroundColor: "#F8F9FA",
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  notificationContainer: {
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 16,
    color: "#1A1A1A",
  },
  notification: {
    marginBottom: 12,
  },
  notificationContent: {
    padding: 16,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  unreadNotification: {
    backgroundColor: "#F0F7FF",
    borderLeftWidth: 4,
    borderLeftColor: "#007AFF",
  },
  notificationHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  notificationTime: {
    fontSize: 12,
    color: "#666",
  },
  notificationText: {
    fontSize: 15,
    color: "#1A1A1A",
    lineHeight: 20,
  },
  unreadIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#007AFF",
  },
  tapToMark: {
    fontSize: 12,
    color: "#007AFF",
    marginTop: 8,
    textAlign: "right",
  },
  emptyContainer: {
    padding: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    fontSize: 16,
    color: "#666",
  },
  errorText: {
    fontSize: 16,
    color: "#DC3545",
    marginBottom: 16,
    textAlign: "center",
  },
  retryButton: {
    padding: 12,
    backgroundColor: "#007AFF",
    borderRadius: 8,
  },
  retryText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  selectButton: {
    padding: 8,
  },
  selectButtonText: {
    color: "#007AFF",
    fontSize: 16,
  },
  deleteAction: {
    backgroundColor: "#DC3545",
    justifyContent: "center",
    alignItems: "center",
    width: 80,
    height: "100%",
  },
  deleteActionText: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  checkboxContainer: {
    marginRight: 10,
  },
  checkbox: {
    width: 20,
    height: 20,
  },
  selectionHeader: {
    backgroundColor: "#F8F9FA",
    padding: 12,
    marginBottom: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E9ECEF",
  },
  selectionActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  selectAllButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    backgroundColor: "#E9ECEF",
  },
  selectAllText: {
    color: "#495057",
    fontWeight: "600",
    fontSize: 14,
  },
  deleteSelectedButton: {
    backgroundColor: "#DC3545",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
  },
  deleteSelectedText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  selectionCount: {
    fontSize: 12,
    color: "#6C757D",
    textAlign: "right",
  },
});
