import React, { useEffect, useState } from "react";
import {
  ScrollView,
  View,
  ActivityIndicator,
  SafeAreaView,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { Avatar, Button, Card, Text, Title } from "react-native-paper";
import axiosInstance from "@/api/axiosInstance";
import { useNavigation } from "@/hooks/useNavigation";
import Icon from "react-native-vector-icons/Ionicons";
import Colors from "@/src/constants/Colors";
import { useAuthCheck } from "@/src/hooks/useAuth";
import { Alert } from "react-native";
import { RootStackParamList } from "@/src/layouts/types/navigationTypes";
import { useAuthStore } from "@/src/stores/authStore";

const userDataSelector = (state: ReturnType<typeof useAuthStore.getState>) =>
  state.userData;
const setUserDataSelector = (state: ReturnType<typeof useAuthStore.getState>) =>
  state.setUserData;

const ProfileScreen = () => {
  const { isAuthenticated } = useAuthCheck();
  const userData = useAuthStore(userDataSelector);
  const setUserData = useAuthStore(setUserDataSelector);
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation();

  const fetchUserData = async () => {
    if (!isAuthenticated) {
      setUserData(null);
      return;
    }

    try {
      setLoading(true);
      const response = await axiosInstance.get("/user/profile");
      setUserData(response.data.data);
    } catch (error) {
      console.error("Error fetching user data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserData();
  }, [isAuthenticated]);

  const handleLogout = async () => {
    try {
      const logout = useAuthStore.getState().logout;
      await logout();
      navigation.navigate("Main", {
        screen: "Home",
      });
    } catch (error) {
      console.error("Error clearing session:", error);
    }
  };

  const handleAuthenticatedNavigation = (
    screenName: keyof RootStackParamList
  ) => {
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

    try {
      if (screenName === "MyProducts") {
        navigation.navigate("MyProducts");
      } else if (screenName === "MyRequests") {
        navigation.navigate("RequestSubAction");
      } else if (screenName === "MyTransactions") {
        navigation.navigate("MyTransactions");
      }
    } catch (error) {
      console.error("Navigation error:", error);
      Alert.alert("Lỗi", "Không thể chuyển đến trang yêu cầu");
    }
  };

  const handleEditProfile = () => {
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
    navigation.navigate("ProfileDetail");
  };

  const menuItems = [
    {
      title: "Sản phẩm của tôi",
      icon: "cube-outline",
      description: "Quản lý các sản phẩm bạn đã đăng",
      onPress: () => handleAuthenticatedNavigation("MyProducts"),
    },
    {
      title: "Yêu cầu của tôi",
      icon: "document-text-outline",
      description: "Xem và quản lý các yêu cầu trao đổi",
      onPress: () => handleAuthenticatedNavigation("MyRequests"),
    },
    {
      title: "Giao dịch của tôi",
      icon: "sync-outline",
      description: "Lịch sử các giao dịch đã thực hiện",
      onPress: () => handleAuthenticatedNavigation("MyTransactions"),
    },
  ];

  const getPointColor = (point: number) => {
    if (point < 50) return "#990000"; // Đỏ đậm - Rất không uy tín
    if (point < 75) return "#ff4d4d"; // Đỏ nhạt - Không uy tín
    if (point < 100) return "#e67300"; // Cam - Cần cải thiện
    if (point <= 120) return "#00e600"; // Xanh lá - Tốt
    return "#ffcc00"; // Xanh lá đậm - Rất tốt
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.orange500} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Profile Header */}
        <View style={styles.header}>
          <View style={styles.profileSection}>
            <View style={styles.avatarContainer}>
              <Avatar.Image
                size={80}
                source={{ uri: userData?.profilePicture }}
                style={styles.avatar}
              />
              {isAuthenticated && (
                <TouchableOpacity
                  style={styles.editAvatarButton}
                  onPress={handleEditProfile}
                >
                  <Icon
                    name="pencil-outline"
                    size={16}
                    color={Colors.orange500}
                  />
                </TouchableOpacity>
              )}
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.userName}>
                {userData?.username || "Khách"}
              </Text>
              {userData?.phone && (
                <View style={styles.contactRow}>
                  <Icon name="call-outline" size={16} color={Colors.gray600} />
                  <Text style={styles.contactText}>{userData.phone}</Text>
                </View>
              )}
              {userData?.email && (
                <View style={styles.contactRow}>
                  <Icon name="mail-outline" size={16} color={Colors.gray600} />
                  <Text style={styles.contactText}>{userData.email}</Text>
                </View>
              )}
            </View>
          </View>

          {isAuthenticated && (
            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Text
                  style={[
                    styles.statValue,
                    { color: getPointColor(userData?.point || 0) },
                  ]}
                >
                  {userData?.point || 0}
                </Text>
                <Text style={styles.statLabel}>Điểm tích lũy</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>
                  {new Date(userData?.dateJoined as string).getFullYear() ||
                    "-"}
                </Text>
                <Text style={styles.statLabel}>Năm tham gia</Text>
              </View>
            </View>
          )}
        </View>

        {/* Menu Section */}
        <View style={styles.menuSection}>
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={styles.menuItem}
              onPress={item.onPress}
            >
              <View style={styles.menuItemContent}>
                <View style={styles.menuItemIcon}>
                  <Icon name={item.icon} size={24} color={Colors.orange500} />
                </View>
                <View style={styles.menuItemText}>
                  <Text style={styles.menuItemTitle}>{item.title}</Text>
                  <Text style={styles.menuItemDescription}>
                    {item.description}
                  </Text>
                </View>
                <Icon
                  name="chevron-forward-outline"
                  size={20}
                  color={Colors.gray400}
                />
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          {isAuthenticated ? (
            <>
              <TouchableOpacity
                onPress={handleEditProfile}
                style={[styles.touchableButton, styles.editButton]}
              >
                <Icon
                  name="pencil-outline"
                  size={20}
                  color="#fff"
                  style={styles.buttonIcon}
                />
                <Text style={styles.buttonText}>Chỉnh sửa thông tin</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleLogout}
                style={[styles.touchableButton, styles.logoutButton]}
              >
                <Icon
                  name="log-out-outline"
                  size={20}
                  color={Colors.orange500}
                  style={styles.buttonIcon}
                />
                <Text style={[styles.buttonText, styles.logoutText]}>
                  Đăng xuất
                </Text>
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity
              onPress={() => navigation.navigate("LoginScreen")}
              style={[styles.touchableButton, styles.loginButton]}
            >
              <Icon
                name="person-outline"
                size={20}
                color="#fff"
                style={styles.buttonIcon}
              />
              <Text style={styles.buttonText}>Đăng nhập</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  scrollContent: {
    paddingBottom: 32,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    backgroundColor: "#fff",
    padding: 24,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    paddingTop: 40,
  },
  profileSection: {
    flexDirection: "row",
    marginBottom: 24,
  },
  avatarContainer: {
    position: "relative",
  },
  avatar: {
    backgroundColor: Colors.orange50,
    // borderWidth: 3,
    borderColor: Colors.orange200,
  },
  editAvatarButton: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: "#fff",
    padding: 8,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  profileInfo: {
    marginLeft: 16,
    flex: 1,
  },
  userName: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1a1a1a",
  },
  contactRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  contactText: {
    marginLeft: 8,
    color: Colors.gray600,
    fontSize: 14,
  },
  statsContainer: {
    flexDirection: "row",
    backgroundColor: Colors.orange50,
    borderRadius: 16,
    padding: 16,
    marginTop: 16,
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statValue: {
    fontSize: 20,
    fontWeight: "700",
    color: Colors.orange500,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 13,
    color: Colors.gray600,
  },
  statDivider: {
    width: 1,
    backgroundColor: Colors.orange200,
    marginHorizontal: 16,
  },
  menuSection: {
    padding: 16,
    gap: 12,
  },
  menuItem: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  menuItemContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  menuItemIcon: {
    backgroundColor: Colors.orange50,
    padding: 12,
    borderRadius: 12,
    marginRight: 16,
  },
  menuItemText: {
    flex: 1,
  },
  menuItemTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1a1a1a",
    marginBottom: 4,
  },
  menuItemDescription: {
    fontSize: 13,
    color: Colors.gray600,
  },
  actionButtons: {
    paddingHorizontal: 16,
    gap: 8,
  },
  touchableButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
    borderRadius: 12,
    marginVertical: 6,
  },
  buttonIcon: {
    marginRight: 8,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  editButton: {
    backgroundColor: Colors.orange500,
  },
  logoutButton: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: Colors.orange500,
  },
  logoutText: {
    color: Colors.orange500,
  },
  loginButton: {
    backgroundColor: Colors.orange500,
  },
});

export default ProfileScreen;
