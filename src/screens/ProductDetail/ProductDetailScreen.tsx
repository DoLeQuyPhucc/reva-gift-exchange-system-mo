import React, { useEffect, useState } from "react";
import { StyleSheet, View, Image, ScrollView, Text, TouchableOpacity, Modal, TextInput, Pressable, Platform } from "react-native";
import { RouteProp, useRoute } from "@react-navigation/native";
import Icon from 'react-native-vector-icons/MaterialIcons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Product, ProductAttribute } from "@/src/shared/type";
import axiosInstance from "@/src/api/axiosInstance";
import { Button } from "react-native";
import { formatDate } from "@/src/shared/formatDate";
import { RootStackParamList } from "@/src/layouts/types/navigationTypes";
import Colors from "@/src/constants/Colors";

type TimeSlot = {
  id: string;
  dateTime: string;
  displayText: string;
};

type ProductDetailScreenRouteProp = RouteProp<RootStackParamList, 'ProductDetail'>;

export default function ProductDetailScreen() {
  const route = useRoute<ProductDetailScreenRouteProp>();
  const itemId = route.params.productId;
  
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [requestMessage, setRequestMessage] = useState("");
  const [showRequestDialog, setShowRequestDialog] = useState(false);
  
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedTimeSlots, setSelectedTimeSlots] = useState<TimeSlot[]>([]);
  const [countTimeSlots, setCountTimeSlots] = useState(0);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [selectedHour, setSelectedHour] = useState<number | null>(null);
  
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

  // Generate time slots for the day (0-23)
  const timeSlots = Array.from({ length: 24 }, (_, i) => ({
    hour: i,
    label: `${i}:00 - ${i + 1}:00`
  }));

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

    const dateStr = selectedDate.toISOString().split('T')[0];
    const timeStr = `${hour.toString().padStart(2, '0')}:00:00`;
    const dateTimeStr = `${dateStr} ${timeStr}`;
    
    const newSlot: TimeSlot = {
      id: Math.random().toString(),
      dateTime: dateTimeStr,
      displayText: `${hour}:00 - ${hour + 1}:00 ${selectedDate.toLocaleDateString()}`
    };

    setSelectedTimeSlots(prev => [...prev, newSlot]);
    setCountTimeSlots(countTimeSlots + 1);
    setShowTimePicker(false);
    setSelectedHour(null);
  };

  const removeTimeSlot = (slotId: string) => {
    setCountTimeSlots(countTimeSlots - 1);
    setSelectedTimeSlots(prev => prev.filter(slot => slot.id !== slotId));
  };
  
  const handleAddToCart = async () => {
    console.log("Add to cart:", product);
  };

  
  const handleRequest = async () => {
    if (!product) {
      console.error("Product not found");
      return;
    }
    setCountTimeSlots(selectedTimeSlots.length);
    setShowRequestDialog(true);
  };

  const handleConfirmRequest = async () => {
    setShowRequestDialog(false);

    const data = {
      itemId: product?.id,
      quantity: product?.quantity,
      // message: requestMessage,
      // timeSlots: selectedTimeSlots.map(slot => slot.dateTime)
    };

    console.log("message", requestMessage);
    console.log("timeSlots", selectedTimeSlots);

    const response = await axiosInstance.post("/request/create", data);
    
    if (response.data.isSuccess) {
      setShowRequestDialog(false);
      setSelectedTimeSlots([]);
      setRequestMessage("");
    }
  };

  const handleCancelRequest = () => {
    setShowRequestDialog(false);
    setRequestMessage("");
  };

  const renderAttributes = () => {
    if(product?.itemAttributeValues.length === 0) {
      return <Text style={styles.attributeText}>Không có thông số kỹ thuật</Text>;
    }
    return product?.itemAttributeValues.map((attr: ProductAttribute) => (
      <View key={attr.id} style={styles.attributeContainer}>
        <Text style={styles.attributeText}>- {attr.value}</Text>
      </View>
    ));
  };
  
  const handleNavigateToUserProducts = () => {
    // if (product) {
    //   navigation.navigate('UserProductsScreen', { owner: product.owner });
    // }
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
          <View style={[styles.badge, { backgroundColor: 'green' }]}>
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
            <Text style={styles.detailText}>Tình trạng: {product.condition}</Text>
          </View>
        </View>

        <View style={styles.attributesContainer}>
          <Text style={styles.attributesTitle}>Thông số kỹ thuật:</Text>
          {renderAttributes()}
        </View>

        <TouchableOpacity style={styles.userInfoContainer} onPress={handleNavigateToUserProducts}>
            <Image source={{ uri: 'https://img.freepik.com/free-psd/3d-illustration-person-with-sunglasses_23-2149436178.jpg?t=st=1731558441~exp=1731562041~hmac=eb803dd276fc45525a2a6d074db707e75e082034a85f1b489db6f93addd08d28&w=740' }} style={styles.avatar} />
            {/* <Image source={{ uri: product.profilePicture }} style={styles.avatar} /> */}
            <View style={styles.userInfo}>
              <Text style={styles.userName}>{product.email}</Text>
              <Text style={styles.userEmail}>{product.email}</Text>
            </View>
          </TouchableOpacity>

        {product.available ? (
          <View style={styles.buttonContainer}>
            <TouchableOpacity style={[styles.button, styles.requestButton]} onPress={handleRequest}>
              <Text style={styles.buttonText}>Đăng ký nhận</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={[styles.button, styles.outOfStockButton]}>
            <Button
              title="Hết hàng"
              disabled
            />
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
            <Text style={styles.modalTitle}>Tạo yêu cầu trao đổi</Text>
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
            <Text style={styles.modalDescription}>
              Vui lòng chọn khung thời gian bạn đến nhận hàng
            </Text>
            <Text style={styles.modalDescriptionSub}>
            Thời gian này sẽ được gửi đến Phúc Đỗ, nếu phù hợp sẽ tiếp hành trao đổi. Bạn có thể chọn tối đa 3 khung giờ.
            </Text>
            {/* Selected Time Slots Display */}
            <View style={styles.selectedSlotsContainer}>
              {selectedTimeSlots.map(slot => (
                <View key={slot.id} style={styles.timeSlotBadge}>
                  <Text style={styles.timeSlotText}>{slot.displayText}</Text>
                  <TouchableOpacity onPress={() => removeTimeSlot(slot.id)}>
                    <Icon name="close" size={20} color={Colors.orange500} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
            { countTimeSlots < 3 && ( 
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
              {/* Time Slots Grid */}
              {(!showDatePicker && countTimeSlots < 3) && (
              <ScrollView style={styles.timeSlotsContainer}>
                <View style={styles.timeGrid}>
                  {timeSlots.map(({ hour, label }) => (
                    <TouchableOpacity
                      key={hour}
                      style={[
                        styles.timeSlot,
                        selectedHour === hour && styles.selectedTimeSlot
                      ]}
                      onPress={() => handleTimeSelect(hour)}
                      disabled={selectedTimeSlots.length >= 3}
                    >
                      <Text style={styles.timeSlotLabel}>{label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            )}


            <View style={styles.modalButtonContainer}>
              <Pressable
                style={[styles.button, styles.cancelButton]}
                onPress={handleCancelRequest}
              >
                <Text style={styles.buttonText}>Hủy</Text>
              </Pressable>
              <Pressable
                style={[styles.button, styles.confirmButton]}
                onPress={handleConfirmRequest}
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
    color: 'white',
    fontSize: 12,
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
  centeredView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalView: {
    backgroundColor: "white",
    borderRadius: 20,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    width: "90%",
    maxHeight: "80%",
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
    marginBottom: 16,
    textAlignVertical: "top",
    width: "100%",
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
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginVertical: 12,
  },
  timeSlotBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderStyle: 'solid',
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
    fontWeight: 'bold',
  },
  datePickerButton: {
    backgroundColor: Colors.orange500,
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  datePickerButtonText: {
    color: 'white',
    fontSize: 16,
    textAlign: 'center',
  },
  timeSlotsContainer: {
    maxHeight: 200,
    marginBottom: 16,
  },
  timeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'space-between',
  },
  timeSlot: {
    width: '31%',
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    marginBottom: 8,
  },
  selectedTimeSlot: {
    backgroundColor: Colors.orange500,
  },
  timeSlotLabel: {
    fontSize: 12,
    textAlign: 'center',
    color: '#333',
  },
  userInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
    padding: 8,
    backgroundColor: '#fff',
    // borderRadius: 8,
    // shadowColor: '#000',
    // shadowOffset: { width: 0, height: 2 },
    // shadowOpacity: 0.1,
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
    fontWeight: 'bold',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: '#666',
  },
});