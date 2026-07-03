import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyToken, getTokenFromHeader, getOrCreateVendor } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const token = getTokenFromHeader(req);
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const payload = await verifyToken(token);
    if (!payload || payload.role !== "VENDOR") return NextResponse.json({ error: "Vendor access required" }, { status: 403 });

    const vendor = await getOrCreateVendor(payload.userId);

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");

    const where: Record<string, unknown> = { product: { vendorId: vendor.id } };
    if (status) where.status = status;

    const bookings = await db.booking.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, email: true, phone: true } },
        product: { select: { id: true, title: true, imageUrl: true } },
        payment: { select: { paymentStatus: true, amount: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return NextResponse.json({ bookings });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch bookings";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}