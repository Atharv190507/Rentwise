import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const categoryId = searchParams.get("categoryId");
    const search = searchParams.get("search");
    const bookingType = searchParams.get("bookingType");
    const minPrice = searchParams.get("minPrice");
    const maxPrice = searchParams.get("maxPrice");
    const condition = searchParams.get("condition");
    const sort = searchParams.get("sort") || "newest";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "12");
    const exclude = searchParams.get("exclude");

    const where: Record<string, unknown> = { status: "AVAILABLE" };

    if (categoryId) {
      where.categoryId = categoryId;
    } else if (category) {
      const cat = await db.category.findUnique({ where: { slug: category } });
      if (cat) where.categoryId = cat.id;
    }
    if (search) {
      where.OR = [
        { title: { contains: search } },
        { description: { contains: search } },
      ];
    }
    if (condition) {
      where.condition = condition;
    }
    if (exclude) {
      where.id = { not: exclude };
    }
    if (minPrice || maxPrice) {
      const priceField = bookingType === "BUY" ? "buyPrice" : "rentPricePerDay";
      (where as Record<string, unknown>)[priceField] = {};
      if (minPrice) (where[priceField] as Record<string, unknown>).gte = parseFloat(minPrice);
      if (maxPrice) (where[priceField] as Record<string, unknown>).lte = parseFloat(maxPrice);
    }

    const orderBy: Record<string, string> = {};
    if (sort === "price_low") orderBy.rentPricePerDay = "asc";
    else if (sort === "price_high") orderBy.rentPricePerDay = "desc";
    else if (sort === "rating") orderBy.createdAt = "desc";
    else orderBy.createdAt = "desc";

    const [products, total] = await Promise.all([
      db.product.findMany({
        where,
        include: {
          vendor: { select: { id: true, businessName: true, isVerified: true } },
          category: { select: { id: true, name: true, icon: true } },
          _count: { select: { reviews: true } },
          reviews: { select: { rating: true } },
        },
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.product.count({ where }),
    ]);

    const productsWithAvg = products.map((p) => ({
      ...p,
      avgRating: p.reviews.length
        ? p.reviews.reduce((sum: number, r: { rating: number }) => sum + r.rating, 0) / p.reviews.length
        : 0,
      reviews: undefined,
    }));

    return NextResponse.json({ products: productsWithAvg, total, page, limit, pages: Math.ceil(total / limit) });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch products";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}