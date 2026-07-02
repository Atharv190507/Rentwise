"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import {
  Package,
  Calendar,
  DollarSign,
  Store,
  BarChart3,
  Star,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  Plus,
  Eye,
  Sparkles,
  Users,
  Loader2,
  AlertCircle,
  Image as ImageIcon,
  X,
  ArrowLeft,
  Pencil,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useAppStore } from "@/stores/app-store";
import type {
  AppProduct,
  AppBooking,
  ProductCondition,
  BookingStatus,
} from "@/lib/types";
import { BOOKING_STATUS_COLORS, BOOKING_TYPE_COLORS } from "@/lib/types";

const tabAnimation = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -12 },
  transition: { duration: 0.25, ease: "easeOut" },
};

function formatINR(amount: number) {
  return `₹${amount.toLocaleString("en-IN")}`;
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

// --- Skeletons ---

function VendorOverviewSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {[...Array(5)].map((_, i) => (
          <Card key={i} className="p-4">
            <div className="flex items-center gap-4">
              <Skeleton className="h-10 w-10 rounded-lg" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-5 w-16" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
          </Card>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-3"><Skeleton className="h-5 w-36" /></CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3"><Skeleton className="h-5 w-36" /></CardHeader>
          <CardContent><Skeleton className="h-[200px] w-full" /></CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader className="pb-3"><Skeleton className="h-5 w-36" /></CardHeader>
        <CardContent><Skeleton className="h-[250px] w-full" /></CardContent>
      </Card>
    </div>
  );
}

function ProductsGridSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {[...Array(6)].map((_, i) => (
        <Card key={i}>
          <Skeleton className="h-40 w-full rounded-t-lg" />
          <CardContent className="p-4 space-y-2">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <div className="flex gap-2">
              <Skeleton className="h-6 w-16" />
              <Skeleton className="h-6 w-16" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function VendorBookingsSkeleton() {
  return (
    <div className="space-y-3">
      {[...Array(5)].map((_, i) => (
        <Card key={i}>
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-3 w-56" />
              </div>
              <Skeleton className="h-8 w-20" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// --- Overview Tab ---

interface VendorDashboardData {
  totalProducts: number;
  activeBookings: number;
  pendingApprovals: number;
  completedOrders: number;
  totalRevenue: number;
  recentBookings: AppBooking[];
  topProducts: Array<{ name: string; bookingCount: number }>;
  monthlyRevenue: Array<{ month: string; revenue: number }>;
}

function VendorOverviewTab({ data }: { data: VendorDashboardData | null }) {
  if (!data) return <VendorOverviewSkeleton />;

  const statCards = [
    { icon: <Package className="h-5 w-5" />, value: data.totalProducts, label: "Total Products", color: "text-primary", bg: "bg-primary/10" },
    { icon: <Calendar className="h-5 w-5" />, value: data.activeBookings, label: "Active Bookings", color: "text-emerald-600", bg: "bg-emerald-100 dark:bg-emerald-900/30" },
    { icon: <Clock className="h-5 w-5" />, value: data.pendingApprovals, label: "Pending Approvals", color: "text-amber-600", bg: "bg-amber-100 dark:bg-amber-900/30" },
    { icon: <CheckCircle className="h-5 w-5" />, value: data.completedOrders, label: "Completed Orders", color: "text-violet-600", bg: "bg-violet-100 dark:bg-violet-900/30" },
    { icon: <DollarSign className="h-5 w-5" />, value: formatINR(data.totalRevenue), label: "Total Revenue", color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-100 dark:bg-emerald-900/30" },
  ];

  return (
    <motion.div {...tabAnimation} className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {statCards.map((card, i) => (
          <Card key={i} className="p-4 card-hover">
            <div className="flex items-center gap-4">
              <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${card.bg} ${card.color}`}>
                {card.icon}
              </div>
              <div>
                <p className="text-2xl font-bold leading-tight">{card.value}</p>
                <p className="text-xs text-muted-foreground">{card.label}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Bookings */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Recent Bookings</CardTitle>
          </CardHeader>
          <CardContent>
            {data.recentBookings.length === 0 ? (
              <p className="text-sm text-muted-foreground py-6 text-center">No bookings yet</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Customer</TableHead>
                      <TableHead>Product</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.recentBookings.map((b) => (
                      <TableRow key={b.id}>
                        <TableCell className="font-medium text-sm">{b.user?.name || "—"}</TableCell>
                        <TableCell className="text-sm max-w-[140px] truncate">{b.product?.title || "—"}</TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-medium ${BOOKING_STATUS_COLORS[b.status]}`}>
                            {b.status}
                          </span>
                        </TableCell>
                        <TableCell className="text-right font-medium text-sm">{formatINR(b.totalPrice)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Products */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Top Products</CardTitle>
          </CardHeader>
          <CardContent>
            {data.topProducts.length === 0 ? (
              <p className="text-sm text-muted-foreground py-6 text-center">No product data yet</p>
            ) : (
              <div className="space-y-3">
                {data.topProducts.map((p, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold">
                        {i + 1}
                      </span>
                      <span className="text-sm font-medium truncate max-w-[200px]">{p.name}</span>
                    </div>
                    <span className="text-sm text-muted-foreground">{p.bookingCount} bookings</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Monthly Revenue Chart */}
      {data.monthlyRevenue.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Monthly Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.monthlyRevenue}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} className="fill-muted-foreground" />
                  <YAxis tick={{ fontSize: 12 }} className="fill-muted-foreground" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--popover)",
                      border: "1px solid var(--border)",
                      borderRadius: "var(--radius)",
                      color: "var(--popover-foreground)",
                    }}
                    formatter={(value: number) => [formatINR(value), "Revenue"]}
                  />
                  <Bar dataKey="revenue" fill="var(--primary)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}
    </motion.div>
  );
}

// --- Products Tab ---

function VendorProductsTab({ products, loading, onAddProduct, onEditProduct, onToggleStatus, onDeleteProduct }: {
  products: AppProduct[] | null;
  loading: boolean;
  onAddProduct: () => void;
  onEditProduct: (product: AppProduct) => void;
  onToggleStatus: (product: AppProduct) => void;
  onDeleteProduct: (product: AppProduct) => void;
}) {
  if (loading) return <ProductsGridSkeleton />;

  if (!products || products.length === 0) {
    return (
      <motion.div {...tabAnimation} className="space-y-4">
        <div className="flex justify-end">
          <Button onClick={onAddProduct} size="sm">
            <Plus className="h-4 w-4 mr-1.5" />
            Add Product
          </Button>
        </div>
        <Card>
          <CardContent className="py-12 text-center">
            <Package className="h-10 w-10 mx-auto text-muted-foreground/40 mb-3" />
            <p className="text-sm text-muted-foreground">No products yet</p>
            <Button variant="outline" size="sm" onClick={onAddProduct} className="mt-3">
              <Plus className="h-4 w-4 mr-1.5" />
              Add Your First Product
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div {...tabAnimation} className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={onAddProduct} size="sm">
          <Plus className="h-4 w-4 mr-1.5" />
          Add Product
        </Button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {products.map((p) => (
          <Card key={p.id} className="overflow-hidden card-hover">
            <div className="h-40 bg-muted relative">
              {(() => {
                let imgSrc = p.imageUrl || null;
                if (p.images) {
                  try {
                    const parsed = JSON.parse(p.images);
                    if (Array.isArray(parsed) && parsed.length > 0) imgSrc = parsed[0];
                  } catch { /* ignore */ }
                }
                return imgSrc ? (
                  <img src={imgSrc} alt={p.title} className="h-full w-full object-cover" />
                ) : (
                  <div className="h-full w-full flex items-center justify-center">
                    <ImageIcon className="h-10 w-10 text-muted-foreground/30" />
                  </div>
                );
              })()}
              <button
                onClick={() => onToggleStatus(p)}
                className={`absolute top-2 right-2 text-[10px] cursor-pointer ${
                  p.status === "AVAILABLE"
                    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400"
                    : "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400"
                }`}
              >
                <Badge
                  className={`text-[10px] cursor-pointer ${
                    p.status === "AVAILABLE"
                      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400"
                      : "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400"
                  }`}
                >
                  {p.status}
                </Badge>
              </button>
            </div>
            <CardContent className="p-4 space-y-2">
              <h3 className="font-semibold text-sm truncate">{p.title}</h3>
              <p className="text-xs text-muted-foreground">{p.category?.name || "Uncategorized"}</p>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Package className="h-3 w-3" /> Stock: {p.stock}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" /> {p._count?.reviews || 0} reviews
                </span>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">{formatINR(p.rentPricePerDay)}</span>
                  <span className="text-muted-foreground">/day</span>
                </div>
                <div className="flex items-center gap-1">
                  <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                  <span className="text-xs font-medium">{p.avgRating?.toFixed(1) || "—"} </span>
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 h-8 text-xs gap-1"
                  onClick={() => onEditProduct(p)}
                >
                  <Pencil className="h-3.5 w-3.5" />
                  Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 h-8 text-xs gap-1 text-red-600 border-red-200 hover:bg-red-50 dark:text-red-400 dark:border-red-800 dark:hover:bg-red-900/20"
                  onClick={() => onDeleteProduct(p)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </motion.div>
  );
}

// --- Add Product Tab ---

interface ProductFormData {
  title: string;
  categoryId: string;
  description: string;
  features: string;
  buyPrice: string;
  rentPricePerDay: string;
  deposit: string;
  stock: string;
  condition: string;
  listingTypes: string;
  location: string;
}

function AddProductTab({
  categories,
  onSubmitted,
  editingProduct,
}: {
  categories: Array<{ id: string; name: string }> | null;
  onSubmitted: () => void;
  editingProduct?: AppProduct | null;
}) {
  const { token } = useAppStore();
  const [aiLoading, setAiLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);

  const isEditing = !!editingProduct;

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<ProductFormData>();

  const title = watch("title");

  useEffect(() => {
    if (!editingProduct) return;

    reset({
      title: editingProduct.title,
      categoryId: editingProduct.categoryId,
      description: editingProduct.description,
      buyPrice: editingProduct.buyPrice.toString(),
      rentPricePerDay: editingProduct.rentPricePerDay.toString(),
      deposit: editingProduct.deposit.toString(),
      stock: editingProduct.stock.toString(),
      condition: editingProduct.condition,
      listingTypes: editingProduct.listingTypes || "RENT,BOOK",
      location: editingProduct.location || "",
    });

    try {
      const parsed = JSON.parse(editingProduct.features);
      setValue(
        "features",
        Array.isArray(parsed) ? parsed.join(", ") : editingProduct.features
      );
    } catch {
      setValue("features", editingProduct.features);
    }

    if (editingProduct.images) {
      try {
        const parsed = JSON.parse(editingProduct.images);
        if (Array.isArray(parsed)) setUploadedImages(parsed);
      } catch {
        if (editingProduct.imageUrl) setUploadedImages([editingProduct.imageUrl]);
      }
    } else if (editingProduct.imageUrl) {
      setUploadedImages([editingProduct.imageUrl]);
    }
  }, [editingProduct, reset, setValue]);

  const handleAIGenerate = async () => {
    if (!title?.trim() || !token) return;

    setAiLoading(true);

    try {
      const res = await fetch("/api/ai/description", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ productName: title }),
      });

      if (!res.ok) throw new Error("AI generation failed");

      const data = await res.json();

      if (data.title) setValue("title", data.title);
      if (data.description) setValue("description", data.description);

      if (data.features) {
        setValue(
          "features",
          Array.isArray(data.features) ? data.features.join(", ") : data.features
        );
      }

      toast.success("AI generated your product content");
    } catch {
      toast.error("Failed to generate AI description");
    } finally {
      setAiLoading(false);
    }
  };

  const handleImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const remaining = 6 - uploadedImages.length;

    if (remaining <= 0) {
      toast.error("Maximum 6 images allowed");
      return;
    }

    const filesToUpload = Array.from(files).slice(0, remaining);
    setUploading(true);

    try {
      const formData = new FormData();
      filesToUpload.forEach((file) => formData.append("images", file));

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Upload failed");
      }

      setUploadedImages((previous) => [...previous, ...data.urls]);

      toast.success(
        `${data.urls.length} image${data.urls.length > 1 ? "s" : ""} uploaded`
      );
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Upload failed");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const removeImage = (index: number) => {
    setUploadedImages((previous) =>
      previous.filter((_, imageIndex) => imageIndex !== index)
    );
  };

  const onSubmit = async (formData: ProductFormData) => {
    if (!token) return;

    setSubmitting(true);

    try {
      const payload = {
        ...formData,
        images:
          uploadedImages.length > 0 ? JSON.stringify(uploadedImages) : null,
        buyPrice: Number(formData.buyPrice),
        rentPricePerDay: Number(formData.rentPricePerDay),
        deposit: Number(formData.deposit),
        stock: Number(formData.stock),
        listingTypes: formData.listingTypes || "RENT,BOOK",
        location: formData.location || null,
      };

      const url = isEditing
        ? `/api/vendors/products/${editingProduct.id}`
        : "/api/vendors/products";

      const res = await fetch(url, {
        method: isEditing ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error(
          isEditing ? "Failed to update product" : "Failed to add product"
        );
      }

      toast.success(
        isEditing ? "Product updated successfully!" : "Product added successfully!"
      );

      reset();
      setValue("listingTypes", "RENT,BOOK");
      setUploadedImages([]);
      onSubmitted();
    } catch {
      toast.error(isEditing ? "Failed to update product" : "Failed to add product");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <motion.div {...tabAnimation} className="w-full">
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <Card className="w-full border-border/70 shadow-sm">
          <CardHeader className="border-b bg-muted/20 px-5 py-5 sm:px-7">
            <CardTitle className="text-xl">
              {isEditing ? "Edit Product Listing" : "Create a Product Listing"}
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Add accurate details so customers can confidently rent, book, or buy.
            </p>
          </CardHeader>

          <CardContent className="p-5 sm:p-7">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-7">
              <section className="space-y-5">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                    1
                  </div>
                  <div>
                    <h3 className="font-semibold">Product details</h3>
                    <p className="text-xs text-muted-foreground">
                      Tell customers what you are listing.
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="title">Product Title</Label>

                  <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
                    <Input
                      id="title"
                      placeholder="e.g. Canon EOS R5 Camera"
                      {...register("title", { required: "Title is required" })}
                      className="h-11"
                    />

                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleAIGenerate}
                      disabled={aiLoading || !title?.trim()}
                      className="h-11 border-primary/30 bg-primary/5 px-4 text-primary hover:bg-primary/10"
                    >
                      {aiLoading ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Sparkles className="mr-2 h-4 w-4" />
                      )}
                      Generate with AI
                    </Button>
                  </div>

                  {errors.title && (
                    <p className="text-xs text-destructive">{errors.title.message}</p>
                  )}
                </div>

                <div className="grid gap-5 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Category</Label>
                    <Select
                      value={watch("categoryId") || ""}
                      onValueChange={(value) => setValue("categoryId", value)}
                    >
                      <SelectTrigger className="h-11 w-full">
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories?.map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <input
                      type="hidden"
                      {...register("categoryId", {
                        required: "Category is required",
                      })}
                    />

                    {errors.categoryId && (
                      <p className="text-xs text-destructive">
                        {errors.categoryId.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>Condition</Label>
                    <Select
                      value={watch("condition") || ""}
                      onValueChange={(value) => setValue("condition", value)}
                    >
                      <SelectTrigger className="h-11 w-full">
                        <SelectValue placeholder="Select condition" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="NEW">New</SelectItem>
                        <SelectItem value="LIKE_NEW">Like New</SelectItem>
                        <SelectItem value="GOOD">Good</SelectItem>
                        <SelectItem value="FAIR">Fair</SelectItem>
                      </SelectContent>
                    </Select>

                    <input
                      type="hidden"
                      {...register("condition", {
                        required: "Condition is required",
                      })}
                    />

                    {errors.condition && (
                      <p className="text-xs text-destructive">
                        {errors.condition.message}
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe the product, included accessories, technical details, and ideal use cases..."
                    rows={6}
                    {...register("description", {
                      required: "Description is required",
                    })}
                    className="resize-y"
                  />

                  {errors.description && (
                    <p className="text-xs text-destructive">
                      {errors.description.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="features">Key Features</Label>
                  <Input
                    id="features"
                    placeholder="e.g. 4K video, 45MP sensor, Wi-Fi, Bluetooth"
                    {...register("features")}
                    className="h-11"
                  />
                  <p className="text-xs text-muted-foreground">
                    Separate features with commas.
                  </p>
                </div>
              </section>

              <Separator />

              <section className="space-y-5">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                    2
                  </div>
                  <div>
                    <h3 className="font-semibold">Pricing and availability</h3>
                    <p className="text-xs text-muted-foreground">
                      Set prices, stock, and listing options.
                    </p>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="buyPrice">Buy Price (₹)</Label>
                    <Input
                      id="buyPrice"
                      type="number"
                      min="0"
                      placeholder="0"
                      {...register("buyPrice", { required: "Required" })}
                      className="h-11"
                    />
                    {errors.buyPrice && (
                      <p className="text-xs text-destructive">
                        {errors.buyPrice.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="rentPricePerDay">Rent / Day (₹)</Label>
                    <Input
                      id="rentPricePerDay"
                      type="number"
                      min="0"
                      placeholder="0"
                      {...register("rentPricePerDay", { required: "Required" })}
                      className="h-11"
                    />
                    {errors.rentPricePerDay && (
                      <p className="text-xs text-destructive">
                        {errors.rentPricePerDay.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="deposit">Security Deposit (₹)</Label>
                    <Input
                      id="deposit"
                      type="number"
                      min="0"
                      placeholder="0"
                      {...register("deposit", { required: "Required" })}
                      className="h-11"
                    />
                    {errors.deposit && (
                      <p className="text-xs text-destructive">
                        {errors.deposit.message}
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid gap-5 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="stock">Stock Quantity</Label>
                    <Input
                      id="stock"
                      type="number"
                      min="1"
                      placeholder="1"
                      {...register("stock", {
                        required: "Required",
                        valueAsNumber: true,
                      })}
                      className="h-11"
                    />
                    {errors.stock && (
                      <p className="text-xs text-destructive">{errors.stock.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="location">Location / City</Label>
                    <Input
                      id="location"
                      placeholder="e.g. Pune, Mumbai, Bengaluru"
                      {...register("location")}
                      className="h-11"
                    />
                    <p className="text-xs text-muted-foreground">
                      Where can customers collect or receive this equipment?
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <Label>Available For</Label>

                  <div className="grid gap-3 sm:grid-cols-3">
                    {[
                      {
                        value: "RENT",
                        label: "Rent",
                        icon: "🔄",
                        desc: "Daily or weekly rental",
                      },
                      {
                        value: "BUY",
                        label: "Sell",
                        icon: "💰",
                        desc: "One-time purchase",
                      },
                      {
                        value: "BOOK",
                        label: "Book",
                        icon: "📅",
                        desc: "Date-based booking",
                      },
                    ].map((type) => {
                      const selected = (watch("listingTypes") || "")
                        .split(",")
                        .includes(type.value);

                      return (
                        <label
                          key={type.value}
                          className={`cursor-pointer rounded-xl border p-4 text-center transition ${
                            selected
                              ? "border-primary bg-primary/5"
                              : "hover:border-primary/40 hover:bg-muted/40"
                          }`}
                        >
                          <input
                            type="checkbox"
                            value={type.value}
                            className="sr-only"
                            checked={selected}
                            onChange={(event) => {
                              const current = watch("listingTypes") || "";
                              const types = current
                                ? current.split(",").filter(Boolean)
                                : [];

                              const nextTypes = event.target.checked
                                ? [...new Set([...types, type.value])]
                                : types.filter((item) => item !== type.value);

                              setValue("listingTypes", nextTypes.join(","));
                            }}
                          />

                          <span className="block text-xl">{type.icon}</span>
                          <span className="mt-1 block text-sm font-semibold">
                            {type.label}
                          </span>
                          <span className="mt-1 block text-[11px] text-muted-foreground">
                            {type.desc}
                          </span>
                        </label>
                      );
                    })}
                  </div>

                  <input type="hidden" {...register("listingTypes")} />
                </div>
              </section>

              <Separator />

              <section className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">Product Images</h3>
                    <p className="text-xs text-muted-foreground">
                      Add up to six images. The first image is the main image.
                    </p>
                  </div>
                  <span className="rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground">
                    {uploadedImages.length}/6
                  </span>
                </div>

                {uploadedImages.length < 6 && (
                  <label
                    className={`flex h-36 w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed transition ${
                      uploading
                        ? "border-primary/50 bg-primary/5 opacity-70"
                        : "border-muted-foreground/25 hover:border-primary/50 hover:bg-primary/5"
                    }`}
                  >
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml"
                      multiple
                      className="hidden"
                      onChange={handleImageUpload}
                      disabled={uploading}
                    />

                    {uploading ? (
                      <>
                        <Loader2 className="h-7 w-7 animate-spin text-primary" />
                        <p className="text-sm font-medium">Uploading images...</p>
                      </>
                    ) : (
                      <>
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                          <ImageIcon className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div className="text-center">
                          <p className="text-sm font-medium">Click to upload product images</p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            JPG, PNG, WebP, GIF · Maximum 5MB per image
                          </p>
                        </div>
                      </>
                    )}
                  </label>
                )}

                {uploadedImages.length > 0 && (
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
                    {uploadedImages.map((url, index) => (
                      <div
                        key={`${url}-${index}`}
                        className="group relative aspect-square overflow-hidden rounded-xl border bg-muted"
                      >
                        <img
                          src={url}
                          alt={`Product upload ${index + 1}`}
                          className="h-full w-full object-cover"
                        />

                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/65 text-white opacity-100 transition hover:bg-black sm:opacity-0 sm:group-hover:opacity-100"
                          aria-label={`Remove image ${index + 1}`}
                        >
                          <X className="h-4 w-4" />
                        </button>

                        {index === 0 && (
                          <span className="absolute bottom-0 left-0 right-0 bg-black/65 py-1 text-center text-[10px] font-medium text-white">
                            Main image
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </section>

              <div className="flex flex-col-reverse gap-3 border-t pt-6 sm:flex-row sm:justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    reset();
                    setUploadedImages([]);
                    setValue("listingTypes", "RENT,BOOK");
                  }}
                  disabled={submitting}
                  className="h-11"
                >
                  Clear Form
                </Button>

                <Button type="submit" disabled={submitting} className="h-11 min-w-44">
                  {submitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {isEditing ? "Saving..." : "Publishing..."}
                    </>
                  ) : (
                    <>
                      {isEditing ? (
                        <Pencil className="mr-2 h-4 w-4" />
                      ) : (
                        <Plus className="mr-2 h-4 w-4" />
                      )}
                      {isEditing ? "Save Changes" : "Publish Product"}
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <aside className="space-y-5 xl:sticky xl:top-6 xl:self-start">
          <Card className="border-border/70 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Listing checklist</CardTitle>
            </CardHeader>

            <CardContent className="space-y-4 text-sm">
              <div className="flex gap-3">
                <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                <p>Add a clear, specific product title.</p>
              </div>
              <div className="flex gap-3">
                <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                <p>Choose the correct category and condition.</p>
              </div>
              <div className="flex gap-3">
                <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                <p>Set realistic rent price and refundable deposit.</p>
              </div>
              <div className="flex gap-3">
                <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                <p>Upload multiple clear photos from different angles.</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-primary/20 bg-primary/5 shadow-sm">
            <CardContent className="p-5">
              <div className="flex gap-3">
                <Sparkles className="h-5 w-5 shrink-0 text-primary" />
                <div>
                  <h3 className="font-semibold">Use AI to save time</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Enter a product title and click Generate with AI. It can create a
                    polished description and feature list for you.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-amber-200 bg-amber-50/70 shadow-sm dark:border-amber-900/60 dark:bg-amber-950/20">
            <CardContent className="flex gap-3 p-5">
              <AlertCircle className="h-5 w-5 shrink-0 text-amber-600" />
              <p className="text-sm text-amber-900 dark:text-amber-200">
                Make sure your pricing and stock details are correct before publishing.
              </p>
            </CardContent>
          </Card>
        </aside>
      </div>
    </motion.div>
  );
}

// --- Bookings Tab ---

function VendorBookingsTab({ bookings, loading, onAction }: {
  bookings: AppBooking[] | null;
  loading: boolean;
  onAction: () => void;
}) {
  const { token } = useAppStore();

  const handleStatusUpdate = async (bookingId: string, status: BookingStatus) => {
    if (!token) return;
    try {
      const res = await fetch(`/api/bookings/${bookingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("Failed to update booking");
      toast.success(`Booking ${status.toLowerCase()} successfully`);
      onAction();
    } catch {
      toast.error("Failed to update booking status");
    }
  };

  if (loading) return <VendorBookingsSkeleton />;

  if (!bookings || bookings.length === 0) {
    return (
      <motion.div {...tabAnimation}>
        <Card>
          <CardContent className="py-12 text-center">
            <Calendar className="h-10 w-10 mx-auto text-muted-foreground/40 mb-3" />
            <p className="text-sm text-muted-foreground">No bookings for your products yet</p>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div {...tabAnimation} className="space-y-3">
      {bookings.map((b) => (
        <Card key={b.id} className="card-hover">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              {/* Customer Info */}
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-bold shrink-0">
                  {b.user?.name?.charAt(0)?.toUpperCase() || "?"}
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-sm truncate">{b.user?.name || "—"}</p>
                  <p className="text-xs text-muted-foreground truncate">{b.user?.email || "—"}</p>
                </div>
              </div>

              {/* Booking Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{b.product?.title || "—"}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className={`inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-medium ${BOOKING_TYPE_COLORS[b.bookingType]}`}>
                    {b.bookingType}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {b.startDate && b.endDate
                      ? `${formatDate(b.startDate)} – ${formatDate(b.endDate)}`
                      : "—"}
                  </span>
                  <span className="text-xs text-muted-foreground">×{b.quantity}</span>
                </div>
              </div>

              {/* Amount & Status */}
              <div className="flex items-center gap-3 shrink-0">
                <div className="text-right">
                  <p className="font-semibold text-sm">{formatINR(b.totalPrice)}</p>
                  <span className={`inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-medium ${BOOKING_STATUS_COLORS[b.status]}`}>
                    {b.status}
                  </span>
                </div>
                {b.status === "PENDING" && (
                  <div className="flex gap-1.5">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs text-emerald-600 border-emerald-300 hover:bg-emerald-50 dark:text-emerald-400 dark:border-emerald-800 dark:hover:bg-emerald-900/20"
                      onClick={() => handleStatusUpdate(b.id, "APPROVED")}
                    >
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs text-red-600 border-red-300 hover:bg-red-50 dark:text-red-400 dark:border-red-800 dark:hover:bg-red-900/20"
                      onClick={() => handleStatusUpdate(b.id, "REJECTED")}
                    >
                      <XCircle className="h-3 w-3 mr-1" />
                      Reject
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </motion.div>
  );
}

// --- Analytics Tab ---

function AnalyticsTab({ data }: { data: VendorDashboardData | null }) {
  if (!data) return <VendorOverviewSkeleton />;

  const bookingTypes = [
    { type: "RENT", count: data.recentBookings.filter((b) => b.bookingType === "RENT").length, color: "#059669" },
    { type: "BUY", count: data.recentBookings.filter((b) => b.bookingType === "BUY").length, color: "#7c3aed" },
    { type: "BOOK", count: data.recentBookings.filter((b) => b.bookingType === "BOOK").length, color: "#d97706" },
  ].filter((t) => t.count > 0);

  const maxBookings = Math.max(...bookingTypes.map((t) => t.count), 1);

  return (
    <motion.div {...tabAnimation} className="space-y-6">
      {/* Revenue Chart */}
      {data.monthlyRevenue.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Revenue Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.monthlyRevenue}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} className="fill-muted-foreground" />
                  <YAxis tick={{ fontSize: 12 }} className="fill-muted-foreground" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--popover)",
                      border: "1px solid var(--border)",
                      borderRadius: "var(--radius)",
                      color: "var(--popover-foreground)",
                    }}
                    formatter={(value: number) => [formatINR(value), "Revenue"]}
                  />
                  <Bar dataKey="revenue" fill="var(--primary)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Summary + Booking Type Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Stats Summary */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Stats Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Total Revenue</span>
              <span className="text-lg font-bold">{formatINR(data.totalRevenue)}</span>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Completed Orders</span>
              <span className="font-semibold">{data.completedOrders}</span>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Average Order Value</span>
              <span className="font-semibold">
                {data.completedOrders > 0
                  ? formatINR(Math.round(data.totalRevenue / data.completedOrders))
                  : "—"}
              </span>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Active Bookings</span>
              <span className="font-semibold">{data.activeBookings}</span>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Total Products</span>
              <span className="font-semibold">{data.totalProducts}</span>
            </div>
          </CardContent>
        </Card>

        {/* Booking Type Distribution */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Booking Type Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            {bookingTypes.length === 0 ? (
              <p className="text-sm text-muted-foreground py-6 text-center">No booking data yet</p>
            ) : (
              <div className="space-y-4 pt-2">
                {bookingTypes.map((t) => (
                  <div key={t.type} className="space-y-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <span className={`font-medium ${BOOKING_TYPE_COLORS[t.type as keyof typeof BOOKING_TYPE_COLORS]} inline-flex items-center rounded-md px-2 py-0.5 text-[11px]`}>
                        {t.type}
                      </span>
                      <span className="text-muted-foreground">{t.count} bookings</span>
                    </div>
                    <div className="h-3 w-full rounded-full bg-muted overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${(t.count / maxBookings) * 100}%` }}
                        transition={{ duration: 0.6, ease: "easeOut" }}
                        className="h-full rounded-full"
                        style={{ backgroundColor: t.color }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
}

// --- Main Component ---

export default function VendorDashboard() {
  const { vendorTab, setVendorTab, token, navigateTo } = useAppStore();
  const [dashboardData, setDashboardData] = useState<VendorDashboardData | null>(null);
  const [products, setProducts] = useState<AppProduct[]>([]);
  const [vendorBookings, setVendorBookings] = useState<AppBooking[]>([]);
  const [categories, setCategories] = useState<Array<{ id: string; name: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [productsLoading, setProductsLoading] = useState(false);
  const [bookingsLoading, setBookingsLoading] = useState(false);
  const [editingProduct, setEditingProduct] = useState<AppProduct | null>(null);

  const fetchDashboard = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch("/api/vendors/dashboard", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch dashboard");
      const data = await res.json();
      setDashboardData(data);
    } catch {
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  }, [token]);

  const fetchProducts = useCallback(async () => {
    if (!token) return;
    setProductsLoading(true);
    try {
      const res = await fetch("/api/vendors/products", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch products");
      const data = await res.json();
      setProducts(data.products || data || []);
    } catch {
      toast.error("Failed to load products");
    } finally {
      setProductsLoading(false);
    }
  }, [token]);

  const fetchBookings = useCallback(async () => {
    if (!token) return;
    setBookingsLoading(true);
    try {
      const res = await fetch("/api/vendors/bookings", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch bookings");
      const data = await res.json();
      setVendorBookings(data.bookings || data || []);
    } catch {
      toast.error("Failed to load bookings");
    } finally {
      setBookingsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchDashboard();
    // Also fetch categories for add-product form
    fetch("/api/categories")
      .then((r) => r.json())
      .then((data) => setCategories(Array.isArray(data) ? data : data.categories || []))
      .catch(() => {});
  }, [fetchDashboard]);

  useEffect(() => {
    if (vendorTab === "products") fetchProducts();
    if (vendorTab === "bookings") fetchBookings();
  }, [vendorTab, fetchProducts, fetchBookings]);

  const handleEditProduct = (product: AppProduct) => {
    setEditingProduct(product);
    setVendorTab("edit-product");
  };

  const handleToggleStatus = async (product: AppProduct) => {
    if (!token) return;
    try {
      const newStatus = product.status === "AVAILABLE" ? "UNAVAILABLE" : "AVAILABLE";
      const res = await fetch(`/api/vendors/products/${product.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error("Failed to update status");
      toast.success(`Product marked as ${newStatus}`);
      fetchProducts();
    } catch {
      toast.error("Failed to update product status");
    }
  };

  const handleDeleteProduct = async (product: AppProduct) => {
    if (!token) return;
    if (!window.confirm(`Delete "${product.title}"? This cannot be undone.`)) return;
    try {
      const res = await fetch(`/api/vendors/products/${product.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to delete");
      toast.success("Product deleted");
      fetchProducts();
    } catch {
      toast.error("Failed to delete product");
    }
  };

  const handleProductSubmitted = () => {
    setEditingProduct(null);
    setVendorTab("products");
    fetchProducts();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Vendor Dashboard</h2>
          <p className="text-sm text-muted-foreground mt-1">Manage your products, bookings, and track your business performance</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigateTo("marketplace")}
          className="gap-2 rounded-full self-start"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Marketplace
        </Button>
      </div>

      <Tabs
        value={vendorTab}
        onValueChange={(v) => setVendorTab(v as typeof vendorTab)}
        className="w-full"
      >
        <TabsList className="flex-wrap h-auto gap-1 p-1">
          <TabsTrigger value="overview" className="text-xs sm:text-sm">
            <Eye className="h-3.5 w-3.5 sm:mr-1.5" />
            <span className="hidden sm:inline">Overview</span>
          </TabsTrigger>
          <TabsTrigger value="products" className="text-xs sm:text-sm">
            <Package className="h-3.5 w-3.5 sm:mr-1.5" />
            <span className="hidden sm:inline">Products</span>
          </TabsTrigger>
          <TabsTrigger value="bookings" className="text-xs sm:text-sm">
            <Calendar className="h-3.5 w-3.5 sm:mr-1.5" />
            <span className="hidden sm:inline">Bookings</span>
          </TabsTrigger>
          <TabsTrigger value="add-product" className="text-xs sm:text-sm">
            <Plus className="h-3.5 w-3.5 sm:mr-1.5" />
            <span className="hidden sm:inline">Add Product</span>
          </TabsTrigger>
          <TabsTrigger value="analytics" className="text-xs sm:text-sm">
            <BarChart3 className="h-3.5 w-3.5 sm:mr-1.5" />
            <span className="hidden sm:inline">Analytics</span>
          </TabsTrigger>
        </TabsList>

        <AnimatePresence mode="wait">
          {vendorTab === "overview" && (
            <TabsContent value="overview">
              <VendorOverviewTab data={loading ? null : dashboardData} />
            </TabsContent>
          )}
          {vendorTab === "products" && (
            <TabsContent value="products">
              <VendorProductsTab
                products={productsLoading ? null : products}
                loading={productsLoading}
                onAddProduct={() => setVendorTab("add-product")}
                onEditProduct={handleEditProduct}
                onToggleStatus={handleToggleStatus}
                onDeleteProduct={handleDeleteProduct}
              />
            </TabsContent>
          )}
          {vendorTab === "bookings" && (
            <TabsContent value="bookings">
              <VendorBookingsTab
                bookings={bookingsLoading ? null : vendorBookings}
                loading={bookingsLoading}
                onAction={fetchBookings}
              />
            </TabsContent>
          )}
          {vendorTab === "add-product" && (
            <TabsContent value="add-product">
              <AddProductTab categories={categories} onSubmitted={handleProductSubmitted} />
            </TabsContent>
          )}
          {vendorTab === "edit-product" && editingProduct && (
            <TabsContent value="edit-product">
              <AddProductTab
                categories={categories}
                onSubmitted={() => {
                  setEditingProduct(null);
                  setVendorTab("products");
                  fetchProducts();
                }}
                editingProduct={editingProduct}
              />
            </TabsContent>
          )}
          {vendorTab === "analytics" && (
            <TabsContent value="analytics">
              <AnalyticsTab data={loading ? null : dashboardData} />
            </TabsContent>
          )}
        </AnimatePresence>
      </Tabs>
    </div>
  );
}