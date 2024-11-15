import React, { useState, useEffect } from 'react';
import { View, Text, Image, Button, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import axios from 'axios';
import axiosInstance from '@/src/api/axiosInstance';
import Colors from '@/src/constants/Colors';
import { Product } from '@/src/shared/type';
import FontSize from '@/src/constants/FontSize';

const MyProducts = () => {
  const [activeTab, setActiveTab] = useState('approved');
  const [products, setProducts] = useState({
    approved: [],
    pending: [],
    outOfDate: []
  });

  useEffect(() => {
    // Fetch data from the API
    axiosInstance.get('/items/current-user')
      .then(response => {
        const data = response.data.data;
        setProducts({
          approved: data['Approved Items'],
          pending: data['Pending Items'],
          outOfDate: data['Out of date Items']
        });
      })
      .catch(error => {
        console.error('Error fetching data:', error);
      });
  }, []);

  const renderProducts = (items: Product[]) => {
    return items.map(item => (
      <View key={item.id} style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>{item.name}</Text>
          <View style={[styles.badge, item.status === 'Approved' ? styles.approvedBadge : styles.pendingBadge]}>
            <Text style={styles.badgeText}>{item.status}</Text>
          </View>
        </View>
        <View style={styles.productInfo}>
          <Image source={{ uri: item.images[0] }} style={styles.image} />
          <View style={styles.productDetails}>
            <Text>{item.description}</Text>
            <Text>Category: {item.category}</Text>
            <Text>Condition: {item.condition}</Text>
            <Text>Points: {item.point}</Text>
            <Text>Owner: {item.owner_Name}</Text>
          </View>
        </View>
      </View>
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
          <Text style={{fontSize: 16}}>Đã hết hạn</Text>
        </TouchableOpacity>
      </View>
      <ScrollView style={styles.tabContent}>
        {activeTab === 'approved' && renderProducts(products.approved)}
        {activeTab === 'pending' && renderProducts(products.pending)}
        {activeTab === 'outOfDate' && renderProducts(products.outOfDate)}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    flex: 1,
  },
  tabs: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
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
    width: 100,
    height: 100,
    marginRight: 16,
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
});

export default MyProducts;