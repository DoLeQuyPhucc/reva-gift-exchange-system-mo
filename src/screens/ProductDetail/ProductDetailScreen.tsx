import React, { useEffect, useState } from "react";
import { StyleSheet, View, Image, ScrollView, Text, TouchableOpacity, Modal, TextInput, Pressable } from "react-native";
import { RouteProp, useRoute } from "@react-navigation/native";
import Icon from 'react-native-vector-icons/MaterialIcons';
import { Product, ProductAttribute } from "@/src/shared/type";
import axiosInstance from "@/src/api/axiosInstance";
import { Button } from "react-native";
import { formatDate } from "@/src/shared/formatDate";
import { RootStackParamList } from "@/src/layouts/types/navigationTypes";
import Colors from "@/src/constants/Colors";


type ProductDetailScreenRouteProp = RouteProp<RootStackParamList, 'ProductDetail'>;

export default function ProductDetailScreen() {
  const route = useRoute<ProductDetailScreenRouteProp>();
  const itemId = route.params.productId;
  
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [requestMessage, setRequestMessage] = useState("");
  const [showRequestDialog, setShowRequestDialog] = useState(false);

  useEffect(() => {
    const fetchProduct = async () => {
      if (!itemId) {
        setError("Invalid product ID");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await axiosInstance.get(`/items/${itemId}`);
        
        if (response.data.isSuccess && response.data.data) {
          setProduct(response.data.data);
        } else {
          throw new Error(response.data.message || "Failed to fetch product");
        }
      } catch (error) {
        console.error("Error fetching product:", error);
        setError("Không thể tải thông tin sản phẩm");
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [itemId]);

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingPlaceholder} />
        <View style={styles.loadingPlaceholder} />
        <View style={[styles.loadingPlaceholder, { width: "75%" }]} />
      </View>
    );
  }

  if (!product) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Không tìm thấy sản phẩm</Text>
      </View>
    );
  }

  const handleAddToCart = async () => {
    console.log("Add to cart:", product);
  };

  
  const handleRequest = async () => {
    if (!product) {
      console.error("Product not found");
      return;
    }

    setShowRequestDialog(true);
  };


  const handleConfirmRequest = async () => {
    setShowRequestDialog(false);

    const data = {
      itemId: product.id,
      quantity: product.quantity,
      // message: requestMessage,
    };

    const response = await axiosInstance.post("/request/create", data);

    if (!response.data.isSuccess) {
      console.log("Failed to create request:", response.data.message);
      return;
    } else {
      console.log("Request created:", response.data.message);
    }
  };
  const handleCancelRequest = () => {
    setShowRequestDialog(false);
    setRequestMessage("");
  };

  const renderAttributes = () => {
    return product.itemAttributeValues.map((attr: ProductAttribute) => (
      <View key={attr.id} style={styles.attributeContainer}>
        <Text style={styles.attributeText}>- {attr.value}</Text>
      </View>
    ));
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.imageContainer}>
        <Image source={{ uri: product.images[0] }} style={styles.image} />
      </View>

      <View style={styles.infoContainer}>
        <Text style={styles.title}>{product.name}</Text>

        <View style={styles.badgeContainer}>
          <View style={[styles.badge, { backgroundColor: Colors.orange500 }]}>
            <Text style={styles.badgeText}>{product.category}</Text>
          </View>
          <View style={[styles.badge, { backgroundColor: Colors.lightGreen }]}>
            <Text style={styles.badgeText}>{product.condition}</Text>
          </View>
          {product.available ? (
          <View style={[styles.badge, { backgroundColor: 'green' }]}>
            <Text style={styles.badgeText}>Còn hàng</Text>
          </View>
          ) : (
          <View style={[styles.badge, { backgroundColor: Colors.orange700 }]}>
            <Text style={styles.badgeText}>Hết hàng</Text>
          </View>
          )}
        </View>

        <Text style={styles.description}>{product.description}</Text>

        <View style={styles.detailsContainer}>
          <View style={styles.detailItem}>
            <Icon name="calendar-month" size={20} />
            <Text style={styles.detailText}>
              Ngày đăng: {formatDate(product.createdAt)}
            </Text>
          </View>
          <View style={styles.detailItem}>
            <Icon name="now-widgets" size={20} />
            <Text style={styles.detailText}>Số lượng: {product.quantity}</Text>
          </View>
          <View style={styles.detailItem}>
            <Icon name="loop" size={20} />
            <Text style={styles.detailText}>Tình trạng: {product.condition}</Text>
          </View>
        </View>

        <View style={styles.attributesContainer}>
          <Text style={styles.attributesTitle}>Thông số kỹ thuật:</Text>
          {renderAttributes()}
        </View>

        {product.available ? (
          <View style={styles.buttonContainer}>
            <TouchableOpacity style={[styles.button, styles.requestButton]} onPress={handleRequest}>
              <Text style={styles.buttonText}>Đăng ký nhận</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={[styles.button, styles.outOfStockButton]}>
            <Button
              title="Hết hàng"
              disabled
            />
          </View>
        )}
      </View>

      <Modal
        visible={showRequestDialog}
        animationType="slide"
        transparent={true}
      >
        <View style={styles.centeredView}>
          <View style={styles.modalView}>
            <Text style={styles.modalTitle}>Tạo yêu cầu trao đổi</Text>
            <Text style={styles.modalDescription}>
              Nhập lời nhắn của bạn:
            </Text>
            <TextInput
              style={styles.requestInput}
              placeholder="Nhập tin nhắn..."
              value={requestMessage}
              onChangeText={setRequestMessage}
              multiline
            />
            <Text style={styles.modalDescription}>
              Vui lòng chọn khung thời gian bạn đến nhận hàng
            </Text>
            <Text style={styles.modalDescriptionSub}>
            Thời gian này sẽ được gửi đến Phúc Đỗ, nếu phù hợp sẽ tiếp hành trao đổi. Bạn có thể chọn tối đa 3 khung giờ.
            </Text>
            <View style={styles.modalButtonContainer}>
              <Pressable
                style={[styles.button, styles.cancelButton]}
                onPress={handleCancelRequest}
              >
                <Text style={styles.buttonText}>Hủy</Text>
              </Pressable>
              <Pressable
                style={[styles.button, styles.confirmButton]}
                onPress={handleConfirmRequest}
              >
                <Text style={styles.buttonText}>Xác nhận</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white",
  },
  imageContainer: {
    height: 400,
    borderRadius: 16,
    overflow: "hidden",
  },
  image: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  infoContainer: {
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
  },
  badgeContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 12,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  badgeText: {
    color: 'white',
    fontSize: 12,
  },
  description: {
    fontSize: 16,
    color: "#666",
    marginBottom: 16,
  },
  detailsContainer: {
    marginBottom: 16,
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
  attributesContainer: {
    marginBottom: 16,
  },
  attributesTitle: {
    fontSize: 18,
    fontWeight: "medium",
    color: "#333",
    marginBottom: 8,
  },
  attributeContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  attributeText: {
    fontSize: 16,
    color: "#666",
  },
  buttonContainer: {
    flexDirection: "column",
    gap: 12,
  },
  button: {
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  requestButton: {
    backgroundColor: Colors.orange500,
    color: "white",
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
  },
  outOfStockButton: {
    backgroundColor: Colors.orange500,
    color: "white",
    opacity: 0.5,
  },
  loadingPlaceholder: {
    backgroundColor: "#f2f2f2",
    borderRadius: 8,
    height: 16,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 18,
    color: "#e53e3e",
    textAlign: "center",
    marginTop: 32,
  },
  centeredView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalView: {
    backgroundColor: "white",
    borderRadius: 20,
    padding: 35,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    width: "80%",
    height: "70%",
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 16,
    textAlign: "center",
  },
  modalDescription: {
    fontSize: 16,
    marginBottom: 16,
    fontWeight: "bold",
    textAlign: "left",
  },
  modalDescriptionSub: {
    fontSize: 14,
    marginBottom: 16,
    color: "#7B7B7B",
  },
  requestInput: {
    backgroundColor: "#f2f2f2",
    borderRadius: 8,
    padding: 12,
    textAlignVertical: "top",
    marginVertical: 16,
    width: "100%",
  },
  modalButtonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },
  cancelButton: {
    width: "48%",
    backgroundColor: "#e53e3e",
  },
  confirmButton: {
    width: "48%",
    backgroundColor: Colors.orange600,
  },
});