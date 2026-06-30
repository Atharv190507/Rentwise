import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyToken, getTokenFromHeader } from "@/lib/auth";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;

    // Fetch the event plan
    const plan = await db.eventPlan.findUnique({
      where: { id },
      include: {
        _count: {
          select: { packageBookings: true },
        },
        packageBookings: {
          include: {
            items: true,
          },
        },
      },
    });

    if (!plan) {
      return NextResponse.json({ error: "Event plan not found" }, { status: 404 });
    }

    // Must be the owner
    if (plan.userId !== payload.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Parse packages JSON
    let parsedPackages;
    try {
      parsedPackages = JSON.parse(plan.packages);
    } catch {
      parsedPackages = {};
    }

    return NextResponse.json({
      ...plan,
      packages: parsedPackages,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch event plan";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;

    // Fetch the event plan
    const plan = await db.eventPlan.findUnique({
      where: { id },
    });

    if (!plan) {
      return NextResponse.json({ error: "Event plan not found" }, { status: 404 });
    }

    // Must be the owner
    if (plan.userId !== payload.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Only DRAFT plans can be deleted
    if (plan.status !== "DRAFT") {
      return NextResponse.json(
        { error: "Only DRAFT plans can be deleted" },
        { status: 400 }
      );
    }

    // Delete the plan (cascade will handle packageBookings and packageItems)
    await db.eventPlan.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: "Event plan deleted" });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to delete event plan";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}