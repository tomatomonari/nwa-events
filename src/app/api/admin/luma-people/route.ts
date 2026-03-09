import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";
import {
  validateLumaUsername,
  fetchLumaPersonEvents,
  lumaToEvent,
} from "@/lib/luma";
import { upsertEvents } from "@/lib/sync";
import { markDuplicatesRecurring } from "@/lib/recurring";

function isAdmin(req: NextRequest) {
  return req.headers.get("x-admin-password") === process.env.ADMIN_PASSWORD;
}

/** Extract username from a lu.ma/user/{username} URL or raw username */
function extractUsername(input: string): string {
  const trimmed = input.trim();
  try {
    const url = new URL(trimmed);
    if (url.hostname === "lu.ma" || url.hostname === "luma.com") {
      const parts = url.pathname.split("/").filter(Boolean);
      // lu.ma/user/{username}
      if (parts[0] === "user" && parts[1]) return parts[1];
    }
  } catch {
    // Not a URL — treat as raw username
  }
  return trimmed;
}

// GET /api/admin/luma-people — list all tracked people
export async function GET(req: NextRequest) {
  if (!isAdmin(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getServiceClient();
  const { data, error } = await supabase
    .from("luma_people")
    .select("*")
    .order("created_at", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ people: data });
}

// POST /api/admin/luma-people — validate, add, and auto-sync a person
export async function POST(req: NextRequest) {
  if (!isAdmin(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getServiceClient();
  const body = await req.json();

  const raw = extractUsername(body.username || "");
  if (!raw) {
    return NextResponse.json(
      { error: "Username is required" },
      { status: 400 }
    );
  }

  // If input is already a user_api_id (starts with "usr-"), use it directly
  let username = raw;
  let userApiId: string;
  let resolvedName: string | null = body.name || null;

  if (raw.startsWith("usr-")) {
    userApiId = raw;
    // Validate by hitting the discover API (0 events is fine — means the ID exists)
    await fetchLumaPersonEvents(raw);
    username = raw;
  } else {
    const validation = await validateLumaUsername(raw);
    if (!validation.valid || !validation.userApiId) {
      return NextResponse.json(
        {
          error: `Invalid Luma user: "${raw}" was not found`,
        },
        { status: 422 }
      );
    }
    userApiId = validation.userApiId;
    username = raw;
    if (!resolvedName) resolvedName = validation.name || null;
  }

  const name = resolvedName;

  const { data, error } = await supabase
    .from("luma_people")
    .insert({
      username,
      user_api_id: userApiId,
      name,
    })
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json(
        { error: "Person already tracked" },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Auto-sync NWA events for this person
  let sync = { synced: 0, skipped: 0 };
  try {
    const raw = await fetchLumaPersonEvents(userApiId);
    const events = raw.map(lumaToEvent);
    const result = await upsertEvents(events);
    sync = { synced: result.synced, skipped: result.skipped };
    await markDuplicatesRecurring();
  } catch (err) {
    console.error(
      `Auto-sync failed for new Luma person ${username}:`,
      err
    );
  }

  return NextResponse.json({ person: data, sync }, { status: 201 });
}

// DELETE /api/admin/luma-people — remove a person by id
export async function DELETE(req: NextRequest) {
  if (!isAdmin(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getServiceClient();
  const body = await req.json();

  if (!body.id) {
    return NextResponse.json(
      { error: "Person id is required" },
      { status: 400 }
    );
  }

  const { error } = await supabase
    .from("luma_people")
    .delete()
    .eq("id", body.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
