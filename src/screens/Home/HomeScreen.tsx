import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  ScrollView,
  Dimensions,
  Modal,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import axiosInstance from "@/src/api/axiosInstance";
import Colors from "@/src/constants/Colors";
import { useNavigation } from "@/src/hooks/useNavigation";
import { Product } from "@/src/shared/type";
import { useRefreshControl } from "@/src/hooks/useRefreshControl";
import { useAuthCheck } from "@/src/hooks/useAuth";
import { formatDateOnlyDate } from "@/src/shared/formatDate";

type SearchMode = "default" | "need" | "have";
interface SortOption {
  value: "createdAt" | "name" | "condition";
  label: string;
}

const sortOptions: SortOption[] = [
  { value: "createdAt", label: "Mới nhất" },
  { value: "name", label: "Tên" },
  { value: "condition", label: "Tình trạng" },
];

const { width } = Dimensions.get("window");

const HomeScreen: React.FC = () => {
  const navigation = useNavigation();
  const userId = useAuthCheck().userData.userId;

  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [searchMode, setSearchMode] = useState<SearchMode>("default");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [sortBy, setSortBy] = useState<"name" | "condition" | "createdAt">(
    "createdAt"
  );
  const [showSortModal, setShowSortModal] = useState(false);

  const fetchProducts = async () => {
    try {
      const response = await axiosInstance.get("items");
      const productsData = response.data.data;
      setProducts(productsData);
      getFilterProducts(productsData);
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setLoading(false);
    }
  };
  // Initial fetch on mount
  useEffect(() => {
    fetchProducts();
  }, [userId, sortBy, selectedCategory]);

  const { refreshing, refreshControl } = useRefreshControl(fetchProducts);

  const categories = [
    ...new Set(products.map((product) => product.category.name)),
  ];

  const renderSearchContainer = () => (
    <TouchableOpacity
      style={styles.searchContainer}
      onPress={() => navigation.navigate("SearchScreen")}
    >
      <Icon name="search" size={20} style={styles.searchIcon} />
      <Text style={styles.searchPlaceholder}>Tìm kiếm sản phẩm...</Text>
    </TouchableOpacity>
  );

  const getFilterProducts = (products: Product[]) => {
    let filteredProducts = products;

    if (userId !== "") {
      filteredProducts = filteredProducts.filter(
        (product) => product.owner_id !== userId
      );
    }

    filteredProducts = filteredProducts
      .filter((product) => product.status === 'Approved')
      .filter((product) =>
        selectedCategory ? product.category.name === selectedCategory : true
      )
      .sort((a, b) => {
        switch (sortBy) {
          case "name":
            return a.name.localeCompare(b.name);
          case "condition":
            return a.condition.localeCompare(b.condition);
          case "createdAt":
            return (
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            );
          default:
            return 0;
        }
      });

    setFilteredProducts(filteredProducts);
  };

  const renderProductCard = ({ item: product }: { item: Product }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate("ProductDetail", { productId: product.id })}
      activeOpacity={0.7}
    >
      <View style={styles.imageContainer}>
        {/* Image with loading placeholder */}
        <Image
          source={{ uri: product.images?.[0] }}
          style={styles.image}
          resizeMode="cover"
        />
        
        {/* Status badges */}
        <View style={styles.statusBadgeContainer}>
          {product.isGift && (
            <View style={styles.giftBadge}>
              <Icon name="card-giftcard" size={16} color="#fff" />
              <Text style={styles.giftText}>Tặng</Text>
            </View>
          )}
        </View>
  
        {/* Save/Wishlist button */}
        {/* <TouchableOpacity 
          style={styles.wishlistButton}
          onPress={() => handleWishlist(product.id)}
        >
          <Icon 
            name={isWishlisted ? "favorite" : "favorite-border"} 
            size={24} 
            color={Colors.orange500}
          />
        </TouchableOpacity> */}
      </View>
  
      <View style={styles.cardContent}>
        {/* Product info */}
        <View style={styles.productInfo}>
          <Text style={styles.productName} numberOfLines={1}>
            {product.name}
          </Text>
          <Text style={styles.description} numberOfLines={1}>
            {product.description}
          </Text>
        </View>
  
        {/* Tags/Badges */}
        <View style={styles.badgeContainer}>
          <View style={[styles.badge, styles.conditionBadge]}>
            <Icon name="info" size={12} color={Colors.orange500} />
            <Text style={styles.conditionText}>{product.condition === 'New' ? "Mới" : "Đã sử dụng"}</Text>
          </View>
  
          <View style={[styles.badge, styles.categoryBadge]}>
            <Icon name="category" size={12} color="#666" />
            <Text style={styles.categoryText}>{product.category.name}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderSortModal = () => (
    <Modal
      visible={showSortModal}
      transparent={true}
      animationType="fade"
      onRequestClose={() => setShowSortModal(false)}
    >
      <TouchableOpacity
        style={styles.modalOverlay}
        activeOpacity={1}
        onPress={() => setShowSortModal(false)}
      >
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Sắp xếp theo</Text>
          {sortOptions.map((option) => (
            <TouchableOpacity
              key={option.value}
              style={styles.sortOption}
              onPress={() => {
                setSortBy(option.value);
                setShowSortModal(false);
              }}
            >
              <Text
                style={[
                  styles.sortOptionText,
                  sortBy === option.value && styles.sortOptionTextSelected,
                ]}
              >
                {option.label}
              </Text>
              {sortBy === option.value && (
                <Icon name="check" size={20} color="#000" />
              )}
            </TouchableOpacity>
          ))}
        </View>
      </TouchableOpacity>
    </Modal>
  );

  const renderHeader = () => (
    <View style={styles.header}>
      {renderSearchContainer()}
      <View style={styles.filterHeader}>
        <View style={styles.filterTitleContainer}>
          <Icon name="filter-alt" size={20} />
          <Text style={styles.filterTitle}>Bộ lọc</Text>
        </View>
        <TouchableOpacity
          style={styles.sortButton}
          onPress={() => setShowSortModal(true)}
        >
          <View style={styles.sortButtonContent}>
            <Icon name="sort" size={20} />
            <Text style={styles.sortButtonText}>
              {sortOptions.find((option) => option.value === sortBy)?.label}
            </Text>
            <Icon name="arrow-drop-down" size={20} />
          </View>
        </TouchableOpacity>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoryScroll}
      >
        <TouchableOpacity
          style={[
            styles.categoryButton,
            selectedCategory === "" && styles.selectedCategoryButton,
          ]}
          onPress={() => setSelectedCategory("")}
        >
          <Text
            style={[
              styles.categoryButtonText,
              selectedCategory === "" && styles.selectedCategoryButtonText,
            ]}
          >
            Tất cả
          </Text>
        </TouchableOpacity>
        {categories.map((category) => (
          <TouchableOpacity
            key={category}
            style={[
              styles.categoryButton,
              selectedCategory === category && styles.selectedCategoryButton,
            ]}
            onPress={() => setSelectedCategory(category)}
          >
            <Text
              style={[
                styles.categoryButtonText,
                selectedCategory === category &&
                  styles.selectedCategoryButtonText,
              ]}
            >
              {category}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <Text style={styles.resultCount}>
        Hiển thị {filteredProducts.length} sản phẩm
      </Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#f97316" />
      </View>
    );
  }

  return (
    <TouchableOpacity
      activeOpacity={1}
      onPress={() => setIsSearchFocused(false)}
      style={{ flex: 1 }}
    >
      <FlatList
        data={filteredProducts}
        renderItem={renderProductCard}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={renderHeader}
        numColumns={2}
        columnWrapperStyle={styles.columnWrapper}
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        refreshing={refreshing}
        onRefresh={fetchProducts}
      />
      {renderSortModal()}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  searchIcon: {
    marginRight: 8,
  },
  searchBar: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: "#D3D3D3",
    borderRadius: 12,
    fontSize: 18,
    marginVertical: 16,
    backgroundColor: "#F8F8F8",
  },
  container: {
    padding: 16,
    paddingVertical: 24,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    marginVertical: 16,
  },
  filterHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  filterTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  filterTitle: {
    fontSize: 20,
    fontWeight: "bold",
  },
  categoryScroll: {
    marginBottom: 16,
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#ccc",
    marginRight: 8,
  },
  selectedCategoryButton: {
    backgroundColor: "#f97316",
    borderColor: "#f97316",
  },
  categoryButtonText: {
    color: "#000",
  },
  selectedCategoryButtonText: {
    color: "#fff",
  },
  resultCount: {
    color: "#666",
    marginBottom: 16,
  },
  columnWrapper: {
    justifyContent: "space-between",
  },card: {
    width: (width - 48) / 2,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },

  imageContainer: {
    height: 140,
    position: 'relative',
  },

  image: {
    width: '100%',
    height: '100%',
    backgroundColor: '#f5f5f5',
  },

  statusBadgeContainer: {
    position: 'absolute',
    top: 8,
    left: 8,
    flexDirection: 'row',
    gap: 4,
  },

  giftBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.orange500,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },

  giftText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },

  unavailableBadge: {
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },

  unavailableText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },

  wishlistButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 6,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },

  cardContent: {
    padding: 12,
    gap: 8,
  },
  productInfo: {
    gap: 4,
  },
  productName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
  },
  description: {
    fontSize: 12,
    color: '#666',
    lineHeight: 16,
  },
  badgeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  conditionBadge: {
    backgroundColor: Colors.orange50,
  },
  categoryBadge: {
    backgroundColor: '#f5f5f5',
  },
  conditionText: {
    fontSize: 12,
    color: Colors.orange500,
    fontWeight: '500',
  },
  categoryText: {
    fontSize: 12,
    color: '#666',
  },
  footerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timeText: {
    fontSize: 11,
    color: '#666',
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flex: 1,
  },
  locationText: {
    fontSize: 11,
    color: '#666',
    flex: 1,
  },
  unavailableOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  badgeDestructive: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    backgroundColor: "#ef4444",
  },
  outlineBadge: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#ccc",
  },
  badgeText: {
    fontSize: 12,
    color: "#000",
  },
  outlineBadgeText: {
    fontSize: 12,
    color: "#666",
  },
  sortButton: {
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ccc",
    backgroundColor: "#fff",
  },
  sortButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  sortButtonText: {
    color: "#000",
    fontWeight: "500",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 16,
    paddingBottom: 32,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 16,
    textAlign: "center",
  },
  sortOption: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  sortOptionText: {
    fontSize: 16,
    color: "#000",
  },
  sortOptionTextSelected: {
    fontWeight: "600",
  },
  searchInput: {
    flex: 1,
    paddingVertical: 8,
    fontSize: 16,
  },
  searchButton: {
    padding: 8,
    borderLeftWidth: 1,
    borderLeftColor: "#eee",
  },
  clearButton: {
    padding: 8,
  },
  searchModeContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
    marginBottom: 16,
  },
  modeButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.orange500,
    marginHorizontal: 4,
    alignItems: "center",
  },
  activeModeButton: {
    backgroundColor: Colors.orange500,
  },
  modeButtonText: {
    fontSize: 12,
    color: Colors.orange500,
  },
  activeModeButtonText: {
    color: "#fff",
  },
  suggestionsContainer: {
    position: "absolute",
    top: 50,
    left: 0,
    right: 0,
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 8,
    elevation: 4,
    zIndex: 1000,
  },
  suggestionsTitle: {
    fontSize: 14,
    color: "#666",
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  suggestionItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 8,
  },
  suggestionIcon: {
    marginRight: 12,
  },
  suggestionText: {
    marginLeft: 12,
    fontSize: 14,
    color: "#000",
  },
  suggestionSubtext: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    elevation: 2,
    marginBottom: 16,
  },
  searchPlaceholder: {
    flex: 1,
    fontSize: 16,
    color: "#666",
    marginLeft: 8,
  },
});

export default HomeScreen;
