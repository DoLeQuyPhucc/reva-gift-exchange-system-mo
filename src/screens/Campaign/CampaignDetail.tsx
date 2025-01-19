import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  Dimensions,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
  FlatList,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import { useNavigation } from "@react-navigation/native";
import { useRoute } from "@/src/hooks/useNavigation";
import axiosInstance from "@/src/api/axiosInstance";
import Colors from "@/src/constants/Colors";
import { CampaignDetail as ICampaignDetail } from "@/src/shared/type";
import { API_GET_CAMPAIGN } from "@env";

const { width } = Dimensions.get("window");
const IMAGE_HEIGHT = width * 0.75; // Maintain 4:3 aspect ratio

enum CampaignStatus {
  PLANNED = "Planned",
  CANCELLED = "Cancelled",
  ONGOING = "Ongoing",
  COMPLETED = "Completed",
}

const STATUS_TRANSLATIONS = {
  [CampaignStatus.PLANNED]: "Đã lên kế hoạch",
  [CampaignStatus.CANCELLED]: "Đã bị hủy",
  [CampaignStatus.ONGOING]: "Đang diễn ra",
  [CampaignStatus.COMPLETED]: "Đã hoàn tất",
} as const;

const CampaignDetail: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<"CampaignDetail">();
  const { campaignId } = route.params;

  const [campaign, setCampaign] = useState<ICampaignDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    fetchCampaignDetail();
  }, [campaignId]);

  const fetchCampaignDetail = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get(
        `${API_GET_CAMPAIGN}/${campaignId}`
      );
      setCampaign(response.data.data);
    } catch (error) {
      console.error("Error fetching campaign detail:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusTranslation = (status: string) => {
    return STATUS_TRANSLATIONS[status as CampaignStatus] || status;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case CampaignStatus.PLANNED:
        return Colors.blue500;
      case CampaignStatus.ONGOING:
        return Colors.green500;
      case CampaignStatus.CANCELLED:
        return Colors.red500;
      default:
        return Colors.gray500;
    }
  };

  const renderImageCounter = () => {
    if (!campaign?.images || campaign.images.length <= 1) return null;
    return (
      <View style={styles.imageCounter}>
        <Text style={styles.imageCounterText}>
          {currentImageIndex + 1}/{campaign.images.length}
        </Text>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.orange500} />
      </View>
    );
  }

  if (!campaign) {
    return (
      <View style={styles.errorContainer}>
        <Icon name="error-outline" size={48} color={Colors.red500} />
        <Text style={styles.errorText}>Không tìm thấy chiến dịch</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Images Section */}
        <View style={styles.imagesContainer}>
          <FlatList
            data={campaign.images}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(e) => {
              const newIndex = Math.round(
                e.nativeEvent.contentOffset.x / width
              );
              setCurrentImageIndex(newIndex);
            }}
            renderItem={({ item }) => (
              <Image
                source={{ uri: item }}
                style={styles.image}
                resizeMode="cover"
              />
            )}
            keyExtractor={(item, index) => index.toString()}
          />
          {renderImageCounter()}
        </View>

        {/* Main Content */}
        <View style={styles.mainContent}>
          {/* Header Section */}
          <View style={styles.headerSection}>
            <Text style={styles.campaignName}>{campaign.name}</Text>
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: getStatusColor(campaign.status) },
              ]}
            >
              <Text style={styles.statusText}>
                {getStatusTranslation(campaign.status)}
              </Text>
            </View>
          </View>

          {/* Time Section */}
          <View style={styles.timeCard}>
            <View style={styles.timeItem}>
              <Icon name="event" size={24} color={Colors.orange500} />
              <View style={styles.timeTextContainer}>
                <Text style={styles.timeLabel}>Bắt đầu</Text>
                <Text style={styles.timeValue}>
                  {formatDate(campaign.startDate)}
                </Text>
              </View>
            </View>
            <View style={styles.timeDivider} />
            <View style={styles.timeItem}>
              <Icon name="event-busy" size={24} color={Colors.orange500} />
              <View style={styles.timeTextContainer}>
                <Text style={styles.timeLabel}>Kết thúc</Text>
                <Text style={styles.timeValue}>
                  {formatDate(campaign.endDate)}
                </Text>
              </View>
            </View>
          </View>

          {/* Description Section */}
          {campaign.description && (
            <View style={styles.descriptionSection}>
              <Text style={styles.sectionTitle}>Mô tả chiến dịch</Text>
              <Text style={styles.descriptionText}>{campaign.description}</Text>
            </View>
          )}

          {/* Categories Section */}
          <View style={styles.categoriesSection}>
            <Text style={styles.sectionTitle}>Danh mục sản phẩm</Text>
            <View style={styles.categoriesList}>
              {campaign.categories.map((category) => (
                <View key={category.id} style={styles.categoryCard}>
                  <Text style={styles.parentCategory}>
                    {category.parentName}
                  </Text>
                  <Icon name="chevron-right" size={16} color={Colors.gray500} />
                  <Text style={styles.childCategory}>{category.name}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Footer Info */}
          <View style={styles.footerSection}>
            <Text style={styles.footerText}>
              Ngày tạo: {formatDate(campaign.createdAt)}
            </Text>
            {campaign.updatedAt && (
              <Text style={styles.footerText}>
                Cập nhật lần cuối: {formatDate(campaign.updatedAt)}
              </Text>
            )}
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.gray50,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    color: Colors.gray700,
  },
  content: {
    flex: 1,
  },
  imagesContainer: {
    height: IMAGE_HEIGHT,
    backgroundColor: Colors.gray100,
  },
  image: {
    width,
    height: IMAGE_HEIGHT,
  },
  imageCounter: {
    position: "absolute",
    right: 16,
    bottom: 16,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  imageCounterText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  mainContent: {
    padding: 16,
    gap: 24,
  },
  headerSection: {
    gap: 12,
  },
  campaignName: {
    fontSize: 24,
    fontWeight: "bold",
    color: Colors.gray900,
  },
  statusBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  statusText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },
  timeCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    gap: 16,
  },
  timeItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  timeTextContainer: {
    flex: 1,
  },
  timeLabel: {
    fontSize: 14,
    color: Colors.gray600,
  },
  timeValue: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.gray900,
    marginTop: 4,
  },
  timeDivider: {
    height: 1,
    backgroundColor: Colors.gray200,
  },
  descriptionSection: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.gray900,
    marginBottom: 12,
  },
  descriptionText: {
    fontSize: 16,
    lineHeight: 24,
    color: Colors.gray700,
  },
  categoriesSection: {
    gap: 12,
  },
  categoriesList: {
    gap: 8,
  },
  categoryCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  parentCategory: {
    flex: 1,
    fontSize: 15,
    color: Colors.gray700,
    fontWeight: "500",
  },
  childCategory: {
    flex: 1,
    fontSize: 15,
    color: Colors.gray900,
    fontWeight: "500",
  },
  footerSection: {
    borderTopWidth: 1,
    borderTopColor: Colors.gray200,
    paddingTop: 16,
    gap: 4,
  },
  footerText: {
    fontSize: 13,
    color: Colors.gray600,
  },
});

export default CampaignDetail;
