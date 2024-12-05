import React, { useEffect, useState } from 'react';
import { ScrollView, View, ActivityIndicator, SafeAreaView, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Card, Text } from 'react-native-paper';
import axiosInstance from '@/api/axiosInstance';
import { useNavigation } from '@/hooks/useNavigation';
import Icon from 'react-native-vector-icons/Ionicons';
import Colors from '@/src/constants/Colors';
import { useAuthStore } from '@/src/stores/authStore';

const setUserDataSelector = (state: ReturnType<typeof useAuthStore.getState>) => state.setUserData;

const RequestSubActionScreen = () => {
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation();
  const setUserData = useAuthStore(setUserDataSelector);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get('/user/profile');
      setUserData(response.data.data);
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserData();
  }, []);

  const handleAuthenticatedNavigation = (screenName: string) => {
    try {
      if (screenName === 'RequestsForMe') {
        navigation.navigate('MyRequests', { productId: '', type: 'requestsForMe' });
      } else if (screenName === 'MyRequests') {
        navigation.navigate('MyRequests', { productId: '', type: 'itemRequestTo' });
      }
    } catch (error) {
      console.error('Navigation error:', error);
      Alert.alert('Lỗi', 'Không thể chuyển đến trang yêu cầu');
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.orange500} />
      </View>
    );
  }

  const menuItems = [
    {
      title: 'Các yêu cầu của tôi',
      icon: 'cube-outline',
      onPress: () => handleAuthenticatedNavigation('MyRequests'),
    },
    {
      title: 'Các yêu cầu được gửi đến tôi',
      icon: 'cube-outline',
      onPress: () => handleAuthenticatedNavigation('RequestsForMe'),
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.menuSection}>
          {menuItems.map((item, index) => (
            <Card key={index} style={styles.menuCard}>
              <TouchableOpacity onPress={item.onPress}>
                <Card.Content style={styles.menuContent}>
                  <View style={styles.menuLeft}>
                    <Icon name={item.icon} size={24} color={Colors.orange500} />
                    <Text style={styles.menuText}>{item.title}</Text>
                  </View>
                  <Icon name="chevron-forward-outline" size={24} color={Colors.orange500} style={{ marginRight: 12 }} />
                </Card.Content>
              </TouchableOpacity>
            </Card>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingVertical: 8,
  },
  scrollContent: {
    paddingHorizontal: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.orange50,
  },
  menuSection: {
    marginBottom: 24,
  },
  menuCard: {
    backgroundColor: 'white',
    marginBottom: 12,
    elevation: 2,
    borderRadius: 12,
  },
  menuContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuText: {
    marginLeft: 12,
    fontSize: 16,
    color: Colors.darkText,
    flex: 1,
  },
});

export default RequestSubActionScreen;
