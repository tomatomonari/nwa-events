import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  try {
    const { event_id, click_type, session_id } = await req.json();

    if (!event_id || !click_type || !["view", "register"].includes(click_type)) {
      return new NextResponse(null, { status: 400 });
    }

    const supabase = getSupabase();
    await supabase.from("click_events").insert({
      event_id,
      click_type,
      session_id: session_id || null,
      user_agent: req.headers.get("user-agent") || null,
    });

    return new NextResponse(null, { status: 204 });
  } catch {
    return new NextResponse(null, { status: 400 });
  }
}
