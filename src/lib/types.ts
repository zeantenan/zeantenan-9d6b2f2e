export type OrderStatus =
  | "menunggu_pembayaran"
  | "menunggu_verifikasi"
  | "terverifikasi"
  | "diproses"
  | "dikemas"
  | "dikirim"
  | "dalam_perjalanan"
  | "selesai"
  | "dibatalkan"
  | "ditolak";

export type PaymentStatus = "menunggu" | "diverifikasi" | "ditolak";

export interface ProductImage {
  url: string;
  alt?: string | null;
  sort_order?: number;
}

export interface ProductCategory {
  name: string;
  slug: string;
}

export interface ProductListItem {
  id: string;
  name: string;
  slug: string;
  price: number;
  discount_price: number | null;
  short_description: string | null;
  product_images: ProductImage[];
  categories: ProductCategory | null;
}

export interface ProductVariant {
  id: string;
  sku: string | null;
  size: string | null;
  color: string | null;
  stock: number;
  min_stock: number;
  price_override: number | null;
  is_active: boolean;
}

export interface ProductDetail {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  short_description: string | null;
  specification: string | null;
  price: number;
  discount_price: number | null;
  weight_gram: number;
  seo_title: string | null;
  seo_description: string | null;
  product_images: (ProductImage & { sort_order: number })[];
  product_variants: ProductVariant[];
  categories: ProductCategory | null;
}

export interface RelatedProduct {
  id: string;
  name: string;
  slug: string;
  price: number;
  discount_price: number | null;
  product_images: { url: string }[];
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
}

export interface CartItemProduct {
  id: string;
  name: string;
  slug: string;
  price: number;
  discount_price: number | null;
  product_images: ProductImage[];
}

export interface CartItemVariant {
  id: string;
  size: string | null;
  color: string | null;
  stock: number;
  price_override: number | null;
}

export interface CartItem {
  id: string;
  quantity: number;
  product_id: string;
  variant_id: string | null;
  products: CartItemProduct | null;
  product_variants: CartItemVariant | null;
}

export interface Cart {
  id: string;
  voucher_code: string | null;
  notes: string | null;
}

export interface CartData {
  cart: Cart | null;
  items: CartItem[];
}

export interface Profile {
  id: string;
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  created_at: string;
}

export interface Address {
  id: string;
  user_id: string;
  label: string | null;
  recipient_name: string;
  phone: string;
  province: string;
  city: string;
  district: string;
  village: string | null;
  postal_code: string;
  full_address: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface AddressForm {
  label?: string | null;
  recipient_name: string;
  phone: string;
  province: string;
  city: string;
  district: string;
  village?: string | null;
  postal_code: string;
  full_address: string;
  is_default?: boolean;
}

export interface OrderListItem {
  id: string;
  order_number: string;
  status: OrderStatus;
  total: number;
  created_at: string;
  payment_deadline: string | null;
}

export interface OrderDetail {
  id: string;
  order_number: string;
  user_id: string;
  status: OrderStatus;
  subtotal: number;
  shipping_cost: number;
  discount: number;
  total: number;
  voucher_code: string | null;
  recipient_name: string;
  recipient_phone: string;
  ship_province: string;
  ship_city: string;
  ship_district: string;
  ship_village: string | null;
  ship_postal_code: string;
  ship_full_address: string;
  courier: string;
  courier_service: string;
  notes: string | null;
  bank_name: string | null;
  payment_deadline: string | null;
  paid_at: string | null;
  tracking_number: string | null;
  cancelled_reason: string | null;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string | null;
  variant_id: string | null;
  product_name: string;
  variant_label: string | null;
  image_url: string | null;
  unit_price: number;
  quantity: number;
  subtotal: number;
  created_at: string;
}

export interface OrderHistoryItem {
  id: string;
  order_id: string;
  status: OrderStatus;
  notes: string | null;
  changed_by: string | null;
  created_at: string;
}

export interface PaymentProof {
  id: string;
  order_id: string;
  file_path: string;
  bank_name: string | null;
  sender_name: string | null;
  amount: number | null;
  transferred_at: string | null;
  status: PaymentStatus;
  rejection_reason: string | null;
  verified_at: string | null;
  verified_by: string | null;
  created_at: string;
}

export interface OrderDetailData {
  order: OrderDetail;
  items: OrderItem[];
  history: OrderHistoryItem[];
  proofs: PaymentProof[];
}
