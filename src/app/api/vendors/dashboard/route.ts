import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyToken, getTokenFromHeader } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const token = getTokenFromHeader(req);
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const payload = await verifyToken(token);
    if (!payload || payload.role !== "VENDOR") return NextResponse.json({ error: "Vendor access required" }, { status: 403 });

    const vendor = await db.vendor.findUnique({ where: { userId: payload.userId } });
    if (!vendor) return NextResponse.json({ error: "Vendor profile not found" }, { status: 404 });

    const [totalProducts, activeBookings, completedBookings, totalRevenue, pendingBookings] = await Promise.all([
      db.product.count({ where: { vendorId: vendor.id } }),
      db.booking.count({ where: { product: { vendorId: vendor.id }, status: { in: ["APPROVED", "CONFIRMED", "DELIVERED"] } } }),
      db.booking.count({ where: { product: { vendorId: vendor.id }, status: "COMPLETED" } }),
      db.booking.aggregate({ where: { product: { vendorId: vendor.id }, status: { in: ["COMPLETED", "DELIVERED"] } }, _sum: { totalPrice: true } }),
      db.booking.count({ where: { product: { vendorId: vendor.id }, status: "PENDING" } }),
    ]);

    // Monthly revenue for chart
    const monthlyRevenue = await db.$queryRaw<Array<{ month: string; total: number }>>`
      SELECT strftime('%Y-%m', createdAt) as month, SUM(totalPrice) as total
      FROM Booking
      WHERE productId IN (SELECT id FROM Product WHERE vendorId = ${vendor.id})
        AND status IN ('COMPLETED', 'DELIVERED')
      GROUP BY strftime('%Y-%m', createdAt)
      ORDER BY month DESC
      LIMIT 6
    `;

    // Top products
    const topProducts = await db.product.findMany({
      where: { vendorId: vendor.id },
      select: { id: true, title: true, stock: true, status: true, _count: { select: { bookings: true } } },
      orderBy: { createdAt: "desc" },
      take: 5,
    });

    return NextResponse.json({
      totalProducts,
      activeBookings,
      completedBookings,
      totalRevenue: totalRevenue._sum.totalPrice || 0,
      pendingBookings,
      monthlyRevenue,
      topProducts,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch vendor stats";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}