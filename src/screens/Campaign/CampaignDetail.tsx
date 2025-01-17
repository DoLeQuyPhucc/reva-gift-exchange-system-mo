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
} from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import { useNavigation } from "@react-navigation/native";
import { useRoute } from "@/src/hooks/useNavigation";
import axiosInstance from "@/src/api/axiosInstance";
import Colors from "@/src/constants/Colors";
import Carousel from "react-native-reanimated-carousel";
import { CampaignDetail as ICampaignDetail } from "@/src/shared/type";
import { API_GET_CAMPAIGN } from "@env";

const { width } = Dimensions.get("window");

enum CampaignStatus {
  PLANNED = "Planned",
  ACTIVE = "Active",
  ENDED = "Ended",
}

const STATUS_TRANSLATIONS = {
  [CampaignStatus.PLANNED]: "Đã lên kế hoạch",
  [CampaignStatus.ACTIVE]: "Đang hoạt động",
  [CampaignStatus.ENDED]: "Đã kết thúc",
} as const;

const CampaignDetail: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<"CampaignDetail">();
  const { campaignId } = route.params;

  const [campaign, setCampaign] = useState<ICampaignDetail | null>(null);
  const [loading, setLoading] = useState(true);

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
      case CampaignStatus.ACTIVE:
        return Colors.green500;
      case CampaignStatus.ENDED:
        return Colors.red500;
      default:
        return Colors.gray500;
    }
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
        {/* Image Carousel */}
        <View style={styles.carouselContainer}>
          <Carousel
            loop
            width={width}
            height={250}
            autoPlay={true}
            data={campaign.images}
            scrollAnimationDuration={1000}
            renderItem={({ item }) => (
              <Image
                source={{ uri: item }}
                style={styles.bannerImage}
                resizeMode="cover"
              />
            )}
          />
        </View>

        {/* Campaign Info */}
        <View style={styles.infoContainer}>
          <Text style={styles.campaignName}>{campaign.name}</Text>

          <View style={styles.statusContainer}>
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

          {/* Time Info */}
          <View style={styles.timeSection}>
            <View style={styles.timeItem}>
              <Icon name="event" size={20} color={Colors.gray700} />
              <View>
                <Text style={styles.timeLabel}>Bắt đầu</Text>
                <Text style={styles.timeValue}>
                  {formatDate(campaign.startDate)}
                </Text>
              </View>
            </View>
            <View style={styles.timeItem}>
              <Icon name="event-busy" size={20} color={Colors.gray700} />
              <View>
                <Text style={styles.timeLabel}>Kết thúc</Text>
                <Text style={styles.timeValue}>
                  {formatDate(campaign.endDate)}
                </Text>
              </View>
            </View>
          </View>

          {/* Categories */}
          <View style={styles.categoriesSection}>
            <Text style={styles.sectionTitle}>Danh mục sản phẩm</Text>
            <View style={styles.categoriesList}>
              {campaign.categories.map((category) => (
                <View key={category.id} style={styles.categoryItem}>
                  <Text style={styles.parentCategory}>
                    {category.parentName}
                  </Text>
                  <Icon name="chevron-right" size={16} color={Colors.gray500} />
                  <Text style={styles.childCategory}>{category.name}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Created Info */}
          <View style={styles.createdSection}>
            <Text style={styles.createdText}>
              Ngày tạo: {formatDate(campaign.createdAt)}
            </Text>
            {campaign.updateddAt && (
              <Text style={styles.updatedText}>
                Cập nhật lần cuối: {formatDate(campaign.updateddAt)}
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
    backgroundColor: "#fff",
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
  header: {
    backgroundColor: Colors.orange500,
    paddingTop: StatusBar.currentHeight,
    paddingBottom: 16,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
  },
  backButton: {
    padding: 8,
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
  },
  content: {
    flex: 1,
  },
  carouselContainer: {
    backgroundColor: Colors.gray100,
  },
  bannerImage: {
    width: "100%",
    height: "100%",
  },
  infoContainer: {
    padding: 16,
  },
  campaignName: {
    fontSize: 24,
    fontWeight: "bold",
    color: Colors.gray900,
    marginBottom: 12,
  },
  statusContainer: {
    flexDirection: "row",
    marginBottom: 16,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },
  timeSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: Colors.gray50,
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  timeItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  timeLabel: {
    fontSize: 12,
    color: Colors.gray600,
  },
  timeValue: {
    fontSize: 14,
    fontWeight: "500",
    color: Colors.gray900,
  },
  categoriesSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.gray900,
    marginBottom: 12,
  },
  categoriesList: {
    gap: 8,
  },
  categoryItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.gray50,
    padding: 12,
    borderRadius: 8,
  },
  parentCategory: {
    fontSize: 14,
    color: Colors.gray700,
    fontWeight: "500",
  },
  childCategory: {
    fontSize: 14,
    color: Colors.gray900,
    fontWeight: "500",
  },
  createdSection: {
    borderTopWidth: 1,
    borderTopColor: Colors.gray200,
    paddingTop: 16,
  },
  createdText: {
    fontSize: 12,
    color: Colors.gray600,
  },
  updatedText: {
    fontSize: 12,
    color: Colors.gray600,
    marginTop: 4,
  },
});

export default CampaignDetail;
