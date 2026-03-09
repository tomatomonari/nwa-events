import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";
import { validateOrganizerId, fetchEventbriteEvents } from "@/lib/eventbrite";
import { upsertEvents } from "@/lib/sync";
import { markDuplicatesRecurring } from "@/lib/recurring";

function isAdmin(req: NextRequest) {
  return req.headers.get("x-admin-password") === process.env.ADMIN_PASSWORD;
}

/** Extract organizer ID from a full Eventbrite URL or raw ID */
function extractOrganizerId(input: string): string {
  const trimmed = input.trim();
  try {
    const url = new URL(trimmed);
    if (
      url.hostname === "www.eventbrite.com" ||
      url.hostname === "eventbrite.com"
    ) {
      // URLs like https://www.eventbrite.com/o/org-name-12345
      const parts = url.pathname.split("/").filter(Boolean);
      if (parts[0] === "o" && parts[1]) {
        // The ID is the trailing number after the last dash
        const match = parts[1].match(/(\d+)$/);
        if (match) return match[1];
        return parts[1];
      }
    }
  } catch {
    // Not a URL — treat as raw ID
  }
  return trimmed;
}

// GET /api/admin/eventbrite-orgs — list all orgs
export async function GET(req: NextRequest) {
  if (!isAdmin(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getServiceClient();
  const { data, error } = await supabase
    .from("eventbrite_orgs")
    .select("*")
    .order("created_at", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ orgs: data });
}

// POST /api/admin/eventbrite-orgs — validate, add, and auto-sync an org
export async function POST(req: NextRequest) {
  if (!isAdmin(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getServiceClient();
  const body = await req.json();

  const organizerId = extractOrganizerId(body.organizer_id || "");
  if (!organizerId) {
    return NextResponse.json(
      { error: "Organizer ID is required" },
      { status: 400 }
    );
  }

  // Validate via Eventbrite API
  const validation = await validateOrganizerId(organizerId);
  if (!validation.valid) {
    return NextResponse.json(
      {
        error: `Invalid Eventbrite organizer: "${organizerId}" was not found`,
      },
      { status: 422 }
    );
  }

  const name = body.name || validation.name || null;

  const { data, error } = await supabase
    .from("eventbrite_orgs")
    .insert({ organizer_id: organizerId, name })
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json(
        { error: "Organization already exists" },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Auto-sync events for this org
  let sync = { synced: 0, skipped: 0 };
  try {
    const events = await fetchEventbriteEvents();
    const result = await upsertEvents(events);
    sync = { synced: result.synced, skipped: result.skipped };
    await markDuplicatesRecurring();
  } catch (err) {
    console.error(
      `Auto-sync failed for new Eventbrite org ${organizerId}:`,
      err
    );
  }

  return NextResponse.json({ org: data, sync }, { status: 201 });
}

// DELETE /api/admin/eventbrite-orgs — remove an org by id
export async function DELETE(req: NextRequest) {
  if (!isAdmin(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getServiceClient();
  const body = await req.json();

  if (!body.id) {
    return NextResponse.json(
      { error: "Organization id is required" },
      { status: 400 }
    );
  }

  const { error } = await supabase
    .from("eventbrite_orgs")
    .delete()
    .eq("id", body.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
