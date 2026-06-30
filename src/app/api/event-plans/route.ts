import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyToken, getTokenFromHeader } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    // Authenticate user
    const token = getTokenFromHeader(req);
    if (!token) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const payload = await verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: "Invalid or expired token" }, { status: 401 });
    }

    // Fetch user's event plans with booking counts
    const plans = await db.eventPlan.findMany({
      where: { userId: payload.userId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        eventType: true,
        guests: true,
        budget: true,
        status: true,
        selectedTier: true,
        createdAt: true,
        _count: {
          select: { packageBookings: true },
        },
      },
    });

    return NextResponse.json(plans);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch event plans";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}