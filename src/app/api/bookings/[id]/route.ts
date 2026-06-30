import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyToken, getTokenFromHeader } from "@/lib/auth";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const booking = await db.booking.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, name: true, email: true, phone: true } },
        product: {
          select: { id: true, title: true, imageUrl: true, rentPricePerDay: true, buyPrice: true, vendor: { select: { businessName: true } } },
        },
        payment: true,
        return_: true,
        review: { include: { user: { select: { name: true } } } },
      },
    });
    if (!booking) return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    return NextResponse.json({ booking });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch booking";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = getTokenFromHeader(req);
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const payload = await verifyToken(token);
    if (!payload) return NextResponse.json({ error: "Invalid token" }, { status: 401 });

    const { id } = await params;
    const body = await req.json();
    const { status } = body;

    const booking = await db.booking.findUnique({
      where: { id },
      include: { product: true },
    });

    if (!booking) return NextResponse.json({ error: "Booking not found" }, { status: 404 });

    // Check permissions: vendor can update their products' bookings, customer can cancel
    const isVendor = payload.role === "VENDOR" && booking.product.vendorId === payload.userId;
    const isCustomer = payload.userId === booking.userId;
    const isAdmin = payload.role === "ADMIN";

    if (!isVendor && !isCustomer && !isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Customer can only cancel
    if (isCustomer && status !== "CANCELLED") {
      return NextResponse.json({ error: "Customers can only cancel bookings" }, { status: 403 });
    }

    const updated = await db.booking.update({
      where: { id },
      data: { status },
      include: {
        product: { select: { id: true, title: true, imageUrl: true, rentPricePerDay: true, buyPrice: true } },
        payment: { select: { id: true, paymentStatus: true, amount: true } },
      },
    });

    // If cancelled, restore stock
    if (status === "CANCELLED") {
      await db.product.update({
        where: { id: booking.productId },
        data: { stock: { increment: booking.quantity } },
      });
    }

    // If completed, create payment record
    if ((status === "APPROVED" || status === "CONFIRMED") && !booking.payment) {
      await db.payment.create({
        data: {
          bookingId: id,
          amount: booking.totalPrice,
          paymentStatus: status === "CONFIRMED" ? "COMPLETED" : "PENDING",
          paymentMethod: "ONLINE",
          paidAt: status === "CONFIRMED" ? new Date() : null,
        },
      });
    }

    return NextResponse.json({ booking: updated });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to update booking";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}