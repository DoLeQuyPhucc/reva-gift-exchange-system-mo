import React, { useEffect, useState } from "react";
import {
  NavigationContainer,
  DarkTheme,
  DefaultTheme,
} from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { useFonts } from "expo-font";
import * as SplashScreen from "expo-splash-screen";
import { useColorScheme } from "@/src/hooks/useColorScheme";
import CustomBottomTab, { TabBarProps } from "./BottomBar";
import { Ionicons } from "@expo/vector-icons";
import { RootStackParamList } from "./types/navigationTypes";

// Fonts
import fonts from "@/config/fonts";

import WelcomeScreen from "@/screens/Welcome/WelcomeScreen";
import LoginScreen from "@/screens/Login/LoginScreen";
import RegisterScreen from "@/screens/Register/RegisterScreen";
import HomeScreen from "@/screens/Home/HomeScreen";
import ProfileScreen from "@/screens/Profile/ProfileScreen";
import NotificationsScreen from "@/screens/Notifications/Notifications";
import FavoritesScreen from "@/screens/Favorites/FavoritesScreen";
import ProductDetailScreen from "@/screens/ProductDetail/ProductDetailScreen";
import CreatePostScreen from "@/screens/CreatePost/CreatePostScreen";
import MyProducts from "@/screens/MyProducts/MyProducts";
import MyTransactions from "@/screens/Transactions/MyTransactions/MyTransactions";
import ProfileDetailScreen from "@/screens/ProfileDetail/ProfileDetailScreen";
import OTPScreen from "@/screens/OTP/OTPScreen";
import MyRequestsScreen from "@/screens/Request/MyRequests/MyRequests";
import RequestSubActionScreen from "@/screens/Request/RequestSubAction/RequestSubAction";
import SearchScreen from "@/screens/Search/SearchScreen";
import SearchResultsScreen from "@/screens/Search/SearchResultsScreen";
import QRScanner from "@/components/QRScanner";
import ResultScanTransaction from "@/screens/Transactions/ResultScanTransaction/ResultScanTransaction";
import CharitarianRequestItem from "@/screens/Request/CharitarianRequestItem/CharitarianRequestItem";
import PreviewPostScreen from "@/screens/PreviewPost/PreviewPostScreen";
import { ButtonMoreActionHeader } from "@/components/ButtonMoreActionHeader";
import { setNavigationRef } from "@/stores/notificationStore";
import RequestDetail from "@/screens/Request/RequestDetail/RequestDetail";
import CampaignDetail from "@/screens/Campaign/CampaignDetail";

const Stack = createStackNavigator<RootStackParamList>();

const tabBarProps: TabBarProps[] = [
  {
    route: "Home",
    component: HomeScreen,
    tabBarLabel: "Trang chủ",
    tabBarIconProps: {
      iconType: Ionicons,
      iconName: "home",
    },
  },
  {
    route: "Favorites",
    component: FavoritesScreen,
    tabBarLabel: "Yêu thích",
    tabBarIconProps: {
      iconType: Ionicons,
      iconName: "favorite",
    },
  },
  {
    route: "Notifications",
    component: NotificationsScreen,
    tabBarLabel: "Thông báo",
    tabBarIconProps: {
      iconType: Ionicons,
      iconName: "notifications",
    },
  },
  {
    route: "Profile",
    component: ProfileScreen,
    tabBarLabel: "Cá nhân",
    tabBarIconProps: {
      iconType: Ionicons,
      iconName: "person",
    },
  },
];

export default function Navigation() {
  const colorScheme = useColorScheme();
  const [fontsLoaded] = useFonts(fonts);
  const [appIsReady, setAppIsReady] = useState(false);
  const [initialRoute, setInitialRoute] = useState<
    keyof RootStackParamList | null
  >(null);

  useEffect(() => {
    if (appIsReady && fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [appIsReady, fontsLoaded]);

  useEffect(() => {
    setInitialRoute("Main");
    setAppIsReady(true);
  }, []);

  if (!appIsReady || !fontsLoaded || !initialRoute) {
    return null;
  }

  return (
    <NavigationContainer
      ref={(ref) => setNavigationRef(ref)}
      theme={colorScheme === "dark" ? DarkTheme : DefaultTheme}
    >
      <Stack.Navigator
        initialRouteName={initialRoute}
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen name="Main">
          {() => <CustomBottomTab tabs={tabBarProps} />}
        </Stack.Screen>
        <Stack.Screen
          name="LoginScreen"
          component={LoginScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="RegisterScreen"
          component={RegisterScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="WelcomeScreen"
          component={WelcomeScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="CreatePost"
          component={CreatePostScreen}
          options={{ headerShown: false }}
        />
        {/* <Stack.Screen name="Notifications" component={NotificationsScreen} options={{ headerShown: false }} /> */}
        <Stack.Screen
          name="OTPScreen"
          component={OTPScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="SearchScreen"
          component={SearchScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="SearchResultsScreen"
          component={SearchResultsScreen}
          options={{
            headerShown: true,
            title: "Kết quả tìm kiếm",
            headerRight: () => <ButtonMoreActionHeader propNav="Home" />,
          }}
        />
        <Stack.Screen
          name="PreviewPost"
          component={PreviewPostScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="ProductDetail"
          component={ProductDetailScreen}
          options={{
            headerShown: true,
            title: "Chi tiết sản phẩm",
            headerRight: () => <ButtonMoreActionHeader propNav="Home" />,
          }}
        />
        <Stack.Screen
          name="ProfileDetail"
          component={ProfileDetailScreen}
          options={{
            headerShown: true,
            title: "Thông tin cá nhân",
            headerRight: () => <ButtonMoreActionHeader propNav="Profile" />,
          }}
        />
        <Stack.Screen
          name="MyProducts"
          component={MyProducts}
          options={{
            headerShown: true,
            title: "Sản phẩm của tôi",
            headerRight: () => <ButtonMoreActionHeader propNav="Profile" />,
          }}
        />
        <Stack.Screen
          name="MyRequests"
          component={MyRequestsScreen}
          options={{
            headerShown: true,
            title: "Quản lí các yêu cầu của tôi",
            headerRight: () => <ButtonMoreActionHeader propNav="Profile" />,
          }}
        />
        <Stack.Screen
          name="RequestSubAction"
          component={RequestSubActionScreen}
          options={{
            headerShown: true,
            title: "Quản lí các yêu cầu của tôi",
            headerRight: () => <ButtonMoreActionHeader propNav="Profile" />,
          }}
        />
        <Stack.Screen
          name="MyTransactions"
          component={MyTransactions}
          options={{
            headerShown: true,
            title: "Quản lí giao dịch của tôi",
            headerRight: () => <ButtonMoreActionHeader propNav="Profile" />,
          }}
        />
        <Stack.Screen
          name="ResultScanTransaction"
          component={ResultScanTransaction}
          options={{
            title: "Kết quả quét QR",
            headerShown: true,
            headerRight: () => <ButtonMoreActionHeader propNav="Profile" />,
          }}
        />
        <Stack.Screen
          name="QRScanner"
          component={QRScanner}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="RequestDetail"
          component={RequestDetail}
          options={{
            headerShown: true,
            title: "Chi tiết yêu cầu",
            headerRight: () => <ButtonMoreActionHeader propNav="Profile" />,
          }}
        />
        <Stack.Screen
          name="CharitarianRequestItem"
          component={CharitarianRequestItem}
          options={{
            headerShown: true,
            title: "Quản lí sản phẩm được gửi yêu cầu",
            headerRight: () => <ButtonMoreActionHeader propNav="Profile" />,
          }}
        />
        <Stack.Screen
          name="CampaignDetail"
          component={CampaignDetail}
          options={{
            headerShown: true,
            title: "Chi tiết chiến dịch",
            headerRight: () => <ButtonMoreActionHeader propNav="Home" />,
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
