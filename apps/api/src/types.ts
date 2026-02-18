/** Prisma JSON column types for Order / PendingOrder */

export interface OrderItem {
  productId: string;
  productName: string;
  productImage: string;
  sizeId: string;
  sizeLabel: string;
  price: number;
  quantity: number;
}

export interface OrderStatusEntry {
  status: string;
  timestamp: string;
  note: string;
}

export interface ShippingAddress {
  street: string;
  unit?: string;
  city: string;
  state: string;
  zip: string;
}
