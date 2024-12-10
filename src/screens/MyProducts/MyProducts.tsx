import React, { useState, useEffect } from 'react';
import { View, Text, Image, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import axiosInstance from '@/src/api/axiosInstance';
import Colors from '@/src/constants/Colors';
import { Product } from '@/src/shared/type';
import Icon from "react-native-vector-icons/MaterialIcons";
import { useNavigation } from '@/src/hooks/useNavigation';

const STATUS_COLORS: { [key: string]: string } = {
  Pending: Colors.orange500,
  Approved: Colors.lightGreen,
  Rejected: Colors.lightRed,
  Out_of_date: "#48494d"
};

const REQUEST_COLORS: { [key: string]: string } = {
  itemRequestTo: Colors.orange500,
  requestForItem: Colors.lightGreen,
};

const STATUS_LABELS = {
  Pending: "Đang chờ",
  Approved: "Đã duyệt",
  Rejected: "Từ chối",
  Out_of_date: "Hết hạn"
};

const MyProducts = () => {
  const [activeTab, setActiveTab] = useState('approved');
  const [products, setProducts] = useState({
    approved: [],
    rejected: [],
    pending: [],
    outOfDate: []
  });
  const navigation = useNavigation();

  useEffect(() => {
    // Fetch data from the API
    axiosInstance.get('/items/current-user')
      .then(response => {
        const data = response.data.data;
        setProducts({
          approved: data['ApprovedItems'],
          rejected: data['RejectedItems'],
          pending: data['PendingItems'],
          outOfDate: data['OutOfDateItems']
        });
      })
      .catch(error => {
        console.error('Error fetching data:', error);
      });
  }, []);

  const renderProducts = (items: Product[]) => {
    return items.map(item => (
      <TouchableOpacity key={item.id} style={styles.card} onPress={() => navigation.navigate("ProductDetail", { productId: item.id })}>
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
            {/* <View style={styles.detailItem}>
              <Icon name="category" size={20} color={Colors.orange500} />
              <Text style={styles.detailText}>Danh mục: {item.category.name}</Text>
            </View>
            <View style={styles.detailItem}>
              <Icon name="now-widgets" size={20} color={Colors.orange500}/>
              <Text style={styles.detailText}>Số lượng: {item.quantity}</Text>
            </View> */}
            <View style={styles.detailItem}>
              <Icon name="loop" size={20} color={Colors.orange500}/>
              <Text style={styles.detailText}>Tình trạng: {item.condition}</Text>
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
        {activeTab === 'approved' && (
          <View style={styles.cardFooter}>
            
          <TouchableOpacity
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
          </TouchableOpacity>
            <TouchableOpacity
            style={[
              styles.statusBadge,
              { backgroundColor: `${Colors.lightRed}15` },
            ]}
            onPress={() => navigation.navigate("MyRequests", { productId: item.id, type: 'requestsForMe' })}
          >
            <Text
              style={[
                styles.statusText,
                { color: Colors.lightRed },
              ]}
            >
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
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'approved' && styles.activeTab]}
          onPress={() => setActiveTab('approved')}
        >
          <Text style={{fontSize: 16}}>Đã duyệt</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'pending' && styles.activeTab]}
          onPress={() => setActiveTab('pending')}
        >
          <Text style={{fontSize: 16}}>Chờ phê duyệt</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'outOfDate' && styles.activeTab]}
          onPress={() => setActiveTab('outOfDate')}
        >
          <Text style={{fontSize: 16}}>Đã huỷ</Text>
        </TouchableOpacity>
      </View>
      <ScrollView style={styles.tabContent}>
        {activeTab === 'approved' && renderProducts(products.approved)}
        {activeTab === 'pending' && renderProducts(products.pending)}
        {activeTab === 'outOfDate' && renderProducts([...products.outOfDate, ...products.rejected])}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tabs: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
    backgroundColor: '#fff',
    paddingTop: 10,

  },
  tabButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: '#f1f1f1',
    borderRadius: 5,
  },
  activeTabButton: {
    backgroundColor: Colors.orange500,
  },
  tabText: {
    fontSize: 16,
    color: '#333',
  },
  activeTabText: {
    color: '#fff',
  },
  tabContent: {
    flex: 1,
    paddingHorizontal: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e1e1e1',
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f1f1f1',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f1f1f1',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  badge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  approvedBadge: {
    backgroundColor: '#28a745',
  },
  pendingBadge: {
    backgroundColor: '#ffc107',
  },
  badgeText: {
    color: '#fff',
    fontSize: 14,
  },
  productInfo: {
    flexDirection: 'row',
    alignItems: 'center',
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
    alignItems: 'center',
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
});

export default MyProducts;