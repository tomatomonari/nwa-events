import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";

function isAdmin(req: NextRequest) {
  return req.headers.get("x-admin-password") === process.env.ADMIN_PASSWORD;
}

export async function GET(req: NextRequest) {
  if (!isAdmin(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getServiceClient();

  const { data: emailEvents } = await supabase
    .from("email_events")
    .select("event_type, created_at")
    .order("created_at", { ascending: false });

  const events = emailEvents || [];

  // Totals by type
  const totals: Record<string, number> = {};
  for (const e of events) {
    totals[e.event_type] = (totals[e.event_type] || 0) + 1;
  }

  const delivered = totals["email.delivered"] || 0;
  const opened = totals["email.opened"] || 0;
  const clicked = totals["email.clicked"] || 0;
  const bounced = totals["email.bounced"] || 0;

  // Daily breakdown
  const dailyStats: Record<string, Record<string, number>> = {};
  for (const e of events) {
    const date = e.created_at.split("T")[0];
    if (!dailyStats[date]) dailyStats[date] = {};
    dailyStats[date][e.event_type] = (dailyStats[date][e.event_type] || 0) + 1;
  }

  const dailyTrend = Object.entries(dailyStats)
    .map(([date, stats]) => ({
      date,
      delivered: stats["email.delivered"] || 0,
      opened: stats["email.opened"] || 0,
      clicked: stats["email.clicked"] || 0,
      bounced: stats["email.bounced"] || 0,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));

  return NextResponse.json({
    totals: { delivered, opened, clicked, bounced },
    openRate: delivered > 0 ? Math.round((opened / delivered) * 100) : 0,
    clickRate: delivered > 0 ? Math.round((clicked / delivered) * 100) : 0,
    bounceRate: delivered > 0 ? Math.round((bounced / delivered) * 100) : 0,
    dailyTrend,
  });
}
