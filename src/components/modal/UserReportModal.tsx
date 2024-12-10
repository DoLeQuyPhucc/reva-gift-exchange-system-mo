import Colors from "@/src/constants/Colors";
import { TransactionReportType } from "@/src/shared/type";
import React, { useState } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
} from "react-native";

interface UserReportModalProps {
  isVisible: boolean;
  onClose: () => void;
  onSubmitRating: (reportData: TransactionReportType) => void;
  userTransactionToRate: {
    userId: string;
    userName: string;
    transactionId: string;
  };
}

const UserReportModal: React.FC<UserReportModalProps> = ({
  isVisible,
  onClose,
  onSubmitRating,
  userTransactionToRate,
}) => {
  const [reason, setReason] = useState("");

  const handleRatingSubmit = () => {
    const data = {
      reasons: [reason],
      reportedId: userTransactionToRate.userId,
      transactionId: userTransactionToRate.transactionId,
    };

    onSubmitRating(data);
    onClose();
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={isVisible}
      onRequestClose={onClose}
    >
      <View style={styles.centeredView}>
        <View style={styles.modalView}>
          <Text style={styles.modalTitle}>
            Báo cáo {userTransactionToRate.userName}
          </Text>

          <TextInput
            style={styles.commentInput}
            placeholderTextColor="#c4c4c4"
            placeholder="Nhập báo cáo của bạn"
            multiline
            numberOfLines={4}
            value={reason}
            onChangeText={setReason}
          />

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={onClose}
            >
              <Text style={styles.buttonText}>Huỷ</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.button,
                styles.submitButton,
                reason === "" && styles.disabledButton,
              ]}
              onPress={handleRatingSubmit}
              disabled={reason === ""}
            >
              <Text style={styles.buttonText}>Gửi báo cáo</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalView: {
    width: "90%",
    backgroundColor: "white",
    borderRadius: 20,
    padding: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
  },
  commentInput: {
    borderColor: "#c4c4c4",
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    textAlignVertical: "top",
    width: "100%",
    marginBottom: 16,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },
  button: {
    borderRadius: 8,
    padding: 12,
    elevation: 2,
    width: "48%",
    alignItems: "center",
    flex: 1,
    marginHorizontal: 5,
  },
  cancelButton: {
    backgroundColor: "#FF3B30",
  },
  submitButton: {
    backgroundColor: Colors.orange500,
  },
  disabledButton: {
    backgroundColor: "#A9A9A9",
  },
  buttonText: {
    color: "white",
    fontWeight: "bold",
  },
});

export default UserReportModal;
