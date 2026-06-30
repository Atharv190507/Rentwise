import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyToken, getTokenFromHeader } from "@/lib/auth";

const SYSTEM_PROMPT = `You are RentWise AI Event Planner. Given event details and available equipment inventory, create 3 equipment packages.

CRITICAL RULES:
- You MUST ONLY recommend products from the provided inventory list
- Every item MUST have a matching productId from the inventory
- Calculate costs as: rentPerDay × duration
- Total cost must not exceed the user's budget (unless premium tier, which can go up to 20% over)
- Respect stock availability - don't recommend more than available stock
- Group items by priority: HIGH (essential), MEDIUM (recommended), LOW (nice-to-have)

Respond in this exact JSON format:
{
  "packages": {
    "economy": {
      "tier": "ECONOMY",
      "name": "Economy Package",
      "description": "Brief description",
      "totalCost": <number>,
      "totalDeposit": <number>,
      "items": [
        {
          "productId": "<must match an inventory product id>",
          "productName": "Display name",
          "category": "Category name",
          "quantity": <number>,
          "rentPerDay": <number>,
          "duration": <number>,
          "subtotal": <number>,
          "deposit": <number>,
          "vendorId": "<from inventory>",
          "vendorName": "<from inventory>",
          "vendorRating": <number>,
          "priority": "HIGH|MEDIUM|LOW",
          "reason": "Why this is included"
        }
      ]
    },
    "standard": { ... same structure ... },
    "premium": { ... same structure ... }
  },
  "upsells": [
    { "name": "Photo Booth", "reason": "Popular add-on", "estimatedCost": 5000, "category": "Photography" }
  ],
  "tips": ["Tip 1", "Tip 2", "Tip 3"]
}`;

function buildInventoryPrompt(
  products: {
    id: string;
    title: string;
    description: string;
    buyPrice: number;
    rentPricePerDay: number;
    deposit: number;
    stock: number;
    condition: string;
    location: string | null;
    vendor: { id: string; businessName: string; isVerified: boolean; rating: number };
    category: { id: string; name: string; slug: string };
    reviews: { rating: number }[];
  }[]
): string {
  if (products.length === 0) {
    return "No products available in inventory.";
  }

  const lines = products.map((p, idx) => {
    const avgRating =
      p.reviews.length > 0
        ? (p.reviews.reduce((sum, r) => sum + r.rating, 0) / p.reviews.length).toFixed(1)
        : "N/A";
    return `[${idx + 1}] ID: "${p.id}" | Title: "${p.title}" | Category: "${p.category.name}" | BuyPrice: ₹${p.buyPrice} | RentPerDay: ₹${p.rentPricePerDay} | Deposit: ₹${p.deposit} | Stock: ${p.stock} | Condition: ${p.condition} | Location: ${p.location || "N/A"} | VendorID: "${p.vendor.id}" | VendorName: "${p.vendor.businessName}" | VendorVerified: ${p.vendor.isVerified} | VendorRating: ${p.vendor.rating} | AvgProductRating: ${avgRating}`;
  });

  return `AVAILABLE INVENTORY (${products.length} products):
${lines.join("\n")}`;
}

function validatePackagesAgainstInventory(
  packages: Record<string, unknown>,
  validProductIds: Set<string>
) {
  const tiers = ["economy", "standard", "premium"] as const;

  for (const tier of tiers) {
    const pkg = packages[tier] as Record<string, unknown> | undefined;
    if (!pkg) continue;

    const items = pkg.items as Array<Record<string, unknown>> | undefined;
    if (!items) continue;

    for (const item of items) {
      const productId = item.productId as string | undefined;
      if (productId && !validProductIds.has(productId)) {
        // Remove invalid product references but keep the item info
        item.productId = null;
        item.reason = `${item.reason || "Included"} (product unavailable)`;
      }
    }
  }
}

export async function POST(req: NextRequest) {
  try {
    // 1. Authenticate user
    const token = getTokenFromHeader(req);
    if (!token) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const payload = await verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: "Invalid or expired token" }, { status: 401 });
    }

    // 2. Parse request body
    const body = await req.json();
    const {
      eventType,
      guests,
      venueType,
      budget,
      city,
      duration = 1,
      eventDate,
      requirements,
      preference = "RENT",
      quality = "STANDARD",
    } = body;

    if (!eventType || !guests || !budget) {
      return NextResponse.json(
        { error: "eventType, guests, and budget are required" },
        { status: 400 }
      );
    }

    // 3. Fetch all available products
    const products = await db.product.findMany({
      where: { status: "AVAILABLE" },
      include: {
        vendor: { select: { id: true, businessName: true, isVerified: true, rating: true } },
        category: { select: { id: true, name: true, slug: true } },
        reviews: { select: { rating: true } },
      },
    });

    // 4. Build the AI prompt
    const inventoryPrompt = buildInventoryPrompt(products);
    const validProductIds = new Set(products.map((p) => p.id));

    const userMessage = `EVENT DETAILS:
- Event Type: ${eventType}
- Number of Guests: ${guests}
- Venue Type: ${venueType || "Not specified"}
- Budget: ₹${Number(budget).toLocaleString("en-IN")}
- City: ${city || "Not specified"}
- Duration: ${duration} days
- Event Date: ${eventDate || "Not specified"}
- Additional Requirements: ${requirements || "None"}
- Preference: ${preference}
- Quality Level: ${quality}

${inventoryPrompt}

Create 3 equipment packages (ECONOMY, STANDARD, PREMIUM) for this event using ONLY the products from the inventory above.
- ECONOMY: Minimize cost, essential items only, stay well within budget
- STANDARD: Good balance of quality and cost, include recommended items
- PREMIUM: Best quality equipment, full setup, can go up to 20% over budget
- Calculate all costs as rentPerDay × ${duration} (duration) days
- Respect stock limits - do not recommend more than available stock`;

    const fullPrompt = `${SYSTEM_PROMPT}\n\n${userMessage}`;

    // 5. Call AI (lazy import to avoid Turbopack compilation issues)
    const zaiSdk = await import("z-ai-web-dev-sdk");
    const ZAI = zaiSdk.default;
    const zai = await ZAI.create();
    const completion = await zai.chat.completions.create({
      messages: [
        { role: "assistant", content: SYSTEM_PROMPT },
        { role: "user", content: userMessage },
      ],
      thinking: { type: "disabled" },
    });

    const rawAIResponse = completion.choices[0]?.message?.content || "";

    // 6. Parse AI response
    let parsedPackages: Record<string, unknown> = {
      packages: { economy: {}, standard: {}, premium: {} },
      upsells: [],
      tips: [],
    };

    try {
      const jsonMatch = rawAIResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsedPackages = JSON.parse(jsonMatch[0]);
      }
    } catch {
      // Fallback: return raw response as tips
      parsedPackages = {
        packages: { economy: {}, standard: {}, premium: {} },
        upsells: [],
        tips: [rawAIResponse],
      };
    }

    // 7. Validate product IDs against inventory
    if (parsedPackages.packages) {
      validatePackagesAgainstInventory(
        parsedPackages.packages as Record<string, unknown>,
        validProductIds
      );
    }

    // 8. Save to EventPlan table
    const eventPlan = await db.eventPlan.create({
      data: {
        userId: payload.userId,
        eventType,
        guests,
        venueType: venueType || null,
        budget,
        city: city || null,
        duration,
        eventDate: eventDate ? new Date(eventDate) : null,
        requirements: requirements || null,
        preference,
        quality,
        aiPrompt: fullPrompt,
        aiResponse: rawAIResponse,
        packages: JSON.stringify(parsedPackages),
      },
    });

    // 9. Return response
    return NextResponse.json({
      id: eventPlan.id,
      eventType: eventPlan.eventType,
      guests: eventPlan.guests,
      budget: eventPlan.budget,
      duration: eventPlan.duration,
      packages: parsedPackages.packages,
      upsells: parsedPackages.upsells || [],
      tips: parsedPackages.tips || [],
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "AI event planning failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}