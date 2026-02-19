import { NextResponse } from "next/server";
import { fetchLumaEvents } from "@/lib/luma";

export async function GET() {
  try {
    const events = await fetchLumaEvents();
    return NextResponse.json({
      count: events.length,
      events: events.slice(0, 2), // Return first 2 for inspection
    });
  } catch (error) {
    return NextResponse.json(
      { error: String(error) },
      { status: 500 }
    );
  }
}
