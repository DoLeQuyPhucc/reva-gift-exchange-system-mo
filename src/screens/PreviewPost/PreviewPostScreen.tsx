// src/screens/CreatePost/PreviewPostScreen.tsx

import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import Colors from "@/src/constants/Colors";
import { Video, ResizeMode } from "expo-av";
import { CustomAlert } from "@/src/components/CustomAlert";

interface PreviewPostScreenProps {
  route: {
    params: {
      title: string;
      description: string;
      category: any;
      subCategory: any;
      condition: string;
      images: string[];
      video: string | null;
      isExchange: boolean;
      isGift: boolean;
      timePreference: string;
      dayTimeFrames: any[];
      address: string;
      desiredCategory?: any;
      desiredSubCategory?: any;
      addressId: string;
      getAvailableTimeString: (timePreference: string) => string;
      onSubmitPost: (postData: any) => Promise<boolean>;
    };
  };
  navigation: any;
}

const PreviewPostScreen: React.FC<PreviewPostScreenProps> = ({
  route,
  navigation,
}) => {
  const [isLoading, setIsLoading] = React.useState(false);
  const [showConfirmAlert, setShowConfirmAlert] = useState(false);
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);

  const {
    title,
    description,
    category,
    subCategory,
    condition,
    images,
    video,
    isExchange,
    isGift,
    timePreference,
    dayTimeFrames,
    address,
    desiredCategory,
    desiredSubCategory,
    addressId,
    onSubmitPost,
  } = route.params;

  const getAvailableTimeString = (timePreference: string) => {
    switch (timePreference) {
      case "allDay":
        return "allDay 09:00_21:00 mon_tue_wed_thu_fri_sat_sun";
      case "officeHours":
        return "officeHours 09:00_17:00 mon_tue_wed_thu_fri";
      case "evening":
        return "evening 17:00_21:00 mon_tue_wed_thu_fri_sat_sun";
      case "custom":
        return getCustomPerDayTimeString();
      default:
        return "";
    }
  };

  const getCustomPerDayTimeString = (): string => {
    if (dayTimeFrames.length === 0) return "";

    if (dayTimeFrames.some((frame) => frame.day === "all")) {
      const frame = dayTimeFrames.find((frame) => frame.day === "all");
      return `custom ${frame?.startTime}_${frame?.endTime} mon_tue_wed_thu_fri_sat_sun`;
    }

    const frames = dayTimeFrames
      .map((frame) => `${frame.startTime}_${frame.endTime} ${frame.day}`)
      .join(" | ");

    return `customPerDay ${frames}`;
  };

  const handleAlertConfirm = () => {
    setShowSuccessAlert(false);
    navigation.navigate("Main", {
      screen: "Home",
    });
  };

  const handlePublishConfirm = () => {
    setShowConfirmAlert(true);
  };

  const handlePublish = async () => {
    try {
      setShowConfirmAlert(false);
      setIsLoading(true);

      const postData = {
        name: title.trim(),
        description: description.trim(),
        categoryId: subCategory.id,
        isGift: isGift,
        quantity: 1,
        condition: condition,
        images,
        video,
        availableTime: getAvailableTimeString(timePreference),
        addressId: addressId,
        desiredCategoryId: desiredCategory?.id || null,
      };

      console.log("Form Data: ", postData);

      const response = await onSubmitPost(postData);

      if (response === true) {
        setShowSuccessAlert(true);
      }
    } catch (error) {
      Alert.alert("Error", "Failed to create post");
      console.error("Submit error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const renderTimePreference = () => {
    switch (timePreference) {
      case "allDay":
        return "Cả ngày (9h - 21h hằng ngày)";
      case "officeHours":
        return "Giờ hành chính (9h - 17h)";
      case "evening":
        return "Chỉ buổi tối (17h - 21h)";
      case "custom":
        return "Khung giờ tự chọn";
      default:
        return "";
    }
  };

  const getDayInVietnamese = (day: string): string => {
    switch (day) {
      case "mon":
        return "Thứ 2";
      case "tue":
        return "Thứ 3";
      case "wed":
        return "Thứ 4";
      case "thu":
        return "Thứ 5";
      case "fri":
        return "Thứ 6";
      case "sat":
        return "Thứ 7";
      case "sun":
        return "Chủ nhật";
      case "all":
        return "Tất cả các ngày";
      default:
        return day;
    }
  };

  const renderTimeFrame = (frame: any) => {
    if (frame.day === "all") {
      return `Tất cả các ngày: ${frame.startTime} - ${frame.endTime}`;
    }
    return `${getDayInVietnamese(frame.day)}: ${frame.startTime} - ${
      frame.endTime
    }`;
  };

  const renderSection = (title: string, content: React.ReactNode) => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Ionicons
          name="information-circle-outline"
          size={24}
          color={Colors.orange500}
        />
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      {content}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Xem Trước Bài Đăng</Text>
        <View style={styles.headerSpace} />
      </View>

      <ScrollView style={styles.content}>
        {/* Media Section */}
        <View style={styles.mediaSection}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {images.map((image: string, index: number) => (
              <Image
                key={index}
                source={{ uri: image }}
                style={styles.mediaItem}
                resizeMode="cover"
              />
            ))}
          </ScrollView>
          {video && (
            <Video
              source={{ uri: video }}
              style={styles.videoPreview}
              useNativeControls
              resizeMode={ResizeMode.CONTAIN}
            />
          )}
        </View>

        {/* Title & Description */}
        {renderSection(
          "THÔNG TIN CHUNG",
          <View>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.description}>{description}</Text>
          </View>
        )}

        {/* Category Info */}
        {renderSection(
          "DANH MỤC",
          <View style={styles.categoryInfo}>
            <Text style={styles.infoText}>
              <Text style={styles.label}>Danh mục: </Text>
              {category?.name}
            </Text>
            <Text style={styles.infoText}>
              <Text style={styles.label}>Danh mục phụ: </Text>
              {subCategory?.name}
            </Text>
            <Text style={styles.infoText}>
              <Text style={styles.label}>Tình trạng: </Text>
              {condition}
            </Text>
          </View>
        )}

        {/* Exchange/Gift Info */}
        {renderSection(
          "HÌNH THỨC",
          <View>
            <Text style={styles.infoText}>
              {isExchange ? "Trao đổi" : "Cho tặng miễn phí"}
            </Text>
            {isExchange && desiredCategory && (
              <View style={styles.desiredItemInfo}>
                <Text style={styles.label}>Mong muốn trao đổi với:</Text>
                <Text style={styles.infoText}>{desiredCategory.name}</Text>
                {desiredSubCategory && (
                  <Text style={styles.infoText}>{desiredSubCategory.name}</Text>
                )}
              </View>
            )}
          </View>
        )}

        {/* Time Availability */}
        {renderSection(
          "THỜI GIAN CÓ THỂ NHẬN",
          <View>
            <Text style={styles.infoText}>{renderTimePreference()}</Text>
            {timePreference === "custom" &&
              dayTimeFrames.map((frame: any, index: number) => (
                <Text key={index} style={styles.timeFrame}>
                  {renderTimeFrame(frame)}
                </Text>
              ))}
          </View>
        )}

        {/* Address */}
        {renderSection(
          "ĐỊA CHỈ NHẬN HÀNG",
          <Text style={styles.address}>{address}</Text>
        )}
      </ScrollView>

      {/* Footer Buttons */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.footerButton, styles.editButton]}
          onPress={() => navigation.goBack()}
          disabled={isLoading}
        >
          <Text style={styles.editButtonText}>Sửa lại tin</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.footerButton,
            styles.publishButton,
            isLoading && styles.disabledButton,
          ]}
          onPress={handlePublishConfirm}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.publishButtonText}>Đăng bài ngay</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Confirm Alert */}
      <CustomAlert
        visible={showConfirmAlert}
        title="Xác nhận"
        message="Bạn có chắc chắn muốn đăng bài này?"
        onConfirm={handlePublish}
        onCancel={() => setShowConfirmAlert(false)}
        showCancelButton={true}
      />

      {/* Success Alert */}
      <CustomAlert
        visible={showSuccessAlert}
        title="Thành công"
        message="Bài đăng của bạn đã được tạo thành công!"
        onConfirm={handleAlertConfirm}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  backButton: {
    fontSize: 24,
    padding: 8,
  },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: 18,
    fontWeight: "bold",
  },
  headerSpace: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  mediaSection: {
    height: 250,
    backgroundColor: "#f5f5f5",
  },
  mediaItem: {
    width: 250,
    height: 250,
    marginRight: 2,
  },
  videoPreview: {
    width: "100%",
    height: 250,
  },
  section: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginLeft: 8,
    color: Colors.orange500,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 8,
    color: Colors.gray800,
  },
  description: {
    fontSize: 16,
    color: Colors.gray700,
    lineHeight: 24,
  },
  categoryInfo: {
    gap: 8,
  },
  infoText: {
    fontSize: 16,
    color: Colors.gray700,
    marginBottom: 4,
  },
  label: {
    fontWeight: "600",
    color: Colors.gray800,
  },
  desiredItemInfo: {
    marginTop: 8,
    padding: 12,
    backgroundColor: Colors.orange50,
    borderRadius: 8,
  },
  timeFrame: {
    fontSize: 15,
    color: Colors.gray700,
    marginTop: 4,
  },
  address: {
    fontSize: 16,
    color: Colors.gray700,
    lineHeight: 24,
  },
  footer: {
    flexDirection: "row",
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
    backgroundColor: "#fff",
  },
  footerButton: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    marginHorizontal: 4,
    alignItems: "center",
  },
  editButton: {
    backgroundColor: "#f0f0f0",
  },
  publishButton: {
    backgroundColor: Colors.orange500,
  },
  editButtonText: {
    color: Colors.gray800,
    fontWeight: "bold",
  },
  publishButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  disabledButton: {
    opacity: 0.7,
  },
});

export default PreviewPostScreen;
