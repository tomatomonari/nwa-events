import { NextRequest, NextResponse } from "next/server";
import { fetchLumaEventByUrl, lumaToEvent } from "@/lib/luma";
import { upsertEvents } from "@/lib/sync";
import { markDuplicatesRecurring } from "@/lib/recurring";

function isAdmin(req: NextRequest) {
  return req.headers.get("x-admin-password") === process.env.ADMIN_PASSWORD;
}

export async function POST(req: NextRequest) {
  if (!isAdmin(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { url, confirm } = await req.json();
    if (!url || typeof url !== "string") {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    // Validate it looks like a Luma URL
    const normalized = url.toLowerCase();
    if (!normalized.includes("luma.com/") && !normalized.includes("lu.ma/")) {
      return NextResponse.json(
        { error: "Not a Luma URL. Provide a luma.com or lu.ma link." },
        { status: 400 }
      );
    }

    const raw = await fetchLumaEventByUrl(url);
    const event = lumaToEvent(raw);

    if (confirm) {
      const result = await upsertEvents([event]);
      await markDuplicatesRecurring();
      return NextResponse.json({ imported: true, event, ...result });
    }

    // Preview mode — return the parsed event without inserting
    return NextResponse.json({ preview: true, event });
  } catch (error) {
    console.error("Import Luma error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Import failed" },
      { status: 500 }
    );
  }
}
