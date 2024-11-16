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
import { Product } from "@/src/shared/type";
import axiosInstance from "@/src/api/axiosInstance";
import { Button } from "react-native";
import { formatDate } from "@/src/shared/formatDate";
import { RootStackParamList } from "@/src/layouts/types/navigationTypes";
import Colors from "@/src/constants/Colors";
import AsyncStorage from "@react-native-async-storage/async-storage";

type TimeSlot = {
  id: string;
  dateTime: string;
  displayText: string;
};

type ProductDetailScreenRouteProp = RouteProp<
  RootStackParamList,
  "ProductDetail"
>;

const availableTimeSlots = {
  "office_hour": [8, 9, 10, 11, 13, 14, 15, 16],
  "evening": [17, 18, 19, 20, 21],
}

export default function ProductDetailScreen() {
  const route = useRoute<ProductDetailScreenRouteProp>();
  const itemId = route.params.productId;

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [requestMessage, setRequestMessage] = useState("");
  const [errorRequestMessage, setErrorRequestMessage] = useState("");
  const [showRequestDialog, setShowRequestDialog] = useState(false);

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedTimeSlots, setSelectedTimeSlots] = useState<TimeSlot[]>([]);
  const [countTimeSlots, setCountTimeSlots] = useState(0);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [selectedHour, setSelectedHour] = useState<number | null>(null);

  const [userItems, setUserItems] = useState<Product[]>([]);
  const [selectedUserItem, setSelectedUserItem] = useState<Product | null>(null);
  const [loadingUserItems, setLoadingUserItems] = useState(false);

  const [wannaRequest, setWannaRequest] = useState(false);
  const [isTrue, setIsTrue] = useState(true);

  const [selectedRange, setSelectedRange] = useState('office_hour'); // or 'evening'


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
          setProduct(response.data.data);
          setSelectedRange(response.data.data?.availableTime || 'office_hour');
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

  const generateTimeSlots = (range: string) => {
    const hours = availableTimeSlots[range as keyof typeof availableTimeSlots];
    return hours.map(hour => ({
      hour,
      label: `${hour}:00 - ${hour + 1}:00`,
    }));
  };
  
  // Use generated time slots
  const timeSlots = generateTimeSlots(selectedRange);

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setSelectedDate(selectedDate);
    }
  };

  const handleTimeSelect = (hour: number) => {
    if (selectedTimeSlots.length >= 3) {
      console.log("Cannot select more than 3 time slots");
      return;
    }

    const dateStr = selectedDate.toISOString().split("T")[0];
    const timeStr = `${hour.toString().padStart(2, "0")}:00:00`;
    const dateTimeStr = `${dateStr} ${timeStr}`;

    const newSlot: TimeSlot = {
      id: Math.random().toString(),
      dateTime: dateTimeStr,
      displayText: `${hour}:00 - ${
        hour + 1
      }:00 ${selectedDate.toLocaleDateString()}`,
    };

    setSelectedTimeSlots((prev) => [...prev, newSlot]);
    setCountTimeSlots(countTimeSlots + 1);
    setShowTimePicker(false);
    setSelectedHour(null);
  };

  const removeTimeSlot = (slotId: string) => {
    setCountTimeSlots(countTimeSlots - 1);
    setSelectedTimeSlots((prev) => prev.filter((slot) => slot.id !== slotId));
  };

  const handleAddToCart = async () => {
    console.log("Add to cart:", product);
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
    if (!product) {
      console.error("Product not found");
      return;
    }
    setCountTimeSlots(selectedTimeSlots.length);
    setShowRequestDialog(true);
    await fetchUserItems();
  };

  const handleConfirmRequest = async () => {
    setShowRequestDialog(false);

    if (!selectedUserItem) {
      const data = {
        itemId: product?.id,
        message: requestMessage,
        appointmentDate: selectedTimeSlots.map((slot) => slot.dateTime),
        requesterItemId: null,
      };
      const response = await axiosInstance.post("/request/create", data);

      if (response.data.isSuccess) {
        setShowRequestDialog(false);
        setSelectedTimeSlots([]);
        setRequestMessage("");
      }
      return;
    }

    const data = {
      itemId: product?.id,
      message: requestMessage,
      appointmentDate: selectedTimeSlots.map((slot) => slot.dateTime),
      requesterItemId: selectedUserItem.id,
    };

    console.log("Request data:", data);

    const response = await axiosInstance.post("/request/create", data);

    if (response.data.isSuccess) {
      setShowRequestDialog(false);
      setSelectedTimeSlots([]);
      setRequestMessage("");
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
    setCountTimeSlots(0);
    setSelectedUserItem(null);
    setWannaRequest(false);
  };

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

    return (
      <ScrollView horizontal style={styles.userItemsScroll}>
        {userItems
          .filter((item) => !item.isGift)
          .map((item) => (
            <TouchableOpacity
              key={item.id}
              style={[
                styles.userItemCard,
                selectedUserItem?.id === item.id && styles.selectedUserItemCard,
              ]}
              onPress={() => setSelectedUserItem(item)}
            >
              <Image
                source={{ uri: item.images[0] }}
                style={styles.userItemImage}
              />
              <Text style={styles.userItemName} numberOfLines={1}>
                {item.name}
              </Text>

              <Text style={styles.userItemName} numberOfLines={1}>
                {item.point}P
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
            <Text style={styles.badgeText}>{product.category}</Text>
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
        {!product.isGift && (
          <Text style={styles.pointText}>{product.point}P</Text>
        )}

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
                      <Text style={styles.currentProductPrice}>
                        {product.point}P
                      </Text>
                    </View>
                  </View>
                </>
              )}

              {!product.isGift && !wannaRequest && (
                <>
                  <View style={styles.exchangeArrowContainer}>
                    <Icon name="swap-vert" size={24} color={Colors.orange500} />
                    <Text style={styles.exchangeText}>
                      Chọn sản phẩm để trao đổi
                    </Text>
                  </View>

                  <View style={styles.userItemsSection}>
                    {renderUserItems()}
                  </View>
                  {selectedUserItem && (
                    <View style={styles.selectedItemInfo}>
                      <Text style={styles.selectedItemText}>
                        Sản phẩm đã chọn: {selectedUserItem.name}
                      </Text>
                    </View>
                  )}
                  <TouchableOpacity onPress={() => handleWannaRequest()}>
                    <Text style={styles.requestText}>
                      Tôi muốn xin món đồ này.
                    </Text>
                  </TouchableOpacity>
                </>
              )}

              {!isTrue ? (
                <TouchableOpacity onPress={() => handleWannaExchange()}>
                  <Text style={styles.requestText}>
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
                    Vui lòng chọn khung thời gian theo thời gian rãnh của chủ sản phẩm
                  </Text>
                  <Text style={styles.modalDescriptionSub}>
                    Thời gian này sẽ được gửi chủ sở hữu, nếu phù
                    hợp sẽ tiếp hành trao đổi. Bạn có thể chọn tối đa 3 khung
                    giờ.
                  </Text>

                  <View style={styles.selectedSlotsContainer}>
                    {selectedTimeSlots.map((slot) => (
                      <View key={slot.id} style={styles.timeSlotBadge}>
                        <Text style={styles.timeSlotText}>
                          {slot.displayText}
                        </Text>
                        <TouchableOpacity
                          onPress={() => removeTimeSlot(slot.id)}
                        >
                          <Icon
                            name="close"
                            size={20}
                            color={Colors.orange500}
                          />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>

                  {countTimeSlots < 3 && (
                    <TouchableOpacity
                      style={styles.datePickerButton}
                      onPress={() => setShowDatePicker(true)}
                    >
                      <Text style={styles.datePickerButtonText}>
                        Chọn ngày: {selectedDate.toLocaleDateString()}
                      </Text>
                    </TouchableOpacity>
                  )}

                  {showDatePicker && (
                    <DateTimePicker
                      value={selectedDate}
                      mode="date"
                      display="default"
                      onChange={handleDateChange}
                      minimumDate={new Date()}
                    />
                  )}

                  {!showDatePicker && countTimeSlots < 3 && (
                    <View style={styles.timeGrid}>
                      {timeSlots.map(({ hour, label }) => (
                        <TouchableOpacity
                          key={hour}
                          style={[
                            styles.timeSlot,
                            selectedHour === hour && styles.selectedTimeSlot,
                          ]}
                          onPress={() => handleTimeSelect(hour)}
                          disabled={selectedTimeSlots.length >= 3}
                        >
                          <Text
                            style={[
                              styles.timeSlotLabel,
                              selectedHour === hour &&
                                styles.selectedTimeSlotLabel,
                            ]}
                          >
                            {label}
                          </Text>
                        </TouchableOpacity>
                      ))}
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
                    : !selectedUserItem || selectedTimeSlots.length === 0) &&
                    styles.disabledButton,
                ]}
                onPress={handleConfirmRequest}
                disabled={
                  product.isGift
                    ? selectedTimeSlots.length === 0
                    : !selectedUserItem || selectedTimeSlots.length === 0
                }
              >
                <Text style={styles.buttonText}>Xác nhận</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
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
    marginBottom: 16,
  },
  detailsContainer: {
    marginBottom: 16,
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
    fontSize: 18,
    color: "#e53e3e",
    textAlign: "center",
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
    marginBottom: 24,
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
    marginVertical: 16,
    textDecorationLine: "underline",
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
});
