import { Category, Product } from "@/src/shared/type";

export type RootStackParamList = {
  Main: {
    screen: keyof BottomTabParamList;
  };
  HomeScreen: undefined;
  LoginScreen: undefined;
  RegisterScreen: undefined;
  WelcomeScreen: undefined;
  ResultScreen: { date: string };
  AuthLoadingScreen: undefined;
  SearchResults: { query: string };
  PackageDetail: { id: string };
  CartScreen: undefined;
  ProfileScreen: undefined;
  OrderScreen: undefined;
  OrderDetail: { orderId: string };
  OrderForm: undefined;
  OrderResult: { orderData: string } | { vnpayData: string };
  AddressScreen: undefined;
  AddAddressScreen: undefined;
  FilterResults: { brandName: string };
  EditProfileScreen: undefined;
  ChangePasswordScreen: undefined;
  ListFavoriteBlogScreen: undefined;
  CreatePost: {
    category?: Category;
    categoryId?: string;
  };
  ProductDetail: { productId: string };
  ProfileDetail: undefined;
  MyProducts: undefined;
  MyRequests: undefined;
  MyTransactions: undefined;
  ChatScreen: undefined;
  PackageScreen: undefined;
  MyPackageScreen: undefined;
  OTPScreen: {
    phoneNumber: string;
    password: string;
  };
};

export type BottomTabParamList = {
  Home: undefined;
  Orders: undefined;
  Profile: undefined;
  Favorites: undefined;
  Notifications: undefined;
  Blogs: undefined;
  Products: undefined;
  Cart: undefined;
};
