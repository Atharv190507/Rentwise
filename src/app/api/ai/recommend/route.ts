import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyToken, getTokenFromHeader } from "@/lib/auth";

const SYSTEM_PROMPT = `You are RentWise AI, an intelligent rental marketplace assistant. Your job is to help users decide whether to RENT, BUY, or BOOK products based on their needs.

Always respond in this exact JSON format:
{
  "recommendation": "RENT" or "BUY" or "BOOK",
  "explanation": "A clear, concise explanation of why this option is best",
  "savings": <number - estimated savings amount if renting vs buying>,
  "alternatives": "Brief suggestion of alternative products or approaches"
}

Consider these factors:
- If usage is short-term (< 15 days), RENT is usually better
- If usage is frequent/long-term (> 6 months), BUY is better
- If it's a one-time event, RENT or BOOK
- Always calculate and show the savings from renting vs buying
- Be specific with numbers and percentages
- Keep explanations concise but persuasive`;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { productTitle, buyPrice, rentPricePerDay, days, budget, purpose } = body;

    if (!productTitle || !buyPrice || !rentPricePerDay || !days) {
      return NextResponse.json({ error: "Product details and duration required" }, { status: 400 });
    }

    const userMessage = `Product: ${productTitle}
Buy Price: ₹${Number(buyPrice).toLocaleString("en-IN")}
Rent Price: ₹${Number(rentPricePerDay).toLocaleString("en-IN")}/day
Duration: ${days} days
${budget ? `Budget: ₹${Number(budget).toLocaleString("en-IN")}` : ""}
${purpose ? `Purpose: ${purpose}` : ""}

Should I RENT, BUY, or BOOK this product? Give your recommendation with savings calculation.`;

    const ZAI = (await import("z-ai-web-dev-sdk")).default;
    const zai = await ZAI.create();

    const completion = await zai.chat.completions.create({
      messages: [
        { role: "assistant", content: SYSTEM_PROMPT },
        { role: "user", content: userMessage },
      ],
      thinking: { type: "disabled" },
    });

    const raw = completion.choices[0]?.message?.content || "";

    // Try to parse JSON from response
    let result;
    try {
      // Extract JSON from potential markdown code blocks
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      result = jsonMatch ? JSON.parse(jsonMatch[0]) : { recommendation: "RENT", explanation: raw, savings: Number(buyPrice) - Number(rentPricePerDay) * days, alternatives: "" };
    } catch {
      result = { recommendation: "RENT", explanation: raw, savings: Number(buyPrice) - Number(rentPricePerDay) * days, alternatives: "" };
    }

    // Save to DB if user is authenticated
    const token = getTokenFromHeader(req);
    if (token) {
      const payload = await verifyToken(token);
      if (payload) {
        await db.aIRecommendation.create({
          data: {
            userId: payload.userId,
            prompt: userMessage,
            recommendation: result.recommendation || "RENT",
            explanation: result.explanation || "",
            savings: result.savings || 0,
            alternatives: result.alternatives || null,
          },
        });
      }
    }

    return NextResponse.json({ ...result, id: Date.now().toString() });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "AI recommendation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}