import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";

function isAdmin(req: NextRequest) {
  return req.headers.get("x-admin-password") === process.env.ADMIN_PASSWORD;
}

function extractGroupId(input: string): string {
  const trimmed = input.trim();
  // Handle full URLs like https://hogsync.uark.edu/events?group_ids=35807
  try {
    const url = new URL(trimmed);
    if (url.hostname === "hogsync.uark.edu") {
      const groupIds = url.searchParams.get("group_ids");
      if (groupIds) return groupIds.split(",")[0];
      const filter2 = url.searchParams.get("filter2");
      if (filter2) return filter2;
    }
  } catch {
    // Not a URL — treat as raw group ID
  }
  return trimmed;
}

// GET /api/admin/hogsync-orgs — list all orgs
export async function GET(req: NextRequest) {
  if (!isAdmin(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getServiceClient();
  const { data, error } = await supabase
    .from("hogsync_orgs")
    .select("*")
    .order("created_at", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ orgs: data });
}

// POST /api/admin/hogsync-orgs — add an org
export async function POST(req: NextRequest) {
  if (!isAdmin(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getServiceClient();
  const body = await req.json();

  const groupId = extractGroupId(body.group_id || "");
  if (!groupId) {
    return NextResponse.json({ error: "Group ID is required" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("hogsync_orgs")
    .insert({ group_id: groupId, name: body.name || null })
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ error: "Organization already exists" }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ org: data }, { status: 201 });
}

// DELETE /api/admin/hogsync-orgs — remove an org by id
export async function DELETE(req: NextRequest) {
  if (!isAdmin(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getServiceClient();
  const body = await req.json();

  if (!body.id) {
    return NextResponse.json({ error: "Org id is required" }, { status: 400 });
  }

  const { error } = await supabase
    .from("hogsync_orgs")
    .delete()
    .eq("id", body.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
