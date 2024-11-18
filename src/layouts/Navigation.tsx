import React, { useEffect, useState } from 'react';
import { NavigationContainer, DarkTheme, DefaultTheme } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { useColorScheme } from '@/src/hooks/useColorScheme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import CustomBottomTab, { TabBarProps } from './BottomBar';
import { Ionicons } from '@expo/vector-icons';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { RootStackParamList } from './types/navigationTypes';

// Fonts
import fonts from '@/config/fonts';

// Screens
import WelcomeScreen from '@/screens/Welcome/WelcomeScreen';
import LoginScreen from '@/screens/Login/LoginScreen';
import RegisterScreen from '@/screens/Register/RegisterScreen';
import HomeScreen from '@/screens/Home/HomeScreen';
import PostScreen from '@/screens/Post/PostScreen';
import ProfileScreen from '@/screens/Profile/ProfileScreen';
import NotificationsScreen from '@/screens/Notifications/Notifications';
import FavoritesScreen from '@/screens/Favorites/FavoritesScreen';
import ProductDetailScreen from '@/screens/ProductDetail/ProductDetailScreen';
import CreatePostScreen from '@/screens/CreatePost/CreatePostScreen';
import MyProducts from '../screens/MyProducts/MyProducts';
import MyRequests from '../screens/MyRequests/MyRequests';
import MyTransactions from '../screens/MyTransactions/MyTransactions';
import ProfileDetailScreen from '../screens/ProfileDetail/ProfileDetailScreen';
import OTPScreen from '../screens/OTP/OTPScreen';
import MapScreen from '../components/Map/MapScreen';


const Stack = createStackNavigator<RootStackParamList>();


const tabBarProps: TabBarProps[] = [
  {
    route: 'Home',
    component: HomeScreen,
    tabBarLabel: 'Home',
    tabBarIconProps: {
      iconType: Ionicons,
      iconName: 'home',
    },
  },
  // {
  //   route: 'Favorites',
  //   component: FavoritesScreen,
  //   tabBarLabel: 'Favorites',
  //   tabBarIconProps: {
  //     iconType: Ionicons,
  //     iconName: 'favorite',
  //   },
  // },
  // {
  //   route: 'Notifications',
  //   component: MapScreen,
  //   tabBarLabel: 'Notifications',
  //   tabBarIconProps: {
  //     iconType: Ionicons,
  //     iconName: 'notifications',
  //   },
  // },
  {
    route: 'Profile',
    component: ProfileScreen,
    tabBarLabel: 'Profile',
    tabBarIconProps: {
      iconType: Ionicons,
      iconName: 'person',
    },
  },
];

export default function Navigation() {
  const colorScheme = useColorScheme();
  const [fontsLoaded] = useFonts(fonts);
  const [appIsReady, setAppIsReady] = useState(false);
  const [initialRoute, setInitialRoute] = useState<keyof RootStackParamList | null>(null);

  useEffect(() => {
    if (appIsReady && fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [appIsReady, fontsLoaded]);

  useEffect(() => {
    setInitialRoute('Main');
    setAppIsReady(true);
  }, []);

  if (!appIsReady || !fontsLoaded || !initialRoute) {
    return null;
  }

  return (
    <NavigationContainer
        theme={colorScheme === 'dark' ? DarkTheme : DefaultTheme}
      >
        <Stack.Navigator initialRouteName={initialRoute}>
          <Stack.Screen name="Main" options={{ headerShown: false }}>
            {() => <CustomBottomTab tabs={tabBarProps} />}
          </Stack.Screen>
          <Stack.Screen name="LoginScreen" component={LoginScreen} options={{ headerShown: false }} />
          <Stack.Screen name="RegisterScreen" component={RegisterScreen} options={{ headerShown: false }} />
          <Stack.Screen name="WelcomeScreen" component={WelcomeScreen} options={{ headerShown: false }} />
          <Stack.Screen name="CreatePost" component={CreatePostScreen} options={{ headerShown: false }} />
          <Stack.Screen name="OTPScreen" component={OTPScreen} options={{ headerShown: false }} />
          <Stack.Screen name="ProductDetail" component={ProductDetailScreen} options={{ title: 'Chi tiết sản phẩm' }} />
          <Stack.Screen name="ProfileDetail" component={ProfileDetailScreen} options={{ title: 'Thông tin cá nhân' }} />
          <Stack.Screen name="MyProducts" component={MyProducts} options={{ title: 'Sản phẩm của tôi' }} />
          <Stack.Screen name="MyRequests" component={MyRequests} options={{ title: 'Quản lí các yêu cầu của tôi' }} />
          <Stack.Screen name="MyTransactions" component={MyTransactions} options={{ title: 'Quản lí giao dịch của tôi' }} />
        </Stack.Navigator>
    </NavigationContainer>
  );
}