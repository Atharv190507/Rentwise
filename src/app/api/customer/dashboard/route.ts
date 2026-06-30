import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyToken, getTokenFromHeader } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const token = getTokenFromHeader(req);
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const payload = await verifyToken(token);
    if (!payload) return NextResponse.json({ error: "Invalid token" }, { status: 401 });

    const [activeBookings, totalBookings, completedRentals, totalSpent, savedByRenting] = await Promise.all([
      db.booking.count({ where: { userId: payload.userId, status: { in: ["PENDING", "APPROVED", "CONFIRMED", "DELIVERED"] } } }),
      db.booking.count({ where: { userId: payload.userId } }),
      db.booking.count({ where: { userId: payload.userId, status: "COMPLETED", bookingType: "RENT" } }),
      db.booking.aggregate({ where: { userId: payload.userId, status: { in: ["COMPLETED", "CONFIRMED", "DELIVERED"] } }, _sum: { totalPrice: true } }),
      // Estimate savings: for completed rentals, savings = (buyPrice * qty) - totalRentalCost
      db.$queryRaw<Array<{ savings: number }>>`
        SELECT SUM(p.buyPrice * b.quantity - b.totalPrice) as savings
        FROM Booking b
        JOIN Product p ON b.productId = p.id
        WHERE b.userId = ${payload.userId} AND b.status = 'COMPLETED' AND b.bookingType = 'RENT'
      `,
    ]);

    const recentBookings = await db.booking.findMany({
      where: { userId: payload.userId },
      include: {
        product: { select: { id: true, title: true, imageUrl: true, rentPricePerDay: true, buyPrice: true } },
        payment: { select: { paymentStatus: true, amount: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    });

    const aiHistory = await db.aIRecommendation.findMany({
      where: { userId: payload.userId },
      orderBy: { createdAt: "desc" },
      take: 5,
    });

    return NextResponse.json({
      activeBookings,
      totalBookings,
      completedRentals,
      totalSpent: totalSpent._sum.totalPrice || 0,
      savedByRenting: savedByRenting[0]?.savings || 0,
      recentBookings,
      aiHistory,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch dashboard data";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}