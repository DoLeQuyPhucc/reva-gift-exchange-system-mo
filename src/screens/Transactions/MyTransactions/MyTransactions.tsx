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
import { useAuthCheck } from "@/src/hooks/useAuth";
import { TouchableWithoutFeedback } from "react-native";
import { formatDate, formatDate_DD_MM_YYYY } from "@/src/shared/formatDate";
import ReportModal from "@/src/components/ReportModal";
import { useNavigation } from "@/src/hooks/useNavigation";
import { TextInput } from "react-native";
import { RouteProp, useRoute } from "@react-navigation/native";
import { RootStackParamList } from "@/src/layouts/types/navigationTypes";

type MyTransactionsScreenRouteProp = RouteProp<
  RootStackParamList,
  "MyTransactions"
>;

const MyTransactions = () => {
  const route = useRoute<MyTransactionsScreenRouteProp>();
  const requestId = route.params.requestId;

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

  const [isConfirm, setIsConfirm] = useState(false);

  const [showInputRejectMessage, setShowInputRejectMessage] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [rejectMessage, setRejectMessage] = useState<string>("");

  const navigation = useNavigation();

  useEffect(() => {
    fetchTransactions();
  }, [isConfirm, requestId]);

  useEffect(() => {
    if (selectedTransaction?.status === "In_Progress") {
      fetchQRCode(selectedTransaction.id);
    }
  }, [selectedTransaction]);

  const fetchTransactions = async () => {
    try {
      let response;
      if (requestId === "") {
        response = await axiosInstance.get("transaction/own-transactions");
      } else {
        response = await axiosInstance.get(`transaction/${requestId}`);
        console.log(response.data.data);
      }

      if (!response.data.data) {
        return;
      }

      const statusOrder = {
        In_Progress: 0,
        Completed: 1,
        Not_Completed: 2,
      };

      const transactionsList = await Promise.all(
        response.data.data.map(async (transaction: Transaction) => {
          let updatedTransaction = { ...transaction };

          if (
            transaction.status === "Completed" ||
            transaction.status === "Not_Completed"
          ) {
            try {
              const rating = await axiosInstance.get<RatingResponse>(
                `rating/transaction/${transaction.id}`
              );
              if (rating.data.data.length === 0) {
                updatedTransaction.rating = null;
                updatedTransaction.ratingComment = null;
              } else {
                updatedTransaction.rating = rating.data.data[0].rating;
                updatedTransaction.ratingComment = rating.data.data[0].comment;
              }
            } catch (error) {
              updatedTransaction.rating = null;
              updatedTransaction.ratingComment = null;
            }
          }
          return updatedTransaction;
        })
      );

      // Sort transactions by status priority
      const sortedTransactions = transactionsList.sort(
        (a: Transaction, b: Transaction) => {
          return statusOrder[a.status] - statusOrder[b.status];
        }
      );

      setTransactions(sortedTransactions);
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

  const handleVerification = async (transactionId: string) => {
    try {
      const res = await axiosInstance.put(
        `transaction/approve/${transactionId}`
      );
      console.log(res.data);
      Alert.alert("Thành công", "Đã xác nhận giao dịch", [
        {
          text: "OK",
          onPress: () =>
            navigation.navigate("MyTransactions", { requestId: requestId }),
        },
      ]);
      setShowConfirmModal(false);
    } catch (error) {
      Alert.alert("Lỗi", "Không thể xác nhận giao dịch. Vui lòng thử lại sau.");
    }
  };

  const handleReject = async (transactionId: string) => {
    try {
      await axiosInstance.put(
        `transaction/reject/${transactionId}?message=${rejectMessage}`
      );
      Alert.alert("Thành công", "Đã từ chối giao dịch", [
        {
          text: "OK",
          onPress: () =>
            navigation.navigate("MyTransactions", { requestId: requestId }),
        },
      ]);
      setShowInputRejectMessage(false);
    } catch (error) {
      Alert.alert("Lỗi", "Không thể từ chối giao dịch. Vui lòng thử lại sau.");
    }
  };

  const handleOpenActionModal = (transaction: Transaction, action: string) => {
    setSelectedTransaction(transaction);
    if (action === "confirm") {
      setShowConfirmModal(true);
    } else if (action === "reject") {
      setShowInputRejectMessage(true);
    }
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

    return `${formatTime(startTime)} - ${formatTime(
      endTime
    )} ${formatDate_DD_MM_YYYY(date.toISOString())}`;
  };

  const getTransactionTitle = (transaction: Transaction) => {
    if (!transaction.requesterItem?.itemName) {
      return `Giao dịch đăng ký nhận từ ${
        checkRole(transaction) === "requester"
          ? "bạn"
          : transaction.requester.name
      }`;
    }
    return `Giao dịch giữa bạn và ${
      checkRole(transaction) === "charitarian"
        ? transaction.requester.name
        : transaction.charitarian.name
    }`;
  };
  interface RatingResponse {
    isSuccess: boolean;
    data: any;
    code: number;
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
        key={star}
        name="star"
        size={30}
        color={star <= rating ? "#FFD700" : "#D3D3D3"}
      />
    ));
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "In_Progress":
        return "Đang diễn ra";
      case "Completed":
        return "Đã hoàn thành";
      case "Not_Completed":
        return "Không thành công";
      default:
        return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "In_Progress":
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
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {requestId === "" ? (
          <>
            <Text style={styles.resultCount}>
              {transactions.length} giao dịch
            </Text>
            {transactions.map((transaction) => (
              <TouchableOpacity
                key={transaction.id}
                style={styles.card}
                onPress={() =>
                  navigation.navigate("MyTransactions", {
                    requestId: transaction.requestId,
                  })
                }
              >
                <View style={styles.cardHeaderList}>
                  <Text style={styles.cardTitleList}>
                    {getTransactionTitle(transaction)}
                  </Text>
                  <View style={styles.statusContainerList}>
                    <View
                      style={[
                        styles.statusDotList,
                        { backgroundColor: getStatusColor(transaction.status) },
                      ]}
                    />
                    <Text
                      style={[
                        styles.statusList,
                        { color: getStatusColor(transaction.status) },
                      ]}
                    >
                      {getStatusText(transaction.status)}
                    </Text>
                  </View>
                </View>

                {transaction.requesterItem ? (
                  <View style={styles.productsContainerList}>
                    <View style={styles.productCardList}>
                      <Image
                        source={{
                          uri: transaction.requesterItem?.itemImages[0],
                        }}
                        style={styles.productImageList}
                      />
                      <Text style={styles.productNameList} numberOfLines={2}>
                        {transaction.requesterItem?.itemName}
                      </Text>
                      <Text style={styles.ownerNameList}>
                        {transaction.requester.name}
                      </Text>
                    </View>

                    <View style={styles.exchangeContainerList}>
                      <Icon
                        name="swap-vert"
                        size={24}
                        color={Colors.orange500}
                      />
                    </View>

                    {/* Recipient's Product */}
                    <View style={styles.productCardList}>
                      <Image
                        source={{
                          uri: transaction.charitarianItem.itemImages[0],
                        }}
                        style={styles.productImageList}
                      />
                      <Text style={styles.productNameList} numberOfLines={2}>
                        {transaction.charitarianItem.itemName}
                      </Text>
                      <Text style={styles.ownerNameList}>
                        {transaction.charitarian.name}
                      </Text>
                    </View>
                  </View>
                ) : (
                  <View style={styles.productCardList}>
                    <Image
                      source={{
                        uri: transaction.charitarianItem.itemImages[0],
                      }}
                      style={styles.productImageList}
                    />
                    <Text style={styles.productName} numberOfLines={2}>
                      {transaction.charitarianItem.itemName}
                    </Text>
                    <Text style={styles.ownerNameList}>
                      {transaction.charitarian.name}
                    </Text>
                  </View>
                )}

                <View style={styles.dateInfoList}>
                  <View style={styles.dateRowList}>
                    <Text style={styles.dateLabelList}>Ngày tạo:</Text>
                    <Text style={styles.dateValueList}>
                      {formatDate(transaction.createdAt)}
                    </Text>
                  </View>
                  <View style={styles.dateRowList}>
                    <Text style={styles.dateLabelList}>Thời gian hẹn:</Text>
                    <Text style={styles.dateValueList}>
                      {formatDate(transaction.appointmentDate)}
                    </Text>
                  </View>
                </View>
                {transaction.requestNote !== "" && (
                  <View style={styles.dateInfoList}>
                    <Text style={styles.dateLabelList}>
                      <Icon
                        name="question-answer"
                        size={12}
                        color={Colors.orange500}
                      />
                      {"  "}
                      Lời nhắn từ người cho: {transaction.requestNote}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </>
        ) : (
          <>
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

                {transaction.requesterItem ? (
                  <View style={styles.productsContainer}>
                    <View style={styles.productCard}>
                      <Image
                        source={{
                          uri: transaction.requesterItem?.itemImages[0],
                        }}
                        style={styles.productImage}
                      />
                      <Text style={styles.productName} numberOfLines={2}>
                        {transaction.requesterItem?.itemName}
                      </Text>
                      <Text style={styles.ownerName}>
                        {transaction.requester.name}
                      </Text>
                    </View>

                    <View style={styles.exchangeContainer}>
                      <Icon
                        name="swap-vert"
                        size={24}
                        color={Colors.orange500}
                      />
                    </View>

                    {/* Recipient's Product */}
                    <View style={styles.productCard}>
                      <Image
                        source={{
                          uri: transaction.charitarianItem.itemImages[0],
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
                        uri: transaction.charitarianItem.itemImages[0],
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

                {transaction.requestNote !== "" && (
                  <View style={styles.dateInfo}>
                    <Text style={styles.dateLabel}>
                      <Icon
                        name="question-answer"
                        size={12}
                        color={Colors.orange500}
                      />
                      {"  "}
                      Lời nhắn từ người cho: {transaction.requestNote}
                    </Text>
                  </View>
                )}

                <View style={styles.dateInfo}>
                  <Text style={styles.dateLabel}>
                    <Icon name="info" size={14} color={Colors.orange500} /> Lưu
                    ý: Bạn nên tới vào lúc{" "}
                    {formatTimeRange(transaction.appointmentDate)} để có thể
                    thấy được mã xác nhận và hoàn thành giao dịch.
                  </Text>
                </View>

                {transaction.rejectMessage && (
                  <Text style={styles.rejectMessage}>
                    Từ chối: {transaction.rejectMessage}
                  </Text>
                )}

                {transaction.status === "In_Progress" &&
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
                              transaction.charitarianAddress.addressCoordinates
                                .latitude
                            ),
                            longitude: parseFloat(
                              transaction.charitarianAddress.addressCoordinates
                                .longitude
                            ),
                          };
                          setLocation(data);
                          setShowMapModal(true);
                        }}
                      >
                        <View style={styles.detailsButtonContent}>
                          <Icon name="map" size={20} color={Colors.orange500} />
                          <Text style={styles.detailsButtonText}>
                            Xem địa chỉ
                          </Text>
                        </View>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.detailsButton}
                        onPress={() => {
                          console.log("Gọi điện");
                        }}
                      >
                        <View style={styles.detailsButtonContent}>
                          <Icon
                            name="phone"
                            size={20}
                            color={Colors.orange500}
                          />
                          <Text style={styles.detailsButtonText}>Gọi điện</Text>
                        </View>
                      </TouchableOpacity>
                    </>
                  )}

                {transaction.status === "In_Progress" &&
                  checkRole(transaction) === "charitarian" && (
                    <>
                      <TouchableOpacity
                        style={styles.verifyButton}
                        onPress={() => {
                          navigation.navigate("QRScanner");
                        }}
                      >
                        <Text style={styles.verifyButtonText}>
                          Xác thực giao dịch
                        </Text>
                      </TouchableOpacity>
                      <View style={styles.topButtonRow}>
                        <TouchableOpacity
                          style={[styles.modalButton, styles.rejectButton]}
                          onPress={() =>
                            handleOpenActionModal(transaction, "reject")
                          }
                        >
                          <Text style={styles.verifyButtonText}>
                            Từ chối
                          </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[
                            styles.modalButton,
                            {
                              backgroundColor: Colors.lightGreen,
                              alignItems: "center",
                            },
                          ]}
                          onPress={() =>
                            handleOpenActionModal(transaction, "confirm")
                          }
                        >
                          <Text style={styles.verifyButtonText}>
                            Xác nhận
                          </Text>
                        </TouchableOpacity>
                      </View>

                      <TouchableOpacity
                        style={styles.detailsButton}
                        onPress={() => {
                          console.log("Gọi điện");
                        }}
                      >
                        <View style={styles.detailsButtonContent}>
                          <Icon
                            name="phone"
                            size={20}
                            color={Colors.orange500}
                          />
                          <Text style={styles.detailsButtonText}>Gọi điện</Text>
                        </View>
                      </TouchableOpacity>
                    </>
                  )}

                {(transaction.status === "Completed" ||
                  transaction.status === "Not_Completed") && (
                  <>
                    <TouchableOpacity
                      style={[styles.verifyButton, { opacity: 0.5 }]}
                      disabled={true}
                    >
                      <Text style={styles.verifyButtonText}>Đã xác thực</Text>
                    </TouchableOpacity>
                    {transaction.rating === null || transaction.rating === 0 ? (
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
                          <Text style={styles.titleText}>
                            Đánh giá giao dịch
                          </Text>
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
                        <Icon
                          name="report"
                          size={20}
                          color={Colors.orange500}
                        />
                        <Text style={styles.detailsButtonText}>Báo cáo</Text>
                      </View>
                    </TouchableOpacity>
                  </>
                )}
              </View>
            ))}
          </>
        )}
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

              <Text
                style={{
                  color: "#ababab",
                  fontStyle: "italic",
                  textAlign: "center",
                }}
              >
                *Sử dụng mã định danh này để xác nhận giao dịch khi bạn đến
              </Text>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      <Modal
        visible={showConfirmModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowConfirmModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Xác nhận giao dịch</Text>

            <View style={styles.modalButtonContainer}>
              <View style={styles.topButtonRow}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => {
                    setShowConfirmModal(false);
                    setShowInputRejectMessage(false);
                    setRejectMessage("");
                  }}
                >
                  <Text style={styles.cancleButtonText}>Hủy</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.verifyButton]}
                  onPress={() => {
                    if (selectedTransaction) {
                      handleVerification(selectedTransaction.id);
                    }
                  }}
                >
                  <Text style={styles.buttonText}>Xác nhận</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>
      <Modal
        visible={showInputRejectMessage}
        transparent
        animationType="fade"
        onRequestClose={() => setShowInputRejectMessage(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Từ chối giao dịch</Text>

            <Text style={styles.modalDescription}>
              Vui lòng nhập lý do từ chối:
            </Text>
            <TextInput
              placeholderTextColor="#c4c4c4"
              style={styles.requestInput}
              placeholder="Nhập tin nhắn..."
              value={rejectMessage}
              onChangeText={setRejectMessage}
              multiline
            />
            {rejectMessage.length > 99 && (
              <Text style={styles.textErrorMessage}>
                Lời nhắn của bạn không được vượt quá 100 ký tự.
              </Text>
            )}
            {rejectMessage.length === 0 && (
              <Text style={styles.textErrorMessage}>
                Bạn phải nhập lí do từ chối
              </Text>
            )}

            <View style={styles.modalButtonContainer}>
              <View style={styles.topButtonRow}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => {
                    setShowConfirmModal(false);
                    setShowInputRejectMessage(false);
                    setRejectMessage("");
                  }}
                >
                  <Text style={styles.cancleButtonText}>Hủy</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.modalButton,
                    styles.rejectButton,
                    rejectMessage.length === 0 && styles.disabledButton,
                  ]}
                  disabled={rejectMessage.length === 0}
                  onPress={() => {
                    if (selectedTransaction) {
                      handleReject(selectedTransaction.id);
                    }
                  }}
                >
                  <Text
                    style={[
                      styles.buttonText,
                      rejectMessage.length === 0 && styles.disabledButtonText,
                    ]}
                  >
                    Từ chối
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
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

      <ReportModal
        isVisible={isReportModalVisible}
        onClose={() => setIsReportModalVisible(false)}
        onSubmit={handleReport}
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
    backgroundColor: "#f5f5f5",
  },
  resultCount: {
    color: "#666",
    marginBottom: 16,
    marginHorizontal: 16,
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
    padding: 12,
    borderRadius: 8,
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
  cardHeaderList: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  cardTitleList: {
    fontSize: 16,
    fontWeight: "bold",
    flex: 1,
  },
  statusContainerList: {
    flexDirection: "row",
    alignItems: "center",
  },
  statusDotList: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusList: {
    fontSize: 12,
    fontWeight: "500",
  },
  productsContainerList: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  productCardList: {
    flex: 1,
    alignItems: "center",
    marginHorizontal: 4,
  },
  productImageList: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginBottom: 4,
  },
  productNameList: {
    fontSize: 12,
    fontWeight: "500",
    textAlign: "center",
  },
  ownerNameList: {
    fontSize: 10,
    color: "#666",
    textAlign: "center",
  },
  exchangeContainerList: {
    paddingHorizontal: 8,
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
  exchangeIcon: {
    fontSize: 24,
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
  dateInfoList: {
    backgroundColor: "#f8f8f8",
    padding: 12,
    borderRadius: 8,
    marginVertical: 8,
  },
  dateRowList: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  dateLabelList: {
    color: "#666",
    fontSize: 12,
  },
  dateValueList: {
    color: "#333",
    fontSize: 12,
    fontWeight: "500",
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
  modalButtonContainer: {
    marginTop: 16,
    width: "100%",
  },
  topButtonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },
  bottomButton: {
    width: "100%",
    padding: 12,
    borderRadius: 8,
  },
  modalButton: {
    padding: 12,
    borderRadius: 8,
    flex: 0.48, // For top row buttons
    alignItems: "center",
  },
  verifyButton: {
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    backgroundColor: Colors.orange500,
  },
  verifyButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  rejectButton: {
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    backgroundColor: "#f00",
  },
  cancelButton: {
    backgroundColor: "#666",
  },
  cancleButtonText: {
    color: "#eee",
    textAlign: "center",
    fontSize: 16,
    fontWeight: "600",
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
    borderColor: Colors.orange500,
    borderWidth: 1,
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
  disabledButton: {
    backgroundColor: "#ccc",
    opacity: 0.5,
  },
  disabledButtonText: {
    color: "#666",
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
    color: "#FFD700",
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
  modalDescription: {
    fontSize: 16,
    marginBottom: 16,
    fontWeight: "bold",
    textAlign: "left",
  },
  rejectMessage: {
    backgroundColor: "#ffe3e3",
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  scrollView: {
    flex: 1,
    // paddingHorizontal: 16,
  },
  scrollContent: {
    padding: 16,
  },
});

export default MyTransactions;
