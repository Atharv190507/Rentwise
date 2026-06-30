"use client";

import { useState, useMemo } from "react";
import { format } from "date-fns";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { CalendarIcon, Loader2, Minus, Plus, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/stores/app-store";
import type { AppProduct, BookingType } from "@/lib/types";

interface BookingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: AppProduct;
  bookingType: BookingType;
}

function formatINR(amount: number): string {
  return "₹" + amount.toLocaleString("en-IN");
}

export default function BookingDialog({
  open,
  onOpenChange,
  product,
  bookingType,
}: BookingDialogProps) {
  const { user, token, navigateTo, openAuthDialog } = useAppStore();
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [startCalOpen, setStartCalOpen] = useState(false);
  const [endCalOpen, setEndCalOpen] = useState(false);

  const needsDates = bookingType === "RENT" || bookingType === "BOOK";

  const numberOfDays = useMemo(() => {
    if (!needsDates || !startDate || !endDate) return 0;
    const diff = endDate.getTime() - startDate.getTime();
    return Math.max(1, Math.ceil(diff / (1000 * 60 * 60 * 24)) + 1);
  }, [startDate, endDate, needsDates]);

  const priceBreakdown = useMemo(() => {
    let basePrice = 0;
    let depositAmount = product.deposit * quantity;

    if (bookingType === "RENT" || bookingType === "BOOK") {
      basePrice = product.rentPricePerDay * numberOfDays * quantity;
    } else if (bookingType === "BUY") {
      basePrice = product.buyPrice * quantity;
      depositAmount = 0;
    }

    return {
      basePrice,
      depositAmount,
      total: basePrice + depositAmount,
    };
  }, [bookingType, product, numberOfDays, quantity]);

  const handleSubmit = async () => {
    if (!user || !token) {
      onOpenChange(false);
      openAuthDialog("login");
      toast.error("Please login to make a booking");
      return;
    }

    if (needsDates && (!startDate || !endDate)) {
      toast.error("Please select start and end dates");
      return;
    }

    if (needsDates && numberOfDays <= 0) {
      toast.error("End date must be after start date");
      return;
    }

    if (quantity < 1) {
      toast.error("Quantity must be at least 1");
      return;
    }

    if (quantity > product.stock) {
      toast.error(`Only ${product.stock} available in stock`);
      return;
    }

    setLoading(true);
    try {
      const body: Record<string, unknown> = {
        productId: product.id,
        bookingType,
        quantity,
        notes: notes || undefined,
      };

      if (needsDates) {
        body.startDate = format(startDate!, "yyyy-MM-dd");
        body.endDate = format(endDate!, "yyyy-MM-dd");
      }

      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Booking failed");

      toast.success("Booking created successfully!");
      onOpenChange(false);

      // Navigate to customer dashboard bookings tab
      if (user.role === "CUSTOMER") {
        const { setCustomerTab } = useAppStore.getState();
        setCustomerTab("bookings");
        navigateTo("customer-dashboard");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Booking failed");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = (open: boolean) => {
    if (!open) {
      // Reset form
      setStartDate(undefined);
      setEndDate(undefined);
      setQuantity(1);
      setNotes("");
    }
    onOpenChange(open);
  };

  const TYPE_LABELS: Record<BookingType, string> = {
    RENT: "Rent",
    BUY: "Buy",
    BOOK: "Book",
  };

  const TYPE_COLORS: Record<BookingType, string> = {
    RENT: "text-emerald-600 dark:text-emerald-400",
    BUY: "text-violet-600 dark:text-violet-400",
    BOOK: "text-amber-600 dark:text-amber-400",
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Package className="h-5 w-5" />
            {TYPE_LABELS[bookingType]}: {product.title}
          </DialogTitle>
          <DialogDescription>
            Complete your {TYPE_LABELS[bookingType].toLowerCase()} request
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 pt-2">
          {/* Product Preview */}
          <div className="flex gap-3 p-3 rounded-lg bg-muted/50 border">
            {product.imageUrl ? (
              <img
                src={product.imageUrl}
                alt={product.title}
                className="h-16 w-16 rounded-md object-cover shrink-0"
              />
            ) : (
              <div className="h-16 w-16 rounded-md bg-muted flex items-center justify-center shrink-0">
                <Package className="h-6 w-6 text-muted-foreground" />
              </div>
            )}
            <div className="min-w-0">
              <p className="font-medium text-sm truncate">{product.title}</p>
              <p className="text-xs text-muted-foreground">
                {product.vendor.businessName}
              </p>
              <p className={`text-sm font-semibold mt-1 ${TYPE_COLORS[bookingType]}`}>
                {bookingType === "BUY"
                  ? formatINR(product.buyPrice)
                  : `${formatINR(product.rentPricePerDay)}/day`}
              </p>
            </div>
          </div>

          {/* Date Pickers */}
          {needsDates && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Start Date</Label>
                <Popover open={startCalOpen} onOpenChange={setStartCalOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !startDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {startDate ? format(startDate, "dd MMM yyyy") : "Pick date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={startDate}
                      onSelect={(date) => {
                        setStartDate(date);
                        setStartCalOpen(false);
                      }}
                      disabled={(date) =>
                        date < new Date(new Date().setHours(0, 0, 0, 0))
                      }
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-1.5">
                <Label>End Date</Label>
                <Popover open={endCalOpen} onOpenChange={setEndCalOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !endDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {endDate ? format(endDate, "dd MMM yyyy") : "Pick date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={endDate}
                      onSelect={(date) => {
                        setEndDate(date);
                        setEndCalOpen(false);
                      }}
                      disabled={(date) =>
                        date < (startDate || new Date(new Date().setHours(0, 0, 0, 0)))
                      }
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          )}

          {/* Quantity */}
          <div className="space-y-1.5">
            <Label>Quantity</Label>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="icon"
                className="h-9 w-9 rounded-full"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                disabled={quantity <= 1}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <Input
                type="number"
                value={quantity}
                onChange={(e) => {
                  const val = parseInt(e.target.value);
                  if (val > 0 && val <= product.stock) setQuantity(val);
                }}
                className="w-20 text-center h-9"
                min={1}
                max={product.stock}
              />
              <Button
                variant="outline"
                size="icon"
                className="h-9 w-9 rounded-full"
                onClick={() =>
                  setQuantity(Math.min(product.stock, quantity + 1))
                }
                disabled={quantity >= product.stock}
              >
                <Plus className="h-4 w-4" />
              </Button>
              <span className="text-xs text-muted-foreground">
                {product.stock} available
              </span>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <Label htmlFor="booking-notes">Notes (optional)</Label>
            <Textarea
              id="booking-notes"
              placeholder="Any special requirements..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
            />
          </div>

          <Separator />

          {/* Price Breakdown */}
          <div className="space-y-2">
            <h4 className="text-sm font-semibold">Price Breakdown</h4>
            {needsDates && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  {formatINR(product.rentPricePerDay)} × {numberOfDays} day
                  {numberOfDays !== 1 ? "s" : ""} × {quantity} qty
                </span>
                <span>{formatINR(priceBreakdown.basePrice)}</span>
              </div>
            )}
            {bookingType === "BUY" && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  {formatINR(product.buyPrice)} × {quantity} qty
                </span>
                <span>{formatINR(priceBreakdown.basePrice)}</span>
              </div>
            )}
            {priceBreakdown.depositAmount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  Refundable deposit × {quantity}
                </span>
                <span>{formatINR(priceBreakdown.depositAmount)}</span>
              </div>
            )}
            <Separator />
            <div className="flex justify-between text-base font-bold">
              <span>Total</span>
              <span className="text-primary">
                {formatINR(priceBreakdown.total)}
              </span>
            </div>
            {priceBreakdown.depositAmount > 0 && (
              <p className="text-xs text-muted-foreground">
                * Deposit is refundable upon safe return
              </p>
            )}
          </div>

          {/* Submit */}
          <Button
            className="w-full"
            onClick={handleSubmit}
            disabled={loading}
            size="lg"
          >
            {loading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            {user && token
              ? `Confirm ${TYPE_LABELS[bookingType]}`
              : `Login to ${TYPE_LABELS[bookingType].toLowerCase()}`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}