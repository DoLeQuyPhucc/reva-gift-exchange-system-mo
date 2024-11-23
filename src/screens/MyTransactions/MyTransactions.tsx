import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Alert,
  Image,
} from "react-native";
import axiosInstance from "@/src/api/axiosInstance";
import Colors from "@/src/constants/Colors";
import Icon from "react-native-vector-icons/MaterialIcons";
import {
  LocationMap,
  Transaction,
  TransactionRatingType,
  TransactionReportType,
} from "@/src/shared/type";
import MapModal from "@/src/components/Map/MapModal";
import UserRatingModal from "@/src/components/modal/RatingUserTransactionModal";
import { Buffer } from "buffer";
import UserReportModal from "@/src/components/modal/UserReportModal";
import { useAuthCheck } from "@/src/hooks/useAuth";
import { TouchableWithoutFeedback } from "react-native";
import { formatDate } from "@/src/shared/formatDate";

const MyTransactions = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedTransaction, setSelectedTransaction] =
    useState<Transaction | null>(null);
  const [verificationInput, setVerificationInput] = useState("");
  const [showMapModal, setShowMapModal] = useState(false);
  const [isRatingModalVisible, setIsRatingModalVisible] = useState(false);
  const [isReportModalVisible, setIsReportModalVisible] = useState(false);
  const [location, setLocation] = useState<LocationMap>({
    latitude: 0,
    longitude: 0,
  });
  const [qrCodeBase64, setQrCodeBase64] = useState<string | null>(null);
  const userId = useAuthCheck().userData.userId;

  useEffect(() => {
    fetchTransactions();
  }, []);

  useEffect(() => {
    if (selectedTransaction?.status === "Pending") {
      fetchQRCode(selectedTransaction.id);
    }
  }, [selectedTransaction]);

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

  const checkRole = (transaction: Transaction) => {
    if (userId === transaction.charitarian.id) {
      return "charitarian";
    } else if (userId === transaction.requester.id) {
      return "requester";
    }
    return "";
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
            setVerificationInput("");
          }
        },
      },
    ]);
  };

  const formatTimeRange = (dateString: string) => {
    const date = new Date(dateString);
    const startTime = new Date(date.getTime() - 15 * 60 * 1000); // Subtract 15 minutes
    const endTime = new Date(date.getTime() + 45 * 60 * 1000); // Add 45 minutes

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

    return `${formatTime(startTime)} - ${formatTime(endTime)} ${formatDate(date)}`;
  };

  const getTransactionTitle = (transaction: Transaction) => {
    if (!transaction.requesterItem?.itemName) {
      return `Giao dịch đăng ký nhận từ ${transaction.charitarian.name}`;
    }
    return `Giao dịch giữa bạn và ${checkRole(transaction) === 'charitarian' ? transaction.requester.name :  transaction.charitarian.name}`;
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

  const handleReport = async (
    reportData: TransactionReportType
  ): Promise<void> => {
    try {
      // API call to submit rating
      const response = await axiosInstance.post(
        "report/create",
        JSON.stringify(reportData),
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (response.data.isSuccess) {
        fetchTransactions();
        Alert.alert("Thành công", "Cảm ơn bạn đã gửi báo cáo.");
      } else {
        Alert.alert(
          "Lỗi",
          response.data.message || "Không thể gửi báo cáo. Vui lòng thử lại sau"
        );
      }
    } catch (error) {
      console.error("Rating error:", error);
      Alert.alert("Lỗi", "Đã xảy ra lỗi khi gửi báo cáo. Vui lòng thử lại sau");
    }
  };

  const handleOpenReportModal = (transaction: Transaction) => {
    setIsReportModalVisible(true);
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

  const fetchQRCode = async (transactionId: string) => {
    try {
      const response = await axiosInstance.get(
        `qr/generate?transactionId=${transactionId}`,
        {
          responseType: "arraybuffer",
        }
      );
      console.log("QR code response:", response);

      // Convert binary data to base64
      const base64Image = `data:image/png;base64,${Buffer.from(
        response.data,
        "binary"
      ).toString("base64")}`;
      setQrCodeBase64(base64Image);
    } catch (error) {
      console.error("Error fetching QR code:", error);
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

            {transaction.requesterItem?.itemName !== "" ? (
              <View style={styles.productsContainer}>
                <View style={styles.productCard}>
                  <Image
                    source={{
                      uri:
                        transaction.requesterItem?.itemImages[0]
                    }}
                    style={styles.productImage}
                  />
                  <Text style={styles.productName} numberOfLines={2}>
                    {transaction.requesterItem?.itemName}
                  </Text>
                  <Text style={styles.ownerName}>{transaction.requester.name}</Text>
                </View>

                <View style={styles.exchangeContainer}>
                  <Icon name="swap-vert" size={24} color={Colors.orange500} />
                </View>

                {/* Recipient's Product */}
                <View style={styles.productCard}>
                  <Image
                    source={{
                      uri:
                        transaction.charitarianItem.itemImages[0]
                    }}
                    style={styles.productImage}
                  />
                  <Text style={styles.productName} numberOfLines={2}>
                    {transaction.charitarianItem.itemName}
                  </Text>
                  <Text style={styles.ownerName}>
                    {transaction.charitarian.name}
                  </Text>
                </View>
              </View>
            ) : (
              <View style={styles.productCard}>
                <Image
                  source={{
                    uri:
                      transaction.charitarianItem.itemImages[0]
                  }}
                  style={styles.productImage}
                />
                <Text style={styles.productName} numberOfLines={2}>
                  {transaction.charitarianItem.itemName}
                </Text>
                <Text style={styles.ownerName}>
                  {transaction.charitarian.name}
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
                  {formatDate(transaction.appointmentDate)}
                </Text>
              </View>
            </View>
            
            <View style={styles.dateInfo}>
              <Text>
              Lưu ý: Bạn nên tới vào lúc {formatTimeRange(transaction.appointmentDate)} để có thể thấy được mã xác nhận và hoàn thành giao dịch.
              </Text>

            </View>

            {transaction.status === "Pending" &&
              checkRole(transaction) === "requester" && (
                <>
                  <TouchableOpacity
                    style={styles.verifyButton}
                    onPress={() => {
                      setSelectedTransaction(transaction);
                      setShowModal(true);
                      setVerificationInput("");
                    }}
                  >
                    <Text style={styles.verifyButtonText}>
                      Xem mã định danh
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.detailsButton}
                    onPress={() => {
                      const data: LocationMap = {
                        latitude: parseFloat(
                          transaction.charitarianAddress.addressCoordinates.latitude
                        ),
                        longitude: parseFloat(
                          transaction.charitarianAddress.addressCoordinates.longitude
                        ),
                      };
                      setLocation(data);
                      setShowMapModal(true);
                    }}
                  >
                    <View style={styles.detailsButtonContent}>
                      <Icon name="map" size={20} color={Colors.orange500} />
                      <Text style={styles.detailsButtonText}>Xem địa chỉ</Text>
                    </View>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.detailsButton}
                    onPress={() => {
                      console.log("Gọi điện");
                    }}
                  >
                    <View style={styles.detailsButtonContent}>
                      <Icon name="phone" size={20} color={Colors.orange500} />
                      <Text style={styles.detailsButtonText}>Gọi điện</Text>
                    </View>
                  </TouchableOpacity>
                </>
              )}

            {transaction.status === "Pending" &&
              checkRole(transaction) === "charitarian" && (
                <>
                  <TouchableOpacity
                    style={styles.verifyButton}
                    onPress={() => {
                      setSelectedTransaction(transaction);
                      setShowModal(true);
                      setVerificationInput("");
                    }}
                  >
                    <Text style={styles.verifyButtonText}>
                      Xác thực giao dịch
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.detailsButton}
                    onPress={() => {
                      console.log("Gọi điện");
                    }}
                  >
                    <View style={styles.detailsButtonContent}>
                      <Icon name="phone" size={20} color={Colors.orange500} />
                      <Text style={styles.detailsButtonText}>Gọi điện</Text>
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
                      <Icon
                        name="drive-file-rename-outline"
                        size={20}
                        color={Colors.orange500}
                      />
                      <Text style={styles.detailsButtonText}>Đánh giá</Text>
                    </View>
                  </TouchableOpacity>
                ) : (
                  <>
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
                  </>
                )}

                <TouchableOpacity
                  style={styles.detailsButton}
                  onPress={() => handleOpenReportModal(transaction)}
                >
                  <View style={styles.detailsButtonContent}>
                    <Icon name="report" size={20} color={Colors.orange500} />
                    <Text style={styles.detailsButtonText}>Báo cáo</Text>
                  </View>
                </TouchableOpacity>
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
        <TouchableWithoutFeedback onPress={() => setShowModal(false)}>
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Mã định danh</Text>
              {selectedTransaction && (
                <View style={styles.idContainer}>
                  {qrCodeBase64 && (
                    <Image
                      source={{
                        uri: qrCodeBase64,
                      }}
                      style={{ width: 220, height: 220 }}
                    />
                  )}
                </View>
              )}
              {/* 
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
            /> */}
              {selectedTransaction &&
                checkRole(selectedTransaction) === "charitarian" && (
                  <View style={styles.modalButtons}>
                    <TouchableOpacity
                      style={[styles.modalButton, styles.cancelButton]}
                      onPress={() => {
                        setShowModal(false);
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
                      <Text style={styles.buttonText}>Xác nhận giao dịch</Text>
                    </TouchableOpacity>
                  </View>
                )}
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      <UserRatingModal
        isVisible={isRatingModalVisible}
        onClose={() => setIsRatingModalVisible(false)}
        onSubmitRating={handleRating}
        userTransactionToRate={{
          userId:
            userId === selectedTransaction?.charitarian.id
              ? selectedTransaction?.requester.id
              : selectedTransaction?.charitarian.id || "",
          userName:
            userId === selectedTransaction?.charitarian.id
              ? selectedTransaction?.requester.name || ""
              : selectedTransaction?.charitarian.name || "",
          transactionId: selectedTransaction?.id || "",
        }}
      />

      <UserReportModal
        isVisible={isReportModalVisible}
        onClose={() => setIsReportModalVisible(false)}
        onSubmitRating={handleReport}
        userTransactionToRate={{
          userId:
            userId === selectedTransaction?.charitarian.id
              ? selectedTransaction?.requester.id
              : selectedTransaction?.charitarian.id || "",
          userName:
            userId === selectedTransaction?.charitarian.id
              ? selectedTransaction?.requester.name || ""
              : selectedTransaction?.charitarian.name || "",
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
    marginBottom: 12,
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
