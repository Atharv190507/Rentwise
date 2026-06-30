import { NextRequest, NextResponse } from "next/server";
import ZAI from "z-ai-web-dev-sdk";

const SYSTEM_PROMPT = `You are RentWise AI Product Description Generator. Given a product name, generate professional listing content.

Always respond in this exact JSON format:
{
  "title": "Optimized product title for marketplace",
  "description": "Detailed product description (2-3 paragraphs) suitable for an equipment rental marketplace",
  "features": ["Feature 1", "Feature 2", "Feature 3", "Feature 4", "Feature 5"],
  "keywords": ["SEO keyword 1", "keyword 2", "keyword 3", "keyword 4", "keyword 5"],
  "shortDescription": "One-line tagline for the product"
}

Write in a professional, trustworthy tone. Focus on practical benefits for event planners, photographers, and businesses.`;

export async function POST(req: NextRequest) {
  try {
    const { productName, category } = await req.json();

    if (!productName) {
      return NextResponse.json({ error: "Product name required" }, { status: 400 });
    }

    const userMessage = `Generate listing content for: "${productName}"
${category ? `Category: ${category}` : ""}`;

    const zai = await ZAI.create();
    const completion = await zai.chat.completions.create({
      messages: [
        { role: "assistant", content: SYSTEM_PROMPT },
        { role: "user", content: userMessage },
      ],
      thinking: { type: "disabled" },
    });

    const raw = completion.choices[0]?.message?.content || "";
    let result;
    try {
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      result = jsonMatch ? JSON.parse(jsonMatch[0]) : { title: productName, description: raw, features: [], keywords: [], shortDescription: "" };
    } catch {
      result = { title: productName, description: raw, features: [], keywords: [], shortDescription: "" };
    }

    return NextResponse.json(result);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Description generation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}