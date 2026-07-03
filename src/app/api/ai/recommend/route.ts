import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { db } from "@/lib/db";
import { verifyToken, getTokenFromHeader } from "@/lib/auth";

const SYSTEM_PROMPT = `You are RentWise AI, an intelligent rental marketplace assistant. Your job is to help users decide whether to RENT, BUY, or BOOK products based on their needs.

Return ONLY valid JSON in exactly this format:
{
  "recommendation": "RENT",
  "explanation": "A clear, concise explanation of why this option is best",
  "savings": 0,
  "alternatives": "Brief suggestion of alternative products or approaches"
}

Rules:
- recommendation must be exactly one of: RENT, BUY, BOOK
- If usage is short-term (less than 15 days), RENT is usually better.
- If usage is frequent or long-term (more than 6 months), BUY is usually better.
- If it is a one-time event, prefer RENT or BOOK.
- Calculate savings as buyPrice minus total rental cost. It may be negative if renting costs more.
- Be specific with numbers and percentages.
- Keep explanations concise and persuasive.`;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const {
      productTitle,
      buyPrice,
      rentPricePerDay,
      days,
      budget,
      purpose,
    } = body;

    if (!productTitle || !buyPrice || !rentPricePerDay || !days) {
      return NextResponse.json(
        { error: "Product details and duration required" },
        { status: 400 }
      );
    }

    const numericBuyPrice = Number(buyPrice);
    const numericRentPricePerDay = Number(rentPricePerDay);
    const numericDays = Number(days);
    const calculatedSavings =
      numericBuyPrice - numericRentPricePerDay * numericDays;

    const userMessage = `Product: ${productTitle}
Buy Price: ₹${numericBuyPrice.toLocaleString("en-IN")}
Rent Price: ₹${numericRentPricePerDay.toLocaleString("en-IN")}/day
Duration: ${numericDays} days
${budget ? `Budget: ₹${Number(budget).toLocaleString("en-IN")}` : ""}
${purpose ? `Purpose: ${purpose}` : ""}

Should I RENT, BUY, or BOOK this product? Give your recommendation with a savings calculation.`;

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

    const raw = response.text || "";

    let result: {
      recommendation: "RENT" | "BUY" | "BOOK";
      explanation: string;
      savings: number;
      alternatives: string;
    };

    try {
      const parsed = JSON.parse(raw);

      result = {
        recommendation:
          parsed.recommendation === "BUY" || parsed.recommendation === "BOOK"
            ? parsed.recommendation
            : "RENT",
        explanation: String(parsed.explanation || ""),
        savings: Number.isFinite(Number(parsed.savings))
          ? Number(parsed.savings)
          : calculatedSavings,
        alternatives: String(parsed.alternatives || ""),
      };
    } catch {
      result = {
        recommendation: "RENT",
        explanation: raw || "Renting is the flexible option for this duration.",
        savings: calculatedSavings,
        alternatives: "",
      };
    }

    const token = getTokenFromHeader(req);

    if (token) {
      const payload = await verifyToken(token);

      if (payload) {
        await db.aIRecommendation.create({
          data: {
            userId: payload.userId,
            prompt: userMessage,
            recommendation: result.recommendation,
            explanation: result.explanation,
            savings: result.savings,
            alternatives: result.alternatives || null,
          },
        });
      }
    }

    return NextResponse.json({
      ...result,
      id: Date.now().toString(),
    });
  } catch (error: unknown) {
    console.error("Gemini recommendation error:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "AI recommendation failed",
      },
      { status: 500 }
    );
  }
}