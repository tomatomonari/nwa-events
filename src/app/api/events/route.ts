import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";

function isAdmin(req: NextRequest) {
  return req.headers.get("x-admin-password") === process.env.ADMIN_PASSWORD;
}

// GET /api/events — list events (public: approved only, admin: any status)
export async function GET(req: NextRequest) {
  const supabase = getServiceClient();
  const status = req.nextUrl.searchParams.get("status") || "approved";

  if (status !== "approved" && !isAdmin(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("events")
    .select("*")
    .eq("status", status)
    .order("start_date", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ events: data });
}

// POST /api/events — create event
export async function POST(req: NextRequest) {
  const supabase = getServiceClient();
  const body = await req.json();

  const { data, error } = await supabase
    .from("events")
    .insert({
      title: body.title,
      description: body.description || null,
      start_date: body.start_date,
      end_date: body.end_date || null,
      location_name: body.location_name || null,
      location_address: body.location_address || null,
      is_online: body.is_online || false,
      online_url: body.online_url || null,
      categories: body.categories || [],
      primary_category: body.primary_category || "fun",
      image_url: body.image_url || null,
      source_url: body.source_url || null,
      source_platform: body.source_platform || null,
      source_id: body.source_id || null,
      organizer_name: body.organizer_name,
      organizer_title: body.organizer_title || null,
      organizer_company: body.organizer_company || null,
      organizer_avatar_url: body.organizer_avatar_url || null,
      status: body.status || "pending",
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ event: data }, { status: 201 });
}

// PATCH /api/events — update event status (admin only)
export async function PATCH(req: NextRequest) {
  if (!isAdmin(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getServiceClient();
  const body = await req.json();

  const { error } = await supabase
    .from("events")
    .update({ status: body.status, updated_at: new Date().toISOString() })
    .eq("id", body.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

// DELETE /api/events — delete event (admin only)
export async function DELETE(req: NextRequest) {
  if (!isAdmin(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getServiceClient();
  const body = await req.json();

  const { error } = await supabase.from("events").delete().eq("id", body.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
