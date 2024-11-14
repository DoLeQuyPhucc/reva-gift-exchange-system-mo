export interface Product {
  id: string;
  name: string;
  description: string;
  category: string;
  condition: string;
  owner_id: string;
  email: string;
  profilePicture: string;
  images: string[];
  available: boolean;
  createdAt: string;
  updatedAt: string;
  itemAttributeValues: ProductAttribute[];
  quantity: number;
}

export interface ProductAttribute {
  id: string;
  productId: string;
  attributeId: string;
  value: string;
}
