import React, { useEffect, useState } from 'react';
import { ScrollView, View, ActivityIndicator, SafeAreaView, TouchableOpacity, StyleSheet } from 'react-native';
import { Avatar, Button, Card, Text, Title } from 'react-native-paper';
import axiosInstance from '@/api/axiosInstance';
import { useNavigation } from '@/hooks/useNavigation';
import Icon from 'react-native-vector-icons/Ionicons';
import Colors from '@/src/constants/Colors';
import { useAuthCheck } from '@/src/hooks/useAuth';
import { Alert } from 'react-native';
import { RootStackParamList } from '@/src/layouts/types/navigationTypes';
import { useAuthStore } from '@/stores/authStore';

const userDataSelector = (state: ReturnType<typeof useAuthStore.getState>) => state.userData;
const setUserDataSelector = (state: ReturnType<typeof useAuthStore.getState>) => state.setUserData;

const ProfileScreen = () => {
  const { isAuthenticated } = useAuthCheck();
  const userData = useAuthStore(userDataSelector);
  const setUserData = useAuthStore(setUserDataSelector);
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation();

  const fetchUserData = async () => {
    if (!isAuthenticated) {
      setUserData(null);
      return;
    }

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
  }, [isAuthenticated]);
  
  const handleLogout = async () => {
    try {
      const logout = useAuthStore.getState().logout;
      await logout();
      navigation.navigate('Main', {
        screen: 'Home'
      });
    } catch (error) {
      console.error('Error clearing session:', error);
    }
  };

  const handleAuthenticatedNavigation = (screenName: keyof RootStackParamList) => {
    if (!isAuthenticated) {
      Alert.alert(
        'Yêu cầu đăng nhập',
        'Vui lòng đăng nhập để sử dụng tính năng này',
        [
          { text: 'Hủy', style: 'cancel' },
          { 
            text: 'Đăng nhập', 
            onPress: () => {
              try {
                navigation.navigate('LoginScreen', undefined);
              } catch (error) {
                console.error('Navigation error:', error);
                Alert.alert('Lỗi', 'Không thể chuyển đến trang đăng nhập');
              }
            }
          }
        ]
      );
      return;
    }
    
    try {
      if (screenName === 'MyProducts') {
        navigation.navigate('MyProducts');
      } else if (screenName === 'MyRequests') {
        navigation.navigate('MyRequests');
      } else if (screenName === 'MyTransactions') {
        navigation.navigate('MyTransactions');
      }
    } catch (error) {
      console.error('Navigation error:', error);
      Alert.alert('Lỗi', 'Không thể chuyển đến trang yêu cầu');
    }
  };

  const handleEditProfile = () => {
    if(!isAuthenticated) {
      Alert.alert(
        'Yêu cầu đăng nhập',
        'Vui lòng đăng nhập để sử dụng tính năng này',
        [
          { text: 'Hủy', style: 'cancel' },
          { 
            text: 'Đăng nhập', 
            onPress: () => {
              try {
                navigation.navigate('LoginScreen', undefined);
              } catch (error) {
                console.error('Navigation error:', error);
                Alert.alert('Lỗi', 'Không thể chuyển đến trang đăng nhập');
              }
            }
          }
        ]
      );
      return;
    }
    navigation.navigate('ProfileDetail');
  }
  
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.orange500} />
      </View>
    );
  }

  const menuItems = [
    {
      title: 'Sản phẩm của tôi',
      icon: 'cube-outline',
      onPress: () => handleAuthenticatedNavigation('MyProducts')
    },
    {
      title: 'Quản lí các yêu cầu của tôi',
      icon: 'cube-outline',
      onPress: () => handleAuthenticatedNavigation('MyRequests')
    },
    {
      title: 'Quản lí các giao dịch của tôi',
      icon: 'cube-outline',
      onPress: () => handleAuthenticatedNavigation('MyTransactions')
    },
  ];

  const renderActionButtons = () => {
    if (isAuthenticated) {
      return (
        <View style={styles.actionButtons}>
          <Button
            mode="contained"
            onPress={handleEditProfile}
            style={[styles.button, styles.editButton]}
            labelStyle={styles.buttonLabel}
          >
            Chỉnh sửa thông tin
          </Button>
          <Button
            mode="outlined"
            onPress={handleLogout}
            style={[styles.button, styles.logoutButton]}
            labelStyle={styles.logoutButtonLabel}
          >
            Đăng xuất
          </Button>
        </View>
      );
    }

    return (
      <View style={styles.actionButtons}>
        <Button
          mode="contained"
          onPress={() => navigation.navigate('LoginScreen')}
          style={[styles.button, styles.editButton]}
          labelStyle={styles.buttonLabel}
        >
          Đăng nhập
        </Button>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* User Avatar and Info */}
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            <Avatar.Image
              size={100}
              source={{ uri: userData?.profilePicture }}
              style={styles.avatar}
            />
          </View>
          <View>
            <Title style={styles.userName}>{userData?.firstName} {userData?.lastName}</Title>
            <Text style={styles.userEmail}>{userData?.phone}</Text>
          </View>
        </View>

        {/* Menu Items */}
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
        
        {/* Action Buttons */}
        {renderActionButtons()}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingVertical: 24,
  },
  scrollContent: {
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.orange50,
  },
  profileHeader: {
    marginBottom: 24,
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
    width: 100,
    marginBottom: 16,
    marginRight: 16,
  },
  avatar: {
    borderColor: Colors.orange200,
  },
  editAvatarButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: Colors.orange100,
    borderRadius: 20,
    padding: 8,
    borderWidth: 2,
    borderColor: Colors.orange200,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.darkText,
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 16,
    color: Colors.darkText,
  },
  infoSection: {
    marginBottom: 24,
  },
  infoCard: {
    backgroundColor: 'white',
    marginBottom: 12,
    elevation: 2,
    borderRadius: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  infoItem: {
    alignItems: 'center',
    flex: 1,
    padding: 8,
  },
  infoLabel: {
    fontSize: 14,
    color: Colors.darkText,
    marginTop: 4,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.darkText,
    marginTop: 4,
  },
  contactInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  contactText: {
    marginLeft: 12,
    flex: 1,
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
  actionButtons: {
    gap: 12,
  },
  button: {
    paddingVertical: 8,
    borderRadius: 8,
  },
  editButton: {
    backgroundColor: Colors.orange500,
  },
  logoutButton: {
    borderColor: Colors.orange500,
  },
  buttonLabel: {
    fontSize: 16,
    color: 'white',
  },
  logoutButtonLabel: {
    fontSize: 16,
    color: Colors.darkText,
  },
});

export default ProfileScreen;