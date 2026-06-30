export type UserRole = "CUSTOMER" | "VENDOR" | "ADMIN";

export type BookingType = "RENT" | "BUY" | "BOOK";

export type BookingStatus =
  | "PENDING"
  | "APPROVED"
  | "CONFIRMED"
  | "DELIVERED"
  | "RETURNED"
  | "COMPLETED"
  | "CANCELLED"
  | "REJECTED";

export type PaymentStatus = "PENDING" | "COMPLETED" | "FAILED" | "REFUNDED";

export type PaymentMethod = "ONLINE" | "CASH" | "UPI" | "CARD";

export type ProductCondition = "NEW" | "LIKE_NEW" | "GOOD" | "FAIR";

export type ProductStatus = "AVAILABLE" | "UNAVAILABLE";

export type ReturnStatus =
  | "PENDING"
  | "INSPECTING"
  | "COMPLETED"
  | "DAMAGE_REPORTED";

export interface AppUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  phone?: string;
  avatar?: string;
}

export interface AppVendor {
  id: string;
  userId: string;
  businessName: string;
  address?: string;
  phone?: string;
  description?: string;
  isVerified: boolean;
  isSuspended: boolean;
  rating: number;
  user: AppUser;
}

export interface AppCategory {
  id: string;
  name: string;
  icon: string;
  slug: string;
  _count?: { products: number };
}

export interface AppProduct {
  id: string;
  vendorId: string;
  categoryId: string;
  title: string;
  slug: string;
  description: string;
  features: string;
  buyPrice: number;
  rentPricePerDay: number;
  deposit: number;
  stock: number;
  status: ProductStatus;
  imageUrl?: string;
  condition: ProductCondition;
  vendor: { id: string; businessName: string; isVerified: boolean };
  category: { id: string; name: string; icon: string };
  _count?: { reviews: number };
  avgRating?: number;
  createdAt: string;
}

export interface AppBooking {
  id: string;
  userId: string;
  productId: string;
  bookingType: BookingType;
  startDate?: string;
  endDate?: string;
  quantity: number;
  totalPrice: number;
  depositAmount: number;
  status: BookingStatus;
  notes?: string;
  product: {
    id: string;
    title: string;
    imageUrl?: string;
    rentPricePerDay: number;
    buyPrice: number;
  };
  user?: { id: string; name: string; email: string };
  payment?: { id: string; paymentStatus: PaymentStatus; amount: number };
  review?: { id: string; rating: number; comment?: string };
  createdAt: string;
}

export interface AppReview {
  id: string;
  userId: string;
  productId: string;
  bookingId?: string;
  rating: number;
  comment?: string;
  user: { id: string; name: string; avatar?: string };
  createdAt: string;
}

export interface AIRecommendationResult {
  id: string;
  recommendation: string;
  explanation: string;
  savings?: number;
  alternatives?: string;
  createdAt: string;
}

// View types for SPA routing
export type AppView =
  | "marketplace"
  | "product-detail"
  | "customer-dashboard"
  | "vendor-dashboard"
  | "admin-dashboard"
  | "booking-detail";

export interface DashboardTab {
  customer: "overview" | "bookings" | "reviews" | "ai-history";
  vendor: "overview" | "products" | "bookings" | "add-product" | "analytics";
  admin: "overview" | "users" | "vendors" | "products" | "bookings";
}

export const BOOKING_STATUS_COLORS: Record<
  BookingStatus,
  string
> = {
  PENDING: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
  APPROVED: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  CONFIRMED: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
  DELIVERED: "bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-400",
  RETURNED: "bg-slate-100 text-slate-800 dark:bg-slate-900/30 dark:text-slate-400",
  COMPLETED: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
  CANCELLED: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  REJECTED: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
};

export const BOOKING_TYPE_COLORS: Record<BookingType, string> = {
  RENT: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  BUY: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400",
  BOOK: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
};