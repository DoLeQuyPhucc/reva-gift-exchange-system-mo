import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Image,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Platform,
} from "react-native";
import axiosInstance from "@/src/api/axiosInstance";
import Colors from "@/src/constants/Colors";
import { Product } from "@/src/shared/type";
import Icon from "react-native-vector-icons/MaterialIcons";
import { useNavigation } from "@/src/hooks/useNavigation";

const STATUS_COLORS: { [key: string]: string } = {
  Pending: Colors.orange500,
  Approved: Colors.lightGreen,
  Rejected: Colors.lightRed,
  Out_of_date: "#48494d",
  In_Transaction: Colors.blue500,
  Exchanged: Colors.purple500,
};

const REQUEST_COLORS: { [key: string]: string } = {
  itemRequestTo: Colors.orange500,
  requestForItem: Colors.lightGreen,
};

const STATUS_LABELS = {
  Pending: "Đang chờ",
  Approved: "Đã duyệt",
  Rejected: "Từ chối",
  Out_of_date: "Hết hạn",
  In_Transaction: "Đang trao đổi",
  Exchanged: "Đã trao đổi",
};

const CharitarianRequestItem = () => {
  const [activeTab, setActiveTab] = useState("approved");
  const [products, setProducts] = useState<Product[]>([]);
  const navigation = useNavigation();
  const [searchQuery, setSearchQuery] = useState<string>("");

  useEffect(() => {
    // Fetch data from the API
    axiosInstance
      .get("/charitarian-item/current-user")
      .then((response) => {
        const data = response.data.data;
        setProducts(data);
      })
      .catch((error) => {
        console.error("Error fetching data:", error);
      });
  }, []);

  const filteredProducts = products.filter((product: Product) => {
    const searchLower = searchQuery.toLowerCase();
    return product.name.toLowerCase().includes(searchLower);
  });

  const renderProducts = (items: Product[]) => {
    return items.map((item) => (
      <TouchableOpacity
        key={item.id}
        style={styles.card}
        onPress={() =>
          navigation.navigate("ProductDetail", { productId: item.id })
        }
      >
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>{item.name}</Text>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: `${STATUS_COLORS[item?.status]}15` },
            ]}
          >
            <View
              style={[
                styles.statusDot,
                { backgroundColor: STATUS_COLORS[item?.status] },
              ]}
            />
            <Text
              style={[
                styles.statusText,
                { color: STATUS_COLORS[item?.status] },
              ]}
            >
              {STATUS_LABELS[item?.status as keyof typeof STATUS_LABELS]}
            </Text>
          </View>
        </View>
        <View style={styles.productInfo}>
          <Image source={{ uri: item.images[0] }} style={styles.image} />
          <View style={styles.productDetails}>
            <View style={styles.detailItem}>
              <Text style={styles.detailText}>{item.description}</Text>
            </View>
            <View style={styles.detailItem}>
              <Icon name="loop" size={20} color={Colors.orange500} />
              <Text style={styles.detailText}>
                Tình trạng: {item.condition}
              </Text>
            </View>
            {item.isGift ? (
              <View style={styles.detailItem}>
                <Icon name="card-giftcard" size={20} color={Colors.orange500} />
                <Text style={[styles.detailText, styles.giftText]}>
                  Sản phẩm này là quà tặng
                </Text>
              </View>
            ) : (
              <></>
            )}
          </View>
        </View>
        {activeTab === "approved" && (
          <View style={styles.cardFooter}>
            <View></View>
            {/* <TouchableOpacity
            style={[
              styles.statusBadge,
              { backgroundColor: `${Colors.orange500}15` },
            ]}
            onPress={() => navigation.navigate("MyRequests", { productId: item.id, type: 'itemRequestTo' })}
          >
            <Text
              style={[
                styles.statusText,
                { color: Colors.orange500 },
              ]}
            >
              {item.itemRequestTo} yêu cầu đã gửi đi
            </Text>
          </TouchableOpacity> */}
            <TouchableOpacity
              style={[
                styles.statusBadge,
                { backgroundColor: `${Colors.lightRed}15` },
              ]}
              onPress={() =>
                navigation.navigate("MyRequests", {
                  productId: item.id,
                  type: "requestsForMe",
                })
              }
            >
              <Text style={[styles.statusText, { color: Colors.lightRed }]}>
                {item.requestForItem} yêu cầu được gửi tới
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </TouchableOpacity>
    ));
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
            onChangeText={setSearchQuery}
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
      <ScrollView style={styles.tabContent}>
        {activeTab === "approved" && renderProducts(filteredProducts)}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tabContent: {
    flex: 1,
    paddingHorizontal: 16,
  },
  card: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e1e1e1",
    borderRadius: 8,
    overflow: "hidden",
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#f1f1f1",
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#f1f1f1",
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  badge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  approvedBadge: {
    backgroundColor: "#28a745",
  },
  pendingBadge: {
    backgroundColor: "#ffc107",
  },
  badgeText: {
    color: "#fff",
    fontSize: 14,
  },
  productInfo: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  image: {
    width: 80,
    height: 80,
    marginRight: 16,
    borderRadius: 8,
  },
  productDetails: {
    flex: 1,
  },
  tab: {
    flex: 1,
    padding: 10,
    alignItems: "center",
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: Colors.orange500,
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
  detailItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  detailText: {
    fontSize: 16,
    color: "#666",
  },
  giftText: {
    color: Colors.orange500,
    fontWeight: "bold",
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
});

export default CharitarianRequestItem;
