export interface Product {
  id: string;
  name: string;
  description: string;
  subCategory: {
    id: string;
    subCategoryName: string;
    category: {
      id: string;
      name: string;
    };
  };
  desiredSubCategory: {
    id: string;
    subCategoryName: string;
    category: {
      id: string;
      name: string;
    };
  };
  condition: string;
  isGift: boolean;
  availableTime: string;
  owner_Name: string;
  owner_id: string;
  profilePicture: string;
  available: boolean;
  createdAt: string;
  expiresAt: string;
  updatedAt: string;
  images: string[];
  video: string;
  quantity: number;
  dateRemaining: number;
  status: string;
  address?: SubInfoAddress;
}

interface SubInfoAddress {
  addressId: string;
  address: string;
  addressCoordinates: AddressCoordinates;
}

export interface User {
  id: string;
  username: string;
  email: string;
  phone: string;
  profilePicture: string;
  point?: number;
  address: AddressData;
  dateJoined?: string;

  role: string;
  fullname: string;
  dob: string | null;
  gender: string | null;
}

export interface Request {
  id: string;
  status: "Pending" | "Approved" | "Rejected";
  requestMessage: string | null;
  rejectMessage: string | null;
  note: string | null;
  createdAt: string;
  updatedAt: string;

  charitarianItem: SubInfoItem;
  charitarian: SubInfoUser;

  requester: SubInfoUser;
  requesterItem: SubInfoItem | null;

  requestImages: string[];
  appointmentDate: string[];
}

interface SubInfoUser {
  id: string;
  name: string;
  image: string;
}
interface SubInfoItem {
  itemId: string;
  itemName: string;
  itemVideo: string;
  itemImages: string[];
  itemQuantity: number;
}

export interface Transaction {
  id: string;
  status: string;
  requestId: string;
  requestNote: string | null;
  rejectMessage: string | null;

  requester: SubInfoUser;
  requesterItem: SubInfoItem | null;

  charitarian: SubInfoUser;
  charitarianItem: SubInfoItem;

  createdAt: string;
  appointmentDate: string;

  charitarianAddress: SubInfoAddress;
  charitarianPhone: string;

  requesterAddress: SubInfoAddress;
  requesterPhone: string;

  rating: number | null;
  ratingComment: string | null;
}

export interface TransactionRatingType {
  ratedUserId: string;
  transactionId: string;
  comment: string;
  rating: number;
}

export interface TransactionReportType {
  reportedId: string;
  transactionId: string;
  reasons: string[];
}

export interface Category {
  id: string;
  name: string;
  status: string;
  subCategories: SubCategory[];
}

export interface SubCategory {
  id: string;
  categoryId: string;
  subCategoryName: string;
}

export interface CategoryContextType {
  selectedCategory: Category | null;
  setSelectedCategory: (category: Category | null) => void;
}

export interface AddressCoordinates {
  latitude: string;
  longitude: string;
}

export interface AddressData {
  addressId: string;
  address: string;
  addressCoordinates: AddressCoordinates;
  isDefault: boolean;
}

export interface AddressResponse {
  isSuccess: boolean;
  code: number;
  data: AddressData[];
  message: string;
}

export interface CreatePostData {
  name: string;
  description: string;
  subCategoryId: string;
  isGift: boolean;
  quantity: number;
  condition: string;
  images: string[];
  addressId: string;
  desiredSubCategoryId: string | null;
}

export enum ItemCondition {
  NEW = "New",
  USED = "Used",
}

export interface ConditionOption {
  id: ItemCondition;
  name: string;
}

export interface LocationMap {
  latitude: number;
  longitude: number;
}

export interface Notification {
  id?: string;
  type?: string;
  data: string;
  timestamp: string | Date;
  isRead?: boolean;
  createdAt?: string | Date;
}

export interface NotificationGlobal {
  data: string;
}
