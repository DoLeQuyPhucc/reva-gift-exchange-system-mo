import React, { useState } from "react";
import { View, Modal, TouchableOpacity, Text, StyleSheet } from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useNavigation } from "@/hooks/useNavigation";
import { BottomTabParamList } from "@/layouts/types/navigationTypes";

interface ButtonMoreActionHeaderProps {
  propNav: "Home" | "Favorites" | "Notifications" | "Profile";
}

export function ButtonMoreActionHeader({
  propNav,
}: ButtonMoreActionHeaderProps) {
  const [modalVisible, setModalVisible] = useState(false);
  const navigation = useNavigation();

  const menuOptions: Array<{ label: string; value: keyof BottomTabParamList }> =
    [
      { label: "Home", value: "Home" },
      { label: "Profile", value: "Profile" },
    ];

  const handleOptionSelect = (screen: keyof BottomTabParamList) => {
    setModalVisible(false);
    navigation.navigate("Main", { screen });
  };

  return (
    <View>
      <MaterialIcons
        name="more-vert"
        size={24}
        color="black"
        style={{ marginRight: 20 }}
        onPress={() => setModalVisible(true)}
      />

      <Modal
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setModalVisible(false)}
        >
          <View style={styles.menuContainer}>
            {menuOptions.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={styles.menuItem}
                onPress={() => handleOptionSelect(option.value)}
              >
                <Text style={styles.menuText}>{option.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-start",
  },
  menuContainer: {
    backgroundColor: "white",
    borderRadius: 8,
    padding: 8,
    marginTop: 50,
    marginRight: 20,
    marginLeft: "auto",
    width: 150,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  menuItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  menuText: {
    fontSize: 16,
  },
});
