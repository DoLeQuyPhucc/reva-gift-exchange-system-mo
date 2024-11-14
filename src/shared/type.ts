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
