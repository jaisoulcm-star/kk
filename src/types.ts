export interface Product {
  id: string;
  name: string;
  subtitle?: string;
  description: string;
  price: number;
  category:
    | "Nutrients"
    | "Fungicides"
    | "Insecticides"
    | "Seeds"
    | "Weedicides"
    | "Tissue Culture"
    | "Fertilizers"
    | "Hardware"
    | string;
  imageUrls: string[];
  isFeatured?: boolean;
  isNew?: boolean;
  isBestSeller?: boolean;
  stock: number;
  createdAt: any;
}

export interface CartItem extends Product {
  quantity: number;
}

export interface Order {
  id: string;
  customerName: string;
  email: string;
  address: string;
  phone: string;
  paymentMethod: string;
  items: CartItem[];
  totalAmount: number;
  status: "pending" | "processing" | "shipped" | "delivered" | "cancelled";
  createdAt: any;
}

export interface Review {
  id: string;
  productId: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  createdAt: any;
}

export interface FarmerListing {
  id?: string;
  productId: string;
  productName: string;
  category?: string;
  farmerName: string;
  farmerId?: string;
  phone: string;
  whatsapp?: string;
  location: string;
  pricePerUnit: number;
  unit: string;
  availableQuantity: number;
  harvestDate?: string;
  organicCertified?: boolean;
  notes?: string;
  status?: "active" | "sold" | "paused" | string;
  createdAt?: any;
}

export enum OperationType {
  CREATE = "create",
  UPDATE = "update",
  DELETE = "delete",
  LIST = "list",
  GET = "get",
  WRITE = "write",
}
