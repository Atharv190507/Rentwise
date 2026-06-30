"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Star,
  CheckCircle2,
  ShoppingCart,
  CalendarCheck,
  Tag,
  Package,
  MessageSquare,
  ShieldCheck,
  Truck,
  RotateCcw,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAppStore } from "@/stores/app-store";
import BookingDialog from "./BookingDialog";
import AIRecommendPanel from "./AIRecommendPanel";
import ProductCard, { ProductCardSkeleton } from "./ProductCard";
import type {
  AppProduct,
  AppReview,
  ProductCondition,
  BookingType,
} from "@/lib/types";

const CONDITION_LABELS: Record<ProductCondition, string> = {
  NEW: "New",
  LIKE_NEW: "Like New",
  GOOD: "Good",
  FAIR: "Fair",
};

const CONDITION_COLORS: Record<ProductCondition, string> = {
  NEW: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  LIKE_NEW: "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400",
  GOOD: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  FAIR: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
};

const BOOKING_TYPE_CONFIG: Record<
  BookingType,
  { label: string; color: string; hoverColor: string; icon: typeof ShoppingCart }
> = {
  RENT: {
    label: "Rent Now",
    color:
      "bg-emerald-600 hover:bg-emerald-700 text-white dark:bg-emerald-700 dark:hover:bg-emerald-800",
    hoverColor: "hover:border-emerald-300",
    icon: ShoppingCart,
  },
  BUY: {
    label: "Buy Now",
    color:
      "bg-violet-600 hover:bg-violet-700 text-white dark:bg-violet-700 dark:hover:bg-violet-800",
    hoverColor: "hover:border-violet-300",
    icon: ShoppingCart,
  },
  BOOK: {
    label: "Book Now",
    color:
      "bg-amber-600 hover:bg-amber-700 text-white dark:bg-amber-700 dark:hover:bg-amber-800",
    hoverColor: "hover:border-amber-300",
    icon: CalendarCheck,
  },
};

function formatINR(amount: number): string {
  return "₹" + amount.toLocaleString("en-IN");
}

export default function ProductDetailView() {
  const { selectedProductId, navigateTo, openAuthDialog, user } = useAppStore();

  const [product, setProduct] = useState<AppProduct | null>(null);
  const [reviews, setReviews] = useState<AppReview[]>([]);
  const [relatedProducts, setRelatedProducts] = useState<AppProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [bookingDialogOpen, setBookingDialogOpen] = useState(false);
  const [activeBookingType, setActiveBookingType] = useState<BookingType>("RENT");

  useEffect(() => {
    if (!selectedProductId) {
      navigateTo("marketplace");
      return;
    }

    const fetchProduct = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/products/${selectedProductId}`);
        if (res.ok) {
          const data = await res.json();
          setProduct(data);
        }
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    };

    const fetchReviews = async () => {
      try {
        const res = await fetch(
          `/api/reviews?productId=${selectedProductId}`
        );
        if (res.ok) {
          const data = await res.json();
          setReviews(Array.isArray(data) ? data : data.reviews || []);
        }
      } catch {
        // silently fail
      }
    };

    const fetchRelated = async () => {
      if (!product?.categoryId) return;
      try {
        const res = await fetch(
          `/api/products?categoryId=${product.categoryId}&limit=4&exclude=${selectedProductId}`
        );
        if (res.ok) {
          const data = await res.json();
          setRelatedProducts(data.products || data || []);
        }
      } catch {
        // silently fail
      }
    };

    fetchProduct();
    fetchReviews();

    // Fetch related after product loads
    const timer = setTimeout(fetchRelated, 500);
    return () => clearTimeout(timer);
  }, [selectedProductId, product?.categoryId, navigateTo]);

  const openBooking = (type: BookingType) => {
    if (!user) {
      openAuthDialog("login");
      return;
    }
    setActiveBookingType(type);
    setBookingDialogOpen(true);
  };

  const handleActionClick = (type: BookingType) => {
    if (!user) {
      openAuthDialog("login");
      return;
    }
    setActiveBookingType(type);
    setBookingDialogOpen(true);
  };

  const parsedFeatures = product?.features
    ? (() => {
        try {
          const parsed = JSON.parse(product.features);
          return Array.isArray(parsed) ? parsed : [];
        } catch {
          return product.features
            .split(",")
            .map((f) => f.trim())
            .filter(Boolean);
        }
      })()
    : [];

  // --- Loading Skeleton ---
  if (loading) {
    return (
      <div className="flex-1">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
          <Button variant="ghost" className="mb-6 gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Skeleton className="aspect-square rounded-2xl" />
            <div className="space-y-4">
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-6 w-1/4" />
              <Skeleton className="h-20 w-full" />
              <div className="flex gap-3">
                <Skeleton className="h-12 flex-1 rounded-lg" />
                <Skeleton className="h-12 flex-1 rounded-lg" />
                <Skeleton className="h-12 flex-1 rounded-lg" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center py-20">
        <Package className="h-16 w-16 text-muted-foreground/40 mb-4" />
        <h3 className="text-lg font-semibold mb-2">Product not found</h3>
        <Button
          variant="outline"
          className="rounded-full"
          onClick={() => navigateTo("marketplace")}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to marketplace
        </Button>
      </div>
    );
  }

  const avgRating = product.avgRating || 0;
  const reviewCount = product._count?.reviews || 0;

  return (
    <div className="flex-1">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
        {/* Back Button */}
        <Button
          variant="ghost"
          className="mb-4 gap-2 text-muted-foreground hover:text-foreground"
          onClick={() => navigateTo("marketplace")}
        >
          <ArrowLeft className="h-4 w-4" />
          Back to marketplace
        </Button>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* Main Product Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
            {/* Image */}
            <div className="relative aspect-square rounded-2xl overflow-hidden bg-muted">
              {product.imageUrl ? (
                <img
                  src={product.imageUrl}
                  alt={product.title}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="h-full w-full flex items-center justify-center">
                  <Package className="h-20 w-20 text-muted-foreground/30" />
                </div>
              )}

              {/* Condition Badge */}
              <div className="absolute top-4 right-4">
                <Badge
                  className={`backdrop-blur-sm text-sm font-medium border-0 ${CONDITION_COLORS[product.condition]}`}
                >
                  {CONDITION_LABELS[product.condition]}
                </Badge>
              </div>
            </div>

            {/* Product Info */}
            <div className="flex flex-col">
              {/* Category */}
              <div className="flex items-center gap-1.5 mb-2">
                <Tag className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  {product.category.name}
                </span>
                <ChevronRight className="h-3 w-3 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  {product.category.name}
                </span>
              </div>

              {/* Title */}
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
                {product.title}
              </h1>

              {/* Vendor */}
              <div className="flex items-center gap-2 mb-3">
                <Avatar className="h-6 w-6">
                  <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                    {product.vendor.businessName.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm text-muted-foreground">
                  {product.vendor.businessName}
                </span>
                {product.vendor.isVerified && (
                  <Badge className="bg-emerald-100 text-emerald-700 border-0 text-[10px] dark:bg-emerald-900/30 dark:text-emerald-400 gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    Verified
                  </Badge>
                )}
              </div>

              {/* Rating */}
              <div className="flex items-center gap-2 mb-4">
                {avgRating > 0 ? (
                  <>
                    <div className="flex items-center gap-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`h-4 w-4 ${
                            i < Math.round(avgRating)
                              ? "fill-amber-400 text-amber-400"
                              : "text-muted-foreground/30"
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-sm font-medium">{avgRating.toFixed(1)}</span>
                    <span className="text-sm text-muted-foreground">
                      ({reviewCount} review{reviewCount !== 1 ? "s" : ""})
                    </span>
                  </>
                ) : (
                  <span className="text-sm text-muted-foreground">
                    No reviews yet
                  </span>
                )}
              </div>

              {/* Description */}
              <p className="text-sm text-muted-foreground leading-relaxed mb-6">
                {product.description}
              </p>

              {/* Features */}
              {parsedFeatures.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm font-semibold mb-2">Features</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                    {parsedFeatures.map((feature, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-2 text-sm text-muted-foreground"
                      >
                        <div className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                        <span>{String(feature)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <Separator className="mb-6" />

              {/* Prices */}
              <div className="space-y-2 mb-6">
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-foreground">
                    {formatINR(product.rentPricePerDay)}
                  </span>
                  <span className="text-sm text-muted-foreground">/day</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Buy price:{" "}
                  <span className="font-semibold text-foreground">
                    {formatINR(product.buyPrice)}
                  </span>
                </p>
                <p className="text-xs text-muted-foreground">
                  Refundable deposit: {formatINR(product.deposit)}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 mb-6">
                {(["RENT", "BUY", "BOOK"] as BookingType[]).map((type) => {
                  const config = BOOKING_TYPE_CONFIG[type];
                  const Icon = config.icon;
                  return (
                    <Button
                      key={type}
                      size="lg"
                      className={`flex-1 gap-2 rounded-xl font-semibold ${config.color}`}
                      onClick={() => handleActionClick(type)}
                    >
                      <Icon className="h-4 w-4" />
                      {config.label}
                    </Button>
                  );
                })}
              </div>

              {/* Trust Badges */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { icon: ShieldCheck, label: "Secure Payment" },
                  { icon: Truck, label: " doorstep delivery" },
                  { icon: RotateCcw, label: "Easy Returns" },
                ].map(({ icon: Icon, label }) => (
                  <div
                    key={label}
                    className="flex flex-col items-center gap-1 text-center p-2 rounded-lg bg-muted/50"
                  >
                    <Icon className="h-4 w-4 text-muted-foreground" />
                    <span className="text-[11px] text-muted-foreground leading-tight">
                      {label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Bottom Sections */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-10">
            {/* AI Recommendation Panel */}
            <div className="lg:col-span-1">
              <AIRecommendPanel
                productTitle={product.title}
                rentPricePerDay={product.rentPricePerDay}
                buyPrice={product.buyPrice}
              />
            </div>

            {/* Reviews */}
            <div className="lg:col-span-2">
              <div className="rounded-xl border bg-card">
                <div className="px-6 py-4 border-b">
                  <h2 className="text-lg font-semibold flex items-center gap-2">
                    <MessageSquare className="h-5 w-5" />
                    Reviews ({reviewCount})
                  </h2>
                </div>
                <div className="p-6">
                  {reviews.length === 0 ? (
                    <div className="text-center py-10">
                      <MessageSquare className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                      <p className="text-sm text-muted-foreground">
                        No reviews yet. Be the first to review this product!
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4 max-h-96 overflow-y-auto">
                      {reviews.map((review) => (
                        <div
                          key={review.id}
                          className="flex gap-3 pb-4 border-b last:border-b-0 last:pb-0"
                        >
                          <Avatar className="h-8 w-8 shrink-0">
                            <AvatarFallback className="text-xs bg-primary/10 text-primary">
                              {review.user.name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm font-medium">
                                {review.user.name}
                              </span>
                              <div className="flex items-center gap-0.5">
                                {Array.from({ length: 5 }).map((_, i) => (
                                  <Star
                                    key={i}
                                    className={`h-3 w-3 ${
                                      i < review.rating
                                        ? "fill-amber-400 text-amber-400"
                                        : "text-muted-foreground/30"
                                    }`}
                                  />
                                ))}
                              </div>
                            </div>
                            {review.comment && (
                              <p className="text-sm text-muted-foreground">
                                {review.comment}
                              </p>
                            )}
                            <p className="text-xs text-muted-foreground/60 mt-1">
                              {new Date(review.createdAt).toLocaleDateString("en-IN", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              })}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Related Products */}
          {relatedProducts.length > 0 && (
            <div className="mt-10">
              <h2 className="text-lg font-semibold mb-4">Related Equipment</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {relatedProducts.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
            </div>
          )}
        </motion.div>
      </div>

      {/* Booking Dialog */}
      <BookingDialog
        open={bookingDialogOpen}
        onOpenChange={setBookingDialogOpen}
        product={product}
        bookingType={activeBookingType}
      />
    </div>
  );
}