// ─── User ────────────────────────────────────────────────────
export interface Address {
  id: string;
  label: string;
  street: string;
  unit?: string;
  city: string;
  state: string;
  zip: string;
  isDefault: boolean;
}

export type UserRole = "customer" | "admin";

export interface UserProfile {
  id: string;
  email: string;
  displayName: string;
  phone?: string;
  photoURL?: string;
  role: UserRole;
  addresses: Address[];
  pushTokens?: { id: string; token: string }[];
  stripeCustomerId?: string;
  notificationPreferences: NotificationPreferences;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationPreferences {
  orderUpdates: boolean;
  promotions: boolean;
  quoteResponses: boolean;
}

// ─── Product ─────────────────────────────────────────────────
export interface ProductSize {
  id: string;
  label: string;
  height: string;
  price: number;
  compareAtPrice?: number;
  stock: number;
  sku: string;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  categoryId: string;
  images: string[];
  thumbnailURL: string;
  sizes: ProductSize[];
  careInfo: CareInfo;
  tags: string[];
  featured: boolean;
  active: boolean;
  seasonalOnly: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CareInfo {
  sunlight: string;
  water: string;
  temperature: string;
  soil: string;
  tips: string[];
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  imageURL: string;
  parentId?: string;
  sortOrder: number;
  active: boolean;
}

// ─── Cart ────────────────────────────────────────────────────
export interface CartItem {
  productId: string;
  productName: string;
  productImage: string;
  sizeId: string;
  sizeLabel: string;
  price: number;
  quantity: number;
}

export interface Cart {
  id: string;
  userId: string;
  items: CartItem[];
  updatedAt: string;
}

// ─── Wishlist ────────────────────────────────────────────────
export interface WishlistItem {
  productId: string;
  productName: string;
  productImage: string;
  addedAt: string;
}

// ─── Order ───────────────────────────────────────────────────
export type OrderStatus =
  | "confirmed"
  | "preparing"
  | "in_transit"
  | "delivered"
  | "cancelled"
  | "refunded";

export interface OrderStatusEntry {
  status: OrderStatus;
  timestamp: string;
  note?: string;
}

export interface OrderItem {
  productId: string;
  productName: string;
  productImage: string;
  sizeId: string;
  sizeLabel: string;
  price: number;
  quantity: number;
}

export interface Order {
  id: string;
  userId: string;
  userEmail: string;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  deliveryFee: number;
  total: number;
  shippingAddress: Address;
  deliveryDate?: string;
  statusHistory: OrderStatusEntry[];
  currentStatus: OrderStatus;
  stripePaymentIntentId: string;
  refundId?: string;
  refundAmount?: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Quote ───────────────────────────────────────────────────
export type QuoteStatus = "pending" | "reviewed" | "estimated" | "accepted" | "declined";

export type ServiceType =
  | "landscape_design"
  | "installation"
  | "maintenance"
  | "consultation"
  | "bulk_order";

export interface Quote {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  serviceType: ServiceType;
  description: string;
  photos: string[];
  contactPreference: "email" | "phone" | "either";
  phone?: string;
  status: QuoteStatus;
  adminResponse?: string;
  estimatedPrice?: number;
  createdAt: string;
  updatedAt: string;
}

// ─── Store ───────────────────────────────────────────────────
export interface StoreHours {
  day: string;
  open: string;
  close: string;
  closed: boolean;
}

export interface StoreLocation {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  phone: string;
  latitude: number;
  longitude: number;
  hours: StoreHours[];
  imageURL?: string;
  active: boolean;
}

// ─── Notification ────────────────────────────────────────────
export type NotificationType = "order_update" | "promotion" | "quote_response" | "general";

export interface PushNotification {
  id: string;
  title: string;
  body: string;
  type: NotificationType;
  data?: Record<string, string>;
  targetUserIds?: string[];
  broadcast: boolean;
  sentAt: string;
  sentBy: string;
}

// ─── Analytics ───────────────────────────────────────────────
export interface DailyAnalytics {
  id: string;
  date: string;
  revenue: number;
  orderCount: number;
  newCustomers: number;
  topProducts: { productId: string; productName: string; quantity: number }[];
  averageOrderValue: number;
}

// ─── Payment ─────────────────────────────────────────────────
export interface CreatePaymentIntentRequest {
  items: CartItem[];
  shippingAddress: Address;
  deliveryDate?: string;
}

export interface CreatePaymentIntentResponse {
  clientSecret: string;
  paymentIntentId: string;
  amount: number;
  tax: number;
  deliveryFee: number;
}
