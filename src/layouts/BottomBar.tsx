import { createMaterialBottomTabNavigator } from '@react-navigation/material-bottom-tabs';
import Icon from 'react-native-vector-icons/MaterialIcons';
import React, { useState } from 'react';
import { View, Modal, TouchableOpacity, Text, StyleSheet, Animated, Dimensions } from 'react-native';
import { BottomTabParamList } from '@/src/layouts/types/navigationTypes';
import Colors from '@/constants/Colors';
import { useNavigation } from '@/hooks/useNavigation';

const Tab = createMaterialBottomTabNavigator<BottomTabParamList>();
const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface Category {
  id: string;
  name: string;
}

const categories: Category[] = [
  { id: '1', name: 'Điện thoại' },
  { id: '2', name: 'Máy tính' },
  { id: '3', name: 'Đồ gia dụng' }, 
];

export interface TabBarProps {
  route: keyof BottomTabParamList;
  component: React.ComponentType<any>;
  tabBarLabel: string;
  tabBarIconProps: {
    iconType: any;
    iconName: string;
  };
}

const CustomBottomTab: React.FC<{ tabs: TabBarProps[] }> = ({ tabs }) => {
  const [modalVisible, setModalVisible] = useState(false);
  const slideAnim = React.useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const navigation = useNavigation();

  const showModal = () => {
    setModalVisible(true);
    Animated.spring(slideAnim, {
      toValue: 0,
      useNativeDriver: true,
      tension: 50,
      friction: 8
    }).start();
  };

  const hideModal = () => {
    Animated.timing(slideAnim, {
      toValue: SCREEN_HEIGHT,
      duration: 300,
      useNativeDriver: true
    }).start(() => {
      setModalVisible(false);
    });
  };

  const handleCategorySelect = (category: Category) => {
    hideModal();
    navigation.navigate('CreatePost', { category });
  };

  const CategoryModal = () => (
    <Modal
      animationType="none"
      transparent={true}
      visible={modalVisible}
      onRequestClose={hideModal}
    >
      <View style={styles.modalOverlay}>
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={hideModal}
        >
          <Animated.View 
            style={[
              styles.modalContent,
              {
                transform: [{
                  translateY: slideAnim
                }]
              }
            ]}
          >
            <View style={styles.modalHeader}>
              <View style={styles.modalIndicator} />
            </View>
            <Text style={styles.modalTitle}>Chọn danh mục</Text>
            {categories.map((category) => (
              <TouchableOpacity
                key={category.id}
                style={styles.categoryItem}
                onPress={() => handleCategorySelect(category)}
              >
                <Text style={styles.categoryText}>{category.name}</Text>
              </TouchableOpacity>
            ))}
          </Animated.View>
        </TouchableOpacity>
      </View>
    </Modal>
  );

  return (
    <View style={{ flex: 1 }}>
      <Tab.Navigator
        initialRouteName={tabs[0].route}
        shifting={true}
        activeColor={Colors.orange600}
        inactiveColor="gray"
        barStyle={{
          borderRadius: 20,
          height: 70,
          backgroundColor: 'white',
        }}
        activeIndicatorStyle={{ opacity: 0 }}
      >
        {tabs.map((tabProps: TabBarProps, idx) => (
          <Tab.Screen
            key={idx}
            name={tabProps.route}
            component={tabProps.component}
            options={{
              tabBarLabel: tabProps.tabBarLabel,
              tabBarIcon: ({ color }) => (
                <Icon
                  name={tabProps.tabBarIconProps.iconName}
                  color={color}
                  size={20}
                />
              ),
            }}
          />
        ))}
      </Tab.Navigator>

      {/* Centered Floating Action Button */}
      <View style={styles.fabContainer}>
        <TouchableOpacity
          style={styles.fab}
          onPress={showModal}
        >
          <Icon name="add" size={24} color="white" />
        </TouchableOpacity>
      </View>

      <CategoryModal />
    </View>
  );
};

const styles = StyleSheet.create({
  fabContainer: {
    position: 'absolute',
    alignSelf: 'center',
    bottom: 40,
    zIndex: 1,
  },
  fab: {
    backgroundColor: Colors.orange600,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.30,
    shadowRadius: 4.65,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingBottom: 40,
    maxHeight: SCREEN_HEIGHT * 0.7,
  },
  modalHeader: {
    alignItems: 'center',
    paddingVertical: 15,
  },
  modalIndicator: {
    width: 40,
    height: 4,
    backgroundColor: '#DEDEDE',
    borderRadius: 2,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: Colors.orange600,
  },
  categoryItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  categoryText: {
    fontSize: 16,
    color: '#333',
  },
});

export default CustomBottomTab;