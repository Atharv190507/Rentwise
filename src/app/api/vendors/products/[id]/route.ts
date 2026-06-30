import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyToken, getTokenFromHeader } from "@/lib/auth";

// Shared helper: authenticate vendor and return vendor record
async function authenticateVendor(req: NextRequest) {
  const token = getTokenFromHeader(req);
  if (!token) return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  const payload = await verifyToken(token);
  if (!payload || payload.role !== "VENDOR") return { error: NextResponse.json({ error: "Vendor access required" }, { status: 403 }) };

  const vendor = await db.vendor.findUnique({ where: { userId: payload.userId } });
  if (!vendor) return { error: NextResponse.json({ error: "Vendor not found" }, { status: 404 }) };

  return { vendor };
}

// Shared helper: find product and verify ownership
async function findOwnedProduct(productId: string, vendorId: string) {
  const product = await db.product.findUnique({
    where: { id: productId },
    include: {
      category: { select: { name: true } },
      _count: { select: { bookings: true, reviews: true } },
    },
  });

  if (!product) return { error: NextResponse.json({ error: "Product not found" }, { status: 404 }) };
  if (product.vendorId !== vendorId) return { error: NextResponse.json({ error: "You do not own this product" }, { status: 403 }) };

  return { product };
}

// ─── PUT: Full product update ───────────────────────────────────────────────
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await authenticateVendor(req);
    if (authResult.error) return authResult.error;

    const { id } = await params;
    const productResult = await findOwnedProduct(id, authResult.vendor.id);
    if (productResult.error) return productResult.error;

    const body = await req.json();
    const {
      title,
      description,
      features,
      categoryId,
      buyPrice,
      rentPricePerDay,
      deposit,
      stock,
      condition,
      images,
      listingTypes,
      location,
    } = body;

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

    const updated = await db.product.update({
      where: { id },
      data: {
        title,
        slug: title.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
        description: description || "",
        features: features ? JSON.stringify(features) : "[]",
        categoryId,
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
      include: {
        category: { select: { name: true } },
        _count: { select: { bookings: true, reviews: true } },
      },
    });

    return NextResponse.json({ product: updated });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to update product";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// ─── PATCH: Toggle product status ───────────────────────────────────────────
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await authenticateVendor(req);
    if (authResult.error) return authResult.error;

    const { id } = await params;
    const productResult = await findOwnedProduct(id, authResult.vendor.id);
    if (productResult.error) return productResult.error;

    const body = await req.json();
    const { status } = body as { status?: string };

    if (!status || !["AVAILABLE", "UNAVAILABLE"].includes(status)) {
      return NextResponse.json(
        { error: "Status must be 'AVAILABLE' or 'UNAVAILABLE'" },
        { status: 400 }
      );
    }

    const updated = await db.product.update({
      where: { id },
      data: { status },
      include: {
        category: { select: { name: true } },
        _count: { select: { bookings: true, reviews: true } },
      },
    });

    return NextResponse.json({ product: updated });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to update product status";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// ─── DELETE: Delete a product ───────────────────────────────────────────────
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await authenticateVendor(req);
    if (authResult.error) return authResult.error;

    const { id } = await params;
    const productResult = await findOwnedProduct(id, authResult.vendor.id);
    if (productResult.error) return productResult.error;

    await db.product.delete({ where: { id } });

    return NextResponse.json({ message: "Product deleted successfully" });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to delete product";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}