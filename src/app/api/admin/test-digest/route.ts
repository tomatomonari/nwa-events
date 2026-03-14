import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";
import { sendDigestEmail } from "@/lib/email";
import { buildDigestHtml } from "@/emails/digest";
import type { Event } from "@/lib/types";

const TEST_EMAIL = "toma88.13.88@gmail.com";

export async function POST(req: NextRequest) {
  const password = req.headers.get("x-admin-password");
  if (password !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { cadence = "weekly" } = await req.json();
  const supabase = getServiceClient();

  const now = new Date();
  const todayCT = new Date(now.toLocaleString("en-US", { timeZone: "America/Chicago" }));
  todayCT.setHours(0, 0, 0, 0);

  const endDate = new Date(todayCT);
  endDate.setDate(endDate.getDate() + (cadence === "daily" ? 1 : 7));

  const { data: events } = await supabase
    .from("events")
    .select("*")
    .eq("status", "approved")
    .eq("primary_category", "business")
    .gte("start_date", todayCT.toISOString())
    .lt("start_date", endDate.toISOString())
    .order("start_date", { ascending: true });

  const filtered = (events || []) as Event[];

  if (filtered.length === 0) {
    return NextResponse.json({ error: "No events to include in digest" }, { status: 400 });
  }

  const subject =
    cadence === "daily"
      ? `${filtered.length} event${filtered.length === 1 ? "" : "s"} happening today in NWA`
      : `Your weekly NWA events digest — ${filtered.length} events`;

  const htmlContent = buildDigestHtml(filtered, cadence);

  // Use a dummy manage token since this is a test
  await sendDigestEmail(TEST_EMAIL, subject, htmlContent, "test");

  return NextResponse.json({
    message: `Test ${cadence} digest sent to ${TEST_EMAIL}`,
    events: filtered.length,
  });
}
