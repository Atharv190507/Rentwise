import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyToken, getTokenFromHeader } from "@/lib/auth";

interface PackageItemData {
  productId: string | null;
  productName: string;
  category?: string;
  quantity: number;
  rentPerDay: number;
  duration: number;
  subtotal: number;
  deposit: number;
  vendorId?: string | null;
  vendorName?: string | null;
  vendorRating?: number;
  priority: string;
  reason?: string;
}

interface TierPackage {
  tier: string;
  name: string;
  description?: string;
  totalCost: number;
  totalDeposit: number;
  items: PackageItemData[];
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 1. Authenticate user
    const token = getTokenFromHeader(req);
    if (!token) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const payload = await verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: "Invalid or expired token" }, { status: 401 });
    }

    const { id } = await params;

    // 2. Parse request body
    const body = await req.json();
    const { tier, startDate, endDate } = body;

    if (!tier || !["ECONOMY", "STANDARD", "PREMIUM"].includes(tier)) {
      return NextResponse.json(
        { error: "A valid tier (ECONOMY, STANDARD, PREMIUM) is required" },
        { status: 400 }
      );
    }

    if (!startDate) {
      return NextResponse.json(
        { error: "startDate is required" },
        { status: 400 }
      );
    }

    // 3. Fetch the event plan and verify ownership
    const plan = await db.eventPlan.findUnique({
      where: { id },
      include: {
        packageBookings: true,
      },
    });

    if (!plan) {
      return NextResponse.json({ error: "Event plan not found" }, { status: 404 });
    }

    if (plan.userId !== payload.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    if (plan.status === "BOOKED") {
      return NextResponse.json(
        { error: "This plan has already been booked" },
        { status: 400 }
      );
    }

    // 4. Parse the plan's packages JSON
    let parsedPackages: Record<string, TierPackage>;
    try {
      parsedPackages = JSON.parse(plan.packages) as Record<string, TierPackage>;
    } catch {
      return NextResponse.json(
        { error: "Invalid package data in event plan" },
        { status: 500 }
      );
    }

    // 5. Find the selected tier
    const tierKey = tier.toLowerCase() as "economy" | "standard" | "premium";
    const selectedPackage = parsedPackages[tierKey];

    if (!selectedPackage || !selectedPackage.items || selectedPackage.items.length === 0) {
      return NextResponse.json(
        { error: `No items found for ${tier} tier` },
        { status: 400 }
      );
    }

    // 6. Create Booking, Payment, PackageBooking, and PackageItem records
    const parsedStartDate = new Date(startDate);
    const parsedEndDate = endDate ? new Date(endDate) : null;
    const calculatedDuration = parsedEndDate
      ? Math.max(
          1,
          Math.ceil(
            (parsedEndDate.getTime() - parsedStartDate.getTime()) / (1000 * 60 * 60 * 24)
          )
        )
      : plan.duration;

    let totalPackageCost = 0;
    let totalPackageDeposit = 0;

    const packageBooking = await db.packageBooking.create({
      data: {
        eventPlanId: plan.id,
        tier,
        totalCost: 0, // Will update after creating items
        totalDeposit: 0,
        savings: 0,
        status: "PENDING",
      },
    });

    // Create bookings and package items for each item in the tier
    for (const item of selectedPackage.items) {
      // Skip items without a valid productId
      if (!item.productId) {
        await db.packageItem.create({
          data: {
            packageBookingId: packageBooking.id,
            productId: null,
            categoryId: null,
            productName: item.productName || "Unknown",
            quantity: item.quantity || 1,
            rentPricePerDay: item.rentPerDay || 0,
            buyPrice: 0,
            duration: item.duration || plan.duration,
            subtotal: item.subtotal || 0,
            vendorId: item.vendorId || null,
            vendorName: item.vendorName || null,
            priority: item.priority || "MEDIUM",
            reason: item.reason || null,
          },
        });
        totalPackageCost += item.subtotal || 0;
        totalPackageDeposit += item.deposit || 0;
        continue;
      }

      // Verify product exists
      const product = await db.product.findUnique({
        where: { id: item.productId },
        select: { id: true, categoryId: true, vendorId: true },
      });

      if (!product) {
        // Product not found, create package item without booking
        await db.packageItem.create({
          data: {
            packageBookingId: packageBooking.id,
            productId: null,
            categoryId: null,
            productName: item.productName || "Unknown",
            quantity: item.quantity || 1,
            rentPricePerDay: item.rentPerDay || 0,
            buyPrice: 0,
            duration: item.duration || plan.duration,
            subtotal: item.subtotal || 0,
            vendorId: item.vendorId || null,
            vendorName: item.vendorName || null,
            priority: item.priority || "MEDIUM",
            reason: item.reason || null,
          },
        });
        totalPackageCost += item.subtotal || 0;
        totalPackageDeposit += item.deposit || 0;
        continue;
      }

      const quantity = item.quantity || 1;
      const duration = item.duration || plan.duration;
      const rentPerDay = item.rentPerDay || 0;
      const totalPrice = rentPerDay * duration * quantity;
      const depositAmount = item.deposit || 0;

      // Create Booking record
      const booking = await db.booking.create({
        data: {
          userId: payload.userId,
          productId: product.id,
          bookingType: "RENT",
          startDate: parsedStartDate,
          endDate: parsedEndDate,
          quantity,
          totalPrice,
          depositAmount,
          status: "PENDING",
          notes: `Booked via AI Event Plan (${tier} tier)`,
        },
      });

      // Create Payment record
      await db.payment.create({
        data: {
          bookingId: booking.id,
          paymentMethod: "ONLINE",
          amount: totalPrice + depositAmount,
          paymentStatus: "PENDING",
        },
      });

      // Create PackageItem record
      await db.packageItem.create({
        data: {
          packageBookingId: packageBooking.id,
          productId: product.id,
          categoryId: product.categoryId,
          productName: item.productName || "Unknown",
          quantity,
          rentPricePerDay: rentPerDay,
          buyPrice: 0,
          duration,
          subtotal: totalPrice,
          vendorId: item.vendorId || product.vendorId,
          vendorName: item.vendorName || null,
          priority: item.priority || "MEDIUM",
          reason: item.reason || null,
        },
      });

      totalPackageCost += totalPrice;
      totalPackageDeposit += depositAmount;
    }

    // 7. Update PackageBooking with calculated totals
    await db.packageBooking.update({
      where: { id: packageBooking.id },
      data: {
        totalCost: totalPackageCost,
        totalDeposit: totalPackageDeposit,
      },
    });

    // 8. Update EventPlan status and selectedTier
    await db.eventPlan.update({
      where: { id: plan.id },
      data: {
        status: "BOOKED",
        selectedTier: tier,
      },
    });

    // 9. Return success response
    return NextResponse.json({
      success: true,
      message: `${tier} package booked successfully`,
      booking: {
        packageBookingId: packageBooking.id,
        tier,
        totalCost: totalPackageCost,
        totalDeposit: totalPackageDeposit,
        startDate: parsedStartDate,
        endDate: parsedEndDate,
        duration: calculatedDuration,
        itemCount: selectedPackage.items.length,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to book package";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}