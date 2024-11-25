import { View, Text, TouchableOpacity, StyleSheet, RefreshControl, ScrollView, ActivityIndicator, Animated } from 'react-native';
import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Notification, useNotificationStore } from '@/src/stores/notificationStore';
import axiosInstance from '@/src/api/axiosInstance';
import { formatDate } from '@/src/shared/formatDate';
import { useAuthCheck } from '@/src/hooks/useAuth';
import { useNavigation } from '@/src/hooks/useNavigation';
import { Alert } from 'react-native';

export default function NotificationsScreen() {
  const { notifications, setNotifications } = useNotificationStore();
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  
  const { isAuthenticated } = useAuthCheck();
  const navigation = useNavigation();

  const handleAuthenticatedNavigation = () => {
    if (!isAuthenticated) {
      Alert.alert(
        'Yêu cầu đăng nhập',
        'Vui lòng đăng nhập để sử dụng tính năng này',
        [
          { text: 'Hủy', style: 'cancel' },
          { 
            text: 'Đăng nhập', 
            onPress: () => {
              try {
                navigation.navigate('LoginScreen', undefined);
              } catch (error) {
                console.error('Navigation error:', error);
                Alert.alert('Lỗi', 'Không thể chuyển đến trang đăng nhập');
              }
            }
          }
        ]
      );
      return;
    }
  };

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const fadeIn = useCallback(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);
  const fetchNotifications = async () => {
    try {
      if (!isAuthenticated) {
        handleAuthenticatedNavigation();
        return;
      }
      setError(null);
      const response = await axiosInstance.get('notification/all');
      
      if (response.data.isSuccess) {
        setNotifications(response.data.data);
        fadeIn();
      } else {
        console.log('Error fetching notifications:', response.data.message);
        
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };
  const onRefresh = async () => {
    setRefreshing(true);
    await fetchNotifications();
    setRefreshing(false);
  };
  const markAsRead = async (notificationId: string) => {
    try {
      await axiosInstance.put(`notification/mark-as-read/${notificationId}`);
      setNotifications(notifications.map(notification => 
        notification.id === notificationId 
          ? { ...notification, read: true }
          : notification
      ));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };
  useEffect(() => {
    fetchNotifications();
  }, []);
  const renderNotification = useCallback(({ item: notification, index }: { item: Notification, index: number }) => {
    const formattedDate = notification.createdAt 
      ? formatDate(notification.createdAt.toLocaleString()) 
      : 'Unknown date';
    
      let parsedData;
  try {
    // Kiểm tra xem data có phải là string JSON không
    parsedData = typeof notification.data === 'string' 
      ? JSON.parse(notification.data)
      : notification.data;
  } catch (error) {
    console.error('Error parsing notification data:', error);
    // Fallback nếu parse thất bại
    parsedData = {
      message: notification.data || 'Invalid notification data'
    };
  }

    return (
      <Animated.View 
        style={[
          styles.notification,
          { 
            opacity: fadeAnim,
            transform: [{
              translateY: fadeAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [50, 0],
              })
            }],
          }
        ]}
      >
        <TouchableOpacity
          onPress={() => !notification.read && notification.id && markAsRead(notification.id)}
          style={[
            styles.notificationContent,
            !notification.read && styles.unreadNotification
          ]}
        >
          <View style={styles.notificationHeader}>
            <Text style={styles.notificationTime}>{formattedDate}</Text>
            {!notification.read && (
              <View style={styles.unreadIndicator} />
            )}
          </View>
          
          <Text style={styles.notificationText}>
            {parsedData.message}
          </Text>
          
          {!notification.read && (
            <Text style={styles.tapToMark}>Nhấn để đánh dấu đã đọc!</Text>
          )}
        </TouchableOpacity>
      </Animated.View>
    );
  }, [fadeAnim, markAsRead]);
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
          onPress={fetchNotifications}
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
    >
      <View style={styles.notificationContainer}>
        <Text style={styles.title}>Thông báo</Text>
        {notifications.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Không có thông báo nào hết</Text>
          </View>
        ) : (
          notifications.map((notification, index) => 
            renderNotification({ item: notification, index })
          )
        )}
      </View>
    </ScrollView>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingVertical: 16,
    backgroundColor: '#F8F9FA',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  notificationContainer: {
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#1A1A1A',
  },
  notification: {
    marginBottom: 12,
  },
  notificationContent: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  unreadNotification: {
    backgroundColor: '#F0F7FF',
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  notificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  notificationTime: {
    fontSize: 12,
    color: '#666',
  },
  notificationText: {
    fontSize: 15,
    color: '#1A1A1A',
    lineHeight: 20,
  },
  unreadIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#007AFF',
  },
  tapToMark: {
    fontSize: 12,
    color: '#007AFF',
    marginTop: 8,
    textAlign: 'right',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
  },
  errorText: {
    fontSize: 16,
    color: '#DC3545',
    marginBottom: 16,
    textAlign: 'center',
  },
  retryButton: {
    padding: 12,
    backgroundColor: '#007AFF',
    borderRadius: 8,
  },
  retryText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});