import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

const SYSTEM_PROMPT = `You are RentWise AI Product Description Generator.

Return ONLY valid JSON in this exact format:
{
  "title": "Optimized product title for marketplace",
  "description": "Detailed product description (2-3 paragraphs) suitable for an equipment rental marketplace",
  "features": ["Feature 1", "Feature 2", "Feature 3", "Feature 4", "Feature 5"],
  "keywords": ["SEO keyword 1", "keyword 2", "keyword 3", "keyword 4", "keyword 5"],
  "shortDescription": "One-line tagline for the product"
}

Write professionally and focus on practical benefits for event planners, photographers, and businesses.`;

export async function POST(req: NextRequest) {
  try {
    const { productName, category } = await req.json();

    if (!productName?.trim()) {
      return NextResponse.json(
        { error: "Product name required" },
        { status: 400 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY is missing in Vercel environment variables" },
        { status: 500 }
      );
    }

    const ai = new GoogleGenAI({ apiKey });

    const prompt = `${SYSTEM_PROMPT}

Product name: "${productName}"
${category ? `Category: "${category}"` : ""}`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    const raw = response.text || "";

    let result;
    try {
      result = JSON.parse(raw);
    } catch {
      return NextResponse.json(
        { error: "Gemini returned invalid JSON", raw },
        { status: 500 }
      );
    }

    return NextResponse.json(result);
  } catch (error: unknown) {
    console.error("Gemini AI error:", error);

    const message =
      error instanceof Error ? error.message : "Description generation failed";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}