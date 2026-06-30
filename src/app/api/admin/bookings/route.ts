import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyToken, getTokenFromHeader } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const token = getTokenFromHeader(req);
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const payload = await verifyToken(token);
    if (!payload || payload.role !== "ADMIN") return NextResponse.json({ error: "Admin access required" }, { status: 403 });

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");

    const where: Record<string, unknown> = {};
    if (status) where.status = status;

    const [bookings, total] = await Promise.all([
      db.booking.findMany({
        where,
        include: {
          user: { select: { name: true, email: true } },
          product: { select: { title: true, vendor: { select: { businessName: true } } } },
          payment: { select: { paymentStatus: true, amount: true } },
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