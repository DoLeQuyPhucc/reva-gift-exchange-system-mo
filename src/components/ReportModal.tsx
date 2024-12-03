import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  ActivityIndicator,
  Animated,
  Keyboard,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { Ionicons } from '@expo/vector-icons';
import { TransactionReportType } from '../shared/type';

interface Reason {
  id: number;
  label: string;
  subReasons: string[];
  icon: keyof typeof Ionicons.glyphMap;
}

interface ReportModalProps {
  isVisible: boolean;
  onClose: () => void;
  onSubmit:(reportData: TransactionReportType) => void;
  loading?: boolean;
  userTransactionToRate: {
    userId: string;
    userName: string;
    transactionId: string;
  };
}

const ReportModal: React.FC<ReportModalProps> = ({
  isVisible,
  onClose,
  onSubmit,
  loading = false,
  userTransactionToRate,
}) => {
  const [selectedReason, setSelectedReason] = useState<Reason | null>(null);
  const [selectedSubReason, setSelectedSubReason] = useState<string>('');
  const [description, setDescription] = useState('');
  const [keyboardHeight] = useState(new Animated.Value(0));
  const [characterCount, setCharacterCount] = useState(0);
  const MAX_CHARS = 500;

  // Animation value for modal sliding
  const slideAnimation = useState(new Animated.Value(0))[0];

  useEffect(() => {
    if (isVisible) {
      Animated.spring(slideAnimation, {
        toValue: 1,
        useNativeDriver: true,
        tension: 50,
        friction: 7,
      }).start();
    } else {
      Animated.timing(slideAnimation, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [isVisible]);

  const reasons: Reason[] = [
    {
      id: 1,
      label: 'Nội dung không phù hợp',
      icon: 'alert-circle-outline',
      subReasons: [
        'Ngôn ngữ tục tĩu, xúc phạm',
        'Nội dung mang tính phân biệt chủng tộc hoặc kỳ thị',
        'Nội dung bạo lực, ghê rợn',
        'Hình ảnh phản cảm hoặc không phù hợp',
      ],
    },
    {
      id: 2,
      label: 'Spam hoặc lừa đảo',
      icon: 'warning-outline',
      subReasons: [
        'Quảng cáo không mong muốn',
        'Nội dung giả mạo hoặc gây nhầm lẫn',
        'Gửi tin nhắn không liên quan hoặc spam hàng loạt',
      ],
    },
    {
      id: 3,
      label: 'Vi phạm bản quyền',
      icon: 'lock-closed-outline',
      subReasons: [
        'Sử dụng nội dung không được phép',
        'Sao chép nguyên văn từ nguồn khác',
        'Phát tán nội dung có bản quyền',
      ],
    },
    {
      id: 4,
      label: 'Thông tin sai lệch',
      icon: 'information-circle-outline',
      subReasons: [
        'Tin giả hoặc thông tin không chính xác',
        'Tin tức chưa được xác minh',
        'Nội dung kích động hoặc gây hoang mang',
      ],
    },
    {
      id: 5,
      label: 'Quấy rối hoặc bắt nạt',
      icon: 'sad-outline',
      subReasons: [
        'Đe dọa hoặc ép buộc cá nhân',
        'Bình luận ác ý hoặc công kích cá nhân',
        'Nội dung mang tính bạo lực hoặc thù địch',
      ],
    },
    {
      id: 6,
      label: 'Xâm phạm quyền riêng tư',
      icon: 'eye-off-outline',
      subReasons: [
        'Công khai thông tin cá nhân (số điện thoại, địa chỉ)',
        'Hình ảnh/video bị chia sẻ trái phép',
        'Nội dung xâm phạm đời tư',
      ],
    },
    {
      id: 7,
      label: 'Hoạt động bất hợp pháp',
      icon: 'ban-outline',
      subReasons: [
        'Chứa nội dung liên quan đến ma túy',
        'Liên quan đến vũ khí hoặc bạo lực',
        'Tuyên truyền nội dung trái pháp luật',
      ],
    },
    {
      id: 8,
      label: 'Khác',
      icon: 'ellipsis-horizontal-outline',
      subReasons: [],
    },
  ];

  // Keyboard handling
  useEffect(() => {
    const keyboardWillShow = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (e) => {
        Animated.timing(keyboardHeight, {
          toValue: e.endCoordinates.height,
          duration: 250,
          useNativeDriver: false,
        }).start();
      }
    );

    const keyboardWillHide = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        Animated.timing(keyboardHeight, {
          toValue: 0,
          duration: 250,
          useNativeDriver: false,
        }).start();
      }
    );

    return () => {
      keyboardWillShow.remove();
      keyboardWillHide.remove();
    };
  }, []);

  const handleSubmit = () => {
    if (!selectedReason) {
      Alert.alert('Error', 'Please select a reason');
      return;
    }
    if (!selectedSubReason && selectedReason.subReasons.length > 0) {
      Alert.alert('Error', 'Please select a specific reason');
      return;
    }
    if (!description.trim()) {
      Alert.alert('Error', 'Please provide a description');
      return;
    }

    const data = {
      reasons: [`${selectedReason.label}: ${selectedSubReason}, ${description}`],
      reportedId: userTransactionToRate.userId,
      transactionId: userTransactionToRate.transactionId,
    };

    onSubmit(data);
  };

  const resetForm = () => {
    setSelectedReason(null);
    setSelectedSubReason('');
    setDescription('');
    setCharacterCount(0);
  };

  const handleClose = () => {
    Animated.timing(slideAnimation, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      resetForm();
      onClose();
    });
  };

  const renderReasonItem = (reason: Reason) => (
    <TouchableOpacity
      key={reason.id}
      style={[
        styles.reasonButton,
        selectedReason?.id === reason.id && styles.selectedReason,
      ]}
      onPress={() => setSelectedReason(reason)}
    >
      <Icon
        name={reason.icon}
        size={24}
        color={selectedReason?.id === reason.id ? '#fff' : '#666'}
        style={styles.reasonIcon}
      />
      <Text
        style={[
          styles.reasonText,
          selectedReason?.id === reason.id && styles.selectedReasonText,
        ]}
      >
        {reason.label}
      </Text>
      <Icon
        name="chevron-forward"
        size={20}
        color={selectedReason?.id === reason.id ? '#fff' : '#666'}
      />
    </TouchableOpacity>
  );

  return (
    <Modal
      visible={isVisible}
      transparent
      animationType="none"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <Animated.View
          style={[
            styles.modalContainer,
            {
              transform: [
                {
                  translateY: slideAnimation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [600, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <Icon name="close" size={24} color="#000" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Báo cáo {userTransactionToRate.userName}</Text>
            <View style={styles.headerRight} />
          </View>

          <ScrollView style={styles.content}>
            <Text style={styles.sectionTitle}>Vấn đề?</Text>
            {reasons.map(renderReasonItem)}

            {selectedReason && selectedReason.subReasons.length > 0 && (
              <View style={styles.subReasonContainer}>
                <Text style={styles.sectionTitle}>Lí do chi tiết:</Text>
                {selectedReason.subReasons.map((subReason, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.subReasonButton,
                      selectedSubReason === subReason && styles.selectedSubReason,
                    ]}
                    onPress={() => setSelectedSubReason(subReason)}
                  >
                    <Text
                      style={[
                        styles.subReasonText,
                        selectedSubReason === subReason &&
                          styles.selectedSubReasonText,
                      ]}
                    >
                      {subReason}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            <Text style={styles.sectionTitle}>Thêm chi tiết:</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                multiline
                numberOfLines={4}
                placeholder="Please provide more details about your report..."
                value={description}
                onChangeText={(text) => {
                  if (text.length <= MAX_CHARS) {
                    setDescription(text);
                    setCharacterCount(text.length);
                  }
                }}
              />
              <Text style={styles.charCount}>
                {characterCount}/{MAX_CHARS}
              </Text>
            </View>
          </ScrollView>

          <Animated.View
            style={[
              styles.bottomContainer,
              { paddingBottom: keyboardHeight },
            ]}
          >
            <TouchableOpacity
              style={[styles.submitButton, loading && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.submitText}>Submit Report</Text>
              )}
            </TouchableOpacity>
          </Animated.View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  closeButton: {
    padding: 8,
  },
  headerRight: {
    width: 40,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  content: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    marginTop: 16,
  },
  reasonButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginVertical: 4,
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
  },
  reasonIcon: {
    marginRight: 12,
  },
  selectedReason: {
    backgroundColor: '#007AFF',
  },
  reasonText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  selectedReasonText: {
    color: '#fff',
  },
  subReasonContainer: {
    marginTop: 16,
  },
  subReasonButton: {
    padding: 12,
    marginVertical: 4,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
  },
  selectedSubReason: {
    backgroundColor: '#E3F2FD',
  },
  subReasonText: {
    fontSize: 14,
    color: '#333',
  },
  selectedSubReasonText: {
    color: '#007AFF',
  },
  inputContainer: {
    position: 'relative',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    minHeight: 120,
    textAlignVertical: 'top',
    fontSize: 16,
  },
  charCount: {
    position: 'absolute',
    bottom: 16,
    right: 12,
    fontSize: 12,
    color: '#666',
  },
  bottomContainer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  submitButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#ccc',
  },
  submitText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ReportModal;
