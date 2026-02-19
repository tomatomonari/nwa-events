import { NextRequest, NextResponse } from "next/server";
import { parseEventFromURL } from "@/lib/url-parser";

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();

    if (!url || typeof url !== "string") {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    // Validate URL
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(url);
    } catch {
      return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
    }

    // Fetch the page
    const res = await fetch(parsedUrl.toString(), {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; NWAEvents/1.0; +https://nwa.events)",
      },
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: `Failed to fetch URL (${res.status})` },
        { status: 422 }
      );
    }

    const html = await res.text();

    // Parse with AI
    const event = await parseEventFromURL(url, html);

    return NextResponse.json({ event });
  } catch (error) {
    console.error("URL import error:", error);
    return NextResponse.json(
      { error: "Failed to parse event from URL" },
      { status: 500 }
    );
  }
}
