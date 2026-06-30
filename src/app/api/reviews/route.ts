import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyToken, getTokenFromHeader } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const token = getTokenFromHeader(req);
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const payload = await verifyToken(token);
    if (!payload) return NextResponse.json({ error: "Invalid token" }, { status: 401 });

    const { productId, bookingId, rating, comment } = await req.json();
    if (!productId || !rating || rating < 1 || rating > 5) {
      return NextResponse.json({ error: "Valid product ID and rating (1-5) required" }, { status: 400 });
    }

    // Check if already reviewed
    const existing = await db.review.findFirst({
      where: { userId: payload.userId, productId, bookingId },
    });
    if (existing) {
      return NextResponse.json({ error: "You already reviewed this" }, { status: 409 });
    }

    const review = await db.review.create({
      data: {
        userId: payload.userId,
        productId,
        bookingId: bookingId || null,
        rating,
        comment: comment || null,
      },
      include: { user: { select: { id: true, name: true, avatar: true } } },
    });

    return NextResponse.json({ review }, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to create review";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const productId = searchParams.get("productId");
    if (!productId) return NextResponse.json({ error: "Product ID required" }, { status: 400 });

    const reviews = await db.review.findMany({
      where: { productId },
      include: { user: { select: { id: true, name: true, avatar: true } } },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    const avg = reviews.length
      ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
      : 0;

    return NextResponse.json({ reviews, avgRating: parseFloat(avg.toFixed(1)), total: reviews.length });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch reviews";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}