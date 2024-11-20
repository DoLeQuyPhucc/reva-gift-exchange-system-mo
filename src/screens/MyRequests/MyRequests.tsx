import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Modal,
  Platform,
  TextInput,
} from "react-native";
import axiosInstance from "@/src/api/axiosInstance";
import Colors from "@/src/constants/Colors";
import Icon from "react-native-vector-icons/MaterialIcons";
import { Request, User } from "@/src/shared/type";

const STATUS_COLORS: { [key: string]: string } = {
  Pending: Colors.orange500,
  Approved: Colors.lightGreen,
  Rejected: Colors.lightRed,
};

const STATUS_LABELS = {
  Pending: "Đang chờ",
  Approved: "Đã duyệt",
  Rejected: "Từ chối",
};

const MyRequests = () => {
  const [activeTab, setActiveTab] = useState("myRequests");
  const [myRequests, setMyRequests] = useState<Request[]>([]);
  const [requestsForMe, setRequestsForMe] = useState<Request[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<Request | null>(null);
  const [showTimeModal, setShowTimeModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [rejectMessage, setRejectMessage] = useState<string>("");
  const [showInfoUser, setShowInfoUser] = useState(false);
  const [user, setUser] = useState<User>({} as User);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const [myRequestsResponse, requestsForMeResponse] = await Promise.all([
        axiosInstance.get("request/my-requests"),
        axiosInstance.get("request/requests-for-me"),
      ]);
      setMyRequests(myRequestsResponse.data.data);
      setRequestsForMe(requestsForMeResponse.data.data);
    } catch (error) {
      console.error("Error fetching requests:", error);
    }
  };

  const formatTimeSlot = (timeString: string) => {
    const startTime = new Date(timeString);
    const endTime = new Date(startTime.getTime() + 60 * 60 * 1000);

    const formatTime = (date: Date) => {
      return date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });
    };

    const formatDate = (date: Date) => {
      return date.toLocaleDateString("en-US", {
        month: "2-digit",
        day: "2-digit",
        year: "numeric",
      });
    };

    return `${formatTime(startTime)} - ${formatTime(endTime)} ${formatDate(
      startTime
    )}`;
  };

  const handleApprove = async (requestId: string) => {
    if (!selectedTime) return;
    try {
      const requestResponse = await axiosInstance.post(
        `request/approve/${requestId}`,
        {
          selectedTime: selectedTime,
        }
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

        const convertedDate = date.toISOString();
        const transactionData = {
          requestId: requestId,
          appointmentDate: convertedDate,
        };
        await axiosInstance.post(`transaction/create`, transactionData);
      }
      fetchRequests();
      setShowTimeModal(false);
      setSelectedRequest(null);
      setSelectedTime(null);
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
  }

  const handleReject = async (requestId: string) => {
    try {
      const data = {reject_message: rejectMessage};
      const response = await axiosInstance.post(`request/reject/${requestId}`, data);

      if (response.data.isSuccess === true) {
        fetchRequests();
        setShowRejectModal(false);
        setRejectMessage("");
      }
    } catch (error) {
      console.error("Error rejecting request:", error);
    }
  };

  const renderRequestCard = (request: Request, showActions = false) => (
    <View style={styles.card} key={request.id}>
      <View style={styles.cardHeader}>
      <TouchableOpacity onPress={() => handleShowInfoUser(request.requesterId)}>
        <View style={styles.userInfo}>
          <Image
            source={{ uri: request.requesterImage }}
            style={styles.avatar}
          />
          <Text style={styles.name}>{request.requesterName}</Text>
        </View>

      </TouchableOpacity>
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

      <View style={styles.itemsContainer}>
        {request.requesterItemId ? (
          // Trường hợp trao đổi bình thường
          <>
            <View style={styles.itemCard}>
              <Image
                source={{ uri: request.requesterItemImages[0] }}
                style={styles.itemImage}
              />
              <Text style={styles.itemName} numberOfLines={2}>
                {request.requesterItemName}
              </Text>
            </View>

            <View style={styles.exchangeIconContainer}>
              <Icon name="swap-vert" size={24} color={Colors.orange500} />
            </View>

            <View style={styles.itemCard}>
              <Image
                source={{ uri: request.recipientItemImages[0] }}
                style={styles.itemImage}
              />
              <Text style={styles.itemName} numberOfLines={2}>
                {request.recipientItemName}
              </Text>
            </View>
          </>
        ) : (
          // Trường hợp đăng ký nhận
          <View style={styles.singleItemContainer}>
            <Image
              source={{ uri: request.recipientItemImages[0] }}
              style={styles.singleItemImage}
            />
            <Text style={styles.itemName} numberOfLines={2}>
              {request.recipientItemName}
            </Text>
          </View>
        )}
      </View>

      
      {request.requestMessage && (
        <View style={styles.itemMessageContainer}>
          <Text>Lời nhắn: {request.requestMessage}</Text>
        </View>
      )}


      {request.rejectMessage && (
        <Text style={styles.rejectMessage}>
          Lời nhắn của bạn đã từ chối: {request.rejectMessage}
        </Text>
      )}

      <View style={styles.timeSection}>
        <Text style={styles.timeTitle}>Thời gian đề xuất:</Text>
        <View style={styles.timeSlotList}>
          {request.appointmentDate.map((time: string, index: number) => (
            <View key={index} style={styles.timeSlotChip}>
              <Text style={styles.timeSlotText}>{formatTimeSlot(time)}</Text>
            </View>
          ))}
        </View>
      </View>

      {showActions && request.status === "Pending" && (
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.button, styles.rejectButton]}
            onPress={() => {
              setSelectedRequest(request);
              setShowRejectModal(true);
            }}
          >
            <Text style={styles.buttonText}>Từ chối</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, styles.approveButton]}
            onPress={() => {
              setSelectedRequest(request);
              setShowTimeModal(true);
            }}
          >
            <Text style={styles.buttonText}>Chấp nhận</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "myRequests" && styles.activeTab]}
          onPress={() => setActiveTab("myRequests")}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "myRequests" && styles.activeTabText,
            ]}
          >
            Yêu cầu của tôi
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === "requestsForMe" && styles.activeTab,
          ]}
          onPress={() => setActiveTab("requestsForMe")}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "requestsForMe" && styles.activeTabText,
            ]}
          >
            Yêu cầu được gửi tới
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {activeTab === "myRequests" &&
          myRequests.map((request) => renderRequestCard(request))}
        {activeTab === "requestsForMe" &&
          requestsForMe.map((request) => renderRequestCard(request, true))}
      </ScrollView>

      <Modal visible={showTimeModal} transparent animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Chọn thời gian phù hợp</Text>

            <ScrollView style={styles.timeSlotScrollView}>
              {selectedRequest?.appointmentDate.map(
                (time: string, index: number) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.modalTimeSlot,
                      selectedTime === time && styles.selectedTimeSlot,
                    ]}
                    onPress={() => setSelectedTime(time)}
                  >
                    <Text
                      style={[
                        styles.modalTimeSlotText,
                        selectedTime === time && styles.selectedTimeSlotText,
                      ]}
                    >
                      {formatTimeSlot(time)}
                    </Text>
                  </TouchableOpacity>
                )
              )}
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setShowTimeModal(false);
                  setSelectedRequest(null);
                  setSelectedTime(null);
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
            <Text style={styles.modalTitle}>Bạn muốn từ chối giao dịch này?</Text>
            <Text style={styles.modalDescription}>
                    Nhập lời nhắn của bạn:
                  </Text>
                  <TextInput
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
                style={[
                  styles.modalButton,
                  styles.confirmButton,
                ]}
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
        <Text style={styles.userName}>{user.firstName} {user.lastName}</Text>
      </View>

      <View style={styles.infoSection}>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Email:</Text>
          <Text style={styles.infoValue}>{user.email}</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Phone:</Text>
          <Text style={styles.infoValue}>{user.phone}</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Address:</Text>
          <Text style={styles.infoValue}>{user.address}</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Points:</Text>
          <Text style={styles.infoValue}>{user.point}</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Member since:</Text>
          <Text style={styles.infoValue}>
            {new Date(user.dateJoined as string).toLocaleDateString()}
          </Text>
        </View>
      </View>

      <TouchableOpacity 
        style={styles.closeButton}
        onPress={() => setShowInfoUser(false)}
      >
        <Text style={styles.closeButtonText}>Close</Text>
      </TouchableOpacity>
    </View>
  </View>
</Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
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
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  name: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
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
  itemCard: {
    flex: 1,
    padding: 8,
    borderRadius: 8,
    alignItems: "center",
  },
  itemImage: {
    width: 90,
    height: 90,
    borderRadius: 8,
    marginBottom: 8,
  },
  itemName: {
    fontSize: 14,
    textAlign: "center",
    color: "#333",
  },
  itemPoint: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.orange500,
  },
  exchangeIconContainer: {
    width: 40,
    alignItems: "center",
  },
  exchangeIcon: {
    fontSize: 20,
  },
  timeSection: {
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  timeTitle: {
    fontSize: 14,
    fontWeight: "500",
    color: "#666",
    marginBottom: 8,
  },
  timeSlotList: {
    flexDirection: "column",
    gap: 8,
  },
  timeSlotChip: {
    backgroundColor: "#fff",
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "#eee",
  },
  timeSlotText: {
    fontSize: 14,
    color: "#333",
  },
  actions: {
    flexDirection: "row",
    gap: 12,
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
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
  },
  timeSlot: {
    padding: 10,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 5,
    marginBottom: 10,
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
    padding: 15,
    borderRadius: 8,
    marginHorizontal: 5,
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
  rejectMessage: {
    backgroundColor: "#ffe3e3",
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  
  modalDescription: {
    fontSize: 16,
    marginBottom: 16,
    fontWeight: "bold",
    textAlign: "left",
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
  profileHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  profilePicture: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 10,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  infoSection: {
    gap: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  infoLabel: {
    fontWeight: '600',
    color: '#666',
    flex: 1,
  },
  infoValue: {
    flex: 2,
    textAlign: 'right',
  },
  closeButton: {
    marginTop: 20,
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  closeButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default MyRequests;
