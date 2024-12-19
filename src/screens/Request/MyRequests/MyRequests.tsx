import {
  View,
  Text,
  Platform,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  Modal,
  TextInput,
  FlatList,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import React, { useEffect, useState } from "react";
import { RootStackParamList } from "@/src/layouts/types/navigationTypes";
import { RouteProp, useRoute } from "@react-navigation/native";
import Colors from "@/src/constants/Colors";
import { Request, User } from "@/src/shared/type";
import axiosInstance from "@/src/api/axiosInstance";
import {
  formatDate,
  formatDate_DD_MM_YYYY,
  formatDate_HHmm_DD_MM_YYYY,
} from "@/src/shared/formatDate";
import Icon from "react-native-vector-icons/MaterialIcons";
import ImagesModalViewer from "@/src/components/modal/ImagesModalViewer";
import { CustomAlert } from "@/src/components/CustomAlert";
import { useNavigation } from "@/src/hooks/useNavigation";
import { useAuthCheck } from "@/src/hooks/useAuth";

const STATUS_COLORS: { [key: string]: string } = {
  Pending: Colors.orange500,
  Approved: Colors.blue500,
  Rejected: Colors.lightRed,
  Hold_On: Colors.gray600,
  Completed: Colors.lightGreen,
  Not_Completed: Colors.lightRed,
};

const STATUS_LABELS = {
  Pending: "Đang chờ",
  Approved: "Đang trong giao dịch",
  Rejected: "Từ chối",
  Hold_On: "Tạm hoãn",
  Completed: "Đã hoàn thành",
  Not_Completed: "Không thành công",
};

type MyRequestsScreenRouteProp = RouteProp<RootStackParamList, "MyRequests">;

export default function MyRequestsScreen() {
  const route = useRoute<MyRequestsScreenRouteProp>();
  const itemId = route.params.productId;
  const typeRequest = route.params.type;

  const { userData } = useAuthCheck();

  const [requests, setRequests] = useState<Request[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<Request | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showTimeModal, setShowTimeModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectMessage, setRejectMessage] = useState<string>("");
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [approveMessage, setApproveMessage] = useState<string>("");
  const [showInfoUser, setShowInfoUser] = useState(false);
  const [user, setUser] = useState<User>({} as User);

  const [isModalVisible, setModalVisible] = useState(false);
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [isShowActions, setIsShowActions] = useState(false);

  const [showAlertDialog, setShowAlertDialog] = useState(false);
  const [alertData, setAlertData] = useState({
    title: "",
    message: "",
  });

  const navigation = useNavigation();
  // Thêm state searchQuery
  const [searchQuery, setSearchQuery] = useState<string>("");

  const [refreshing, setRefreshing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const PAGE_SIZE = 10;

  const fetchRequests = async (page: number) => {
    setIsLoading(true);
    try {
      let requestsResponse;

      switch (typeRequest) {
        case "itemRequestTo":
          if (itemId !== "") {
            requestsResponse = await axiosInstance.get(
              `request/my-requests/${itemId}?pageIndex=${page}&sizeIndex=${PAGE_SIZE}`
            );
          } else {
            requestsResponse = await axiosInstance.get(
              `request/my-requests?pageIndex=${page}&sizeIndex=${PAGE_SIZE}`
            );
          }
          setIsShowActions(false);
          break;
        case "requestsForMe":
          if (itemId !== "") {
            requestsResponse = await axiosInstance.get(
              `request/requests-for-me/${itemId}?pageIndex=${page}&sizeIndex=${PAGE_SIZE}`
            );
          } else {
            requestsResponse = await axiosInstance.get(
              `request/requests-for-me?pageIndex=${page}&sizeIndex=${PAGE_SIZE}`
            );
          }
          setIsShowActions(true);
          break;
        default:
          console.warn("Invalid typeRequest:", typeRequest);
          return;
      }

      if (requestsResponse?.data?.data) {
        const { data, totalItems } = requestsResponse.data.data;

        const sortedRequests = data.sort((a: Request, b: Request) => {
          const statusOrder: { [key: string]: number } = {
            Pending: 1,
            Hold_On: 2,
            Approved: 3,
            Rejected: 4,
            Completed: 5,
            Not_Completed: 6,
          };
          return statusOrder[a.status] - statusOrder[b.status];
        });

        if (page === 1) {
          setRequests(sortedRequests);
        } else {
          setRequests((prev) => [...prev, ...sortedRequests]);
        }

        setTotalPages(Math.ceil(totalItems / PAGE_SIZE));
      } else {
        console.warn("No data found in response:", requestsResponse);
      }
      setIsLoading(false);
    } catch (error) {
      console.error("Error fetching requests:", error);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests(1);
  }, []);

  const loadMore = () => {
    if (!isLoading && currentPage < totalPages) {
      setCurrentPage((prev) => prev + 1);
      fetchRequests(currentPage + 1);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchRequests(1);
    setRefreshing(false);
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
    // Reset products and fetch first page with search query
    fetchRequests(1);
  };

  // Thêm hàm lọc requests
  const filteredRequests = requests.filter((request: Request) => {
    const searchLower = searchQuery.toLowerCase();
    const charitarianItemName = request.charitarianItem.itemName.toLowerCase();
    const requesterItemName =
      request.requesterItem?.itemName?.toLowerCase() || "";

    return (
      charitarianItemName.includes(searchLower) ||
      requesterItemName.includes(searchLower)
    );
  });

  const handleImagePress = (listImages: string[]) => {
    setSelectedImages(listImages);
    setModalVisible(true);
  };

  const formatTimeSlot = (timeString: string) => {
    const startTime = new Date(timeString);

    const formatTime = (date: Date) => {
      return date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });
    };

    return `${formatTime(startTime)} ${formatDate_DD_MM_YYYY(
      startTime.toISOString()
    )}`;
  };

  const handleApprove = async (requestId: string) => {
    if (!selectedTime) return;
    try {
      const requestResponse = await axiosInstance.post(
        `request/approve/${requestId}`,
        approveMessage
      );

      if (requestResponse.data.isSuccess === true) {
        const [datePart, timePart] = selectedTime.split(" ");
        const [year, month, day] = datePart.split("-");
        const [hours, minutes, seconds] = timePart.split(":");

        const date = new Date(
          Date.UTC(
            Number(year),
            Number(month) - 1,
            Number(day),
            Number(hours),
            Number(minutes),
            Number(seconds)
          )
        );

        const convertedDate = date.toISOString().replace("Z", "");
        const transactionData = {
          requestId: requestId,
          appointmentDate: convertedDate,
        };

        console.log(transactionData);
        await axiosInstance.post(`transaction/create`, transactionData);
      }
      fetchRequests(1);
      setShowTimeModal(false);
      setSelectedRequest(null);
      setSelectedTime(null);
      setApproveMessage("");

      setAlertData({
        title: "Thành công",
        message: "Chấp nhận yêu cầu thành công!",
      });
      setShowAlertDialog(true);
    } catch (error) {
      console.error("Error approving request:", error);
    }
  };

  const handleShowInfoUser = async (userId: string) => {
    try {
      console.log(userId);
      const response = await axiosInstance.get(`user/profile/${userId}`);
      setUser(response.data.data);
      setShowInfoUser(true);
    } catch (error) {
      console.error("Error fetching user info:", error);
    }
  };

  const handleReject = async (requestId: string) => {
    try {
      const data = { reject_message: rejectMessage };
      const response = await axiosInstance.post(
        `request/reject/${requestId}`,
        data
      );

      if (response.data.isSuccess === true) {
        fetchRequests(1);
        setShowRejectModal(false);
        setRejectMessage("");
      }

      setAlertData({
        title: "Thành công",
        message: "Bạn đã từ chối yêu cầu này!",
      });
      setShowAlertDialog(true);
    } catch (error) {
      console.error("Error rejecting request:", error);
    }
  };

  const handleSelectRequest = (request: Request) => {
    setSelectedRequest(request);
    setShowDetailModal(true);
    setSelectedTime(request.appointmentDate[0]);
  };

  const handleNavigateToProductDetail = (productId: string) => {
    if (!productId) return;
    navigation.navigate("ProductDetail", { productId });
    setShowDetailModal(false);
  };

  const RequestListItem = ({
    request,
    onPress,
  }: {
    request: Request;
    onPress: () => void;
  }) => {
    const isExchangeRequest = request.requesterItem !== null;

    return (
      <TouchableOpacity style={styles.listItem} onPress={onPress}>
        <View style={styles.userSection}>
          <Image
            source={{ uri: request.requester.image }}
            style={styles.listItemAvatar}
          />
          <View style={styles.userInfo}>
            {userData.userId !== request.requester.id ? (
            <View>
              <Text style={styles.listItemName}>{request.requester.name}</Text>
              <Text style={styles.listItemTime}>
                {formatDate_HHmm_DD_MM_YYYY(request.createdAt)}
              </Text>
            </View>
            ) : (
              <View>
                <Text style={styles.listItemName}>Tôi</Text>
                <Text style={styles.listItemTime}>
                  {formatDate_HHmm_DD_MM_YYYY(request.createdAt)}
                </Text>
              </View>)}
          </View>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: `${STATUS_COLORS[request.status]}15` },
            ]}
          >
            <View
              style={[
                styles.statusDot,
                { backgroundColor: STATUS_COLORS[request.status] },
              ]}
            />
            <Text
              style={[
                styles.statusText,
                { color: STATUS_COLORS[request.status] },
              ]}
            >
              {STATUS_LABELS[request.status]}
            </Text>
          </View>
        </View>

        <View style={styles.listItemContent}>
          <Text style={styles.listItemType}>
            {isExchangeRequest
              ? "Yêu cầu trao đổi sản phẩm"
              : "Yêu cầu nhận sản phẩm"}
          </Text>

          <View style={styles.itemPreview}>
            {isExchangeRequest ? (
              <>
                <Image
                  source={{ uri: request.requesterItem?.itemImages[0] }}
                  style={styles.previewImage}
                />
                <Icon name="swap-horiz" size={16} color={Colors.orange500} />
                <Image
                  source={{ uri: request.charitarianItem.itemImages[0] }}
                  style={styles.previewImage}
                />
              </>
            ) : (
              <Image
                source={{ uri: request.charitarianItem.itemImages[0] }}
                style={styles.previewImage}
              />
            )}
          </View>
        </View>

        <View>
          <View>
            {request.appointmentDate.map((date, index) => (
              <View key={date} style={styles.timeSlotList}>
                <Icon name="access-time" size={16} color={Colors.orange500} />
                <Text style={styles.timeSlotTextList}>{formatDate(date)}</Text>
              </View>
            ))}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const RequestDetailModal = ({
    visible,
    request,
    onClose,
    onApprove,
    onReject,
    isShowActions,
  }: {
    visible: boolean;
    request: Request | null;
    onClose: () => void;
    onApprove: (request: Request) => void;
    onReject: (request: Request) => void;
    isShowActions: boolean;
  }) => {
    if (!request) return null;

    const isExchangeRequest = request.requesterItem !== null;

    return (
      <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
        <View style={styles.centeredView}>
          <View style={styles.modalView}>
            <ScrollView style={styles.modalScrollView}>
              <View style={styles.modalHeader}>
                <View></View>
                <Text style={styles.modalTitle}>
                  {isExchangeRequest
                    ? "Chi tiết trao đổi sản phẩm"
                    : "Chi tiết yêu cầu nhận sản phẩm"}
                </Text>
                <TouchableOpacity onPress={onClose}>
                  <Icon
                    name="close"
                    size={24}
                    color="#000"
                    style={{ marginBottom: 15 }}
                  />
                </TouchableOpacity>
              </View>
              {/* Requester Info */}
              <View style={styles.userSection}>
                <TouchableOpacity
                  onPress={() => handleShowInfoUser(request.requester.id)}
                >
                  <Image
                    source={{ uri: request.requester.image }}
                    style={styles.avatar}
                  />
                </TouchableOpacity>

              {userData.userId !== request.requester.id ? (
                <TouchableOpacity
                  onPress={() => handleShowInfoUser(request.requester.id)}
                  style={styles.userInfo}
                >
                  <Text style={styles.userName}>{request.requester.name}</Text>
                </TouchableOpacity>) : (
                <TouchableOpacity 
                onPress={() => handleShowInfoUser(request.requester.id)}
                style={styles.userInfo}
              >
                <Text style={styles.userName}>Tôi</Text>
              </TouchableOpacity>
              )}
                
                <View
                  style={[
                    styles.statusBadge,
                    { backgroundColor: `${STATUS_COLORS[request.status]}15` },
                  ]}
                >
                  <View
                    style={[
                      styles.statusDot,
                      { backgroundColor: STATUS_COLORS[request.status] },
                    ]}
                  />
                  <Text
                    style={[
                      styles.statusText,
                      { color: STATUS_COLORS[request.status] },
                    ]}
                  >
                    {STATUS_LABELS[request.status]}
                  </Text>
                </View>
              </View>

              {/* Status Message Box */}
              <View style={styles.statusMessageBox}>
                <View style={styles.statusMessageContent}>
                  <Icon
                    name={
                      request.status === "Pending"
                        ? "timer"
                        : request.status === "Approved"
                        ? "check-circle"
                        : request.status === "Rejected"
                        ? "cancel"
                        : request.status === "Hold_On"
                        ? "pause-circle-filled"
                        : request.status === "Completed"
                        ? "verified"
                        : "error"
                    }
                    size={20}
                    color={STATUS_COLORS[request.status]}
                  />
                  <Text
                    style={[
                      styles.statusMessage,
                      { color: STATUS_COLORS[request.status] },
                    ]}
                  >
                    {request.status === "Pending" &&
                      "Yêu cầu này đang trong quá trình đợi phản hồi."}
                    {request.status === "Approved" &&
                      "Yêu cầu đã được chấp nhận. Vui lòng chờ liên hệ để trao đổi thêm."}
                    {request.status === "Rejected" &&
                      "Yêu cầu đã bị từ chối. Xem lý do từ chối bên dưới."}
                    {request.status === "Hold_On" &&
                      "Yêu cầu tạm hoãn do sản phẩm đang trong giao dịch khác."}
                    {request.status === "Completed" &&
                      "Giao dịch đã hoàn thành thành công."}
                    {request.status === "Not_Completed" &&
                      "Giao dịch không thành công."}
                  </Text>
                </View>

                {(request.status === "Approved" ||
                  request.status === "Completed" ||
                  request.status === "Not_Completed") && (
                  <TouchableOpacity
                    style={styles.viewDetailButton}
                    onPress={() =>{
                      navigation.navigate("MyTransactions", {
                        requestId: request.id,
                      })
                      setShowDetailModal(false)
                    }
                    }
                  >
                    <Icon
                      name="arrow-forward"
                      size={20}
                      color={STATUS_COLORS[request.status]}
                    />
                  </TouchableOpacity>
                )}
              </View>

              {/* Items Section */}
              <View style={styles.itemsSection}>
                <Text style={styles.sectionTitle}>Thông tin sản phẩm</Text>
                {isExchangeRequest ? (
                  <View style={styles.exchangeItems}>
                    <TouchableOpacity
                      onPress={() =>
                        handleNavigateToProductDetail(
                          request.requesterItem?.itemId as string
                        )
                      }
                      style={styles.itemCard}
                    >
                      <Image
                        source={{ uri: request.requesterItem?.itemImages[0] }}
                        style={styles.itemImage}
                      />
                      <Text style={styles.itemName}>
                        {request.requesterItem?.itemName}
                      </Text>
                      <Text style={styles.itemQuantity}>
                        Số lượng: {request.requesterItem?.itemQuantity}
                      </Text>
                    </TouchableOpacity>
                    <Icon
                      name="swap-horiz"
                      size={24}
                      color={Colors.orange500}
                    />
                    <TouchableOpacity
                      onPress={() =>
                        handleNavigateToProductDetail(
                          request.charitarianItem?.itemId as string
                        )
                      }
                      style={styles.itemCard}
                    >
                      <Image
                        source={{ uri: request.charitarianItem.itemImages[0] }}
                        style={styles.itemImage}
                      />
                      <Text style={styles.itemName}>
                        {request.charitarianItem.itemName}
                      </Text>
                      <Text style={styles.itemQuantity}>
                        Số lượng: {request.charitarianItem.itemQuantity}
                      </Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity
                    onPress={() =>
                      handleNavigateToProductDetail(
                        request.charitarianItem?.itemId as string
                      )
                    }
                    style={styles.itemCard}
                  >
                    <Image
                      source={{ uri: request.charitarianItem.itemImages[0] }}
                      style={styles.itemImage}
                    />
                    <Text style={styles.itemName}>
                      {request.charitarianItem.itemName}
                    </Text>
                    <Text style={styles.itemQuantity}>
                      Số lượng: {request.charitarianItem.itemQuantity}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Message Section */}
              {request.requestMessage && (
                <View style={styles.messageSection}>
                  <Text style={styles.sectionTitle}>Lời nhắn</Text>
                  <Text>{request.requestMessage}</Text>
                </View>
              )}

              {/* Reject Message if any */}
              {request.rejectMessage && (
                <View style={styles.rejectSection}>
                  <Text style={styles.sectionTitle}>Lý do từ chối</Text>
                  {request.charitarian.id.match(userData.userId as string) ? (
                    <Text>{request.rejectMessage}</Text>
                  ) : (
                    <Text>
                      Rất tiếc, sản phẩm này đã được trao đổi rồi, vui lòng chọn
                      sản phẩm khác.
                    </Text>
                  )}
                </View>
              )}

              {/* Appointment Times */}
              <View style={styles.timeSection}>
                <Text style={styles.sectionTitle}>Thời gian mong muốn</Text>
                {request.appointmentDate.map((date, index) => (
                  <View key={index} style={styles.timeSlot}>
                    <Icon
                      name="access-time"
                      size={20}
                      color={Colors.orange500}
                    />
                    <Text style={styles.timeText}>{formatDate(date)}</Text>
                  </View>
                ))}
              </View>

              {/* Actions */}
              {isShowActions && request.status === "Pending" && (
                <View style={styles.actions}>
                  <TouchableOpacity
                    style={[styles.button, styles.rejectButton]}
                    onPress={() => onReject(request)}
                  >
                    <Text style={styles.buttonText}>Từ chối</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.button, styles.approveButton]}
                    onPress={() => onApprove(request)}
                  >
                    <Text style={styles.buttonText}>Chấp nhận</Text>
                  </TouchableOpacity>
                </View>
              )}
              <View style={{ height: 50, width: "100%" }}></View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <View style={styles.searchWrapper}>
          <Icon
            name="search"
            size={20}
            color={Colors.gray500}
            style={styles.searchIcon}
          />
          <TextInput
            placeholderTextColor="#c4c4c4"
            style={styles.searchInput}
            placeholder="Tìm kiếm theo tên sản phẩm..."
            value={searchQuery}
            onChangeText={() => handleSearch(searchQuery)}
          />
          {searchQuery !== "" && (
            <TouchableOpacity
              onPress={() => setSearchQuery("")}
              style={styles.clearButton}
            >
              <Icon name="close" size={20} color={Colors.gray500} />
            </TouchableOpacity>
          )}
        </View>
      </View>
      <Text style={styles.resultCount}>{filteredRequests.length} yêu cầu</Text>
      <FlatList
        data={filteredRequests}
        keyExtractor={(item: any) => item.id}
        renderItem={({ item }: { item: Request }) => (
          <RequestListItem
            request={item}
            onPress={() => handleSelectRequest(item)}
          />
        )}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={() =>
          isLoading ? (
            <View style={styles.loadingMore}>
              <ActivityIndicator size="small" color="#f97316" />
            </View>
          ) : null
        }
        style={styles.scrollView}
      />

      <RequestDetailModal
        visible={showDetailModal}
        request={selectedRequest}
        onClose={() => {
          setShowDetailModal(false);
          setSelectedRequest(null);
        }}
        onApprove={(request) => {
          setShowTimeModal(true);
          setShowDetailModal(false);
          setSelectedTime(request.appointmentDate[0]);
        }}
        onReject={(request) => {
          setSelectedRequest(request);
          setShowDetailModal(false);
          setShowRejectModal(true);
        }}
        isShowActions={isShowActions}
      />

      <Modal visible={showTimeModal} transparent animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={[styles.modalTitle, styles.textCenter]}>
              Bạn muốn xác nhận giao dịch này
            </Text>

            <ScrollView style={styles.timeSlotScrollView}>
              {selectedRequest?.appointmentDate.map((time: string) => (
                <Text
                  key={time} // If time string is unique
                  style={[
                    styles.modalTimeSlotText,
                    selectedTime === time && styles.selectedTimeSlotText,
                  ]}
                >
                  {formatTimeSlot(time)}
                </Text>
              ))}
            </ScrollView>

            <Text style={styles.modalDescription}>Nhập lời nhắn của bạn:</Text>
            <TextInput
              placeholderTextColor="#c4c4c4"
              style={styles.requestInput}
              placeholder="Nhập tin nhắn..."
              value={approveMessage}
              onChangeText={setApproveMessage}
              multiline
            />
            {approveMessage.length > 99 && (
              <Text style={styles.textErrorMessage}>
                Lời nhắn của bạn không được vượt quá 100 ký tự.
              </Text>
            )}

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setShowTimeModal(false);
                  setSelectedRequest(null);
                  setSelectedTime(null);
                  setApproveMessage("");
                  setShowDetailModal(false);
                }}
              >
                <Text style={styles.modalButtonText}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modalButton,
                  styles.confirmButton,
                  !selectedTime && styles.disabledButton,
                ]}
                onPress={() =>
                  selectedRequest?.id && handleApprove(selectedRequest.id)
                }
                disabled={!selectedTime}
              >
                <Text style={styles.modalButtonText}>Xác nhận</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={showRejectModal} transparent animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={[styles.modalTitle, styles.textCenter]}>
              Bạn muốn từ chối giao dịch này?
            </Text>
            <Text style={styles.modalDescription}>Nhập lời nhắn của bạn:</Text>
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
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setShowRejectModal(false);
                }}
              >
                <Text style={styles.modalButtonText}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton]}
                onPress={() =>
                  selectedRequest?.id && handleReject(selectedRequest.id)
                }
              >
                <Text style={styles.modalButtonText}>Xác nhận</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      <Modal visible={showInfoUser} transparent animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.profileHeader}>
              <Image
                source={{ uri: user.profilePicture }}
                style={styles.profilePicture}
              />
              <Text style={styles.userName}>{user.username}</Text>
            </View>

            <View style={styles.infoSection}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Điểm:</Text>
                <Text style={styles.infoValue}>{user.point}</Text>
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Là thành viên từ:</Text>
                <Text style={styles.infoValue}>
                  {formatDate_DD_MM_YYYY(user.dateJoined as string)}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowInfoUser(false)}
            >
              <Text style={styles.closeButtonText}>Đóng</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <ImagesModalViewer
        images={selectedImages}
        isVisible={isModalVisible}
        onClose={() => setModalVisible(false)}
      />

      <CustomAlert
        visible={showAlertDialog}
        title={alertData.title}
        message={alertData.message}
        onConfirm={() => setShowAlertDialog(false)}
        onCancel={() => setShowAlertDialog(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  resultCount: {
    color: "#666",
    marginBottom: 16,
    marginHorizontal: 32,
  },
  tabContainer: {
    flexDirection: "row",
    backgroundColor: "#fff",
    paddingTop: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: Colors.orange500,
  },
  tabText: {
    fontSize: 15,
    color: "#666",
    fontWeight: "500",
  },
  activeTabText: {
    color: Colors.orange500,
    fontWeight: "600",
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 16,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  statusText: {
    fontSize: 13,
    fontWeight: "500",
  },
  itemsContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  itemPoint: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.orange500,
  },
  exchangeIcon: {
    fontSize: 20,
  },
  timeSlotChip: {
    backgroundColor: "#fff",
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "#eee",
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  approveButton: {
    backgroundColor: Colors.orange500,
  },
  rejectButton: {
    backgroundColor: "#666",
  },
  buttonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
  },
  tabs: {
    flexDirection: "row",
    padding: 10,
    backgroundColor: "#fff",
  },
  row: {
    flexDirection: "row",
    marginBottom: 10,
  },
  requestInfo: {
    marginLeft: 10,
  },
  item: {
    alignItems: "center",
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 10,
    width: "80%",
  },
  centeredView: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalView: {
    backgroundColor: "white",
    borderTopRightRadius: 24,
    borderTopLeftRadius: 24,
    height: "90%",
    width: "100%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  modalScrollView: {
    flex: 1,
    padding: 24,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
  },
  textCenter: {
    textAlign: "center",
  },
  timeSlot: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.gray100,
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  selectedTimeSlot: {
    backgroundColor: "#e3f2fd",
    borderColor: "#2196F3",
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 20,
  },
  timeSlotScrollView: {
    maxHeight: 300,
    marginBottom: 20,
  },
  modalTimeSlot: {
    padding: 15,
    borderRadius: 8,
    backgroundColor: "#f5f5f5",
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  modalTimeSlotText: {
    fontSize: 16,
    textAlign: "center",
    color: "#333",
  },
  selectedTimeSlotText: {
    color: "#333",
  },
  modalButton: {
    flex: 1,
    marginHorizontal: 5,
    borderRadius: 8,
    padding: 10,
    elevation: 2,
    width: "48%",
    alignItems: "center",
  },

  cancelButton: {
    backgroundColor: "#FF3B30",
  },
  confirmButton: {
    backgroundColor: "#34C759",
  },
  disabledButton: {
    backgroundColor: "#cccccc",
    opacity: 0.7,
  },
  modalButtonText: {
    color: "#FFFFFF",
    textAlign: "center",
    fontSize: 16,
    fontWeight: "600",
  },
  singleItemContainer: {
    flex: 1,
    alignItems: "center",
    padding: 8,
  },
  singleItemImage: {
    width: 120,
    height: 120,
    borderRadius: 8,
    marginBottom: 8,
  },
  itemMessageContainer: {
    paddingHorizontal: 12,
  },
  timeMessage: {
    fontWeight: "500",
    color: "#666",
  },
  modalDescription: {
    fontSize: 16,
    marginBottom: 16,
    fontWeight: "bold",
    textAlign: "left",
  },
  requestInput: {
    borderColor: "#c4c4c4",
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    textAlignVertical: "top",
    width: "100%",
    marginBottom: 16,
  },
  textErrorMessage: {
    color: "#e53e3e",
    marginBottom: 16,
  },
  profileHeader: {
    alignItems: "center",
    marginBottom: 20,
  },
  profilePicture: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 10,
  },
  userName: {
    fontSize: 18,
    fontWeight: "bold",
  },
  infoSection: {
    gap: 12,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  infoLabel: {
    fontWeight: "600",
    color: "#666",
    flex: 1,
  },
  infoValue: {
    flex: 2,
    textAlign: "right",
  },
  closeButtonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
  holdOnText: {
    backgroundColor: "#f5f5f5",
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  scrollContent: {
    padding: 16,
  },
  card: {
    backgroundColor: "#fff",
    marginBottom: 32,
    borderRadius: 12,
    padding: 16,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  name: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1a1a1a",
    marginBottom: 2,
  },
  timestamp: {
    fontSize: 12,
    color: "#666",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  itemCard: {
    flex: 1,
    borderRadius: 12,
    padding: 8,
    alignItems: "center",
  },
  itemImage: {
    width: "100%",
    maxWidth: 80,
    maxHeight: 80,
    aspectRatio: 1,
    borderRadius: 8,
    marginBottom: 8,
  },
  itemName: {
    fontSize: 14,
    fontWeight: "500",
    color: "#1a1a1a",
    textAlign: "center",
    marginBottom: 4,
  },
  headerDetail: {
    fontSize: 14,
    fontWeight: "500",
    color: "#1a1a1a",
    marginBottom: 8,
    marginLeft: 8,
  },
  exchangeIconContainer: {
    width: 40,
    alignItems: "center",
  },
  messageContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  messageText: {
    marginLeft: 8,
    fontSize: 14,
    color: "#666",
    flex: 1,
  },
  timeSection: {
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
    paddingVertical: 16,
  },
  timeSectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  timeTitle: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: "600",
    color: "#1a1a1a",
  },
  timeSlotList: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.gray100,
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  timeSlotText: {
    marginLeft: 8,
    fontSize: 14,
    color: "#1a1a1a",
  },
  timeSlotTextList: {
    marginLeft: 8,
    fontSize: 14,
    color: "#1a1a1a",
  },
  actions: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 50,
  },
  listItem: {
    backgroundColor: "#fff",
    marginBottom: 8,
    borderRadius: 8,
    padding: 12,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  listItemContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  listItemAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  listItemInfo: {
    flex: 1,
    marginLeft: 12,
    justifyContent: "center",
  },
  listItemName: {
    fontSize: 16,
    fontWeight: "500",
    marginLeft: 8,
  },
  listItemTime: {
    fontSize: 12,
    color: "#666",
    marginLeft: 8,
  },
  listItemStatus: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  listItemStatusText: {
    fontSize: 12,
    fontWeight: "500",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
  },
  listItemType: {
    fontSize: 14,
    fontWeight: "500",
    color: Colors.orange500,
  },
  itemPreview: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },
  previewImage: {
    width: 40,
    height: 40,
    borderRadius: 8,
    marginHorizontal: 4,
  },

  // Section Styles
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 16,
    color: Colors.gray800,
  },

  // User Section
  userSection: {
    flexDirection: "row",
    alignItems: "center",
  },
  userAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  // Items Section
  itemsSection: {
    padding: 16,
  },
  exchangeItems: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  singleItem: {
    alignItems: "center",
    justifyContent: "center",
  },
  itemQuantity: {
    fontSize: 12,
    color: Colors.gray600,
    textAlign: "center",
  },

  // Other sections...
  messageSection: {
    padding: 16,
    backgroundColor: Colors.gray100,
    // marginHorizontal: 16,
    borderRadius: 12,
  },
  timeText: {
    marginLeft: 8,
    fontSize: 14,
  },
  rejectSection: {
    padding: 16,
    backgroundColor: "#ffe3e3",
    // marginHorizontal: 16,
    borderRadius: 12,
    marginTop: 16,
  },

  closeButton: {
    marginTop: 20,
    backgroundColor: "#007AFF",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  searchContainer: {
    margin: 16,
  },
  searchWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: Colors.gray800,
    // paddingVertical: 4,
  },
  clearButton: {
    padding: 4,
  },
  holdOnMessage: {
    backgroundColor: "#f8f9fa",
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  holdOnMessageText: {
    color: "#666",
  },
  statusMessageBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F5F5F5",
    padding: 12,
    borderRadius: 8,
    marginTop: 10,
    marginBottom: 15,
    justifyContent: "space-between",
  },
  statusMessageContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  statusMessage: {
    marginLeft: 8,
    fontSize: 14,
    flex: 1,
  },
  viewDetailButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    marginLeft: 8,
  },
  loadingMore: {
    paddingVertical: 20,
    alignItems: "center",
  },
});
