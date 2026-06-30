"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  SlidersHorizontal,
  Sparkles,
  X,
  PackageOpen,
  Store,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from "@/components/ui/pagination";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { useAppStore } from "@/stores/app-store";
import ProductCard, { ProductCardSkeleton } from "./ProductCard";
import EventPlannerDialog from "./EventPlannerDialog";
import HeroSection from "./HeroSection";
import CategoriesShowcase from "./CategoriesShowcase";
import HowItWorks from "./HowItWorks";
import WhyRentWise from "./WhyRentWise";
import type { AppProduct, AppCategory, ProductCondition, BookingType } from "@/lib/types";

const ITEMS_PER_PAGE = 12;

const CONDITION_OPTIONS: { value: ProductCondition | "ALL"; label: string }[] = [
  { value: "ALL", label: "All Conditions" },
  { value: "NEW", label: "New" },
  { value: "LIKE_NEW", label: "Like New" },
  { value: "GOOD", label: "Good" },
  { value: "FAIR", label: "Fair" },
];

const SORT_OPTIONS = [
  { value: "newest", label: "Newest First" },
  { value: "price_low", label: "Price: Low to High" },
  { value: "price_high", label: "Price: High to Low" },
  { value: "rating", label: "Highest Rated" },
  { value: "popular", label: "Most Popular" },
];

export default function MarketplaceView() {
  const { navigateTo, openAuthDialog, user, token } = useAppStore();
  const isVendor = user?.role === "VENDOR";

  // Data
  const [categories, setCategories] = useState<AppCategory[]>([]);
  const [products, setProducts] = useState<AppProduct[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [categoriesLoading, setCategoriesLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [activeSearch, setActiveSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [bookingType, setBookingType] = useState<"ALL" | BookingType>("ALL");
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 50000]);
  const [condition, setCondition] = useState<ProductCondition | "ALL">("ALL");
  const [sortBy, setSortBy] = useState("newest");
  const [page, setPage] = useState(1);

  // Mobile filter sheet
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);

  // Event planner dialog
  const [eventPlannerOpen, setEventPlannerOpen] = useState(false);

  // Listen for open-event-planner events from Footer
  useEffect(() => {
    const handler = () => setEventPlannerOpen(true);
    window.addEventListener("open-event-planner", handler);
    return () => window.removeEventListener("open-event-planner", handler);
  }, []);

  // Listen for search events from Navbar / Hero
  useEffect(() => {
    const handler = (e: Event) => {
      const customEvent = e as CustomEvent<string>;
      const query = customEvent.detail;
      setActiveSearch(query);
      setSearchQuery(query);
      setPage(1);
      // Scroll to marketplace content
      const el = document.getElementById("marketplace-content");
      if (el) {
        setTimeout(() => {
          el.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 100);
      }
    };
    window.addEventListener("marketplace-search", handler);
    return () => window.removeEventListener("marketplace-search", handler);
  }, []);

  // Listen for category filter events from CategoriesShowcase
  useEffect(() => {
    const handler = (e: Event) => {
      const customEvent = e as CustomEvent<string>;
      const categoryId = customEvent.detail;
      setSelectedCategory(categoryId);
      setPage(1);
      // Scroll to marketplace content
      const el = document.getElementById("marketplace-content");
      if (el) {
        setTimeout(() => {
          el.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 100);
      }
    };
    window.addEventListener("marketplace-category-filter", handler);
    return () => window.removeEventListener("marketplace-category-filter", handler);
  }, []);

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      setCategoriesLoading(true);
      try {
        const res = await fetch("/api/categories");
        if (res.ok) {
          const data = await res.json();
          setCategories(data);
        }
      } catch {
        // Categories optional
      } finally {
        setCategoriesLoading(false);
      }
    };
    fetchCategories();
  }, []);

  // Fetch products
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      if (isVendor && token) {
        // Vendor sees only their own products
        const res = await fetch("/api/vendors/products", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          let vendorProducts: AppProduct[] = data.products || data || [];
          // Apply search filter client-side
          if (activeSearch) {
            const q = activeSearch.toLowerCase();
            vendorProducts = vendorProducts.filter((p) =>
              p.title.toLowerCase().includes(q)
            );
          }
          // Apply category filter client-side
          if (selectedCategory !== "ALL") {
            vendorProducts = vendorProducts.filter(
              (p) => p.categoryId === selectedCategory
            );
          }
          setProducts(vendorProducts);
          setTotalCount(vendorProducts.length);
        }
      } else {
        const params = new URLSearchParams();
        params.set("page", page.toString());
        params.set("limit", ITEMS_PER_PAGE.toString());
        if (activeSearch) params.set("search", activeSearch);
        if (selectedCategory !== "ALL") params.set("categoryId", selectedCategory);
        if (bookingType !== "ALL") params.set("bookingType", bookingType);
        if (condition !== "ALL") params.set("condition", condition);
        if (priceRange[0] > 0) params.set("minPrice", priceRange[0].toString());
        if (priceRange[1] < 50000) params.set("maxPrice", priceRange[1].toString());
        if (sortBy) params.set("sort", sortBy);

        const res = await fetch(`/api/products?${params.toString()}`);
        if (res.ok) {
          const data = await res.json();
          setProducts(data.products || data);
          setTotalCount(data.total || (Array.isArray(data) ? data.length : 0));
        }
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, [page, activeSearch, selectedCategory, bookingType, condition, priceRange, sortBy, isVendor, token]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setActiveSearch(searchQuery);
    setPage(1);
  };

  const clearFilters = () => {
    setSearchQuery("");
    setActiveSearch("");
    setSelectedCategory("ALL");
    setBookingType("ALL");
    setPriceRange([0, 50000]);
    setCondition("ALL");
    setSortBy("newest");
    setPage(1);
  };

  const hasActiveFilters =
    activeSearch ||
    selectedCategory !== "ALL" ||
    bookingType !== "ALL" ||
    condition !== "ALL" ||
    priceRange[0] > 0 ||
    priceRange[1] < 50000;

  // Sidebar Filters Content (shared between desktop and mobile)
  const FiltersContent = () => (
    <div className="space-y-6">
      {/* Booking Type */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Booking Type</Label>
        <div className="flex gap-2">
          {(["ALL", "RENT", "BUY", "BOOK"] as const).map((type) => (
            <Button
              key={type}
              variant={bookingType === type ? "default" : "outline"}
              size="sm"
              className="rounded-full text-xs flex-1"
              onClick={() => {
                setBookingType(type);
                setPage(1);
              }}
            >
              {type === "ALL" ? "All" : type.charAt(0) + type.slice(1).toLowerCase()}
            </Button>
          ))}
        </div>
      </div>

      <Separator />

      {/* Price Range */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">Price Range (per day)</Label>
        <Slider
          min={0}
          max={50000}
          step={500}
          value={priceRange}
          onValueChange={(val) => {
            setPriceRange(val as [number, number]);
            setPage(1);
          }}
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>\u20B9{priceRange[0].toLocaleString("en-IN")}</span>
          <span>\u20B9{priceRange[1].toLocaleString("en-IN")}</span>
        </div>
      </div>

      <Separator />

      {/* Condition */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Condition</Label>
        <Select
          value={condition}
          onValueChange={(val) => {
            setCondition(val as ProductCondition | "ALL");
            setPage(1);
          }}
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CONDITION_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Separator />

      {/* Sort By */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Sort By</Label>
        <Select
          value={sortBy}
          onValueChange={(val) => {
            setSortBy(val);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SORT_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {hasActiveFilters && (
        <>
          <Separator />
          <Button
            variant="ghost"
            size="sm"
            className="w-full text-muted-foreground"
            onClick={clearFilters}
          >
            <X className="mr-2 h-3.5 w-3.5" />
            Clear all filters
          </Button>
        </>
      )}
    </div>
  );

  return (
    <div className="flex-1">
      {/* Vendor banner instead of hero/categories for vendor users */}
      {!isVendor && <HeroSection />}

      {!isVendor && <CategoriesShowcase />}

      {isVendor && (
        <div className="bg-primary/5 border-b">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Store className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-foreground">Showing your equipment</h2>
                <p className="text-sm text-muted-foreground">Manage and view all products you&apos;ve listed</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. Marketplace Content */}
      <div id="marketplace-content" className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        {/* Section Header + AI Event Planner */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-foreground">
                {isVendor ? "My Equipment" : "All Equipment"}
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                {isVendor
                  ? "Manage and monitor your listed equipment"
                  : "Rent, buy, or book from verified vendors across India"}
              </p>
            </div>
            {!isVendor && (
              <Button
                onClick={() => setEventPlannerOpen(true)}
                className="gap-2 rounded-full self-start sm:self-auto"
              >
                <Sparkles className="h-4 w-4" />
                AI Event Planner
              </Button>
            )}
          </div>
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearchSubmit} className="mb-5">
          <div className="relative max-w-2xl mx-auto">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search for equipment, tools, electronics..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 pr-20 h-12 rounded-full bg-card border shadow-sm text-base"
            />
            <Button
              type="submit"
              size="sm"
              className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-full"
            >
              Search
            </Button>
          </div>
        </form>

        {/* Category Pills */}
        {!categoriesLoading && categories.length > 0 && (
          <div className="mb-6">
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
              <button
                onClick={() => {
                  setSelectedCategory("ALL");
                  setPage(1);
                }}
                className="shrink-0"
              >
                <Badge
                  variant={selectedCategory === "ALL" ? "default" : "outline"}
                  className="rounded-full px-4 py-1.5 text-sm cursor-pointer transition-premium"
                >
                  All
                </Badge>
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => {
                    setSelectedCategory(cat.id);
                    setPage(1);
                  }}
                  className="shrink-0"
                >
                  <Badge
                    variant={selectedCategory === cat.id ? "default" : "outline"}
                    className="rounded-full px-4 py-1.5 text-sm cursor-pointer transition-premium"
                  >
                    {cat.icon && <span className="mr-1">{cat.icon}</span>}
                    {cat.name}
                    {cat._count?.products != null && (
                      <span className="ml-1.5 text-[10px] opacity-70">
                        {cat._count.products}
                      </span>
                    )}
                  </Badge>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Mobile Filter Button */}
        <div className="flex items-center justify-between mb-4 lg:hidden">
          <p className="text-sm text-muted-foreground">
            {totalCount > 0
              ? `${totalCount} equipment found`
              : "No equipment found"}
          </p>
          <Sheet open={filterSheetOpen} onOpenChange={setFilterSheetOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2 rounded-full">
                <SlidersHorizontal className="h-4 w-4" />
                Filters
                {hasActiveFilters && (
                  <span className="h-2 w-2 rounded-full bg-primary" />
                )}
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="h-[80vh] rounded-t-2xl">
              <SheetHeader>
                <SheetTitle>Filters</SheetTitle>
              </SheetHeader>
              <div className="mt-4 overflow-y-auto max-h-[60vh]">
                <FiltersContent />
              </div>
            </SheetContent>
          </Sheet>
        </div>

        {/* Main Layout */}
        <div className="flex gap-6">
          {/* Desktop Sidebar */}
          <aside className="hidden lg:block w-64 shrink-0">
            <div className="sticky top-20">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-foreground">Filters</h3>
                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    className="text-xs text-muted-foreground hover:text-foreground transition-premium"
                  >
                    Clear all
                  </button>
                )}
              </div>
              <div className="rounded-xl border bg-card p-4">
                <FiltersContent />
              </div>
            </div>
          </aside>

          {/* Product Grid */}
          <main className="flex-1 min-w-0">
            {/* Active filter tags */}
            {hasActiveFilters && (
              <div className="flex flex-wrap gap-2 mb-4">
                {activeSearch && (
                  <Badge variant="secondary" className="rounded-full gap-1">
                    &ldquo;{activeSearch}&rdquo;
                    <button onClick={() => { setSearchQuery(""); setActiveSearch(""); setPage(1); }}>
                      <X className="h-3 w-3 ml-1" />
                    </button>
                  </Badge>
                )}
                {selectedCategory !== "ALL" && (
                  <Badge variant="secondary" className="rounded-full gap-1">
                    {categories.find((c) => c.id === selectedCategory)?.name || "Category"}
                    <button onClick={() => { setSelectedCategory("ALL"); setPage(1); }}>
                      <X className="h-3 w-3 ml-1" />
                    </button>
                  </Badge>
                )}
                {bookingType !== "ALL" && (
                  <Badge variant="secondary" className="rounded-full gap-1">
                    {bookingType}
                    <button onClick={() => { setBookingType("ALL"); setPage(1); }}>
                      <X className="h-3 w-3 ml-1" />
                    </button>
                  </Badge>
                )}
                {condition !== "ALL" && (
                  <Badge variant="secondary" className="rounded-full gap-1">
                    {condition.replace("_", " ")}
                    <button onClick={() => { setCondition("ALL"); setPage(1); }}>
                      <X className="h-3 w-3 ml-1" />
                    </button>
                  </Badge>
                )}
              </div>
            )}

            {/* Desktop result count */}
            <div className="hidden lg:flex items-center justify-between mb-4">
              <p className="text-sm text-muted-foreground">
                {loading ? "Loading..." : `${totalCount} equipment found`}
              </p>
            </div>

            {/* Loading State */}
            {loading && (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <ProductCardSkeleton key={i} />
                ))}
              </div>
            )}

            {/* Empty State */}
            {!loading && products.length === 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center justify-center py-20 text-center"
              >
                <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center mb-4">
                  <PackageOpen className="h-10 w-10 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-1">
                  No equipment found
                </h3>
                <p className="text-sm text-muted-foreground mb-4 max-w-sm">
                  Try adjusting your search or filters to find what you&apos;re
                  looking for.
                </p>
                <Button variant="outline" className="rounded-full" onClick={clearFilters}>
                  Clear all filters
                </Button>
              </motion.div>
            )}

            {/* Product Grid */}
            {!loading && products.length > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4"
              >
                <AnimatePresence mode="popLayout">
                  {products.map((product) => (
                    <motion.div
                      key={product.id}
                      layout
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                    >
                      <ProductCard product={product} />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </motion.div>
            )}

            {/* Pagination */}
            {!loading && totalPages > 1 && (
              <div className="mt-8">
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          if (page > 1) setPage(page - 1);
                        }}
                        className={page <= 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                      />
                    </PaginationItem>

                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter((p) => {
                        if (totalPages <= 7) return true;
                        if (p === 1 || p === totalPages) return true;
                        if (Math.abs(p - page) <= 1) return true;
                        return false;
                      })
                      .map((p, idx, arr) => {
                        const prev = arr[idx - 1];
                        const showEllipsis = prev != null && p - prev > 1;
                        return (
                          <span key={p} className="contents">
                            {showEllipsis && (
                              <PaginationItem>
                                <PaginationEllipsis />
                              </PaginationItem>
                            )}
                            <PaginationItem>
                              <PaginationLink
                                href="#"
                                isActive={p === page}
                                onClick={(e) => {
                                  e.preventDefault();
                                  setPage(p);
                                }}
                                className="cursor-pointer"
                              >
                                {p}
                              </PaginationLink>
                            </PaginationItem>
                          </span>
                        );
                      })}

                    <PaginationItem>
                      <PaginationNext
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          if (page < totalPages) setPage(page + 1);
                        }}
                        className={page >= totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            )}
          </main>
        </div>
      </div>

      {/* 4. How It Works */}
      {!isVendor && <HowItWorks />}

      {/* 5. Why RentWise */}
      {!isVendor && <WhyRentWise />}

      {/* Event Planner Dialog */}
      <EventPlannerDialog open={eventPlannerOpen} onOpenChange={setEventPlannerOpen} />
    </div>
  );
}