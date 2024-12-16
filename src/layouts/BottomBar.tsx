import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import Icon from "react-native-vector-icons/MaterialIcons";
import React, { useEffect, useState } from "react";
import {
  View,
  Modal,
  TouchableOpacity,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  Alert,
} from "react-native";
import { BottomTabParamList } from "@/src/layouts/types/navigationTypes";
import Colors from "@/constants/Colors";
import { Category, SubCategory } from "@/shared/type";

import { useNavigation } from "@/hooks/useNavigation";
import useCategories from "@/hooks/useCategories";
import { useAuthStore } from "@/src/stores/authStore";
import { useNotificationStore } from "../stores/notificationStore";

const Tab = createBottomTabNavigator<BottomTabParamList>();
const { height: SCREEN_HEIGHT } = Dimensions.get("window");

export interface TabBarProps {
  route: keyof BottomTabParamList;
  component: React.ComponentType<any>;
  tabBarLabel: string;
  tabBarIconProps: {
    iconType: any;
    iconName: string;
  };
}

const CustomBottomTab: React.FC<{ tabs: TabBarProps[] }> = ({ tabs }) => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const userEmail = useAuthStore((state) => state.email);
  const { categories, subCategories, getSubCategories, isLoading } =
    useCategories();
  const [modalVisible, setModalVisible] = useState(false);
  const [subCategoryModalVisible, setSubCategoryModalVisible] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(
    null
  );
  const slideAnim = React.useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const subCategorySlideAnim = React.useRef(
    new Animated.Value(SCREEN_HEIGHT)
  ).current;
  const navigation = useNavigation();
  const { notifications, fetchInitialNotifications } = useNotificationStore();
  const unreadCount = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    if (isAuthenticated) {
      fetchInitialNotifications(1, 10);
    }
  }, [isAuthenticated]);

  const showModal = () => {
    if (!isAuthenticated) {
      Alert.alert(
        "Đăng nhập",
        "Bạn cần phải đăng nhập trước khi thực hiện hành động này",
        [
          { text: "Hủy", style: "cancel" },
          {
            text: "Đăng nhập",
            onPress: () => navigation.navigate("LoginScreen"),
          },
        ]
      );
      return;
    }

    if (!userEmail) {
      Alert.alert(
        "Cập nhật thông tin",
        "Vui lòng cập nhật email trước khi thực hiện hành động này",
        [
          { text: "Hủy", style: "cancel" },
          {
            text: "Cập nhật",
            onPress: () => navigation.navigate("ProfileDetail"),
          },
        ]
      );
      return;
    }

    setModalVisible(true);
    Animated.spring(slideAnim, {
      toValue: 0,
      useNativeDriver: true,
      tension: 50,
      friction: 8,
    }).start();
  };

  const hideModal = () => {
    Animated.timing(slideAnim, {
      toValue: SCREEN_HEIGHT,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setModalVisible(false);
    });
  };

  const showSubCategoryModal = async (category: Category) => {
    setSelectedCategory(category);
    await getSubCategories(category.id);

    Animated.timing(slideAnim, {
      toValue: SCREEN_HEIGHT,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setModalVisible(false);
      setSubCategoryModalVisible(true);
      Animated.spring(subCategorySlideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 50,
        friction: 8,
      }).start();
    });
  };

  const hideSubCategoryModal = () => {
    Animated.timing(subCategorySlideAnim, {
      toValue: SCREEN_HEIGHT,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setSubCategoryModalVisible(false);
    });
  };

  const handleSubCategorySelect = (subCategory: SubCategory) => {
    hideSubCategoryModal();
    if (selectedCategory) {
      navigation.navigate("CreatePost", {
        category: selectedCategory,
        categoryId: selectedCategory.id,
        subCategory,
        subCategoryId: subCategory.id,
      });
    }
  };

  const CategoryModal = () => (
    <Modal
      animationType="none"
      transparent={true}
      visible={modalVisible}
      onRequestClose={hideModal}
    >
      <View style={styles.modalOverlay}>
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={hideModal}
        >
          <Animated.View
            style={[
              styles.modalContent,
              {
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            <View style={styles.modalHeader}>
              <View style={styles.modalIndicator} />
            </View>
            <Text style={styles.modalTitle}>Chọn danh mục</Text>
            {categories.map((category) => (
              <TouchableOpacity
                key={category.id}
                style={styles.categoryItem}
                onPress={() => showSubCategoryModal(category)}
              >
                <Text style={styles.categoryText}>{category.name}</Text>
              </TouchableOpacity>
            ))}
          </Animated.View>
        </TouchableOpacity>
      </View>
    </Modal>
  );

  const SubCategoryModal = () => (
    <Modal
      animationType="none"
      transparent={true}
      visible={subCategoryModalVisible}
      onRequestClose={hideSubCategoryModal}
    >
      <View style={styles.modalOverlay}>
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={hideSubCategoryModal}
        >
          <Animated.View
            style={[
              styles.modalContent,
              {
                transform: [{ translateY: subCategorySlideAnim }],
              },
            ]}
          >
            <View style={styles.modalHeader}>
              <View style={styles.modalIndicator} />
            </View>
            <Text style={styles.modalTitle}>
              Chọn danh mục phụ cho {selectedCategory?.name}
            </Text>
            {subCategories.map((subCategory) => (
              <TouchableOpacity
                key={subCategory.id}
                style={styles.categoryItem}
                onPress={() => handleSubCategorySelect(subCategory)}
              >
                <Text style={styles.categoryText}>{subCategory.name}</Text>
              </TouchableOpacity>
            ))}
          </Animated.View>
        </TouchableOpacity>
      </View>
    </Modal>
  );

  return (
    <View style={{ flex: 1 }}>
      <Tab.Navigator
        initialRouteName={tabs[0].route}
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: Colors.orange600,
          tabBarInactiveTintColor: "gray",
          tabBarStyle: {
            borderTopRightRadius: 20,
            borderTopLeftRadius: 20,
            height: 70,
            backgroundColor: "white",
          },
        }}
      >
        {tabs.map((tabProps: TabBarProps, idx) => (
          <Tab.Screen
            key={idx}
            name={tabProps.route}
            component={tabProps.component}
            options={{
              tabBarLabel: tabProps.tabBarLabel,
              tabBarIcon: ({ color, size }) => (
                <Icon
                  name={tabProps.tabBarIconProps.iconName}
                  color={color}
                  size={20}
                />
              ),
              tabBarBadge:
                tabProps.route === "Notifications" && unreadCount > 0
                  ? unreadCount
                  : undefined,
              tabBarBadgeStyle: {
                backgroundColor: Colors.orange600,
                fontSize: 12,
              },
            }}
          />
        ))}
      </Tab.Navigator>

      <View style={styles.fabContainer}>
        <TouchableOpacity style={styles.fab} onPress={showModal}>
          <Icon name="add" size={20} color="white" />
        </TouchableOpacity>
      </View>

      <CategoryModal />
      <SubCategoryModal />
    </View>
  );
};

const styles = StyleSheet.create({
  fabContainer: {
    position: "absolute",
    alignSelf: "center",
    bottom: 40,
    zIndex: 1,
  },
  fab: {
    backgroundColor: Colors.orange600,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "white",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingBottom: 40,
    maxHeight: SCREEN_HEIGHT * 0.7,
  },
  modalHeader: {
    alignItems: "center",
    paddingVertical: 15,
  },
  modalIndicator: {
    width: 40,
    height: 4,
    backgroundColor: "#DEDEDE",
    borderRadius: 2,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
    color: Colors.orange600,
  },
  categoryItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  categoryText: {
    fontSize: 16,
    color: "#333",
  },
});

export default CustomBottomTab;
