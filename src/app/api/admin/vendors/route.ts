import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyToken, getTokenFromHeader } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const token = getTokenFromHeader(req);
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const payload = await verifyToken(token);
    if (!payload || payload.role !== "ADMIN") return NextResponse.json({ error: "Admin access required" }, { status: 403 });

    const vendors = await db.vendor.findMany({
      include: {
        user: { select: { id: true, name: true, email: true, phone: true, createdAt: true } },
        _count: { select: { products: true } },
        products: { select: { bookings: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    const vendorData = vendors.map((v) => ({
      ...v,
      totalBookings: v.products.reduce((s, p) => s + p.bookings.length, 0),
      products: undefined,
    }));

    return NextResponse.json({ vendors: vendorData });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch vendors";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const token = getTokenFromHeader(req);
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const payload = await verifyToken(token);
    if (!payload || payload.role !== "ADMIN") return NextResponse.json({ error: "Admin access required" }, { status: 403 });

    const { vendorId, action } = await req.json();
    if (!vendorId || !action) return NextResponse.json({ error: "Vendor ID and action required" }, { status: 400 });

    const data: Record<string, boolean> = {};
    if (action === "verify") data.isVerified = true;
    else if (action === "suspend") data.isSuspended = true;
    else if (action === "unsuspend") data.isSuspended = false;
    else if (action === "unverify") data.isVerified = false;
    else return NextResponse.json({ error: "Invalid action" }, { status: 400 });

    const vendor = await db.vendor.update({ where: { id: vendorId }, data });
    return NextResponse.json({ vendor });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to update vendor";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}