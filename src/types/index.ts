export type ProductType = "digital" | "physical";
export type OrderStatus =
  | "pending" | "paid" | "processing" | "shipped" | "completed" | "cancelled" | "refunded";
export type UserRole = "customer" | "admin" | "super_admin";

export interface Category {
  id: string;
  parent_id: string | null;
  name: string;
  slug: string;
  icon: string | null;
  image_url: string | null;
  sort_order: number;
  is_active: boolean;
}

export interface Product {
  id: string;
  category_id: string | null;
  type: ProductType;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  discount_percent: number;
  stock: number | null;
  cover_image: string | null;
  gallery: string[];
  video_url: string | null;
  tags: string[];
  rating_avg: number;
  rating_count: number;
  sold_count: number;
  status: "draft" | "published" | "archived";
}

export interface Banner {
  id: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  media_url: string;
  media_type: "image" | "video";
  button_label: string | null;
  link_url: string | null;
  priority: number;
  start_at: string;
  end_at: string | null;
  is_published: boolean;
}

export interface Profile {
  id: string;
  username: string;
  email: string;
  avatar_url: string | null;
  role: UserRole;
  balance: number;
  coin: number;
  referral_code: string;
  checkin_streak: number;
}

export interface CartItem {
  product: Product;
  quantity: number;
}
