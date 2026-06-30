"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  Package,
  Calendar,
  DollarSign,
  Users,
  Store,
  BarChart3,
  Star,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Search,
  Filter,
  Eye,
  Shield,
  Ban,
  Check,
  Loader2,
  Mail,
  Phone,
  ArrowLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
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
  AppBooking,
  AppProduct,
  BookingStatus,
  ProductStatus,
  UserRole,
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

function AdminOverviewSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="p-4">
            <div className="flex items-center gap-4">
              <Skeleton className="h-10 w-10 rounded-lg" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-5 w-16" />
                <Skeleton className="h-3 w-28" />
              </div>
            </div>
          </Card>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card><CardHeader><Skeleton className="h-5 w-40" /></CardHeader><CardContent><Skeleton className="h-[250px] w-full" /></CardContent></Card>
        <Card><CardHeader><Skeleton className="h-5 w-40" /></CardHeader><CardContent><Skeleton className="h-[250px] w-full" /></CardContent></Card>
      </div>
      <Card><CardHeader><Skeleton className="h-5 w-40" /></CardHeader><CardContent><div className="space-y-3">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div></CardContent></Card>
    </div>
  );
}

function TableSkeleton({ rows = 8 }: { rows?: number }) {
  return (
    <Card>
      <CardContent className="p-0">
        <div className="space-y-3 p-4">
          <Skeleton className="h-9 w-full" />
          {[...Array(rows)].map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// --- Overview Tab ---

interface AdminStats {
  totalUsers: number;
  totalVendors: number;
  totalProducts: number;
  activeRentals: number;
  pendingApprovals: number;
  totalRevenue: number;
  bookingsByStatus: Array<{ status: string; count: number }>;
  bookingsByType: Array<{ type: string; count: number }>;
  recentBookings: AppBooking[];
}

function AdminOverviewTab({ stats }: { stats: AdminStats | null }) {
  if (!stats) return <AdminOverviewSkeleton />;

  const statCards = [
    { icon: <Users className="h-5 w-5" />, value: stats.totalUsers, label: "Total Users", color: "text-primary", bg: "bg-primary/10" },
    { icon: <Store className="h-5 w-5" />, value: stats.totalVendors, label: "Total Vendors", color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-100 dark:bg-emerald-900/30" },
    { icon: <Package className="h-5 w-5" />, value: stats.totalProducts, label: "Total Products", color: "text-violet-600 dark:text-violet-400", bg: "bg-violet-100 dark:bg-violet-900/30" },
    { icon: <Calendar className="h-5 w-5" />, value: stats.activeRentals, label: "Active Rentals", color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-100 dark:bg-amber-900/30" },
    { icon: <Clock className="h-5 w-5" />, value: stats.pendingApprovals, label: "Pending Approvals", color: "text-red-600 dark:text-red-400", bg: "bg-red-100 dark:bg-red-900/30" },
    { icon: <DollarSign className="h-5 w-5" />, value: formatINR(stats.totalRevenue), label: "Total Revenue", color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-100 dark:bg-emerald-900/30" },
  ];

  const statusColors: Record<string, string> = {
    PENDING: "#d97706",
    APPROVED: "#2563eb",
    CONFIRMED: "#059669",
    DELIVERED: "#7c3aed",
    RETURNED: "#64748b",
    COMPLETED: "#059669",
    CANCELLED: "#dc2626",
    REJECTED: "#dc2626",
  };

  const typeColors: Record<string, string> = {
    RENT: "#059669",
    BUY: "#7c3aed",
    BOOK: "#d97706",
  };

  return (
    <motion.div {...tabAnimation} className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
        {/* Bookings by Status */}
        {stats.bookingsByStatus.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">Bookings by Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.bookingsByStatus}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="status" tick={{ fontSize: 11 }} className="fill-muted-foreground" />
                    <YAxis tick={{ fontSize: 11 }} className="fill-muted-foreground" allowDecimals={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "var(--popover)",
                        border: "1px solid var(--border)",
                        borderRadius: "var(--radius)",
                        color: "var(--popover-foreground)",
                      }}
                    />
                    <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                      {stats.bookingsByStatus.map((entry, index) => (
                        <rect key={index} fill={statusColors[entry.status] || "var(--primary)"} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Bookings by Type */}
        {stats.bookingsByType.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">Bookings by Type</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.bookingsByType}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="type" tick={{ fontSize: 11 }} className="fill-muted-foreground" />
                    <YAxis tick={{ fontSize: 11 }} className="fill-muted-foreground" allowDecimals={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "var(--popover)",
                        border: "1px solid var(--border)",
                        borderRadius: "var(--radius)",
                        color: "var(--popover-foreground)",
                      }}
                    />
                    <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                      {stats.bookingsByType.map((entry, index) => (
                        <rect key={index} fill={typeColors[entry.type] || "var(--primary)"} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Recent Bookings */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">Recent Bookings</CardTitle>
        </CardHeader>
        <CardContent>
          {stats.recentBookings.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">No bookings yet</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="text-right">Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stats.recentBookings.slice(0, 10).map((b) => (
                    <TableRow key={b.id}>
                      <TableCell className="font-medium text-sm">{b.user?.name || "—"}</TableCell>
                      <TableCell className="text-sm max-w-[160px] truncate">{b.product?.title || "—"}</TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-medium ${BOOKING_TYPE_COLORS[b.bookingType]}`}>
                          {b.bookingType}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-medium ${BOOKING_STATUS_COLORS[b.status]}`}>
                          {b.status}
                        </span>
                      </TableCell>
                      <TableCell className="text-right font-medium text-sm">{formatINR(b.totalPrice)}</TableCell>
                      <TableCell className="text-right text-xs text-muted-foreground">{formatDate(b.createdAt)}</TableCell>
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

// --- Users Tab ---

interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  phone?: string;
  createdAt: string;
  vendor?: { businessName: string };
}

function UsersTab() {
  const { token } = useAppStore();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("ALL");
  const [searchInput, setSearchInput] = useState("");

  const fetchUsers = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (roleFilter !== "ALL") params.set("role", roleFilter);
      if (search) params.set("search", search);
      const res = await fetch(`/api/admin/users?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch users");
      const data = await res.json();
      setUsers(Array.isArray(data) ? data : data.users || []);
    } catch {
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  }, [token, search, roleFilter]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput !== search) {
        setSearch(searchInput);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput, search]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const roleBadgeColor = (role: string) => {
    switch (role) {
      case "ADMIN": return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
      case "VENDOR": return "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400";
      case "CUSTOMER": return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400";
      default: return "bg-slate-100 text-slate-700 dark:bg-slate-900/30 dark:text-slate-400";
    }
  };

  if (loading) return <TableSkeleton />;

  return (
    <motion.div {...tabAnimation} className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search users by name or email..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={roleFilter} onValueChange={(v) => setRoleFilter(v)}>
          <SelectTrigger size="sm" className="w-[150px]">
            <SelectValue placeholder="Role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Roles</SelectItem>
            <SelectItem value="CUSTOMER">Customer</SelectItem>
            <SelectItem value="VENDOR">Vendor</SelectItem>
            <SelectItem value="ADMIN">Admin</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Users Table */}
      <Card>
        <CardContent className="p-0">
          {users.length === 0 ? (
            <div className="py-12 text-center">
              <Users className="h-10 w-10 mx-auto text-muted-foreground/40 mb-3" />
              <p className="text-sm text-muted-foreground">No users found</p>
            </div>
          ) : (
            <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Business Name</TableHead>
                    <TableHead className="text-right">Joined</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((u) => (
                    <TableRow key={u.id}>
                      <TableCell className="font-medium text-sm">{u.name}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{u.email}</TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium ${roleBadgeColor(u.role)}`}>
                          {u.role}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{u.phone || "—"}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{u.vendor?.businessName || "—"}</TableCell>
                      <TableCell className="text-right text-xs text-muted-foreground">{formatDate(u.createdAt)}</TableCell>
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

// --- Vendors Tab ---

interface AdminVendor {
  id: string;
  userId: string;
  businessName: string;
  isVerified: boolean;
  isSuspended: boolean;
  productsCount: number;
  bookingsCount: number;
  user: { name: string; email: string; phone?: string };
}

function VendorsTab() {
  const { token } = useAppStore();
  const [vendors, setVendors] = useState<AdminVendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchVendors = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch("/api/admin/vendors", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch vendors");
      const data = await res.json();
      setVendors(Array.isArray(data) ? data : data.vendors || []);
    } catch {
      toast.error("Failed to load vendors");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchVendors();
  }, [fetchVendors]);

  const handleAction = async (vendorId: string, action: "verify" | "suspend" | "unsuspend") => {
    if (!token) return;
    setActionLoading(vendorId);
    try {
      const res = await fetch("/api/admin/vendors", {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ vendorId, action }),
      });
      if (!res.ok) throw new Error("Action failed");
      toast.success(`Vendor ${action}d successfully`);
      fetchVendors();
    } catch {
      toast.error(`Failed to ${action} vendor`);
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) return <TableSkeleton rows={6} />;

  return (
    <motion.div {...tabAnimation}>
      <Card>
        <CardContent className="p-0">
          {vendors.length === 0 ? (
            <div className="py-12 text-center">
              <Store className="h-10 w-10 mx-auto text-muted-foreground/40 mb-3" />
              <p className="text-sm text-muted-foreground">No vendors found</p>
            </div>
          ) : (
            <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Business Name</TableHead>
                    <TableHead>Admin Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Products</TableHead>
                    <TableHead>Bookings</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {vendors.map((v) => (
                    <TableRow key={v.id}>
                      <TableCell className="font-medium text-sm">{v.businessName}</TableCell>
                      <TableCell className="text-sm">{v.user?.name || "—"}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{v.user?.email || "—"}</TableCell>
                      <TableCell className="text-sm text-center">{v.productsCount}</TableCell>
                      <TableCell className="text-sm text-center">{v.bookingsCount}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          {v.isVerified && (
                            <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 text-[10px] border-0">
                              <CheckCircle className="h-3 w-3 mr-0.5" />
                              Verified
                            </Badge>
                          )}
                          {v.isSuspended && (
                            <Badge className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 text-[10px] border-0">
                              <Ban className="h-3 w-3 mr-0.5" />
                              Suspended
                            </Badge>
                          )}
                          {!v.isVerified && !v.isSuspended && (
                            <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 text-[10px] border-0">
                              <AlertCircle className="h-3 w-3 mr-0.5" />
                              Unverified
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {!v.isVerified && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-xs text-emerald-600 border-emerald-300 hover:bg-emerald-50 dark:text-emerald-400 dark:border-emerald-800 dark:hover:bg-emerald-900/20"
                              disabled={actionLoading === v.id}
                              onClick={() => handleAction(v.id, "verify")}
                            >
                              {actionLoading === v.id ? (
                                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                              ) : (
                                <Shield className="h-3 w-3 mr-1" />
                              )}
                              Verify
                            </Button>
                          )}
                          {v.isSuspended ? (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-xs text-primary border-primary/30 hover:bg-primary/5 dark:border-primary/50"
                              disabled={actionLoading === v.id}
                              onClick={() => handleAction(v.id, "unsuspend")}
                            >
                              {actionLoading === v.id ? (
                                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                              ) : (
                                <Check className="h-3 w-3 mr-1" />
                              )}
                              Un-suspend
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-xs text-red-600 border-red-300 hover:bg-red-50 dark:text-red-400 dark:border-red-800 dark:hover:bg-red-900/20"
                              disabled={actionLoading === v.id}
                              onClick={() => handleAction(v.id, "suspend")}
                            >
                              {actionLoading === v.id ? (
                                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                              ) : (
                                <Ban className="h-3 w-3 mr-1" />
                              )}
                              Suspend
                            </Button>
                          )}
                        </div>
                      </TableCell>
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

// --- Products Tab ---

interface AdminProduct {
  id: string;
  title: string;
  vendor: { businessName: string; isVerified: boolean };
  category: { name: string };
  rentPricePerDay: number;
  buyPrice: number;
  stock: number;
  status: ProductStatus;
  _count?: { bookings: number; reviews: number };
}

function ProductsTab() {
  const { token } = useAppStore();
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const fetchProducts = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      const res = await fetch(`/api/admin/products?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch products");
      const data = await res.json();
      setProducts(Array.isArray(data) ? data : data.products || []);
    } catch {
      toast.error("Failed to load products");
    } finally {
      setLoading(false);
    }
  }, [token, search]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput !== search) {
        setSearch(searchInput);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput, search]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleToggle = async (productId: string, currentStatus: ProductStatus) => {
    if (!token) return;
    const newStatus: ProductStatus = currentStatus === "AVAILABLE" ? "UNAVAILABLE" : "AVAILABLE";
    setTogglingId(productId);
    try {
      const res = await fetch("/api/admin/products", {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ productId, status: newStatus }),
      });
      if (!res.ok) throw new Error("Failed to update product");
      toast.success(`Product ${newStatus.toLowerCase()}`);
      fetchProducts();
    } catch {
      toast.error("Failed to update product status");
    } finally {
      setTogglingId(null);
    }
  };

  if (loading) return <TableSkeleton />;

  return (
    <motion.div {...tabAnimation} className="space-y-4">
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search products..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className="pl-10"
        />
      </div>

      <Card>
        <CardContent className="p-0">
          {products.length === 0 ? (
            <div className="py-12 text-center">
              <Package className="h-10 w-10 mx-auto text-muted-foreground/40 mb-3" />
              <p className="text-sm text-muted-foreground">No products found</p>
            </div>
          ) : (
            <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Vendor</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead className="text-right">Price/Day</TableHead>
                    <TableHead className="text-center">Stock</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-center">Bookings</TableHead>
                    <TableHead className="text-center">Reviews</TableHead>
                    <TableHead className="text-right">Toggle</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium text-sm max-w-[180px] truncate">{p.title}</TableCell>
                      <TableCell className="text-sm">
                        <div className="flex items-center gap-1.5">
                          {p.vendor?.businessName || "—"}
                          {p.vendor?.isVerified && (
                            <CheckCircle className="h-3 w-3 text-emerald-500 shrink-0" />
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{p.category?.name || "—"}</TableCell>
                      <TableCell className="text-right text-sm font-medium">{formatINR(p.rentPricePerDay)}</TableCell>
                      <TableCell className="text-center text-sm">{p.stock}</TableCell>
                      <TableCell>
                        <Badge
                          className={`text-[10px] border-0 ${
                            p.status === "AVAILABLE"
                              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                              : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                          }`}
                        >
                          {p.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center text-sm">{p._count?.bookings || 0}</TableCell>
                      <TableCell className="text-center text-sm">{p._count?.reviews || 0}</TableCell>
                      <TableCell className="text-right">
                        <Switch
                          checked={p.status === "AVAILABLE"}
                          disabled={togglingId === p.id}
                          onCheckedChange={() => handleToggle(p.id, p.status)}
                        />
                      </TableCell>
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

function AdminBookingsTab() {
  const { token } = useAppStore();
  const [bookings, setBookings] = useState<AppBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  const fetchBookings = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "ALL") params.set("status", statusFilter);
      const res = await fetch(`/api/admin/bookings?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch bookings");
      const data = await res.json();
      setBookings(Array.isArray(data) ? data : data.bookings || []);
    } catch {
      toast.error("Failed to load bookings");
    } finally {
      setLoading(false);
    }
  }, [token, statusFilter]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  if (loading) return <TableSkeleton />;

  return (
    <motion.div {...tabAnimation} className="space-y-4">
      <div className="flex flex-wrap gap-3 items-center">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Filter className="h-4 w-4" />
          <span className="font-medium">Status:</span>
        </div>
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v)}>
          <SelectTrigger size="sm" className="w-[160px]">
            <SelectValue placeholder="All Statuses" />
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
      </div>

      <Card>
        <CardContent className="p-0">
          {bookings.length === 0 ? (
            <div className="py-12 text-center">
              <Calendar className="h-10 w-10 mx-auto text-muted-foreground/40 mb-3" />
              <p className="text-sm text-muted-foreground">No bookings found</p>
            </div>
          ) : (
            <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>Vendor</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Dates</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead>Payment</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bookings.map((b) => (
                    <TableRow key={b.id}>
                      <TableCell className="font-medium text-sm">{b.user?.name || "—"}</TableCell>
                      <TableCell className="text-sm max-w-[140px] truncate">{b.product?.title || "—"}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">—</TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-medium ${BOOKING_TYPE_COLORS[b.bookingType]}`}>
                          {b.bookingType}
                        </span>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {b.startDate && b.endDate
                          ? `${formatDate(b.startDate)} – ${formatDate(b.endDate)}`
                          : "—"}
                      </TableCell>
                      <TableCell className="text-right font-medium text-sm">{formatINR(b.totalPrice)}</TableCell>
                      <TableCell>
                        <span className={`text-[10px] font-medium capitalize ${
                          b.payment?.paymentStatus === "COMPLETED"
                            ? "text-emerald-600 dark:text-emerald-400"
                            : b.payment?.paymentStatus === "FAILED"
                            ? "text-red-600 dark:text-red-400"
                            : "text-amber-600 dark:text-amber-400"
                        }`}>
                          {b.payment?.paymentStatus || "—"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-medium ${BOOKING_STATUS_COLORS[b.status]}`}>
                          {b.status}
                        </span>
                      </TableCell>
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

// --- Main Component ---

export default function AdminDashboard() {
  const { adminTab, setAdminTab, token, navigateTo } = useAppStore();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    async function fetchStats() {
      try {
        const res = await fetch("/api/admin/stats", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Failed to fetch stats");
        const data = await res.json();
        setStats(data);
      } catch {
        toast.error("Failed to load admin stats");
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, [token]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Admin Dashboard</h2>
          <p className="text-sm text-muted-foreground mt-1">Platform management, user oversight, and system analytics</p>
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
        value={adminTab}
        onValueChange={(v) => setAdminTab(v as typeof adminTab)}
        className="w-full"
      >
        <TabsList className="flex-wrap h-auto gap-1 p-1">
          <TabsTrigger value="overview" className="text-xs sm:text-sm">
            <Eye className="h-3.5 w-3.5 sm:mr-1.5" />
            <span className="hidden sm:inline">Overview</span>
          </TabsTrigger>
          <TabsTrigger value="users" className="text-xs sm:text-sm">
            <Users className="h-3.5 w-3.5 sm:mr-1.5" />
            <span className="hidden sm:inline">Users</span>
          </TabsTrigger>
          <TabsTrigger value="vendors" className="text-xs sm:text-sm">
            <Store className="h-3.5 w-3.5 sm:mr-1.5" />
            <span className="hidden sm:inline">Vendors</span>
          </TabsTrigger>
          <TabsTrigger value="products" className="text-xs sm:text-sm">
            <Package className="h-3.5 w-3.5 sm:mr-1.5" />
            <span className="hidden sm:inline">Products</span>
          </TabsTrigger>
          <TabsTrigger value="bookings" className="text-xs sm:text-sm">
            <Calendar className="h-3.5 w-3.5 sm:mr-1.5" />
            <span className="hidden sm:inline">Bookings</span>
          </TabsTrigger>
        </TabsList>

        <AnimatePresence mode="wait">
          {adminTab === "overview" && (
            <TabsContent value="overview">
              <AdminOverviewTab stats={loading ? null : stats} />
            </TabsContent>
          )}
          {adminTab === "users" && (
            <TabsContent value="users">
              <UsersTab />
            </TabsContent>
          )}
          {adminTab === "vendors" && (
            <TabsContent value="vendors">
              <VendorsTab />
            </TabsContent>
          )}
          {adminTab === "products" && (
            <TabsContent value="products">
              <ProductsTab />
            </TabsContent>
          )}
          {adminTab === "bookings" && (
            <TabsContent value="bookings">
              <AdminBookingsTab />
            </TabsContent>
          )}
        </AnimatePresence>
      </Tabs>
    </div>
  );
}