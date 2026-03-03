import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";
import {
  validateLumaSlug,
  fetchLumaCalendarEvents,
  lumaToEvent,
} from "@/lib/luma";
import { upsertEvents } from "@/lib/sync";
import { markDuplicatesRecurring } from "@/lib/recurring";

function isAdmin(req: NextRequest) {
  return req.headers.get("x-admin-password") === process.env.ADMIN_PASSWORD;
}

function extractSlug(input: string): string {
  const trimmed = input.trim();
  // Handle full URLs like https://lu.ma/slug or https://luma.com/slug
  try {
    const url = new URL(trimmed);
    if (url.hostname === "lu.ma" || url.hostname === "luma.com" || url.hostname === "www.luma.com") {
      return url.pathname.replace(/^\//, "").split("/")[0];
    }
  } catch {
    // Not a URL — treat as raw slug
  }
  return trimmed;
}

// GET /api/admin/calendars — list all calendars
export async function GET(req: NextRequest) {
  if (!isAdmin(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getServiceClient();
  const { data, error } = await supabase
    .from("luma_calendars")
    .select("*")
    .order("created_at", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ calendars: data });
}

// POST /api/admin/calendars — validate, add, and auto-sync a Luma calendar
export async function POST(req: NextRequest) {
  if (!isAdmin(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getServiceClient();
  const body = await req.json();

  const slug = extractSlug(body.slug || "");
  if (!slug) {
    return NextResponse.json({ error: "Slug is required" }, { status: 400 });
  }

  // Validate the slug is a real Luma calendar
  const validation = await validateLumaSlug(slug);
  if (!validation.valid) {
    return NextResponse.json(
      { error: `Invalid Luma calendar: "${slug}" is not a valid calendar URL` },
      { status: 422 }
    );
  }

  // Auto-fill name from Luma if user didn't provide one
  const name = body.name || validation.calendarName || null;

  const { data, error } = await supabase
    .from("luma_calendars")
    .insert({ slug, name })
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ error: "Calendar already exists" }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Auto-sync events for this calendar
  let sync = { synced: 0, skipped: 0 };
  try {
    const { events: lumaEvents } = await fetchLumaCalendarEvents(slug);
    const events = lumaEvents.map(lumaToEvent);
    const result = await upsertEvents(events);
    sync = { synced: result.synced, skipped: result.skipped };
    await markDuplicatesRecurring();
  } catch (err) {
    console.error(`Auto-sync failed for new calendar ${slug}:`, err);
  }

  return NextResponse.json({ calendar: data, sync }, { status: 201 });
}

// DELETE /api/admin/calendars — remove a calendar by id
export async function DELETE(req: NextRequest) {
  if (!isAdmin(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getServiceClient();
  const body = await req.json();

  if (!body.id) {
    return NextResponse.json({ error: "Calendar id is required" }, { status: 400 });
  }

  const { error } = await supabase
    .from("luma_calendars")
    .delete()
    .eq("id", body.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
