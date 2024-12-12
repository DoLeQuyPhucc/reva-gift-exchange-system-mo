import { Category, Product, SubCategory } from "@/src/shared/type";
import { SearchMode } from "@/src/utils/search";

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
    subCategory?: SubCategory;
    subCategoryId?: string;
  };
  ProductDetail: { productId: string };
  ProfileDetail: undefined;
  MyProducts: undefined;
  SearchScreen: undefined;
  SearchResultsScreen: {
    searchTerm: string;
    searchMode: SearchMode;
  };
  MyRequests: { productId: string; type: string };
  RequestsForMe: { productId: string };
  RequestSubAction: undefined;
  MyTransactions: undefined;
  ChatScreen: undefined;
  PackageScreen: undefined;
  MyPackageScreen: undefined;
  OTPScreen: {
    phoneNumber: string;
  };
  QRScanner: undefined;
  ResultScanTransaction: { transactionResult: any };
  CharitarianRequestItem: undefined;
};

export type BottomTabParamList = {
  Notifications: undefined;
  Home: undefined;
  Orders: undefined;
  Profile: undefined;
  Favorites: undefined;
  Blogs: undefined;
  Products: undefined;
  Cart: undefined;
};
