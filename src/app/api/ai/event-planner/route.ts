import { NextRequest, NextResponse } from "next/server";
import ZAI from "z-ai-web-dev-sdk";

const SYSTEM_PROMPT = `You are RentWise AI Event Planner. Given an event description, recommend all equipment needed with quantities and estimated costs. 

Always respond in this exact JSON format:
{
  "summary": "Brief overview of the event setup",
  "equipment": [
    { "name": "Equipment name", "quantity": <number>, "rentPerDay": <number>, "totalDays": <number>, "totalCost": <number>, "reason": "Why this is needed" }
  ],
  "totalEstimatedCost": <number>,
  "tips": ["Helpful tip 1", "Helpful tip 2"]
}

Consider:
- Number of attendees for speaker/audio sizing
- Indoor/outdoor for tent/lighting needs
- Event type for decoration and stage
- Always provide realistic quantities and pricing in INR (₹)`;

export async function POST(req: NextRequest) {
  try {
    const { eventDescription, attendees, budget } = await req.json();

    if (!eventDescription) {
      return NextResponse.json({ error: "Event description required" }, { status: 400 });
    }

    const userMessage = `Event: ${eventDescription}
${attendees ? `Attendees: ${attendees}` : ""}
${budget ? `Budget: ₹${Number(budget).toLocaleString("en-IN")}` : ""}

Plan the complete equipment setup for this event.`;

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
      result = jsonMatch ? JSON.parse(jsonMatch[0]) : { summary: raw, equipment: [], totalEstimatedCost: 0, tips: [] };
    } catch {
      result = { summary: raw, equipment: [], totalEstimatedCost: 0, tips: [] };
    }

    return NextResponse.json(result);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Event planning failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}