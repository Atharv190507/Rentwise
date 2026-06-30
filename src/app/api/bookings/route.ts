import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyToken, getTokenFromHeader } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const token = getTokenFromHeader(req);
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const payload = await verifyToken(token);
    if (!payload) return NextResponse.json({ error: "Invalid token" }, { status: 401 });

    const body = await req.json();
    const { productId, bookingType, startDate, endDate, quantity, notes } = body;

    if (!productId || !bookingType) {
      return NextResponse.json({ error: "Product and booking type are required" }, { status: 400 });
    }

    const product = await db.product.findUnique({ where: { id: productId } });
    if (!product) return NextResponse.json({ error: "Product not found" }, { status: 404 });
    if (product.stock < (quantity || 1)) {
      return NextResponse.json({ error: "Insufficient stock" }, { status: 400 });
    }

    const qty = quantity || 1;
    let totalPrice = 0;
    let depositAmount = 0;

    if (bookingType === "RENT") {
      if (!startDate || !endDate) {
        return NextResponse.json({ error: "Start and end dates required for rental" }, { status: 400 });
      }
      const start = new Date(startDate);
      const end = new Date(endDate);
      const days = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / 86400000));
      totalPrice = product.rentPricePerDay * days * qty;
      depositAmount = product.deposit * qty;
    } else if (bookingType === "BUY") {
      totalPrice = product.buyPrice * qty;
    } else {
      if (!startDate || !endDate) {
        return NextResponse.json({ error: "Start and end dates required for booking" }, { status: 400 });
      }
      const start = new Date(startDate);
      const end = new Date(endDate);
      const days = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / 86400000));
      totalPrice = product.rentPricePerDay * Math.max(1, Math.floor(days / 2)) * qty;
    }

    const booking = await db.booking.create({
      data: {
        userId: payload.userId,
        productId,
        bookingType,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        quantity: qty,
        totalPrice,
        depositAmount,
        status: "PENDING",
        notes: notes || null,
      },
      include: {
        product: { select: { id: true, title: true, imageUrl: true, rentPricePerDay: true, buyPrice: true } },
      },
    });

    // Reduce stock
    await db.product.update({
      where: { id: productId },
      data: { stock: { decrement: qty } },
    });

    return NextResponse.json({ booking }, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to create booking";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const token = getTokenFromHeader(req);
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const payload = await verifyToken(token);
    if (!payload) return NextResponse.json({ error: "Invalid token" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const type = searchParams.get("type");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");

    const where: Record<string, unknown> = { userId: payload.userId };
    if (status) where.status = status;
    if (type) where.bookingType = type;

    const [bookings, total] = await Promise.all([
      db.booking.findMany({
        where,
        include: {
          product: { select: { id: true, title: true, imageUrl: true, rentPricePerDay: true, buyPrice: true } },
          payment: { select: { id: true, paymentStatus: true, amount: true } },
          review: { select: { id: true, rating: true, comment: true } },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.booking.count({ where }),
    ]);

    return NextResponse.json({ bookings, total, page, pages: Math.ceil(total / limit) });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch bookings";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}