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
  status?: string;
}

export interface User {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  phone: string;
  role: string;
  profileURL: string;
  // products: Product[];
}

export interface Category {
  id: string;
  name: string;
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
