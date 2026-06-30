import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyToken, getTokenFromHeader } from "@/lib/auth";

export async function GET() {
  try {
    const [totalUsers, totalVendors, totalProducts, totalBookings, activeRentals, pendingApprovals, totalRevenue] = await Promise.all([
      db.user.count({ where: { role: "CUSTOMER" } }),
      db.vendor.count(),
      db.product.count(),
      db.booking.count(),
      db.booking.count({ where: { status: { in: ["APPROVED", "CONFIRMED", "DELIVERED"] } } }),
      db.booking.count({ where: { status: "PENDING" } }),
      db.booking.aggregate({ where: { status: { in: ["COMPLETED", "DELIVERED"] } }, _sum: { totalPrice: true } }),
    ]);

    const bookingByStatus = await db.booking.groupBy({
      by: ["status"],
      _count: { id: true },
    });

    const bookingByType = await db.booking.groupBy({
      by: ["bookingType"],
      _count: { id: true },
    });

    const recentBookings = await db.booking.findMany({
      include: {
        user: { select: { name: true, email: true } },
        product: { select: { title: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    return NextResponse.json({
      totalUsers,
      totalVendors,
      totalProducts,
      totalBookings,
      activeRentals,
      pendingApprovals,
      totalRevenue: totalRevenue._sum.totalPrice || 0,
      bookingsByStatus: bookingByStatus.map((b) => ({ status: b.status, count: b._count.id })),
      bookingsByType: bookingByType.map((b) => ({ type: b.bookingType, count: b._count.id })),
      recentBookings,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch stats";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}