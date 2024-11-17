export interface Product {
  id: string;
  name: string;
  description: string;
  category: string;
  condition: string;
  isGift: boolean;
  point: number;
  owner_Name: string;
  owner_id: string;
  profilePicture: string;
  available: boolean;
  createdAt: string;
  expiresAt: string;
  updatedAt: string;
  images: string[];
  quantity: number;
  dateRemaining: number;
  status: string;
  availableTime: string;
}

export interface User {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  profilePicture: string;
  address: string;
  dob: string | null;
  gender: string | null;
  point?: number;
  addressCoordinates: AddressCoordinates;
  dateJoined?: string;
}

export interface Request {
  id: string;
  status: "Pending" | "Approved" | "Rejected";
  requestMessage: string;
  rejectMessage: string | null;
  createdAt: string;
  updatedAt: string;

  // Recipient details
  recipientId: string;
  recipientName: string;
  recipientImage: string;
  recipientItemId: string;
  recipientItemName: string;
  recipientItemImages: string[];
  recipientItemQuantity: number;
  recipientItemPoint: number;

  // Requester details
  requesterId: string;
  requesterName: string;
  requesterImage: string;
  requesterItemId: string | null;
  requesterItemName: string | null;
  requesterItemImages: string[];
  requesterItemQuantity: number | null;
  requesterItemPoint: number;

  // Appointment
  appointmentDate: string[];
}

export interface Transaction {
  id: string;
  status: string;
  requestId: string;
  quantity: number;

  // Sender details
  senderId: string;
  senderName: string;
  senderProfileUrl: string;
  senderItemId: string;
  senderItemName: string;
  senderItemImage: string[];
  senderItemQuantity: number;
  senderItemPoint: number;
  senderAddress: string;
  senderAddressCoordinates: AddressCoordinates;
  senderPhone: string;

  // Recipient details
  recipientId: string;
  recipientName: string;
  recipientProfileUrl: string;
  recipientItemId: string;
  recipientItemName: string;
  recipientItemImage: string[];
  recipientItemQuantity: number;
  recipientItemPoint: number;
  recipientAddress: string;
  recipientAddressCoordinates: AddressCoordinates;
  recipientPhone: string;

  // Timestamps
  createdAt: string;
  appointmentDate: string;
}

export interface Category {
  id: string;
  name: string;
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
  address: string;
  addressCoordinates: AddressCoordinates;
}

export interface AddressResponse {
  isSuccess: boolean;
  code: number;
  data: AddressData;
  message: string;
}

export interface CreatePostData {
  name: string;
  description: string;
  categoryId: string;
  isGift: boolean;
  point: number;
  quantity: number;
  condition: string;
  images: string[];
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
  title?: string;
  description?: string;
}
