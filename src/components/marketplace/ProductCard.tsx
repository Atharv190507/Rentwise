"use client";

import { Star, CheckCircle2, ShoppingCart, Tag, Package } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useAppStore } from "@/stores/app-store";
import type { AppProduct, ProductCondition } from "@/lib/types";

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

function formatINR(amount: number): string {
  return "₹" + amount.toLocaleString("en-IN");
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-1">
      <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
      <span className="text-sm font-medium">{rating.toFixed(1)}</span>
    </div>
  );
}

export function ProductCardSkeleton() {
  return (
    <Card className="overflow-hidden">
      <Skeleton className="aspect-[4/3] w-full" />
      <CardContent className="p-4 space-y-3">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
        <div className="flex gap-2">
          <Skeleton className="h-5 w-14 rounded-full" />
          <Skeleton className="h-5 w-14 rounded-full" />
        </div>
        <div className="flex justify-between items-center pt-1">
          <Skeleton className="h-5 w-20" />
          <Skeleton className="h-4 w-16" />
        </div>
      </CardContent>
    </Card>
  );
}

interface ProductCardProps {
  product: AppProduct;
}

export default function ProductCard({ product }: ProductCardProps) {
  const { navigateTo, openAuthDialog, user } = useAppStore();

  // Get primary image from images array or fallback to imageUrl
  const primaryImage = (() => {
    if (product.images) {
      try {
        const parsed = JSON.parse(product.images);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed[0];
      } catch { /* ignore */ }
    }
    return product.imageUrl || null;
  })();
  const imageCount = (() => {
    if (product.images) {
      try {
        const parsed = JSON.parse(product.images);
        if (Array.isArray(parsed)) return parsed.length;
      } catch { /* ignore */ }
    }
    return 0;
  })();

  const handleClick = () => {
    navigateTo("product-detail", product.id);
  };

  return (
    <Card
      className="card-hover overflow-hidden cursor-pointer group active:scale-[0.98] transition-transform"
      onClick={handleClick}
    >
      {/* Image */}
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        {primaryImage ? (
          <img
            src={primaryImage}
            alt={product.title}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <Package className="h-12 w-12 text-muted-foreground/40" />
          </div>
        )}

        {/* Verified Badge */}
        {product.vendor.isVerified && (
          <div className="absolute top-2 left-2">
            <Badge className="bg-white/90 text-emerald-700 border-0 backdrop-blur-sm gap-1 text-[10px] font-medium dark:bg-black/60 dark:text-emerald-400">
              <CheckCircle2 className="h-3 w-3" />
              Verified
            </Badge>
          </div>
        )}

        {/* Image count badge */}
        {imageCount > 1 && (
          <div className="absolute bottom-2 right-2">
            <Badge className="bg-black/60 text-white border-0 backdrop-blur-sm gap-1 text-[10px] font-medium">
              {imageCount} photos
            </Badge>
          </div>
        )}

        {/* Condition Badge */}
        <div className="absolute top-2 right-2">
          <Badge
            className={`border-0 backdrop-blur-sm text-[10px] font-medium ${CONDITION_COLORS[product.condition]}`}
          >
            {CONDITION_LABELS[product.condition]}
          </Badge>
        </div>
      </div>

      <CardContent className="p-4 space-y-2.5">
        {/* Category */}
        <div className="flex items-center gap-1.5">
          <Tag className="h-3 w-3 text-muted-foreground" />
          <span className="text-xs text-muted-foreground truncate">
            {product.category.name}
          </span>
        </div>

        {/* Title */}
        <h3 className="font-semibold text-sm leading-snug line-clamp-2 group-hover:text-primary transition-premium">
          {product.title}
        </h3>

        {/* Vendor */}
        <p className="text-xs text-muted-foreground flex items-center gap-1">
          {product.vendor.businessName}
        </p>

        {/* Rating */}
        {product.avgRating != null && product.avgRating > 0 && (
          <div className="flex items-center gap-1.5">
            <StarRating rating={product.avgRating} />
            {product._count?.reviews != null && (
              <span className="text-xs text-muted-foreground">
                ({product._count.reviews})
              </span>
            )}
          </div>
        )}

        {/* Booking Type Badges - Hidden for Vendors */}
        {user?.role !== "VENDOR" ? (
          <div className="flex gap-1.5">
            <Badge className="bg-emerald-100 text-emerald-700 border-0 text-[10px] dark:bg-emerald-900/30 dark:text-emerald-400">
              Rent
            </Badge>
            <Badge className="bg-violet-100 text-violet-700 border-0 text-[10px] dark:bg-violet-900/30 dark:text-violet-400">
              Buy
            </Badge>
          </div>
        ) : null}

        {/* Prices */}
        <div className="flex items-end justify-between pt-1">
          <div>
            <p className="text-lg font-bold text-foreground">
              {formatINR(product.rentPricePerDay)}
              <span className="text-xs font-normal text-muted-foreground">
                /day
              </span>
            </p>
            <p className="text-xs text-muted-foreground">
              Buy: {formatINR(product.buyPrice)}
            </p>
          </div>
          {user?.role === "VENDOR" ? (
            <span className="text-xs text-muted-foreground">{product.stock} in stock</span>
          ) : (
            <ShoppingCart className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-premium" />
          )}
        </div>
      </CardContent>
    </Card>
  );
}