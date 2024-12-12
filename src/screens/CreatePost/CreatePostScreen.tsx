import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Platform,
  Alert,
  Button,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ActivityIndicator, Checkbox, RadioButton } from "react-native-paper";
import { Picker } from "@react-native-picker/picker";
import { RouteProp, NavigationProp } from "@react-navigation/native";
import { RootStackParamList } from "@/src/layouts/types/navigationTypes";
import * as ImagePicker from "expo-image-picker";
import { CustomAlert } from "@/src/components/CustomAlert";
import { Dropdown } from "react-native-element-dropdown";

import MediaUploadSection from "@/src/components/MediaUploadSection";
import {
  Category,
  ConditionOption,
  ItemCondition,
  SubCategory,
} from "@/src/shared/type";

import useCategories from "@/src/hooks/useCategories";
import useCreatePost from "@/src/hooks/useCreatePost";
import { useCategoryStore } from "@/src/stores/categoryStore";
import Colors from "@/src/constants/Colors";

interface CreatePostScreenProps {
  route: RouteProp<RootStackParamList, "CreatePost">;
  navigation: NavigationProp<RootStackParamList>;
}

type TimeSlot = {
  label: string;
  value: string;
};

type DayTimeFrame = {
  day: string;
  startTime: string;
  endTime: string;
};

const TIME_SLOTS: TimeSlot[] = Array.from({ length: 25 }).map((_, idx) => {
  const hour = Math.floor(idx / 2) + 9;
  const minute = idx % 2 === 0 ? "00" : "30";
  const time = `${hour.toString().padStart(2, "0")}:${minute}`;
  return {
    label: time,
    value: time,
  };
});

interface CreatePostScreenProps {
  route: RouteProp<RootStackParamList, "CreatePost">;
  navigation: NavigationProp<RootStackParamList>;
}

const CustomCheckbox = ({
  checked,
  onPress,
  label,
}: {
  checked: boolean;
  onPress: () => void;
  label: string;
}) => {
  return (
    <TouchableOpacity
      style={styles.customCheckboxContainer}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.checkbox, checked && styles.checkboxChecked]}>
        {checked && <Text style={styles.checkmark}>✓</Text>}
      </View>
      <Text style={styles.checkboxLabel}>{label}</Text>
    </TouchableOpacity>
  );
};

const CreatePostScreen: React.FC<CreatePostScreenProps> = ({
  navigation,
  route,
}) => {
  const initialCategory = route.params?.category;
  const initialCategoryId = route.params?.categoryId;
  const initialSubCategory = route.params?.subCategory;
  const initialSubCategoryId = route.params?.subCategoryId;

  const { categories, subCategories, getSubCategories } = useCategories();
  const { addressData, loading, submitPost } = useCreatePost();
  const setCategoryStore = useCategoryStore((state) => state.setCategory);
  const setSubCategoryStore = useCategoryStore((state) => state.setSubCategory);

  const [selectedCategory, setSelectedCategory] = useState<Category | null>(
    () => {
      if (initialCategory) {
        setCategoryStore(initialCategory);
        return initialCategory;
      }
      if (initialCategoryId) {
        const category = categories.find((cat) => cat.id === initialCategoryId);
        if (category) setCategoryStore(category);
        return category || null;
      }
      return null;
    }
  );

  const [selectedSubCategory, setSelectedSubCategory] =
    useState<SubCategory | null>(() => {
      if (initialSubCategory) {
        setSubCategoryStore(initialSubCategory);
        return initialSubCategory;
      }
      if (initialSubCategoryId) {
        const subCategory = subCategories.find(
          (subCat) => subCat.id === initialSubCategoryId
        );
        if (subCategory) setSubCategoryStore(subCategory);
        return subCategory || null;
      }
      return null;
    });

  const [selectedAddressId, setSelectedAddressId] = useState<string>("");
  const [images, setImages] = useState<string[]>([]);
  const [video, setVideo] = useState<string | null>(null);
  const [condition, setCondition] = useState<ItemCondition | "">("");
  const [isExchange, setIsExchange] = useState<boolean>(false);
  const [isGift, setIsGift] = useState<boolean>(true);
  const [isUploadingImage, setIsUploadingImage] = useState<boolean>(false);
  const [isUploadingVideo, setIsUploadingVideo] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [title, setTitle] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [showTitleHint, setShowTitleHint] = useState<boolean>(false);
  const [isTermsAccepted, setIsTermsAccepted] = useState<boolean>(false);
  const [showDescriptionHint, setShowDescriptionHint] =
    useState<boolean>(false);
  const [desiredCategoryId, setDesiredCategoryId] = useState<string>("");
  const [desiredSubCategoryId, setDesiredSubCategoryId] = useState<
    string | null
  >(null);
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);

  const [timePreference, setTimePreference] = useState<string>("all_day");
  const [dayTimeFrames, setDayTimeFrames] = useState<DayTimeFrame[]>([]);
  const [selectedDayForFrame, setSelectedDayForFrame] = useState<string>("");
  const [frameStartTime, setFrameStartTime] = useState<string>("09:00");
  const [frameEndTime, setFrameEndTime] = useState<string>("21:00");

  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);

  useEffect(() => {
    if (addressData.length > 0) {
      const defaultAddress = addressData.find((addr) => addr.isDefault);
      setSelectedAddressId(
        defaultAddress?.addressId || addressData[0].addressId
      );
    }
  }, [addressData]);

  useEffect(() => {
    if (desiredCategoryId) {
      getSubCategories(desiredCategoryId);
    }
  }, [desiredCategoryId]);

  useEffect(() => {
    if (selectedCategory) {
      getSubCategories(selectedCategory.id);
    }
  }, [selectedCategory]);

  const conditions: ConditionOption[] = [
    { id: ItemCondition.NEW, name: "Mới" },
    { id: ItemCondition.USED, name: "Đã sử dụng" },
  ];

  const WEEKDAYS = [
    { label: "Thứ 2", value: "mon" },
    { label: "Thứ 3", value: "tue" },
    { label: "Thứ 4", value: "wed" },
    { label: "Thứ 5", value: "thu" },
    { label: "Thứ 6", value: "fri" },
    { label: "Thứ 7", value: "sat" },
    { label: "Chủ nhật", value: "sun" },
  ];

  const handleAddTimeFrame = () => {
    if (!selectedDayForFrame) {
      Alert.alert("Lỗi!", "Vui lòng chọn ngày");
      return;
    }

    if (selectedDayForFrame === "all") {
      setDayTimeFrames([
        {
          day: "all",
          startTime: frameStartTime,
          endTime: frameEndTime,
        },
      ]);
      return;
    }

    if (dayTimeFrames.some((frame) => frame.day === selectedDayForFrame)) {
      Alert.alert("Lỗi!", "Ngày này đã có giờ");
      return;
    }

    const start = parseInt(frameStartTime.replace(":", ""));
    const end = parseInt(frameEndTime.replace(":", ""));
    if (start >= end) {
      Alert.alert("Lỗi!", "Giờ kết thúc phải sau giờ bắt đầu");
      return;
    }

    setDayTimeFrames((prev) => [
      ...prev,
      {
        day: selectedDayForFrame,
        startTime: frameStartTime,
        endTime: frameEndTime,
      },
    ]);

    console.log("Day time frames:", dayTimeFrames);

    setSelectedDayForFrame("");
  };

  const handleRemoveTimeFrame = (day: string) => {
    setSelectedDayForFrame("");
    setDayTimeFrames((prev) => prev.filter((frame) => frame.day !== day));
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

  const handlePostTypeChange = (type: "exchange" | "gift") => {
    if (type === "exchange") {
      setIsExchange(true);
      setIsGift(false);
    } else {
      setIsExchange(false);
      setIsGift(true);
    }
  };

  const handleCategoryChange = async (categoryId: string) => {
    const category = categories.find((cat) => cat.id === categoryId);
    setSelectedCategory(category || null);
    setSelectedSubCategory(null);

    if (category) {
      setCategoryStore(category);
      setSubCategoryStore(null);
      await getSubCategories(category.id);
    }
  };

  const handleSubCategoryChange = (subCategoryId: string) => {
    const subCategory = subCategories.find(
      (subCat) => subCat.id === subCategoryId
    );
    setSelectedSubCategory(subCategory || null);
    if (subCategory) {
      setSubCategoryStore(subCategory);
    }
  };

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

  const validateForm = () => {
    if (!title.trim()) {
      Alert.alert("Error", "Vui lòng nhập tiêu đề tin đăng");
      return false;
    }
    if (!description.trim()) {
      Alert.alert("Error", "Vui lòng nhập mô tả chi tiết");
      return false;
    }
    if (!selectedCategory) {
      Alert.alert("Error", "Vui lòng chọn danh mục");
      return false;
    }
    if (!condition) {
      Alert.alert("Error", "Vui lòng chọn tình trạng sản phẩm");
      return false;
    }
    if (images.length === 0) {
      Alert.alert("Error", "Vui lòng tải lên ít nhất 1 ảnh");
      return false;
    }
    if (!timePreference) {
      Alert.alert("Error", "Vui lòng chọn giờ nhận");
      return false;
    }
    if (!desiredCategoryId && isExchange) {
      Alert.alert("Error", "Vui lòng chọn sản phẩm mong muốn trao đổi");
      return false;
    }
    return true;
  };

  const uploadImageToCloudinary = async (uri: string): Promise<string> => {
    try {
      console.log("Starting upload process with URI:", uri);

      // Create file object
      const filename = uri.split("/").pop() || "photo.jpg";
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : "image/jpeg";

      console.log("File details:", {
        filename,
        type,
      });

      const formData = new FormData();

      // Append file with proper structure
      const fileData = {
        uri: Platform.OS === "ios" ? uri.replace("file://", "") : uri,
        name: filename,
        type: type,
      };

      const CLOUDINARY_UPLOAD_PRESET = "gift_system";
      const CLOUDINARY_URL =
        "https://api.cloudinary.com/v1_1/dt4ianp80/image/upload";

      console.log("FormData file object:", fileData);
      formData.append("file", fileData as any);
      formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

      console.log("Cloudinary URL:", CLOUDINARY_URL);
      console.log("Upload preset:", CLOUDINARY_UPLOAD_PRESET);

      const response = await fetch(CLOUDINARY_URL, {
        method: "POST",
        body: formData,
        headers: {
          Accept: "application/json",
          "Content-Type": "multipart/form-data",
        },
      });

      console.log("Response status:", response.status);

      // Get detailed error message if available
      const responseData = await response.json();
      console.log("Response data:", responseData);

      if (!response.ok) {
        throw new Error(
          `Upload failed: ${response.status} - ${JSON.stringify(responseData)}`
        );
      }

      return responseData.secure_url;
    } catch (error: any) {
      console.error("Detailed upload error:", {
        message: error.message,
        stack: error.stack,
      });
      throw error;
    }
  };

  const handleImageUpload = async () => {
    try {
      setIsUploadingImage(true);
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });

      if (!result.canceled) {
        const uri = result.assets[0].uri;
        setSelectedImage(uri);

        const imageUrl = await uploadImageToCloudinary(uri);
        setImages((prev) => [...prev, imageUrl]);
        console.log("Image uploaded successfully:", imageUrl);
      }
    } catch (error) {
      console.error("Image upload error:", error);
      Alert.alert("Upload Failed", "Please try again");
    } finally {
      setIsUploadingImage(false);
    }
  };

  const uploadVideoToCloudinary = async (uri: string): Promise<string> => {
    try {
      console.log("Starting video upload process with URI:", uri);

      const filename = uri.split("/").pop() || "video.mp4";
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `video/${match[1]}` : "video/mp4";

      console.log("Video file details:", {
        filename,
        type,
      });

      const formData = new FormData();

      const fileData = {
        uri: Platform.OS === "ios" ? uri.replace("file://", "") : uri,
        name: filename,
        type: type,
      };

      const CLOUDINARY_UPLOAD_PRESET = "gift_system";
      const CLOUDINARY_URL =
        "https://api.cloudinary.com/v1_1/dt4ianp80/video/upload";

      console.log("FormData video object:", fileData);
      formData.append("file", fileData as any);
      formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

      console.log("Sending video upload request to Cloudinary...");
      console.log("Cloudinary URL:", CLOUDINARY_URL);

      const response = await fetch(CLOUDINARY_URL, {
        method: "POST",
        body: formData,
        headers: {
          Accept: "application/json",
          "Content-Type": "multipart/form-data",
        },
      });

      console.log("Video upload response status:", response.status);

      const responseData = await response.json();
      console.log("Video upload response data:", responseData);

      if (!response.ok) {
        throw new Error(
          `Video upload failed: ${response.status} - ${JSON.stringify(
            responseData
          )}`
        );
      }

      return responseData.secure_url;
    } catch (error: any) {
      console.error("Detailed video upload error:", {
        message: error.message,
        stack: error.stack,
      });
      throw error;
    }
  };

  const pickVideo = async () => {
    try {
      console.log("Starting video picker...");

      setIsUploadingVideo(true);

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        allowsEditing: true,
        aspect: [16, 9],
        quality: 1,
        videoMaxDuration: 60,
      });

      console.log("Video picker result:", result);

      if (!result.canceled) {
        const uri = result.assets[0].uri;
        console.log("Selected video URI:", uri);

        const videoUrl = await uploadVideoToCloudinary(uri);
        console.log("Video uploaded successfully to Cloudinary:", videoUrl);

        setVideo(videoUrl);
      }
    } catch (error) {
      console.error("Error in video picking/upload process:", error);
      Alert.alert("Upload Failed", "Failed to upload video. Please try again");
    } finally {
      setIsUploadingVideo(false);
    }
  };

  const removeVideo = () => {
    console.log("Removing video from state");
    setVideo("");
  };

  const removeImage = (index: number) => {
    const newImages = images.filter((_, idx) => idx !== index);
    setImages(newImages);
  };

  const handleAlertConfirm = () => {
    setShowSuccessAlert(false);
    navigation.navigate("Main", {
      screen: "Home",
    });
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    console.log("Submitting post:");

    try {
      setIsLoading(true);

      const postData = {
        name: title.trim(),
        description: description.trim(),
        categoryId: selectedSubCategory!.id,
        isGift: isGift,
        quantity: 1,
        condition: condition,
        images,
        video,
        availableTime: getAvailableTimeString(timePreference),
        addressId: selectedAddressId,
        desiredCategoryId: desiredCategoryId === "" ? null : desiredCategoryId,
      };

      console.log("Form Data: ", postData);

      // const response = await submitPost(postData);

      // console.log("Submit response:", response);

      // if (response === true) {
      //   setShowSuccessAlert(true);
      // }
    } catch (error) {
      Alert.alert("Error", "Failed to create post");
      console.error("Submit error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartTimePress = () => {
    setShowStartTimePicker(true);
  };

  const handleEndTimePress = () => {
    setShowEndTimePicker(true);
  };

  const CustomPerDayTimeSection = () => {
    return (
      <View style={styles.customPerDayContainer}>
        <Text style={styles.timeSelectionHeader}>
          Chọn thời gian có thể nhận
        </Text>

        {/* Day Selection Grid */}
        <View style={styles.daySelectionGrid}>
          <TouchableOpacity
            style={[
              styles.dayChip,
              selectedDayForFrame === "all" && styles.dayChipSelected,
            ]}
            onPress={() => setSelectedDayForFrame("all")}
          >
            <Text
              style={[
                styles.dayChipText,
                selectedDayForFrame === "all" && styles.dayChipTextSelected,
              ]}
            >
              Tất cả các ngày
            </Text>
          </TouchableOpacity>
          {WEEKDAYS.map((day) => {
            const isSelected = day.value === selectedDayForFrame;
            const isDisabled =
              dayTimeFrames.some((frame) => frame.day === day.value) ||
              selectedDayForFrame === "all";

            return (
              <TouchableOpacity
                key={day.value}
                style={[
                  styles.dayChip,
                  isSelected && styles.dayChipSelected,
                  isDisabled && styles.dayChipDisabled,
                ]}
                onPress={() => setSelectedDayForFrame(day.value)}
                disabled={isDisabled}
              >
                <Text
                  style={[
                    styles.dayChipText,
                    isSelected && styles.dayChipTextSelected,
                    isDisabled && styles.dayChipTextDisabled,
                  ]}
                >
                  {day.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Time Selection */}
        {selectedDayForFrame && (
          <View style={styles.timePickerContainer}>
            <Text style={styles.timeFrameLabel}>
              Chọn giờ có thể nhận cho{" "}
              {selectedDayForFrame === "all"
                ? "tất cả các ngày"
                : WEEKDAYS.find((d) => d.value === selectedDayForFrame)?.label}
            </Text>

            <View style={styles.timePickersRow}>
              <View style={styles.timePickerWrapper}>
                <Text style={styles.timeLabel}>Từ</Text>
                <View style={styles.timeInputContainer}>
                  <TextInput
                    style={styles.timeInput}
                    value={frameStartTime}
                    editable={false}
                    placeholder="00:00"
                  />
                  <TouchableOpacity
                    style={styles.timePickerButton}
                    onPress={handleStartTimePress}
                  >
                    <Text style={styles.timePickerButtonText}>▼</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.timePickerWrapper}>
                <Text style={styles.timeLabel}>Đến</Text>
                <View style={styles.timeInputContainer}>
                  <TextInput
                    style={styles.timeInput}
                    value={frameEndTime}
                    editable={false}
                    placeholder="00:00"
                  />
                  <TouchableOpacity
                    style={styles.timePickerButton}
                    onPress={handleEndTimePress}
                  >
                    <Text style={styles.timePickerButtonText}>▼</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {showStartTimePicker && (
              <Picker
                selectedValue={frameStartTime}
                onValueChange={(itemValue) => {
                  setFrameStartTime(itemValue);
                  setShowStartTimePicker(false);
                }}
              >
                {TIME_SLOTS.map((slot) => (
                  <Picker.Item
                    key={slot.value}
                    label={slot.label}
                    value={slot.value}
                  />
                ))}
              </Picker>
            )}

            {showEndTimePicker && (
              <Picker
                selectedValue={frameEndTime}
                onValueChange={(itemValue) => {
                  setFrameEndTime(itemValue);
                  setShowEndTimePicker(false);
                }}
              >
                {TIME_SLOTS.map((slot) => (
                  <Picker.Item
                    key={slot.value}
                    label={slot.label}
                    value={slot.value}
                  />
                ))}
              </Picker>
            )}

            <TouchableOpacity
              style={styles.addFrameButton}
              onPress={handleAddTimeFrame}
            >
              <Text style={styles.addFrameButtonText}>Thêm thời gian</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Selected Time Frames */}
        {dayTimeFrames.length > 0 && (
          <View style={styles.selectedFramesContainer}>
            <Text style={styles.selectedFramesTitle}>Thời gian đã chọn:</Text>
            {dayTimeFrames.map((frame) => (
              <View key={frame.day} style={styles.selectedFrameCard}>
                <View style={styles.frameInfo}>
                  <Text style={styles.frameDayText}>
                    {frame.day === "all"
                      ? "Tất cả các ngày"
                      : WEEKDAYS.find((d) => d.value === frame.day)?.label}
                  </Text>
                  <Text style={styles.frameTimeText}>
                    {frame.startTime} - {frame.endTime}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => handleRemoveTimeFrame(frame.day)}
                  style={styles.removeButton}
                >
                  <Text style={styles.removeIcon}>×</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
      </View>
    );
  };

  // Định dạng data cho dropdown
  const categoryData = categories.map((cat) => ({
    label: cat.name,
    value: cat.id,
  }));

  const subCategoryData = subCategories.map((subCat) => ({
    label: subCat.name,
    value: subCat.id,
  }));

  const conditionData = conditions.map((condition) => ({
    label: condition.name,
    value: condition.id,
  }));

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Đăng Tin</Text>
        <View style={styles.headerSpace} />
      </View>

      <ScrollView style={styles.content}>
        {/* Category Selector */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Danh Mục</Text>
          <View style={styles.categoryContainer}>
            <Dropdown
              style={styles.dropdown}
              placeholderStyle={styles.placeholderStyle}
              selectedTextStyle={styles.selectedTextStyle}
              data={categoryData}
              maxHeight={300}
              labelField="label"
              valueField="value"
              placeholder="Chọn danh mục"
              value={selectedCategory?.id}
              onChange={(item) => {
                handleCategoryChange(item.value);
              }}
            />

            {selectedCategory && (
              <Dropdown
                style={styles.dropdown}
                placeholderStyle={styles.placeholderStyle}
                selectedTextStyle={styles.selectedTextStyle}
                data={subCategoryData}
                maxHeight={300}
                labelField="label"
                valueField="value"
                placeholder="Chọn danh mục phụ"
                value={selectedSubCategory?.id}
                onChange={(item) => {
                  handleSubCategoryChange(item.value);
                }}
              />
            )}
          </View>

          {/* Condition Dropdown */}
          <View style={[styles.pickerWrapper, styles.conditionWrapper]}>
            <Dropdown
              style={styles.dropdown}
              placeholderStyle={styles.placeholderStyle}
              selectedTextStyle={styles.selectedTextStyle}
              data={conditionData}
              maxHeight={300}
              labelField="label"
              valueField="value"
              placeholder="Chọn tình trạng sản phẩm"
              value={condition}
              onChange={(item) => {
                setCondition(item.value);
              }}
            />
          </View>
        </View>

        {/* Media Upload Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>THÔNG TIN CHI TIẾT</Text>

          <MediaUploadSection
            images={images}
            video={video}
            selectedImage={selectedImage}
            isLoading={isUploadingImage}
            isVideoLoading={isUploadingVideo}
            onPickImage={handleImageUpload}
            onPickVideo={pickVideo}
            onRemoveImage={removeImage}
            onRemoveVideo={removeVideo}
          />
        </View>

        {/* Post Type Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>HÌNH THỨC</Text>
          <View style={styles.postTypeContainer}>
            <RadioButton.Group
              onValueChange={(value) =>
                handlePostTypeChange(value as "exchange" | "gift")
              }
              value={isExchange ? "exchange" : "gift"}
            >
              <View style={styles.radioOption}>
                <RadioButton.Item
                  label="Tôi muốn trao đổi"
                  value="exchange"
                  position="trailing"
                />
              </View>
              <View style={styles.radioOption}>
                <RadioButton.Item
                  label="Tôi muốn cho tặng miễn phí"
                  value="gift"
                  position="trailing"
                />
              </View>
            </RadioButton.Group>
          </View>

          {/* Desired Category Dropdown (for exchange) */}
          {isExchange && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Danh mục muốn trao đổi</Text>
              <Dropdown
                style={styles.dropdown}
                placeholderStyle={styles.placeholderStyle}
                selectedTextStyle={styles.selectedTextStyle}
                data={categoryData}
                maxHeight={300}
                labelField="label"
                valueField="value"
                placeholder="Chọn danh mục"
                value={desiredCategoryId}
                onChange={(item) => {
                  setDesiredCategoryId(item.value);
                  setDesiredSubCategoryId(null);
                }}
              />

              {desiredCategoryId && (
                <Dropdown
                  style={[styles.dropdown, { marginTop: 12 }]}
                  placeholderStyle={styles.placeholderStyle}
                  selectedTextStyle={styles.selectedTextStyle}
                  data={subCategoryData}
                  maxHeight={300}
                  labelField="label"
                  valueField="value"
                  placeholder="Chọn danh mục phụ"
                  value={desiredSubCategoryId}
                  onChange={(item) => {
                    setDesiredSubCategoryId(item.value);
                  }}
                />
              )}
            </View>
          )}
        </View>

        {/* Title and Description */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            TIÊU ĐỀ TIN ĐĂNG VÀ MÔ TẢ CHI TIẾT
          </Text>

          <TextInput
            style={styles.input}
            placeholder="Tiêu đề tin đăng"
            value={title}
            onChangeText={setTitle}
            onFocus={() => setShowTitleHint(true)}
            onBlur={() => setShowTitleHint(false)}
          />
          {showTitleHint && (
            <Text style={styles.hint}>
              Tiêu đề tốt nên ngắn gọn, đầy đủ thông tin quan trọng
            </Text>
          )}

          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Mô tả chi tiết"
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
            onFocus={() => setShowDescriptionHint(true)}
            onBlur={() => setShowDescriptionHint(false)}
          />

          {showDescriptionHint && (
            <Text style={styles.hint}>
              Không được phép ghi thông tin liên hệ trong mô tả
            </Text>
          )}
        </View>

        {/* Time Availability Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>THỜI GIAN CÓ THỂ NHẬN</Text>
          <RadioButton.Group
            onValueChange={(value) => setTimePreference(value)}
            value={timePreference}
          >
            <View style={styles.radioOption}>
              <RadioButton.Item
                label="Cả ngày (9h - 21h hằng ngày)"
                value="allDay"
                position="trailing"
              />
            </View>
            <View style={styles.radioOption}>
              <RadioButton.Item
                label="Giờ hành chính (9h - 17h)"
                value="officeHours"
                position="trailing"
              />
            </View>
            <View style={styles.radioOption}>
              <RadioButton.Item
                label="Chỉ buổi tối (17h - 21h)"
                value="evening"
                position="trailing"
              />
            </View>
            <View style={styles.radioOption}>
              <RadioButton.Item
                label="Khung giờ tự chọn"
                value="custom"
                position="trailing"
              />
            </View>
          </RadioButton.Group>

          {timePreference === "custom" && <CustomPerDayTimeSection />}
        </View>

        {/* Address Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ĐỊA CHỈ</Text>
          {loading ? (
            <ActivityIndicator size="small" color="#0000ff" />
          ) : (
            <View style={styles.addressContainer}>
              {addressData.map((address) => (
                <TouchableOpacity
                  key={address.addressId}
                  style={[
                    styles.addressCard,
                    selectedAddressId === address.addressId &&
                      styles.selectedAddressCard,
                  ]}
                  onPress={() => setSelectedAddressId(address.addressId)}
                >
                  <View style={styles.addressRadioContainer}>
                    <View style={styles.radioOuter}>
                      {selectedAddressId === address.addressId && (
                        <View style={styles.radioInner} />
                      )}
                    </View>
                    <View style={styles.addressTextContainer}>
                      <Text style={styles.addressText}>{address.address}</Text>
                      {address.isDefault && (
                        <Text style={styles.defaultBadge}>Mặc định</Text>
                      )}
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Terms and Conditions Checkbox */}
        <View style={styles.section}>
          <CustomCheckbox
            checked={isTermsAccepted}
            onPress={() => setIsTermsAccepted(!isTermsAccepted)}
            label="Tôi cam kết các thông tin là chính xác và đúng với thực tế"
          />
        </View>
      </ScrollView>

      {/* Footer Buttons */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.footerButton, styles.previewButton]}
          onPress={() => {
            /* Handle preview */
          }}
        >
          <Text style={{ color: "black" }}>Xem trước</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.footerButton,
            styles.publishButton,
            !isTermsAccepted && styles.disabledButton,
          ]}
          onPress={handleSubmit}
          disabled={!isTermsAccepted}
        >
          <Text style={styles.buttonText}>Đăng bài</Text>
        </TouchableOpacity>
      </View>

      {/* Alert */}
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
  section: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 12,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 8,
    marginBottom: 12,
  },
  mediaButtons: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 12,
  },
  uploadButton: {
    padding: 12,
    backgroundColor: "#f0f0f0",
    borderRadius: 8,
  },
  imageContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 12,
  },
  thumbnail: {
    width: 80,
    height: 80,
    borderRadius: 4,
  },
  videoPreview: {
    width: "100%",
    height: 200,
    marginBottom: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  textArea: {
    height: 120,
    textAlignVertical: "top",
  },
  hint: {
    color: "#666",
    fontSize: 12,
    marginBottom: 12,
    fontStyle: "italic",
  },
  addressContainer: {
    backgroundColor: "#f5f5f5",
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
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
  previewButton: {
    backgroundColor: "#f0f0f0",
  },
  publishButton: {
    backgroundColor: "#f97314",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  postTypeContainer: {
    marginBottom: 16,
  },
  radioOption: {
    marginVertical: 4,
  },
  exchangeHint: {
    color: "#666",
    fontSize: 14,
    fontStyle: "italic",
    marginTop: 8,
    padding: 12,
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
  },
  timePicker: {
    flex: 1,
    marginLeft: 8,
  },
  picker: {
    height: 50,
    width: "100%",
  },
  addressCard: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: "#fff",
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  selectedAddressCard: {
    borderColor: Colors.orange500,
    backgroundColor: Colors.orange50,
  },
  addressRadioContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  radioOuter: {
    height: 20,
    width: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: Colors.orange500,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  radioInner: {
    height: 10,
    width: 10,
    borderRadius: 5,
    backgroundColor: Colors.orange500,
  },
  addressTextContainer: {
    flex: 1,
  },
  addressText: {
    fontSize: 14,
    color: "#333",
  },
  defaultBadge: {
    fontSize: 12,
    color: Colors.orange500,
    marginTop: 4,
  },
  categoryContainer: {
    gap: 12,
  },
  selectedCategoryDisplay: {
    backgroundColor: Colors.orange50,
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  selectedCategoryText: {
    color: Colors.orange600,
    fontWeight: "500",
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
  },
  dateButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1ABC9C",
    padding: 10,
    borderRadius: 5,
    flex: 1,
    marginHorizontal: 5,
  },
  customTimeContainer: {
    gap: 16,
    marginTop: 16,
  },
  timeSection: {
    padding: 16,
    borderRadius: 12,
    elevation: 2,
  },
  weekdaySection: {
    padding: 16,
    borderRadius: 12,
    elevation: 2,
  },
  timePickersRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 16,
    marginTop: 8,
  },
  timePickerWrapper: {
    flex: 1,
  },
  timeLabel: {
    fontSize: 15,
    color: Colors.gray700,
    marginBottom: 8,
  },
  timeInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.gray300,
    borderRadius: 8,
    backgroundColor: "#fff",
    overflow: "hidden",
  },
  timeInput: {
    flex: 1,
    height: 44,
    paddingHorizontal: 12,
    fontSize: 16,
    color: Colors.gray800,
  },
  timePickerButton: {
    padding: 12,
    borderLeftWidth: 1,
    borderLeftColor: Colors.gray300,
  },
  timePickerButtonText: {
    fontSize: 12,
    color: Colors.gray600,
  },
  addFrameButton: {
    backgroundColor: Colors.orange500,
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 16,
  },
  addFrameButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "500",
  },
  selectedFramesContainer: {
    backgroundColor: "#f5f5f5",
    padding: 16,
    borderRadius: 12,
  },
  selectedFramesTitle: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 12,
  },
  timeFrameItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "white",
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  timeFrameText: {
    flex: 1,
  },
  removeFrameButton: {
    padding: 4,
  },
  removeFrameButtonText: {
    color: Colors.orange500,
    fontSize: 16,
  },
  timeSelectionHeader: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 16,
    color: Colors.gray800,
  },
  daySelectionGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 16,
  },
  dayChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.orange300,
  },
  dayChipSelected: {
    backgroundColor: Colors.orange500,
  },
  dayChipDisabled: {
    borderColor: Colors.gray300,
    backgroundColor: Colors.gray100,
  },
  dayChipText: {
    color: Colors.orange500,
    fontSize: 14,
  },
  dayChipTextSelected: {
    color: "white",
  },
  dayChipTextDisabled: {
    color: Colors.gray400,
  },
  timePickerContainer: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  selectedFrameCard: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  frameInfo: {
    flex: 1,
  },
  frameDayText: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.gray800,
    marginBottom: 4,
  },
  frameTimeText: {
    fontSize: 14,
    color: Colors.gray600,
  },
  removeButton: {
    padding: 8,
  },
  removeIcon: {
    color: Colors.lightRed,
    fontSize: 20,
  },
  checkboxContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  disabledButton: {
    backgroundColor: "#ccc",
  },
  customPerDayContainer: {
    padding: 16,
    backgroundColor: "#fff",
    borderRadius: 12,
  },
  timeFrameLabel: {
    fontSize: 15,
    color: Colors.gray700,
    marginBottom: 12,
  },
  pickerWrapper: {
    marginBottom: 12,
  },
  customInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.gray300,
    borderRadius: 8,
    backgroundColor: "#fff",
    overflow: "hidden",
  },
  customInput: {
    flex: 1,
    height: 44,
    paddingHorizontal: 12,
    fontSize: 16,
    color: Colors.gray800,
  },
  dropdownButton: {
    padding: 12,
    borderLeftWidth: 1,
    borderLeftColor: Colors.gray300,
  },
  dropdownButtonText: {
    fontSize: 12,
    color: Colors.gray600,
  },
  conditionWrapper: {
    marginTop: 16,
  },
  customCheckboxContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 8,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: Colors.orange500,
    backgroundColor: "white",
    marginRight: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  checkboxChecked: {
    backgroundColor: Colors.orange500,
  },
  checkmark: {
    color: "white",
    fontSize: 14,
    fontWeight: "bold",
  },
  checkboxLabel: {
    fontSize: 15,
    color: Colors.gray800,
    flex: 1,
  },
  dropdown: {
    height: 50,
    borderColor: Colors.gray300,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    backgroundColor: "white",
  },
  placeholderStyle: {
    fontSize: 16,
    color: Colors.gray500,
  },
  selectedTextStyle: {
    fontSize: 16,
    color: Colors.gray800,
  },
});

export default CreatePostScreen;
