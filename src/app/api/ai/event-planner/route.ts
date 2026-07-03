import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

const SYSTEM_PROMPT = `You are RentWise AI Event Planner.

Given an event description, create a practical equipment recommendation plan for an equipment rental marketplace.

Return ONLY valid JSON in exactly this format:
{
  "eventTitle": "Short event title",
  "summary": "Short summary of the event requirements",
  "recommendedItems": [
    {
      "name": "Equipment name",
      "quantity": 1,
      "reason": "Why this equipment is needed"
    }
  ],
  "tips": [
    "Helpful planning tip 1",
    "Helpful planning tip 2",
    "Helpful planning tip 3"
  ]
}

Recommend suitable items such as speakers, microphones, LED screens, projectors, cameras, lights, chairs, tables, decoration equipment, generators, and staging equipment.`;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const eventDescription =
      body.eventDescription ||
      body.description ||
      body.event ||
      "";

    if (!eventDescription.trim()) {
      return NextResponse.json(
        { error: "Event description is required" },
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

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `${SYSTEM_PROMPT}

Event description:
"${eventDescription}"`,
      config: {
        responseMimeType: "application/json",
      },
    });

    const raw = response.text || "";

    try {
      return NextResponse.json(JSON.parse(raw));
    } catch {
      console.error("Gemini returned invalid JSON:", raw);

      return NextResponse.json(
        { error: "Gemini returned invalid event plan data" },
        { status: 500 }
      );
    }
  } catch (error: unknown) {
    console.error("Gemini Event Planner error:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to generate event plan",
      },
      { status: 500 }
    );
  }
}