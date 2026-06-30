import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyToken, getTokenFromHeader } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const token = getTokenFromHeader(req);
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const payload = await verifyToken(token);
    if (!payload || payload.role !== "VENDOR") return NextResponse.json({ error: "Vendor access required" }, { status: 403 });

    const vendor = await db.vendor.findUnique({ where: { userId: payload.userId } });
    if (!vendor) return NextResponse.json({ error: "Vendor not found" }, { status: 404 });

    const body = await req.json();
    const { title, description, features, categoryId, buyPrice, rentPricePerDay, deposit, stock, condition, images, listingTypes, location } = body;

    if (!title || !categoryId || !buyPrice || !rentPricePerDay) {
      return NextResponse.json({ error: "Title, category, prices are required" }, { status: 400 });
    }

    // Parse images array — use first image as imageUrl for backward compat
    let parsedImages: string[] = [];
    if (images) {
      try {
        parsedImages = typeof images === "string" ? JSON.parse(images) : images;
        if (!Array.isArray(parsedImages)) parsedImages = [];
      } catch {
        parsedImages = [];
      }
    }
    const primaryImage = parsedImages.length > 0 ? parsedImages[0] : null;

    const product = await db.product.create({
      data: {
        vendorId: vendor.id,
        categoryId,
        title,
        slug: title.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
        description: description || "",
        features: features ? JSON.stringify(features) : "[]",
        buyPrice: parseFloat(buyPrice),
        rentPricePerDay: parseFloat(rentPricePerDay),
        deposit: parseFloat(deposit) || 0,
        stock: parseInt(stock) || 1,
        condition: condition || "GOOD",
        imageUrl: primaryImage,
        images: parsedImages.length > 0 ? JSON.stringify(parsedImages) : null,
        listingTypes: listingTypes || "RENT,BOOK",
        location: location || null,
      },
    });

    return NextResponse.json({ product }, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to create product";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const token = getTokenFromHeader(req);
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const payload = await verifyToken(token);
    if (!payload || payload.role !== "VENDOR") return NextResponse.json({ error: "Vendor access required" }, { status: 403 });

    const vendor = await db.vendor.findUnique({ where: { userId: payload.userId } });
    if (!vendor) return NextResponse.json({ error: "Vendor not found" }, { status: 404 });

    const products = await db.product.findMany({
      where: { vendorId: vendor.id },
      include: {
        vendor: { select: { id: true, businessName: true, isVerified: true } },
        category: { select: { id: true, name: true, icon: true } },
        reviews: { select: { rating: true } },
        _count: { select: { bookings: true, reviews: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    const productsWithAvg = products.map((p) => ({
      ...p,
      avgRating: p.reviews.length
        ? p.reviews.reduce((sum: number, r: { rating: number }) => sum + r.rating, 0) / p.reviews.length
        : 0,
      reviews: undefined,
    }));

    return NextResponse.json({ products: productsWithAvg });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch products";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}