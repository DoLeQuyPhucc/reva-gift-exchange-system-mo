import React, { useState, useEffect } from "react";
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  StyleSheet,
  SafeAreaView,
  SectionList,
  Image,
  Platform,
  Modal,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import Colors from "@/src/constants/Colors";
import { useNavigation } from "@/src/hooks/useNavigation";
import axiosInstance from "@/src/api/axiosInstance";
import { Product } from "@/src/shared/type";
import { SearchMode, searchModes, getSearchValue } from "@/src/utils/search";

const SearchScreen: React.FC = () => {
  const navigation = useNavigation();
  const [searchTerm, setSearchTerm] = useState("");
  const [searchMode, setSearchMode] = useState<SearchMode>("default");
  const [isFocused, setIsFocused] = useState(false);
  const [showModeModal, setShowModeModal] = useState(false);
  const [recentProducts, setRecentProducts] = useState<Product[]>([]);

  useEffect(() => {
    fetchRecentProducts();
  }, []);

  const fetchRecentProducts = async () => {
    try {
      const response = await axiosInstance.get("items");
      setRecentProducts(response.data.data);
    } catch (error) {
      console.error("Error fetching recent products:", error);
    }
  };

  const handleSearch = () => {
    if (!searchTerm) return;
    navigation.navigate("SearchResultsScreen", {
      searchTerm,
      searchMode,
    });
  };

  const getSearchModeIcon = () => {
    switch (searchMode) {
      case "need":
        return "category";
      case "have":
        return "people";
      default:
        return "search";
    }
  };

  const renderSearchModeModal = () => (
    <Modal
      visible={showModeModal}
      transparent={true}
      animationType="fade"
      onRequestClose={() => setShowModeModal(false)}
    >
      <TouchableOpacity
        style={styles.modalOverlay}
        activeOpacity={1}
        onPress={() => setShowModeModal(false)}
      >
        <View style={styles.modalContent}>
          {searchModes.map((mode) => (
            <TouchableOpacity
              key={mode.value}
              style={styles.modalOption}
              onPress={() => {
                setSearchMode(mode.value);
                setShowModeModal(false);
              }}
            >
              <Icon
                name={mode.icon}
                size={24}
                color={searchMode === mode.value ? Colors.orange500 : "#666"}
              />
              <View style={styles.modalOptionContent}>
                <Text
                  style={[
                    styles.modalOptionText,
                    searchMode === mode.value && styles.activeOptionText,
                  ]}
                >
                  {mode.label}
                </Text>
                <Text style={styles.modalOptionDescription}>
                  {mode.description}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </TouchableOpacity>
    </Modal>
  );

  const renderProductItem = ({ item }: { item: Product }) => (
    <TouchableOpacity
      style={styles.productItem}
      onPress={() =>
        navigation.navigate("ProductDetail", { productId: item.id })
      }
    >
      <Image source={{ uri: item.images?.[0] }} style={styles.productImage} />
      <View style={styles.productInfo}>
        <Text style={styles.productName} numberOfLines={1}>
          {item.name}
        </Text>
        <Text style={styles.productCategory}>{item.category.name}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-back" size={24} />
        </TouchableOpacity>
        <View style={styles.searchContainer}>
          <Icon name={getSearchModeIcon()} size={20} color="#666" />
          <TextInput
            style={styles.searchInput}
            placeholder="Tìm kiếm sản phẩm..."
            value={searchTerm}
            onChangeText={setSearchTerm}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            onSubmitEditing={handleSearch}
          />
          {searchTerm.length > 0 && (
            <TouchableOpacity onPress={() => setSearchTerm("")}>
              <Icon name="close" size={20} color="#666" />
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={styles.modeButton}
            onPress={() => setShowModeModal(true)}
          >
            <Icon name="tune" size={20} color={Colors.orange500} />
          </TouchableOpacity>
        </View>
      </View>

      <SectionList
        sections={[{ title: "Gợi ý tìm kiếm", data: recentProducts }]}
        renderItem={renderProductItem}
        renderSectionHeader={({ section: { title } }) => (
          <Text style={styles.sectionHeader}>{title}</Text>
        )}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
      />

      {renderSearchModeModal()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    paddingTop: Platform.OS === "android" ? 16 : 0,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  backButton: {
    padding: 4,
  },
  searchContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === "ios" ? 8 : 4,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  modeButton: {
    padding: 4,
    borderLeftWidth: 1,
    borderLeftColor: "#ddd",
    marginLeft: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "80%",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  modalOption: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  modalOptionText: {
    fontSize: 16,
    color: "#666",
  },
  activeOptionText: {
    color: Colors.orange500,
    fontWeight: "500",
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: "600",
    padding: 16,
    backgroundColor: "#fff",
  },
  listContent: {
    paddingBottom: 16,
  },
  productItem: {
    flexDirection: "row",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    alignItems: "center",
    gap: 12,
  },
  productImage: {
    width: 48,
    height: 48,
    borderRadius: 8,
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 4,
  },
  productCategory: {
    fontSize: 14,
    color: "#666",
  },
  modalOptionContent: {
    flex: 1,
  },
  modalOptionDescription: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
  },
});

export default SearchScreen;
