import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Modal,
} from 'react-native';
import axios from 'axios';
import axiosInstance from '@/src/api/axiosInstance';
import Colors from '@/src/constants/Colors';

const MyRequests = () => {
  const [activeTab, setActiveTab] = useState('myRequests');
  const [myRequests, setMyRequests] = useState([]);
  const [requestsForMe, setRequestsForMe] = useState([]);
  
  interface Request {
    id: string;
    requesterImage: string;
    requesterName: string;
    status: string;
    requesterItemImages: string[];
    requesterItemName: string;
    recipientItemImages: string[];
    recipientItemName: string;
    appointmentDate: string[];
  }
  
  const [selectedRequest, setSelectedRequest] = useState<Request | null>(null);
  const [showTimeModal, setShowTimeModal] = useState(false);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const myRequestsResponse = await axiosInstance.get('request/my-requests');
      const requestsForMeResponse = await axiosInstance.get('request/requests-for-me');
      setMyRequests(myRequestsResponse.data.data);
      setRequestsForMe(requestsForMeResponse.data.data);
    } catch (error) {
      console.error('Error fetching requests:', error);
    }
  };

  const formatTimeSlot = (timeString: string) => {
    const startTime = new Date(timeString);
    const endTime = new Date(startTime.getTime() + 60 * 60 * 1000); // Add 1 hour
    
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: 'numeric'
    });
  };

  return `${formatTime(startTime)} - ${formatTime(endTime)} ${formatDate(startTime)}`;
  };

  const handleApprove = async (requestId: string) => {
    if (!selectedTime) return;
    try {
    const requestResponse =  await axiosInstance.post(`request/approve/${requestId}`, {
        selectedTime: selectedTime,
      });

    //   if (requestResponse.data.isSuccess === true) {
    // const [datePart, timePart] = selectedTime.split(' ');
    // const [year, month, day] = datePart.split('-');
    // const [hours, minutes, seconds] = timePart.split(':');
    
    // // Create date object in UTC
    // const date = new Date(Date.UTC(
    //   Number(year),
    //   Number(month) - 1,
    //   Number(day),
    //   Number(hours),
    //   Number(minutes),
    //   Number(seconds)
    // ));

    // const convertedDate = date.toISOString();
    // const transactionData = {
    //   requestId: requestId,
    //   appointmentDate: convertedDate,
    // }
    // console.log('transactionData', transactionData);
    //   await axiosInstance.post(`transaction/${requestId}`, transactionData);
    // }
    fetchRequests();
    setShowTimeModal(false);
    setSelectedRequest(null);
    setSelectedTime(null);
    } catch (error) {
      console.error('Error approving request:', error);
    }
  };

  const handleReject = async (requestId: string) => {
    try {
      await axiosInstance.post(`request/reject/${requestId}`);
      fetchRequests();
    } catch (error) {
      console.error('Error rejecting request:', error);
    }
  };

  const renderRequestCard = (request: any, showActions = false) => (
    <View style={styles.card} key={request.id}>
      <View style={styles.row}>
        <Image source={{ uri: request.requesterImage }} style={styles.avatar} />
        <View style={styles.requestInfo}>
          <Text style={styles.name}>{request.requesterName}</Text>
          <Text>Status: {request.status}</Text>
        </View>
      </View>

      <View style={styles.itemsContainer}>
        <View style={styles.item}>
          <Image source={{ uri: request.requesterItemImages[0] }} style={styles.itemImage} />
          <Text>{request.requesterItemName}</Text>
        </View>
        <Text>↔️</Text>
        <View style={styles.item}>
          <Image source={{ uri: request.recipientItemImages[0] }} style={styles.itemImage} />
          <Text>{request.recipientItemName}</Text>
        </View>
      </View>

      <Text>Proposed times:</Text>
      {request.appointmentDate.map((time: any, index: any) => (
        <Text key={index}>{formatTimeSlot(time)}</Text>
      ))}

      {showActions && request.status === 'Pending' && (
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.button, styles.approveButton]}
            onPress={() => {
              setSelectedRequest(request);
              setShowTimeModal(true);
            }}
          >
            <Text style={styles.buttonText}>Approve</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, styles.rejectButton]}
            onPress={() => handleReject(request.id)}
          >
            <Text style={styles.buttonText}>Reject</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'myRequests' && styles.activeTab]}
          onPress={() => setActiveTab('myRequests')}
        >
          <Text>Yêu cầu của tôi</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'requestsForMe' && styles.activeTab]}
          onPress={() => setActiveTab('requestsForMe')}
        >
          <Text>Yêu cầu được gửi tới tôi</Text>
        </TouchableOpacity>
      </View>

      <ScrollView>
        {activeTab === 'myRequests' &&
          myRequests.map((request) => renderRequestCard(request))}
        {activeTab === 'requestsForMe' &&
          requestsForMe.map((request) => renderRequestCard(request, true))}
      </ScrollView>

      <Modal visible={showTimeModal} transparent>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Time Slot</Text>
            {selectedRequest?.appointmentDate.map((time: any, index: any) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.timeSlot,
                  selectedTime === time && styles.selectedTimeSlot,
                ]}
                onPress={() => setSelectedTime(time)}
              >
                <Text>{formatTimeSlot(time)}</Text>
              </TouchableOpacity>
            ))}
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.button, styles.approveButton]}
                onPress={() => selectedRequest?.id && handleApprove(selectedRequest.id)}
                disabled={!selectedTime}
              >
                <Text style={styles.buttonText}>Confirm</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.rejectButton]}
                onPress={() => {
                  setShowTimeModal(false);
                  setSelectedRequest(null);
                  setSelectedTime(null);
                }}
              >
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  tabs: {
    flexDirection: 'row',
    padding: 10,
    backgroundColor: '#fff',
  },
  tab: {
    flex: 1,
    padding: 10,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: Colors.orange500,
  },
  card: {
    backgroundColor: '#fff',
    margin: 10,
    padding: 15,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  requestInfo: {
    marginLeft: 10,
  },
  name: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  itemsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 10,
  },
  item: {
    alignItems: 'center',
  },
  itemImage: {
    width: 80,
    height: 80,
    borderRadius: 5,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 10,
  },
  button: {
    padding: 10,
    borderRadius: 5,
    minWidth: 100,
    alignItems: 'center',
  },
  approveButton: {
    backgroundColor: '#4CAF50',
  },
  rejectButton: {
    backgroundColor: '#f44336',
  },
  buttonText: {
    color: '#fff',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
    width: '80%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  timeSlot: {
    padding: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    marginBottom: 10,
  },
  selectedTimeSlot: {
    backgroundColor: '#e3f2fd',
    borderColor: '#2196F3',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 20,
  },
});

export default MyRequests;