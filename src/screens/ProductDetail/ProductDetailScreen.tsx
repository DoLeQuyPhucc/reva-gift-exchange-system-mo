import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  View,
  Image,
  ScrollView,
  Text,
  TouchableOpacity,
  Modal,
  TextInput,
  Pressable,
  Platform,
} from "react-native";
import { RouteProp, useRoute } from "@react-navigation/native";
import Icon from "react-native-vector-icons/MaterialIcons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { DayTimeRange, Product } from "@/src/shared/type";
import axiosInstance from "@/src/api/axiosInstance";
import { Button } from "react-native";
import { formatDate, formatDate_DD_MM_YYYY } from "@/src/shared/formatDate";
import { RootStackParamList } from "@/src/layouts/types/navigationTypes";
import Colors from "@/src/constants/Colors";
import MediaUploadSection from "@/src/components/MediaUploadSection";
import * as ImagePicker from "expo-image-picker";
import { useAuthCheck } from "@/src/hooks/useAuth";
import { useNavigation } from "@/src/hooks/useNavigation";
import { CustomAlert } from "@/src/components/CustomAlert";
import DateTimePickerCustom, {
  convertDayOfWeek,
} from "@/src/components/modal/DateTimePickerCustom";

type TimeSlot = {
  id: string;
  dateTime: string;
  displayText: string;
};

type ProductDetailScreenRouteProp = RouteProp<
  RootStackParamList,
  "ProductDetail"
>;

export default function ProductDetailScreen() {
  const route = useRoute<ProductDetailScreenRouteProp>();
  const itemId = route.params.productId;

  const { isAuthenticated } = useAuthCheck();
  const navigation = useNavigation();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [requestMessage, setRequestMessage] = useState("");
  const [showRequestDialog, setShowRequestDialog] = useState(false);

  const [moreImages, setMoreImages] = useState<string[]>([]);
  const [isUploadingImage, setIsUploadingImage] = useState<boolean>(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const [userItems, setUserItems] = useState<Product[]>([]);
  const [selectedUserItem, setSelectedUserItem] = useState<Product | null>(
    null
  );
  const [loadingUserItems, setLoadingUserItems] = useState(false);

  const [wannaRequest, setWannaRequest] = useState(false);
  const [isTrue, setIsTrue] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedTimeSlots, setSelectedTimeSlots] = useState<TimeSlot[]>([]);
  const [selectedHour, setSelectedHour] = useState<number | null>(null);
  const [selectedMinute, setSelectedMinute] = useState<number | null>(null);
  const [showHourModal, setShowHourModal] = useState(false);
  const [showMinuteModal, setShowMinuteModal] = useState(false);
  const [timeInputError, setTimeInputError] = useState("");
  const [startHour, setStartHour] = useState(9);
  const [endHour, setEndHour] = useState(17);
  const [daysOnly, setDaysOnly] = useState("mon_tue_wed_thu_fri_sat_sun");
  const [timeRanges, setTimeRanges] = useState<DayTimeRange[]>([]);

  const [showAlertDialog, setShowAlertDialog] = useState(false);
  const [alertData, setAlertData] = useState({
    title: "",
    message: "",
  });

  useEffect(() => {
    const fetchProduct = async () => {
      if (!itemId) {
        setError("Invalid product ID");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await axiosInstance.get(`/items/${itemId}`);

        if (response.data.isSuccess && response.data.data) {
          console.log("Product:", response.data.data);
          setProduct(response.data.data);
          setCustomTimeRanges(
            response.data.data?.availableTime || "officeHours 9:00_17:00"
          );
          console.log("Product:", response.data.data);
        } else {
          throw new Error(response.data.message || "Failed to fetch product");
        }
      } catch (error) {
        console.error("Error fetching product:", error);
        setError("Không thể tải thông tin sản phẩm");
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [itemId]);

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

      const fileData = {
        uri: Platform.OS === "ios" ? uri.replace("file://", "") : uri,
        name: filename,
        type: type,
      };

      const CLOUDINARY_UPLOAD_PRESET = "gift_system";
      const CLOUDINARY_URL =
        "https://api.cloudinary.com/v1_1/dt4ianp80/image/upload";

      formData.append("file", fileData as any);
      formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

      const response = await fetch(CLOUDINARY_URL, {
        method: "POST",
        body: formData,
        headers: {
          Accept: "application/json",
          "Content-Type": "multipart/form-data",
        },
      });

      // Get detailed error message if available
      const responseData = await response.json();

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
      setSelectedUserItem(null);
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
        setMoreImages((prev) => [...prev, imageUrl]);
        setAlertData({
          title: "Thành công",
          message: "Tải hình ảnh lên thành công!",
        });
        setShowAlertDialog(true);
      }
    } catch (error) {
      setAlertData({
        title: "Thất bại",
        message: "Tải hình ảnh lên thất bại! Vui lòng thử lại.",
      });
      setShowAlertDialog(true);
    } finally {
      setIsUploadingImage(false);
    }
  };

  const removeImage = (index: number) => {
    const newImages = moreImages.filter((_, idx) => idx !== index);
    setMoreImages(newImages);
  };
  const parseCustomPerDay = (rangeString: string): DayTimeRange[] => {
    const [type, ...dayRanges] = rangeString.split(" ");
    
    if (type !== "customPerDay") return [];
    
    return dayRanges.join(" ").split("|").map(dayRange => {
      const [hours, day] = dayRange.trim().split(" ");
      const [start, end] = hours.split("_").map(hour => {
        // Chuyển đổi format "HH:mm" thành số
        const [h] = hour.split(":");
        return parseInt(h);
      });
      
      return {
        day: day,
        startHour: start,
        endHour: end
      };
    });
  };
  
  const setCustomTimeRanges = (range: string) => {
    const [type] = range.split(" ");
    
    if (type === "customPerDay") {
      const timeRanges = parseCustomPerDay(range);
      console.log("Time ranges:", timeRanges);
      setTimeRanges(timeRanges); // Thêm state mới để lưu timeRanges
      setDaysOnly(timeRanges.map(r => r.day).join("_"));
    } else {
      // Logic cũ cho officeHours
      const [, hours, daysOnly] = range.split(" ");
      const [start, end] = hours.split("_").map((hour) => parseInt(hour));
      setStartHour(start);
      setEndHour(end);
      setDaysOnly(daysOnly);
    }
  };
  

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setSelectedDate(selectedDate);
    }
  };

  const getTimeRangeForSelectedDate = (date: Date): { start: number; end: number } | null => {
  const dayIndex = date.getDay();
  const dayMap: { [key: string]: number } = {
    sun: 0, mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6
  };

  if (timeRanges.length > 0) {
    const dayName = Object.keys(dayMap).find(key => dayMap[key] === dayIndex);
    const timeRange = timeRanges.find(range => range.day.toLowerCase() === dayName);
    
    if (timeRange) {
      return {
        start: timeRange.startHour,
        end: timeRange.endHour
      };
    }
    return null;
  } else {
    return {
      start: startHour,
      end: endHour
    };
  }
};

const generateHourRange = () => {
  const timeRange = getTimeRangeForSelectedDate(selectedDate);
  
  if (!timeRange) return []; // Trả về mảng rỗng nếu không có khung giờ hợp lệ

  const { start, end } = timeRange;

  // Nếu start <= end, tạo range bình thường
  if (start <= end) {
    return Array.from({ length: end - start }, (_, i) => start + i);
  }
  // Nếu start > end (qua nửa đêm), tạo range bao quanh 24h
  else {
    return [
      ...Array.from({ length: 24 - start }, (_, i) => start + i),
      ...Array.from({ length: end + 1 }, (_, i) => i),
    ];
  }
};
const formatTimeRanges = (timeRanges: DayTimeRange[]): string => {
  if (!timeRanges || timeRanges.length === 0) {
    return `từ ${startHour}:00 - ${endHour - 1}:59, ${convertDayOfWeek(daysOnly)}`;
  }

  return timeRanges
    .map(range => {
      const dayName = convertDayOfWeek(range.day);
      return `${range.startHour}:00-${range.endHour - 1}:59 ${dayName}`;
    })
    .join(', ');
};


  // Generate hour and minute arrays
  const hours = generateHourRange();
  const minutes = Array.from({ length: 60 }, (_, i) => i);
  const validateTimeInput = () => {
    // Kiểm tra xem đã chọn cả giờ và phút chưa
    if (selectedHour === null || selectedMinute === null) {
      setTimeInputError("Vui lòng chọn đầy đủ giờ và phút");
      return false;
    }
  
    const timeRange = getTimeRangeForSelectedDate(selectedDate);
    if (!timeRange) {
      setTimeInputError("Ngày này không có khung giờ hợp lệ");
      return false;
    }
  
    const { start, end } = timeRange;
  
    // Kiểm tra giờ có nằm trong khung giờ cho phép không
    if (selectedHour < start || selectedHour >= end) {
      setTimeInputError(`Giờ phải từ ${start}:00 đến ${end - 1}:59`);
      return false;
    }
  
    // Xóa lỗi nếu có
    setTimeInputError("");
    return true;
  };
  
  // Add time slot
  const addTimeSlot = () => {
    // Validate input before adding
    if (!validateTimeInput()) return;

    if (selectedTimeSlots.length >= 1) {
      setTimeInputError("Bạn chỉ được chọn tối đa 1 khung thời gian");
      return;
    }

    // Format time with leading zeros
    const formattedHour = selectedHour!.toString().padStart(2, "0");
    const formattedMinute = selectedMinute!.toString().padStart(2, "0");
    const timeStr = `${formattedHour}:${formattedMinute}:00`;

    // Construct date time string
    const dateStr = selectedDate.toISOString().split("T")[0];
    const dateTimeStr = `${dateStr} ${timeStr}`;

    const newSlot: TimeSlot = {
      id: Math.random().toString(),
      dateTime: dateTimeStr,
      displayText: `${formattedHour}:${formattedMinute} ${formatDate_DD_MM_YYYY(
        selectedDate.toISOString()
      )}`,
    };

    setSelectedTimeSlots((prev) => [...prev, newSlot]);

    // Reset selections
    setSelectedHour(null);
    setSelectedMinute(null);
  };

  // Remove time slot
  const removeTimeSlot = (slotId: string) => {
    setSelectedTimeSlots((prev) => prev.filter((slot) => slot.id !== slotId));
  };

  const fetchUserItems = async () => {
    setLoadingUserItems(true);
    try {
      const response = await axiosInstance.get(`/items/current-user`);
      if (response.data.isSuccess) {
        setUserItems(response.data.data["ApprovedItems"]);
      }
    } catch (error) {
      console.error("Error fetching user items:", error);
    } finally {
      setLoadingUserItems(false);
    }
  };

  const handleRequest = async () => {
    if (!isAuthenticated) {
      navigation.navigate("LoginScreen");
      return;
    }

    if (!product) {
      console.error("Product not found");
      return;
    }

    setShowRequestDialog(true);
    await fetchUserItems();
  };

  const handleConfirmRequest = async () => {
    try {
      setShowRequestDialog(false);

      const requestImages = moreImages.length > 0 ? moreImages : null;

      const data = {
        itemId: product?.id,
        message: requestMessage,
        appointmentDate: selectedTimeSlots.map((slot) => slot.dateTime),
        requesterItemId: selectedUserItem?.id || null,
        requestImages: requestImages,
      };

      const response = await axiosInstance.post("/request/create", data);

      if (response.data.isSuccess) {
        // Reset form
        setSelectedTimeSlots([]);
        setRequestMessage("");
        setAlertData({
          title: "Thành công",
          message: "Yêu cầu đã được tạo thành công",
        });
        setShowAlertDialog(true);
      }
    } catch (error) {
      setAlertData({
        title: "Thất bại",
        message:
          error instanceof Error ? error.message : "Bạn không thể tạo yêu cầu",
      });
      setShowAlertDialog(true);
    }
  };

  const handleWannaRequest = () => {
    setIsTrue(false);
    setWannaRequest(true);
  };

  const handleWannaExchange = () => {
    setIsTrue(true);
    setWannaRequest(false);
  };

  const handleCancelRequest = () => {
    setShowRequestDialog(false);
    setRequestMessage("");
    setSelectedUserItem(null);
    setWannaRequest(false);
  };

  // Render modal for hour or minute selection
  const renderPickerModal = (
    visible: boolean,
    setVisible: (show: boolean) => void,
    items: number[],
    selectedItem: number | null,
    setSelectedItem: (item: number) => void,
    title: string
  ) => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={() => setVisible(false)}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>{title}</Text>
          <ScrollView>
            {items.map((item) => (
              <TouchableOpacity
                key={item}
                style={[
                  styles.pickerItem,
                  selectedItem === item && styles.selectedPickerItem,
                ]}
                onPress={() => {
                  setSelectedItem(item);
                  setVisible(false);
                }}
              >
                <Text
                  style={[
                    styles.pickerItemText,
                    selectedItem === item && styles.selectedPickerItemText,
                  ]}
                >
                  {item.toString().padStart(2, "0")}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  const renderUserItems = () => {
    if (loadingUserItems) {
      return (
        <Text style={styles.loadingText}>Đang tải danh sách sản phẩm...</Text>
      );
    }

    if (userItems.length === 0) {
      return (
        <Text style={styles.noItemsText}>
          Bạn chưa có sản phẩm nào để trao đổi
        </Text>
      );
    }

    const handleItemPress = (item: any) => {
      setSelectedUserItem((prevItem) =>
        prevItem?.id === item.id ? null : item
      );
    };

    return (
      <ScrollView horizontal style={styles.userItemsScroll}>
        {userItems.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={[
              styles.userItemCard,
              selectedUserItem?.id === item.id && styles.selectedUserItemCard,
            ]}
            onPress={() => handleItemPress(item)}
          >
            <Image
              source={{ uri: item.images[0] }}
              style={styles.userItemImage}
            />
            <Text style={styles.userItemName} numberOfLines={1}>
              {item.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    );
  };

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingPlaceholder} />
        <View style={styles.loadingPlaceholder} />
        <View style={[styles.loadingPlaceholder, { width: "75%" }]} />
      </View>
    );
  }

  if (!product) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Không tìm thấy sản phẩm</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.imageContainer}>
        <Image source={{ uri: product.images[0] }} style={styles.image} />
      </View>

      <View style={styles.infoContainer}>
        <Text style={styles.title}>{product.name}</Text>

        <View style={styles.badgeContainer}>
          <View style={[styles.badge, { backgroundColor: Colors.orange500 }]}>
            <Text style={styles.badgeText}>
              {product.subCategory.category.name}
            </Text>
          </View>
          <View style={[styles.badge, { backgroundColor: Colors.lightGreen }]}>
            <Text style={styles.badgeText}>{product.condition}</Text>
          </View>
          {product.available ? (
            <View style={[styles.badge, { backgroundColor: "green" }]}>
              <Text style={styles.badgeText}>Còn hàng</Text>
            </View>
          ) : (
            <View style={[styles.badge, { backgroundColor: Colors.orange700 }]}>
              <Text style={styles.badgeText}>Hết hàng</Text>
            </View>
          )}
        </View>

        <Text style={styles.description}>{product.description}</Text>

        <View style={styles.detailsContainer}>
          <View style={styles.detailItem}>
            <Icon name="calendar-month" size={20} />
            <Text style={styles.detailText}>
              Ngày đăng: {formatDate(product.createdAt)}
            </Text>
          </View>
          <View style={styles.detailItem}>
            <Icon name="now-widgets" size={20} />
            <Text style={styles.detailText}>Số lượng: {product.quantity}</Text>
          </View>
          <View style={styles.detailItem}>
            <Icon name="loop" size={20} />
            <Text style={styles.detailText}>
              Tình trạng: {product.condition}
            </Text>
          </View>
          <View style={styles.detailItem}>
            <Icon name="access-time" size={20} />
            <Text style={styles.detailText}>
            Khung giờ: {formatTimeRanges(timeRanges)}
            </Text>
          </View>
          <View style={styles.detailItem}>
            <Icon name="compare-arrows" size={20} />
            <Text style={styles.detailText}>
              Mong muốn trao đổi với: {product.desiredSubCategory.category.name}
              , {product.desiredSubCategory.subCategoryName}
            </Text>
          </View>
          {product.isGift && (
            <View style={styles.detailItem}>
              <Icon name="card-giftcard" size={20} color={Colors.orange500} />
              <Text style={[styles.detailText, styles.giftText]}>
                Sản phẩm này là quà tặng
              </Text>
            </View>
          )}
        </View>

        {product.available ? (
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.requestButton]}
              onPress={handleRequest}
            >
              {product.isGift ? (
                <Text style={styles.buttonText}>Đăng ký nhận</Text>
              ) : (
                <Text style={styles.buttonText}>Yêu cầu trao đổi</Text>
              )}
            </TouchableOpacity>
          </View>
        ) : (
          <View style={[styles.button, styles.outOfStockButton]}>
            <Button title="Hết hàng" disabled />
          </View>
        )}
      </View>

      <Modal
        visible={showRequestDialog}
        animationType="slide"
        transparent={true}
      >
        <View style={styles.centeredView}>
          <View style={styles.modalView}>
            <ScrollView
              style={styles.modalScrollView}
              showsVerticalScrollIndicator={false}
            >
              {product.isGift ? (
                <>
                  <Text style={styles.modalTitle}>Tạo yêu cầu nhận hàng</Text>
                  {/* Current Product Section */}
                  <View style={styles.currentProductSection}>
                    <Image
                      source={{ uri: product?.images[0] }}
                      style={styles.currentProductImage}
                    />
                    <View style={styles.currentProductInfo}>
                      <Text style={styles.currentProductName}>
                        {product?.name}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.detailText}>
                    Mong muốn trao đổi với:{" "}
                    {product.desiredSubCategory.category.name},{" "}
                    {product.desiredSubCategory.subCategoryName}
                  </Text>
                </>
              ) : (
                <>
                  <Text style={styles.modalTitle}>Tạo yêu cầu trao đổi</Text>
                  {/* Current Product Section */}
                  <View style={styles.currentProductSection}>
                    <Image
                      source={{ uri: product?.images[0] }}
                      style={styles.currentProductImage}
                    />
                    <View style={styles.currentProductInfo}>
                      <Text style={styles.currentProductName}>
                        {product?.name}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.detailText}>
                    Mong muốn trao đổi với:{" "}
                    {product.desiredSubCategory.category.name},{" "}
                    {product.desiredSubCategory.subCategoryName}
                  </Text>
                </>
              )}

              {!product.isGift && !wannaRequest && (
                <>
                  <View style={styles.exchangeArrowContainer}>
                    <Icon name="swap-vert" size={24} color={Colors.orange500} />
                    {moreImages.length === 0 && (
                      <>
                        <Text style={styles.exchangeText}>
                          Chọn sản phẩm để trao đổi
                        </Text>
                      </>
                    )}
                  </View>
                  {moreImages.length === 0 && (
                    <>
                      <View style={styles.userItemsSection}>
                        {renderUserItems()}
                      </View>
                    </>
                  )}

                  <Text style={styles.moreItemText}>
                    Sản phẩm khác, bạn hãy chụp lại sản phẩm và ghi rõ thông tin
                    sản phẩm
                  </Text>
                  {selectedUserItem && (
                    <View style={styles.selectedItemInfo}>
                      <Text style={styles.selectedItemText}>
                        Sản phẩm đã chọn: {selectedUserItem.name}
                      </Text>
                    </View>
                  )}

                  <MediaUploadSection
                    images={moreImages}
                    video={""}
                    selectedImage={selectedImage}
                    isLoading={isUploadingImage}
                    onPickImage={handleImageUpload}
                    onPickVideo={() => {}}
                    onRemoveImage={removeImage}
                    onRemoveVideo={() => {}}
                    canUploadVideo={false}
                  />
                  <TouchableOpacity onPress={() => handleWannaRequest()}>
                    <Text style={styles.requestText}>
                      Tôi muốn xin món đồ này.
                    </Text>
                  </TouchableOpacity>
                </>
              )}

              {!isTrue ? (
                <TouchableOpacity onPress={() => handleWannaExchange()}>
                  <Text style={[styles.requestText, styles.marginTop_16_Botttom_12]}>
                    Tôi muốn trao đổi với đồ của tôi.
                  </Text>
                </TouchableOpacity>
              ) : (
                <></>
              )}
              {(product.isGift || userItems.length > 0) && (
                <>
                  <Text style={styles.modalDescription}>
                    Nhập lời nhắn của bạn:
                  </Text>
                  <TextInput
                    style={styles.requestInput}
                    placeholder="Nhập tin nhắn..."
                    value={requestMessage}
                    onChangeText={setRequestMessage}
                    multiline
                  />
                  {requestMessage.length > 99 && !wannaRequest && (
                    <Text style={styles.textErrorMessage}>
                      Lời nhắn của bạn không được vượt quá 100 ký tự.
                    </Text>
                  )}

                  {requestMessage.length < 300 && wannaRequest && (
                    <Text style={styles.textErrorMessage}>
                      Để yêu cầu xin sản phẩm, bạn phải tạo lời nhắn hơn 300 ký
                      tự.
                    </Text>
                  )}
<Text style={styles.modalDescription}>
  Vui lòng chọn thời gian bạn sẽ tời nhận sản phẩm:
</Text>

<Text style={styles.description}>
  Khung giờ: {formatTimeRanges(timeRanges)}
</Text>

<Text style={styles.modalDescriptionSub}>
  Thời gian này sẽ được gửi chủ sở hữu, nếu phù hợp sẽ tiếp hành trao đổi.
</Text>


                  {/* Selected Time Slots */}
                  <View style={styles.selectedSlotsContainer}>
                    {selectedTimeSlots.map((slot) => (
                      <View key={slot.id} style={styles.timeSlotBadge}>
                        <Text style={styles.timeSlotText}>
                          {slot.displayText}
                        </Text>
                        <TouchableOpacity
                          onPress={() => removeTimeSlot(slot.id)}
                        >
                          <Icon name="close" size={20} color="#FF5722" />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                    {selectedTimeSlots.length === 0 && (
                      <View style={styles.container}>
                        {/* Date Picker */}
                        <TouchableOpacity
                          style={styles.datePickerButton}
                          onPress={() => setShowDatePicker(true)}
                        >
                          <Text style={styles.datePickerButtonText}>
                            Chọn ngày:{" "}
                            {formatDate_DD_MM_YYYY(selectedDate.toISOString())}
                          </Text>
                        </TouchableOpacity>

                        {showDatePicker && (
                          // <DateTimePicker
                          //   value={selectedDate}
                          //   mode="date"
                          //   display="default"
                          //   onChange={handleDateChange}
                          //   minimumDate={new Date()}
                          // />

                          <DateTimePickerCustom
  date={selectedDate}
  setDate={setSelectedDate}
  allowedDays={daysOnly}
  timeRanges={timeRanges} // Thêm prop mới
  onClose={() => setShowDatePicker(false)}
/>

                        )}

                        {/* Time Input */}
                        <View style={styles.inputContainer}>
                          <View style={styles.timeInputWrapper}>
                            <TouchableOpacity
                              style={styles.timeInput}
                              onPress={() => setShowHourModal(true)}
                            >
                              <Text style={styles.timeInputText}>
                                {selectedHour !== null
                                  ? selectedHour.toString().padStart(2, "0")
                                  : "Giờ"}
                              </Text>
                            </TouchableOpacity>

                            <Text style={styles.colonText}>:</Text>

                            <TouchableOpacity
                              style={styles.timeInput}
                              onPress={() => setShowMinuteModal(true)}
                            >
                              <Text style={styles.timeInputText}>
                                {selectedMinute !== null
                                  ? selectedMinute.toString().padStart(2, "0")
                                  : "Phút"}
                              </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                              style={styles.addButton}
                              onPress={addTimeSlot}
                            >
                              <Text style={styles.addButtonText}>Chọn</Text>
                            </TouchableOpacity>
                          </View>

                          {/* Hour Modal */}
                          {renderPickerModal(
                            showHourModal,
                            setShowHourModal,
                            hours,
                            selectedHour,
                            setSelectedHour,
                            "Chọn giờ"
                          )}

                          {/* Minute Modal */}
                          {renderPickerModal(
                            showMinuteModal,
                            setShowMinuteModal,
                            minutes,
                            selectedMinute,
                            setSelectedMinute,
                            "Chọn phút"
                          )}

                          {/* Error Message */}
                          {timeInputError ? (
                            <View style={styles.timeInputWrapper}>
                              <Text style={styles.errorTimeText}>
                                {timeInputError}
                              </Text>
                            </View>
                          ) : null}
                        </View>

                        {/* Hiển thị khung giờ cho ngày đã chọn */}
{selectedDate && (
  <Text style={styles.timeRangeText}>
    {(() => {
      const timeRange = getTimeRangeForSelectedDate(selectedDate);
      if (timeRange) {
        return `Khung giờ cho phép: ${timeRange.start}:00 - ${timeRange.end - 1}:59`;
      }
      return "Không có khung giờ cho phép trong ngày này";
    })()}
  </Text>
)}

                      </View>

                    )}
                </>
              )}
            </ScrollView>

            {/* Fixed Button Container */}
            <View style={styles.fixedButtonContainer}>
              <Pressable
                style={[styles.button, styles.cancelButton]}
                onPress={handleCancelRequest}
              >
                <Text style={styles.buttonText}>Hủy</Text>
              </Pressable>
              <Pressable
                style={[
                  styles.button,
                  styles.confirmButton,
                  (product.isGift
                    ? selectedTimeSlots.length === 0
                    : (!selectedUserItem && moreImages.length === 0) ||
                      selectedTimeSlots.length === 0) && styles.disabledButton,
                ]}
                onPress={handleConfirmRequest}
                disabled={
                  product.isGift
                    ? selectedTimeSlots.length === 0
                    : (!selectedUserItem && moreImages.length === 0) ||
                      selectedTimeSlots.length === 0
                }
              >
                <Text style={styles.buttonText}>Xác nhận</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <CustomAlert
        visible={showAlertDialog}
        title={alertData.title}
        message={alertData.message}
        onConfirm={() => setShowAlertDialog(false)}
        onCancel={() => setShowAlertDialog(false)}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white",
  },
  imageContainer: {
    height: 400,
    borderRadius: 16,
    overflow: "hidden",
    margin: 16,
    marginBottom: 0,
  },
  image: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  infoContainer: {
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
  },
  badgeContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 12,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  badgeText: {
    color: "white",
    fontSize: 12,
  },
  pointText: {
    fontSize: 32,
    color: Colors.orange500,
    fontWeight: "bold",
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    color: "#666",
    marginBottom: 8,
  },
  detailsContainer: {
    marginBottom: 8,
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  detailText: {
    fontSize: 16,
    color: "#666",
  },
  giftText: {
    color: Colors.orange500,
    fontWeight: "bold",
  },
  attributesContainer: {
    marginBottom: 16,
  },
  attributesTitle: {
    fontSize: 18,
    fontWeight: "medium",
    color: "#333",
    marginBottom: 8,
  },
  attributeContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  attributeText: {
    fontSize: 16,
    color: "#666",
  },
  buttonContainer: {
    flexDirection: "column",
    gap: 12,
  },
  button: {
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  requestButton: {
    backgroundColor: Colors.orange500,
    color: "white",
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
  },
  outOfStockButton: {
    backgroundColor: Colors.orange500,
    color: "white",
    opacity: 0.5,
  },
  loadingPlaceholder: {
    backgroundColor: "#f2f2f2",
    borderRadius: 8,
    height: 16,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 14,
    color: "#e53e3e",
    marginTop: 32,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 16,
    textAlign: "center",
    color: Colors.orange600,
  },
  modalDescription: {
    fontSize: 16,
    marginTop: 12,
    marginBottom: 16,
    fontWeight: "bold",
    textAlign: "left",
  },
  modalDescriptionSub: {
    fontSize: 14,
    marginBottom: 16,
    color: "#7B7B7B",
  },
  requestInput: {
    backgroundColor: "#f2f2f2",
    borderRadius: 8,
    padding: 12,
    textAlignVertical: "top",
    width: "100%",
  },
  textErrorMessage: {
    color: "#e53e3e",
    marginBottom: 16,
  },
  modalButtonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },
  cancelButton: {
    width: "48%",
    backgroundColor: "#e53e3e",
  },
  confirmButton: {
    width: "48%",
    backgroundColor: Colors.orange600,
  },
  selectedSlotsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 32,
  },
  timeSlotBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    borderStyle: "solid",
    borderWidth: 1,
    borderColor: Colors.orange500,
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 12,
    gap: 8,
  },
  timeSlotText: {
    color: Colors.orange500,
    fontSize: 14,
    fontWeight: "bold",
  },
  datePickerButton: {
    backgroundColor: Colors.orange500,
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
  },
  datePickerButtonText: {
    color: "white",
    fontSize: 16,
    textAlign: "center",
  },
  // timeSlotsContainer: {
  //   height: 700,
  //   marginBottom: 200,
  // },
  timeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    justifyContent: "flex-start",
    marginBottom: 20,
  },
  userInfoContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 16,
    padding: 8,
    backgroundColor: "#fff",
    shadowRadius: 4,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 16,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: "#666",
  },
  currentProductSection: {
    flexDirection: "row",
    padding: 12,
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
  },
  currentProductImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  currentProductInfo: {
    flex: 1,
    marginLeft: 12,
    justifyContent: "center",
  },
  currentProductName: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 4,
  },
  currentProductPrice: {
    fontSize: 16,
    color: Colors.orange500,
    fontWeight: "bold",
  },
  exchangeArrowContainer: {
    alignItems: "center",
    marginVertical: 16,
  },
  exchangeText: {
    fontSize: 14,
    color: "#666",
    marginTop: 4,
  },
  moreItemText: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    paddingVertical: 16,
  },
  userItemsSection: {
    marginBottom: 16,
  },
  userItemsScroll: {
    flexGrow: 0,
  },
  userItemCard: {
    width: 120,
    marginRight: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ddd",
    padding: 8,
  },
  selectedUserItemCard: {
    borderColor: Colors.orange500,
    backgroundColor: "#fff5e6",
  },
  userItemImage: {
    width: "100%",
    height: 100,
    borderRadius: 4,
    marginBottom: 8,
  },
  userItemName: {
    fontSize: 14,
    textAlign: "center",
  },
  selectedItemInfo: {
    backgroundColor: "#f0f0f0",
    padding: 8,
    borderRadius: 4,
    marginBottom: 16,
  },
  selectedItemText: {
    fontSize: 14,
    color: "#333",
  },
  requestText: {
    color: Colors.orange500,
    fontSize: 14,
    marginBottom: 12,
    textDecorationLine: "underline",
  },
  marginTop_16_Botttom_12: {
    marginTop: 16,
    marginBottom: 12,
  },
  loadingText: {
    textAlign: "center",
    color: "#666",
    padding: 16,
  },
  noItemsText: {
    textAlign: "center",
    color: Colors.orange500,
    padding: 16,
    fontWeight: "bold",
  },
  disabledButton: {
    opacity: 0.5,
  },
  centeredView: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalView: {
    backgroundColor: "white",
    borderTopRightRadius: 20,
    borderTopLeftRadius: 20,
    height: "90%",
    width: "100%",
  },
  modalScrollView: {
    flex: 1,
    padding: 24,
  },
  timeSlot: {
    width: "31%",
    padding: 8,
    borderRadius: 8,
    backgroundColor: "#f0f0f0",
    marginBottom: 8,
  },
  selectedTimeSlot: {
    backgroundColor: Colors.orange500,
  },
  timeSlotLabel: {
    fontSize: 12,
    textAlign: "center",
    color: "#333",
  },
  selectedTimeSlotLabel: {
    color: "white",
  },
  fixedButtonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 16,
    paddingBottom: Platform.OS === "ios" ? 34 : 16, // Account for iPhone notch
    borderTopWidth: 1,
    borderTopColor: "#eee",
    backgroundColor: "white",
  },
  inputContainer: {
    flexDirection: "column",
    // alignItems: "center",
    marginBottom: 50,
  },
  addButton: {
    backgroundColor: "#FF5722",
    padding: 12,
    borderRadius: 8,
  },
  addButtonText: {
    color: "white",
    textAlign: "center",
  },
  timeInputWrapper: {
    flexDirection: "row",
    alignItems: "center",
  },
  timeInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 12,
    marginRight: 8,
    textAlign: "center",
  },
  colonText: {
    fontSize: 20,
    marginRight: 8,
  },
  errorTimeText: {
    fontSize: 14,
    color: "#e53e3e",
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContent: {
    width: "80%",
    maxHeight: "70%",
    backgroundColor: "white",
    borderRadius: 10,
    padding: 16,
  },
  pickerItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  selectedPickerItem: {
    backgroundColor: "#FF5722",
  },
  pickerItemText: {
    textAlign: "center",
    fontSize: 16,
  },
  selectedPickerItemText: {
    color: "white",
    fontWeight: "bold",
  },
  timeInputText: {
    color: "#777",
    textAlign: "center",
  },
  timeRangeText: {
    marginTop: 8,
    marginBottom: 8,
    color: Colors.orange500,
    fontSize: 14,
  },
});
