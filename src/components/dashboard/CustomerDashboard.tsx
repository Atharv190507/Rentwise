"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  Package,
  Calendar,
  DollarSign,
  Sparkles,
  Star,
  Clock,
  CheckCircle,
  XCircle,
  ChevronDown,
  ChevronUp,
  Filter,
  Eye,
  TrendingDown,
  Lightbulb,
  ArrowLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useAppStore } from "@/stores/app-store";
import type {
  AppBooking,
  AIRecommendationResult,
  BookingStatus,
  BookingType,
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

// --- Skeleton Components ---

function StatCardSkeleton() {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-4">
        <Skeleton className="h-10 w-10 rounded-lg" />
        <div className="space-y-2 flex-1">
          <Skeleton className="h-5 w-20" />
          <Skeleton className="h-3 w-24" />
        </div>
      </div>
    </Card>
  );
}

function OverviewSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
      </div>
      <Card>
        <CardHeader className="pb-3">
          <Skeleton className="h-5 w-36" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function BookingsSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex gap-3">
        <Skeleton className="h-9 w-40" />
        <Skeleton className="h-9 w-40" />
      </div>
      <Card>
        <CardContent className="p-0">
          <div className="space-y-3 p-4">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-20 w-full rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function ReviewsSkeleton() {
  return (
    <div className="space-y-4">
      {[...Array(4)].map((_, i) => (
        <Card key={i}>
          <CardContent className="p-4">
            <div className="flex gap-4">
              <div className="flex-1 space-y-2">
                <Skeleton className="h-5 w-48" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-full" />
              </div>
              <Skeleton className="h-3 w-20" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function AIHistorySkeleton() {
  return (
    <div className="space-y-4">
      {[...Array(3)].map((_, i) => (
        <Card key={i}>
          <CardContent className="p-4 space-y-3">
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// --- Overview Tab ---

interface DashboardStats {
  activeBookings: number;
  totalOrders: number;
  savedByRenting: number;
  aiSuggestions: number;
  recentBookings: AppBooking[];
}

function OverviewTab({ stats, onViewAll }: { stats: DashboardStats | null; onViewAll: () => void }) {
  if (!stats) return <OverviewSkeleton />;

  const statCards = [
    {
      icon: <Package className="h-5 w-5" />,
      value: stats.activeBookings,
      label: "Active Bookings",
      color: "text-primary",
      bg: "bg-primary/10",
    },
    {
      icon: <Calendar className="h-5 w-5" />,
      value: stats.totalOrders,
      label: "Total Orders",
      color: "text-emerald-600",
      bg: "bg-emerald-100 dark:bg-emerald-900/30",
    },
    {
      icon: <DollarSign className="h-5 w-5" />,
      value: formatINR(stats.savedByRenting),
      label: "Saved by Renting",
      color: "text-amber-600",
      bg: "bg-amber-100 dark:bg-amber-900/30",
    },
    {
      icon: <Sparkles className="h-5 w-5" />,
      value: stats.aiSuggestions,
      label: "AI Suggestions",
      color: "text-violet-600",
      bg: "bg-violet-100 dark:bg-violet-900/30",
    },
  ];

  return (
    <motion.div {...tabAnimation} className="space-y-6">
      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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

      {/* Recent Bookings */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold">Recent Bookings</CardTitle>
            {stats.recentBookings.length > 0 && (
              <Button variant="ghost" size="sm" onClick={onViewAll} className="text-xs text-primary hover:text-primary/80">
                View All Bookings
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {stats.recentBookings.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">No bookings yet</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="text-right">Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stats.recentBookings.map((b) => (
                    <TableRow key={b.id}>
                      <TableCell className="font-medium max-w-[200px] truncate">{b.product?.title || "—"}</TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium ${BOOKING_TYPE_COLORS[b.bookingType]}`}>
                          {b.bookingType}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium ${BOOKING_STATUS_COLORS[b.status]}`}>
                          {b.status}
                        </span>
                      </TableCell>
                      <TableCell className="text-right font-medium">{formatINR(b.totalPrice)}</TableCell>
                      <TableCell className="text-right text-muted-foreground text-xs">{formatDate(b.createdAt)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

// --- Bookings Tab ---

function BookingsTab() {
  const { token } = useAppStore();
  const [bookings, setBookings] = useState<AppBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [typeFilter, setTypeFilter] = useState<string>("ALL");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const fetchBookings = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page) });
      if (statusFilter !== "ALL") params.set("status", statusFilter);
      if (typeFilter !== "ALL") params.set("type", typeFilter);
      const res = await fetch(`/api/bookings?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch bookings");
      const data = await res.json();
      setBookings(data.bookings || []);
      setTotalPages(data.totalPages || 1);
    } catch {
      toast.error("Failed to load bookings");
    } finally {
      setLoading(false);
    }
  }, [token, statusFilter, typeFilter, page]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const handleCancel = async () => {
    if (!cancellingId || !token) return;
    try {
      const res = await fetch(`/api/bookings/${cancellingId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: "CANCELLED" }),
      });
      if (!res.ok) throw new Error("Failed to cancel booking");
      toast.success("Booking cancelled successfully");
      setExpandedId(null);
      fetchBookings();
    } catch {
      toast.error("Failed to cancel booking");
    } finally {
      setCancellingId(null);
    }
  };

  if (loading) return <BookingsSkeleton />;

  return (
    <motion.div {...tabAnimation} className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Filter className="h-4 w-4" />
          <span className="font-medium">Filters:</span>
        </div>
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
          <SelectTrigger size="sm" className="w-[160px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Statuses</SelectItem>
            <SelectItem value="PENDING">Pending</SelectItem>
            <SelectItem value="APPROVED">Approved</SelectItem>
            <SelectItem value="CONFIRMED">Confirmed</SelectItem>
            <SelectItem value="DELIVERED">Delivered</SelectItem>
            <SelectItem value="RETURNED">Returned</SelectItem>
            <SelectItem value="COMPLETED">Completed</SelectItem>
            <SelectItem value="CANCELLED">Cancelled</SelectItem>
            <SelectItem value="REJECTED">Rejected</SelectItem>
          </SelectContent>
        </Select>
        <Select value={typeFilter} onValueChange={(v) => { setTypeFilter(v); setPage(1); }}>
          <SelectTrigger size="sm" className="w-[140px]">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Types</SelectItem>
            <SelectItem value="RENT">Rent</SelectItem>
            <SelectItem value="BUY">Buy</SelectItem>
            <SelectItem value="BOOK">Book</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Booking List */}
      {bookings.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Package className="h-10 w-10 mx-auto text-muted-foreground/40 mb-3" />
            <p className="text-sm text-muted-foreground">No bookings found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {bookings.map((b) => (
            <Card key={b.id} className="overflow-hidden">
              <button
                className="w-full text-left"
                onClick={() => setExpandedId(expandedId === b.id ? null : b.id)}
              >
                <div className="flex items-center gap-4 p-4">
                  {/* Product Image */}
                  <div className="h-14 w-14 rounded-lg bg-muted flex-shrink-0 overflow-hidden">
                    {b.product?.imageUrl ? (
                      <img src={b.product.imageUrl} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center text-muted-foreground">
                        <Package className="h-5 w-5" />
                      </div>
                    )}
                  </div>
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{b.product?.title || "—"}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-medium ${BOOKING_TYPE_COLORS[b.bookingType]}`}>
                        {b.bookingType}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {b.startDate && b.endDate
                          ? `${formatDate(b.startDate)} – ${formatDate(b.endDate)}`
                          : formatDate(b.createdAt)}
                      </span>
                    </div>
                  </div>
                  {/* Amount & Status */}
                  <div className="text-right flex-shrink-0">
                    <p className="font-semibold text-sm">{formatINR(b.totalPrice)}</p>
                    <span className={`inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-medium mt-1 ${BOOKING_STATUS_COLORS[b.status]}`}>
                      {b.status}
                    </span>
                  </div>
                  {/* Expand Icon */}
                  <div className="flex-shrink-0 text-muted-foreground">
                    {expandedId === b.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </div>
                </div>
              </button>

              {/* Expanded Details */}
              <AnimatePresence>
                {expandedId === b.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <Separator />
                    <div className="p-4 bg-muted/30 space-y-3">
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground text-xs mb-0.5">Quantity</p>
                          <p className="font-medium">{b.quantity}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground text-xs mb-0.5">Deposit</p>
                          <p className="font-medium">{formatINR(b.depositAmount)}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground text-xs mb-0.5">Payment</p>
                          <p className="font-medium capitalize">{b.payment?.paymentStatus || "—"}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground text-xs mb-0.5">Booked On</p>
                          <p className="font-medium">{formatDate(b.createdAt)}</p>
                        </div>
                      </div>
                      {b.notes && (
                        <p className="text-sm text-muted-foreground">
                          <span className="font-medium text-foreground">Notes: </span>{b.notes}
                        </p>
                      )}
                      {b.status === "PENDING" && (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => setCancellingId(b.id)}
                          className="mt-2"
                        >
                          <XCircle className="h-4 w-4 mr-1.5" />
                          Cancel Booking
                        </Button>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      )}

      {/* Cancel Dialog */}
      <AlertDialog open={!!cancellingId} onOpenChange={(open) => !open && setCancellingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Booking</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel this booking? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Booking</AlertDialogCancel>
            <AlertDialogAction onClick={handleCancel} className="bg-destructive text-white hover:bg-destructive/90">
              Cancel Booking
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  );
}

// --- Reviews Tab ---

function ReviewsTab({ reviews }: { reviews: Array<{ productTitle: string; rating: number; comment?: string; createdAt: string }> | null }) {
  if (!reviews) return <ReviewsSkeleton />;

  if (reviews.length === 0) {
    return (
      <motion.div {...tabAnimation}>
        <Card>
          <CardContent className="py-12 text-center">
            <Star className="h-10 w-10 mx-auto text-muted-foreground/40 mb-3" />
            <p className="text-sm text-muted-foreground">No reviews yet</p>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div {...tabAnimation} className="space-y-4">
      {reviews.map((r, i) => (
        <Card key={i} className="card-hover">
          <CardContent className="p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm">{r.productTitle}</p>
                <div className="flex items-center gap-1 mt-1">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                      key={s}
                      className={`h-3.5 w-3.5 ${s <= r.rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30"}`}
                    />
                  ))}
                </div>
                {r.comment && (
                  <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{r.comment}</p>
                )}
              </div>
              <p className="text-xs text-muted-foreground flex-shrink-0">{formatDate(r.createdAt)}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </motion.div>
  );
}

// --- AI History Tab ---

function AIHistoryTab({ aiHistory }: { aiHistory: AIRecommendationResult[] | null }) {
  if (!aiHistory) return <AIHistorySkeleton />;

  if (aiHistory.length === 0) {
    return (
      <motion.div {...tabAnimation}>
        <Card>
          <CardContent className="py-12 text-center">
            <Sparkles className="h-10 w-10 mx-auto text-muted-foreground/40 mb-3" />
            <p className="text-sm text-muted-foreground">No AI recommendations yet</p>
            <p className="text-xs text-muted-foreground mt-1">Try the AI recommendation tool on any product page!</p>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  const getRecommendationColor = (rec: string) => {
    if (rec.toUpperCase().includes("RENT")) return BOOKING_TYPE_COLORS.RENT;
    if (rec.toUpperCase().includes("BUY")) return BOOKING_TYPE_COLORS.BUY;
    if (rec.toUpperCase().includes("BOOK")) return BOOKING_TYPE_COLORS.BOOK;
    return "bg-slate-100 text-slate-700 dark:bg-slate-900/30 dark:text-slate-400";
  };

  return (
    <motion.div {...tabAnimation} className="space-y-4">
      {aiHistory.map((item) => (
        <Card key={item.id} className="card-hover">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2 flex-shrink-0">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-100 dark:bg-violet-900/30">
                  <Sparkles className="h-4 w-4 text-violet-600" />
                </div>
                <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium ${getRecommendationColor(item.recommendation)}`}>
                  {item.recommendation}
                </span>
              </div>
              <p className="text-xs text-muted-foreground flex-shrink-0">{formatDate(item.createdAt)}</p>
            </div>
            <div>
              <p className="text-sm font-medium flex items-center gap-1.5">
                <Lightbulb className="h-3.5 w-3.5 text-amber-500" />
                Recommendation
              </p>
              <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{item.explanation}</p>
            </div>
            {item.savings != null && item.savings > 0 && (
              <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                <TrendingDown className="h-4 w-4" />
                <span className="text-sm font-semibold">Savings: {formatINR(item.savings)}</span>
              </div>
            )}
            {item.alternatives && (
              <p className="text-xs text-muted-foreground">
                <span className="font-medium">Alternatives: </span>{item.alternatives}
              </p>
            )}
          </CardContent>
        </Card>
      ))}
    </motion.div>
  );
}

// --- Main Component ---

export default function CustomerDashboard() {
  const { customerTab, setCustomerTab, navigateTo } = useAppStore();
  const { token } = useAppStore();
  const [dashboardData, setDashboardData] = useState<{
    activeBookings: number;
    totalOrders: number;
    savedByRenting: number;
    aiSuggestions: number;
    recentBookings: AppBooking[];
    reviews: Array<{ productTitle: string; rating: number; comment?: string; createdAt: string }>;
    aiHistory: AIRecommendationResult[];
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    async function fetchDashboard() {
      try {
        const res = await fetch("/api/customer/dashboard", {
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
    }
    fetchDashboard();
  }, [token]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Customer Dashboard</h2>
          <p className="text-sm text-muted-foreground mt-1">Manage your bookings, reviews, and AI-powered recommendations</p>
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
        value={customerTab}
        onValueChange={(v) => setCustomerTab(v as typeof customerTab)}
        className="w-full"
      >
        <TabsList className="flex-wrap h-auto gap-1 p-1">
          <TabsTrigger value="overview" className="text-xs sm:text-sm">
            <Eye className="h-3.5 w-3.5 sm:mr-1.5" />
            <span className="hidden sm:inline">Overview</span>
          </TabsTrigger>
          <TabsTrigger value="bookings" className="text-xs sm:text-sm">
            <Calendar className="h-3.5 w-3.5 sm:mr-1.5" />
            <span className="hidden sm:inline">Bookings</span>
          </TabsTrigger>
          <TabsTrigger value="reviews" className="text-xs sm:text-sm">
            <Star className="h-3.5 w-3.5 sm:mr-1.5" />
            <span className="hidden sm:inline">Reviews</span>
          </TabsTrigger>
          <TabsTrigger value="ai-history" className="text-xs sm:text-sm">
            <Sparkles className="h-3.5 w-3.5 sm:mr-1.5" />
            <span className="hidden sm:inline">AI History</span>
          </TabsTrigger>
        </TabsList>

        <AnimatePresence mode="wait">
          {customerTab === "overview" && (
            <TabsContent value="overview">
              <OverviewTab
                stats={loading ? null : dashboardData}
                onViewAll={() => setCustomerTab("bookings")}
              />
            </TabsContent>
          )}
          {customerTab === "bookings" && (
            <TabsContent value="bookings">
              <BookingsTab />
            </TabsContent>
          )}
          {customerTab === "reviews" && (
            <TabsContent value="reviews">
              <ReviewsTab reviews={loading ? null : dashboardData?.reviews || null} />
            </TabsContent>
          )}
          {customerTab === "ai-history" && (
            <TabsContent value="ai-history">
              <AIHistoryTab aiHistory={loading ? null : dashboardData?.aiHistory || null} />
            </TabsContent>
          )}
        </AnimatePresence>
      </Tabs>
    </div>
  );
}