import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
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

Respond ONLY with valid JSON in this exact structure:
{
  "packages": {
    "economy": {
      "tier": "ECONOMY",
      "name": "Economy Package",
      "description": "Brief description",
      "totalCost": 0,
      "totalDeposit": 0,
      "items": [
        {
          "productId": "inventory product id",
          "productName": "Display name",
          "category": "Category name",
          "quantity": 1,
          "rentPerDay": 0,
          "duration": 1,
          "subtotal": 0,
          "deposit": 0,
          "vendorId": "vendor id",
          "vendorName": "vendor name",
          "vendorRating": 0,
          "priority": "HIGH",
          "reason": "Why this is included"
        }
      ]
    },
    "standard": {
      "tier": "STANDARD",
      "name": "Standard Package",
      "description": "Brief description",
      "totalCost": 0,
      "totalDeposit": 0,
      "items": []
    },
    "premium": {
      "tier": "PREMIUM",
      "name": "Premium Package",
      "description": "Brief description",
      "totalCost": 0,
      "totalDeposit": 0,
      "items": []
    }
  },
  "upsells": [
    {
      "name": "Photo Booth",
      "reason": "Popular add-on",
      "estimatedCost": 5000,
      "category": "Photography"
    }
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
    vendor: {
      id: string;
      businessName: string;
      isVerified: boolean;
      rating: number;
    };
    category: { id: string; name: string; slug: string };
    reviews: { rating: number }[];
  }[]
): string {
  if (products.length === 0) {
    return "No products available in inventory.";
  }

  const lines = products.map((p, index) => {
    const averageRating =
      p.reviews.length > 0
        ? (
            p.reviews.reduce((sum, review) => sum + review.rating, 0) /
            p.reviews.length
          ).toFixed(1)
        : "N/A";

    return `[${index + 1}] ID: "${p.id}" | Title: "${p.title}" | Category: "${
      p.category.name
    }" | BuyPrice: ₹${p.buyPrice} | RentPerDay: ₹${
      p.rentPricePerDay
    } | Deposit: ₹${p.deposit} | Stock: ${p.stock} | Condition: ${
      p.condition
    } | Location: ${p.location || "N/A"} | VendorID: "${
      p.vendor.id
    }" | VendorName: "${p.vendor.businessName}" | VendorVerified: ${
      p.vendor.isVerified
    } | VendorRating: ${p.vendor.rating} | AvgProductRating: ${averageRating}`;
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
    const packageData = packages[tier] as Record<string, unknown> | undefined;
    if (!packageData) continue;

    const items = packageData.items as Array<Record<string, unknown>> | undefined;
    if (!items) continue;

    for (const item of items) {
      const productId = item.productId as string | undefined;

      if (productId && !validProductIds.has(productId)) {
        item.productId = null;
        item.reason = `${item.reason || "Included"} (product unavailable)`;
      }
    }
  }
}

export async function POST(req: NextRequest) {
  try {
    const token = getTokenFromHeader(req);

    if (!token) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const payload = await verifyToken(token);

    if (!payload) {
      return NextResponse.json(
        { error: "Invalid or expired token" },
        { status: 401 }
      );
    }

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

    const products = await db.product.findMany({
      where: { status: "AVAILABLE" },
      include: {
        vendor: {
          select: {
            id: true,
            businessName: true,
            isVerified: true,
            rating: true,
          },
        },
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        reviews: {
          select: {
            rating: true,
          },
        },
      },
    });

    const inventoryPrompt = buildInventoryPrompt(products);
    const validProductIds = new Set(products.map((product) => product.id));

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

- ECONOMY: Minimize cost, essential items only, stay well within budget.
- STANDARD: Good balance of quality and cost, include recommended items.
- PREMIUM: Best quality equipment, full setup, can go up to 20% over budget.
- Calculate all costs as rentPerDay × ${duration} days.
- Respect stock limits.`;

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY is missing in Vercel environment variables" },
        { status: 500 }
      );
    }

    const ai = new GoogleGenAI({ apiKey });

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `${SYSTEM_PROMPT}

${userMessage}`,
      config: {
        responseMimeType: "application/json",
      },
    });

    const rawAIResponse = response.text || "";

    let parsedPackages: Record<string, unknown> = {
      packages: { economy: {}, standard: {}, premium: {} },
      upsells: [],
      tips: [],
    };

    try {
      parsedPackages = JSON.parse(rawAIResponse);
    } catch {
      parsedPackages = {
        packages: { economy: {}, standard: {}, premium: {} },
        upsells: [],
        tips: [rawAIResponse || "AI returned an invalid response."],
      };
    }

    if (parsedPackages.packages) {
      validatePackagesAgainstInventory(
        parsedPackages.packages as Record<string, unknown>,
        validProductIds
      );
    }

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
        aiPrompt: `${SYSTEM_PROMPT}\n\n${userMessage}`,
        aiResponse: rawAIResponse,
        packages: JSON.stringify(parsedPackages),
      },
    });

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
    console.error("Gemini Event Plan error:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "AI event planning failed",
      },
      { status: 500 }
    );
  }
}