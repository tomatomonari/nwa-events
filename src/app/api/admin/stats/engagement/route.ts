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

  // Get all click events from last 30 days
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const [clicksResult, eventsResult] = await Promise.all([
    supabase
      .from("click_events")
      .select("event_id, click_type, created_at")
      .gte("created_at", thirtyDaysAgo)
      .order("created_at", { ascending: false }),
    // Get event titles for the top events
    supabase
      .from("events")
      .select("id, title, start_date")
      .eq("status", "approved"),
  ]);

  const clicks = clicksResult.data || [];
  const events = eventsResult.data || [];
  const eventMap = new Map(events.map((e) => [e.id, e]));

  // Top events by engagement
  const eventStats: Record<string, { views: number; registers: number }> = {};
  for (const click of clicks) {
    if (!eventStats[click.event_id]) {
      eventStats[click.event_id] = { views: 0, registers: 0 };
    }
    if (click.click_type === "view") eventStats[click.event_id].views++;
    if (click.click_type === "register") eventStats[click.event_id].registers++;
  }

  const topEvents = Object.entries(eventStats)
    .map(([eventId, stats]) => ({
      eventId,
      title: eventMap.get(eventId)?.title || "Unknown",
      startDate: eventMap.get(eventId)?.start_date || null,
      views: stats.views,
      registers: stats.registers,
      ctr: stats.views > 0 ? Math.round((stats.registers / stats.views) * 100) : 0,
    }))
    .sort((a, b) => b.views - a.views)
    .slice(0, 20);

  // Daily click totals
  const dailyClicks: Record<string, { views: number; registers: number }> = {};
  for (const click of clicks) {
    const date = click.created_at.split("T")[0];
    if (!dailyClicks[date]) dailyClicks[date] = { views: 0, registers: 0 };
    if (click.click_type === "view") dailyClicks[date].views++;
    if (click.click_type === "register") dailyClicks[date].registers++;
  }

  const dailyTrend = Object.entries(dailyClicks)
    .map(([date, stats]) => ({ date, ...stats }))
    .sort((a, b) => a.date.localeCompare(b.date));

  return NextResponse.json({
    topEvents,
    dailyTrend,
    totalViews: clicks.filter((c) => c.click_type === "view").length,
    totalRegisters: clicks.filter((c) => c.click_type === "register").length,
  });
}
