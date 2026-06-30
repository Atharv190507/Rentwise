import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const product = await db.product.findUnique({
      where: { id },
      include: {
        vendor: { select: { id: true, businessName: true, isVerified: true, rating: true } },
        category: { select: { id: true, name: true, icon: true, slug: true } },
        reviews: {
          include: { user: { select: { id: true, name: true, avatar: true } } },
          orderBy: { createdAt: "desc" },
          take: 20,
        },
        _count: { select: { reviews: true, bookings: true } },
      },
    });

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const avgRating = product.reviews.length
      ? product.reviews.reduce((sum, r) => sum + r.rating, 0) / product.reviews.length
      : 0;

    // Related products
    const related = await db.product.findMany({
      where: { categoryId: product.categoryId, id: { not: product.id }, status: "AVAILABLE" },
      include: {
        vendor: { select: { id: true, businessName: true, isVerified: true } },
        category: { select: { id: true, name: true } },
        _count: { select: { reviews: true } },
        reviews: { select: { rating: true } },
      },
      take: 4,
    });

    return NextResponse.json({
      ...product,
      avgRating,
      related: related.map((r) => ({
        ...r,
        avgRating: r.reviews.length ? r.reviews.reduce((s, rv) => s + rv.rating, 0) / r.reviews.length : 0,
        reviews: undefined,
      })),
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch product";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}