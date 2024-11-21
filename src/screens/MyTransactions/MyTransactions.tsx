import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  Image,
  Linking,
  Platform,
} from "react-native";
import axiosInstance from "@/src/api/axiosInstance";
import Colors from "@/src/constants/Colors";
import Icon from "react-native-vector-icons/MaterialIcons";
import {
  LocationMap,
  Transaction,
  TransactionRatingType,
} from "@/src/shared/type";
import MapModal from "@/src/components/Map/MapModal";
import UserRatingModal from "@/src/components/modal/RatingUserTransactionModal";

const MyTransactions = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedTransaction, setSelectedTransaction] =
    useState<Transaction | null>(null);
  const [verificationInput, setVerificationInput] = useState("");
  const [showTransactionId, setShowTransactionId] = useState(false);
  const [showMapModal, setShowMapModal] = useState(false);
  const [isRatingModalVisible, setIsRatingModalVisible] = useState(false);
  const [location, setLocation] = useState<LocationMap>({
    latitude: 0,
    longitude: 0,
  });

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      const response = await axiosInstance.get("transaction/own-transactions");

      if (!response.data.data) {
        return;
      }
      const transactionsList = await Promise.all(
        response.data.data.map(async (transaction: Transaction) => {
          if (transaction.status === "Completed") {
            const rating = await axiosInstance.get(
              `rating/transaction/${transaction.id}`
            );
            if (rating.data.data.length === 0) {
              transaction.rating = null;
            } else {
              transaction.rating = rating.data.data[0].rating;
              transaction.ratingComment = rating.data.data[0].comment;
            }
            return transaction;
          }

          return transaction;
        })
      );
      setTransactions(transactionsList);
    } catch (error) {
      console.error("Error fetching transactions:", error);
    }
  };

  const handleVerification = async () => {
    if (selectedTransaction && verificationInput === selectedTransaction.id) {
      const res = await axiosInstance.put(
        `transaction/update-status/${selectedTransaction.id}`,
        "Completed"
      );
      if (res.data.isSuccess === true) {
        Alert.alert("Thành công", "Mã định danh trùng khớp");
        setShowModal(false);
        setShowTransactionId(false);
        setVerificationInput("");
      }
    } else {
      Alert.alert("Lỗi", "Mã định danh không trùng khớp");
    }
  };

  const handleReject = (transactionId: string) => {
    Alert.alert("Lưu ý", "Bạn có chắc chắn muốn từ chối giao dịch?", [
      {
        text: "Hủy",
        style: "cancel",
      },
      {
        text: "Xác nhận",
        onPress: async () => {
          const res = await axiosInstance.put(
            `transaction/update-status/${transactionId}`,
            "Not_Completed"
          );
          if (res.data.isSuccess === true) {
            Alert.alert("Thành công", "Bạn đã từ chối giao dịch.");
            setShowModal(false);
            setShowTransactionId(false);
            setVerificationInput("");
          }
        },
      },
    ]);
  };

  const formatTimeRange = (dateString: string) => {
    const date = new Date(dateString);
    const endTime = new Date(date.getTime() + 60 * 60 * 1000); // Add 1 hour

    const formatTime = (d: Date) => {
      return d.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });
    };

    const formatDate = (d: Date) => {
      return d.toLocaleDateString("en-US", {
        month: "2-digit",
        day: "2-digit",
        year: "numeric",
      });
    };

    return `${formatTime(date)} - ${formatTime(endTime)} ${formatDate(date)}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getTransactionTitle = (transaction: Transaction) => {
    if (!transaction.senderItemName) {
      return `Giao dịch đăng ký nhận từ ${transaction.recipientName}`;
    }
    return `Giao dịch giữa ${transaction.senderName} & ${transaction.recipientName}`;
  };
  interface RatingResponse {
    isSuccess: boolean;
    message?: string;
  }

  const handleRating = async (
    ratingData: TransactionRatingType
  ): Promise<void> => {
    try {
      // Input validation
      if (!ratingData || !ratingData.rating) {
        Alert.alert("Lỗi", "Vui lòng nhập đánh giá");
        return;
      }

      // API call to submit rating
      const response = await axiosInstance.post<RatingResponse>(
        "rating",
        JSON.stringify(ratingData),
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (response.data.isSuccess) {
        fetchTransactions();
        Alert.alert("Thành công", "Cảm ơn bạn đã gửi đánh giá");
      } else {
        Alert.alert(
          "Lỗi",
          response.data.message ||
            "Không thể gửi đánh giá. Vui lòng thử lại sau"
        );
      }
    } catch (error) {
      console.error("Rating error:", error);
      Alert.alert(
        "Lỗi",
        "Đã xảy ra lỗi khi gửi đánh giá. Vui lòng thử lại sau"
      );
    }
  };

  const handleOpenRatingModal = (transaction: Transaction) => {
    setIsRatingModalVisible(true);
    setSelectedTransaction(transaction);
  };

  const renderStars = (rating: number) => {
    return [1, 2, 3, 4, 5].map((star) => (
      <Icon
        name="star"
        size={30}
        color={star <= rating ? "#FFD700" : "#D3D3D3"}
      />
    ));
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "Pending":
        return "Đang diễn ra";
      case "Completed":
        return "Hoàn thành";
      case "Not_Completed":
        return "Đã hủy";
      default:
        return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Pending":
        return Colors.orange500;
      case "Completed":
        return Colors.lightGreen;
      case "Not_Completed":
        return Colors.lightRed || "#FF0000"; // Add error color to Colors constant
      default:
        return Colors.orange500;
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {transactions.map((transaction) => (
          <View key={transaction.id} style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>
                {getTransactionTitle(transaction)}
              </Text>
              <View style={styles.statusContainer}>
                <View
                  style={[
                    styles.statusDot,
                    { backgroundColor: getStatusColor(transaction.status) },
                  ]}
                />
                <Text
                  style={[
                    styles.status,
                    { color: getStatusColor(transaction.status) },
                  ]}
                >
                  {getStatusText(transaction.status)}
                </Text>
              </View>
            </View>

            {transaction.senderItemName !== "" ? (
              <View style={styles.productsContainer}>
                <View style={styles.productCard}>
                  <Image
                    source={{
                      uri:
                        transaction.senderItemImage[0] ||
                        transaction.senderProfileUrl,
                    }}
                    style={styles.productImage}
                  />
                  <Text style={styles.productName} numberOfLines={2}>
                    {transaction.senderItemName}
                  </Text>
                  <Text style={styles.ownerName}>{transaction.senderName}</Text>
                </View>

                <View style={styles.exchangeContainer}>
                  <Icon name="swap-vert" size={24} color={Colors.orange500} />
                </View>

                {/* Recipient's Product */}
                <View style={styles.productCard}>
                  <Image
                    source={{
                      uri:
                        transaction.recipientItemImage[0] ||
                        transaction.recipientProfileUrl,
                    }}
                    style={styles.productImage}
                  />
                  <Text style={styles.productName} numberOfLines={2}>
                    {transaction.recipientItemName}
                  </Text>
                  <Text style={styles.ownerName}>
                    {transaction.recipientName}
                  </Text>
                </View>
              </View>
            ) : (
              <View style={styles.productCard}>
                <Image
                  source={{
                    uri:
                      transaction.recipientItemImage[0] ||
                      transaction.recipientProfileUrl,
                  }}
                  style={styles.productImage}
                />
                <Text style={styles.productName} numberOfLines={2}>
                  {transaction.recipientItemName}
                </Text>
                <Text style={styles.ownerName}>
                  {transaction.recipientName}
                </Text>
              </View>
            )}

            <View style={styles.dateInfo}>
              <View style={styles.dateRow}>
                <Text style={styles.dateLabel}>Ngày tạo:</Text>
                <Text style={styles.dateValue}>
                  {formatDate(transaction.createdAt)}
                </Text>
              </View>
              <View style={styles.dateRow}>
                <Text style={styles.dateLabel}>Thời gian hẹn:</Text>
                <Text style={styles.dateValue}>
                  {formatTimeRange(transaction.appointmentDate)}
                </Text>
              </View>
            </View>

            {transaction.status === "Pending" && (
              <TouchableOpacity
                style={styles.verifyButton}
                onPress={() => {
                  setSelectedTransaction(transaction);
                  setShowModal(true);
                  setShowTransactionId(false);
                  setVerificationInput("");
                }}
              >
                <Text style={styles.verifyButtonText}>Xác thực giao dịch</Text>
              </TouchableOpacity>
            )}

            {transaction.status === "Pending" && (
              <>
                <TouchableOpacity
                  style={styles.detailsButton}
                  onPress={() => {
                    Alert.alert(
                      "Thông tin chi tiết",
                      `Bên gửi:
      • Địa chỉ: ${transaction.senderAddress}
      • Số điện thoại: ${transaction.senderPhone}
      • Tọa độ: ${transaction.senderAddressCoordinates.latitude}, ${transaction.senderAddressCoordinates.longitude}

      Bên nhận:
      • Địa chỉ: ${transaction.recipientAddress}
      • Số điện thoại: ${transaction.recipientPhone} 
      • Tọa độ: ${transaction.recipientAddressCoordinates.latitude}, ${transaction.recipientAddressCoordinates.longitude}`,
                      [
                        {
                          text: "Đóng",
                          style: "cancel",
                        },
                        {
                          text: "Mở bản đồ",
                          onPress: () => {
                            const data: LocationMap = {
                              latitude: parseFloat(
                                transaction.recipientAddressCoordinates.latitude
                              ),
                              longitude: parseFloat(
                                transaction.recipientAddressCoordinates
                                  .longitude
                              ),
                            };
                            setLocation(data);
                            setShowMapModal(true);
                          },
                        },
                      ]
                    );
                  }}
                >
                  <View style={styles.detailsButtonContent}>
                    <Icon name="info" size={20} color={Colors.orange500} />
                    <Text style={styles.detailsButtonText}>
                      Chi tiết giao dịch
                    </Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.detailsButton}
                  onPress={() => {
                    const data: LocationMap = {
                      latitude: parseFloat(
                        transaction.recipientAddressCoordinates.latitude
                      ),
                      longitude: parseFloat(
                        transaction.recipientAddressCoordinates.longitude
                      ),
                    };
                    console.log(data);
                    setLocation(data);
                    setShowMapModal(true);
                  }}
                >
                  <View style={styles.detailsButtonContent}>
                    <Icon name="map" size={20} color={Colors.orange500} />
                    <Text style={styles.detailsButtonText}>Xem địa chỉ</Text>
                  </View>
                </TouchableOpacity>
              </>
            )}

            {transaction.status === "Completed" && (
              <>
                <TouchableOpacity
                  style={[styles.verifyButton, { opacity: 0.5 }]}
                  disabled={true}
                >
                  <Text style={styles.verifyButtonText}>Đã xác thực</Text>
                </TouchableOpacity>
                {transaction.rating === null ? (
                  <TouchableOpacity
                    style={styles.detailsButton}
                    onPress={() => handleOpenRatingModal(transaction)}
                  >
                    <View style={styles.detailsButtonContent}>
                      <Icon name="map" size={20} color={Colors.orange500} />
                      <Text style={styles.detailsButtonText}>Đánh giá</Text>
                    </View>
                  </TouchableOpacity>
                ) : (
                  <View style={styles.starContainer}>
                    <Text style={styles.titleText}>Đánh giá giao dịch</Text>
                    <View style={styles.ratingContainer}>
                      <Text style={styles.labelText}>Chất lượng: </Text>
                      <Text style={styles.starText}>
                        {renderStars(transaction.rating || 0)}
                      </Text>
                    </View>
                    {transaction.ratingComment && (
                      <View style={styles.commentContainer}>
                        <Text style={styles.labelText}>Nhận xét: </Text>
                        <Text style={styles.commentText}>
                          {transaction.ratingComment}
                        </Text>
                      </View>
                    )}
                  </View>
                )}
              </>
            )}
          </View>
        ))}
      </ScrollView>
      <MapModal
        open={showMapModal}
        onClose={setShowMapModal}
        location={location}
        canMarkerMove={false}
      />

      <Modal visible={showModal} transparent animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Xác thực giao dịch</Text>
            {selectedTransaction && (
              <View style={styles.idContainer}>
                <Image
                  source={{
                    uri: `https://api.qrserver.com/v1/create-qr-code/?data=${selectedTransaction.id}&size=200x200`,
                  }}
                  style={{ width: 200, height: 200 }}
                />
              </View>
            )}

            <View style={styles.idContainer}>
              {showTransactionId && selectedTransaction && (
                <View style={styles.transactionIdBox}>
                  <Text style={styles.transactionIdText}>
                    {selectedTransaction.id}
                  </Text>
                </View>
              )}
              <TouchableOpacity
                style={styles.showIdButton}
                onPress={() => setShowTransactionId(!showTransactionId)}
              >
                <Text style={styles.showIdButtonText}>
                  {showTransactionId ? "Ẩn mã" : "Xem mã"}
                </Text>
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.input}
              placeholder="Nhập mã định danh"
              value={verificationInput}
              onChangeText={setVerificationInput}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setShowModal(false);
                  setShowTransactionId(false);
                  setVerificationInput("");
                }}
              >
                <Text style={styles.buttonText}>Hủy</Text>
              </TouchableOpacity>
              {selectedTransaction && (
                <TouchableOpacity
                  style={[styles.modalButton, styles.rejectButton]}
                  onPress={() => handleReject(selectedTransaction.id)}
                >
                  <Text style={styles.buttonText}>Từ chối</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={[styles.modalButton, styles.verifyButton]}
                onPress={handleVerification}
              >
                <Text style={styles.buttonText}>Xác thực</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <UserRatingModal
        isVisible={isRatingModalVisible}
        onClose={() => setIsRatingModalVisible(false)}
        onSubmitRating={handleRating}
        userTransactionToRate={{
          userId: selectedTransaction?.recipientId || "",
          userName: selectedTransaction?.recipientName || "",
          transactionId: selectedTransaction?.id || "",
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#f5f5f5",
  },
  card: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardHeader: {
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 8,
    color: "#333",
  },
  statusContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  status: {
    fontSize: 16,
    fontWeight: "500",
  },
  productsContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  productCard: {
    flex: 1,
    alignItems: "center",
    backgroundColor: "#f8f8f8",
    padding: 12,
    borderRadius: 8,
  },
  emptyProductCard: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f8f8f8",
    padding: 12,
    borderRadius: 8,
    height: 160,
  },
  emptyProductText: {
    color: "#666",
    fontSize: 14,
    textAlign: "center",
  },
  productImage: {
    width: 90,
    height: 90,
    borderRadius: 8,
    marginBottom: 8,
  },
  productName: {
    fontSize: 15,
    fontWeight: "500",
    textAlign: "center",
    marginBottom: 4,
    color: "#333",
  },
  ownerName: {
    fontSize: 13,
    color: "#666",
  },
  exchangeContainer: {
    width: 40,
    alignItems: "center",
  },
  exchangeIcon: {
    fontSize: 24,
  },
  dateInfo: {
    backgroundColor: "#f8f8f8",
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  dateRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  dateLabel: {
    color: "#666",
    fontSize: 14,
  },
  dateValue: {
    color: "#333",
    fontSize: 14,
    fontWeight: "500",
  },
  verifyButton: {
    backgroundColor: Colors.orange500,
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
  },
  verifyButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContent: {
    backgroundColor: "white",
    padding: 24,
    borderRadius: 16,
    width: "85%",
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
    color: "#333",
  },
  idContainer: {
    marginBottom: 16,
    alignItems: "center",
  },
  transactionIdBox: {
    backgroundColor: "#f0f0f0",
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    width: "100%",
  },
  transactionIdText: {
    fontSize: 16,
    fontWeight: "500",
    textAlign: "center",
    color: "#333",
  },
  showIdButton: {
    backgroundColor: Colors.orange500,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
  },
  showIdButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "500",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
    fontSize: 16,
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  modalButton: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
  },
  rejectButton: {
    backgroundColor: "#f00",
  },
  cancelButton: {
    backgroundColor: "#666",
  },
  buttonText: {
    color: "white",
    textAlign: "center",
    fontSize: 16,
    fontWeight: "600",
  },
  detailsButton: {
    marginTop: 8,
    padding: 8,
    borderRadius: 8,
    backgroundColor: "#f8f8f8",
  },
  detailsButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  detailsButtonText: {
    marginLeft: 8,
    color: Colors.orange500,
    fontSize: 14,
    fontWeight: "500",
  },
  starContainer: {
    marginVertical: 10,
  },
  titleText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 10,
    textAlign: "center",
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  labelText: {
    fontSize: 14,
    color: "#666",
  },
  starText: {
    fontSize: 18,
    color: "#FFD700", // Gold color for stars
  },
  commentContainer: {
    backgroundColor: "#f0f0f0",
    borderRadius: 5,
    padding: 10,
  },
  commentText: {
    fontSize: 14,
    color: "#333",
    fontStyle: "italic",
  },
});

export default MyTransactions;
