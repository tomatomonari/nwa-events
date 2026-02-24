import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";

function isAdmin(req: NextRequest) {
  return req.headers.get("x-admin-password") === process.env.ADMIN_PASSWORD;
}

function extractUrlname(input: string): string {
  const trimmed = input.trim();
  // Handle full URLs like https://www.meetup.com/nwa-techfest/ or https://meetup.com/nwa-techfest/events/
  try {
    const url = new URL(trimmed);
    if (url.hostname === "meetup.com" || url.hostname === "www.meetup.com") {
      return url.pathname.replace(/^\//, "").split("/")[0];
    }
  } catch {
    // Not a URL — treat as raw urlname
  }
  return trimmed;
}

// GET /api/admin/meetup-groups — list all groups
export async function GET(req: NextRequest) {
  if (!isAdmin(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getServiceClient();
  const { data, error } = await supabase
    .from("meetup_groups")
    .select("*")
    .order("created_at", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ groups: data });
}

// POST /api/admin/meetup-groups — add a group
export async function POST(req: NextRequest) {
  if (!isAdmin(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getServiceClient();
  const body = await req.json();

  const urlname = extractUrlname(body.urlname || "");
  if (!urlname) {
    return NextResponse.json({ error: "URL name is required" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("meetup_groups")
    .insert({ urlname, name: body.name || null })
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ error: "Group already exists" }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ group: data }, { status: 201 });
}

// DELETE /api/admin/meetup-groups — remove a group by id
export async function DELETE(req: NextRequest) {
  if (!isAdmin(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getServiceClient();
  const body = await req.json();

  if (!body.id) {
    return NextResponse.json({ error: "Group id is required" }, { status: 400 });
  }

  const { error } = await supabase
    .from("meetup_groups")
    .delete()
    .eq("id", body.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
