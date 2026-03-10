"use client";

import { useState, useEffect } from "react";
import KpiCard from "../charts/KpiCard";
import TrendLineChart from "../charts/TrendLineChart";
import BarBreakdownChart from "../charts/BarBreakdownChart";

interface OverviewData {
  subscribers: { total: number; daily: number; weekly: number };
  upcomingEvents: number;
  pendingEvents: number;
  eventsBySource: Record<string, number>;
  latestSyncs: Record<string, { source: string; status: string; synced: number; duration_ms: number; created_at: string; error_message?: string }>;
  email7d: { delivered: number; opened: number; clicked: number; openRate: number; clickRate: number };
}

interface OverviewTabProps {
  password: string;
}

export default function OverviewTab({ password }: OverviewTabProps) {
  const [data, setData] = useState<OverviewData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/stats/overview", {
      headers: { "x-admin-password": password },
    })
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, [password]);

  if (loading) {
    return <LoadingSkeleton />;
  }

  if (!data) {
    return <p className="text-muted-foreground">Failed to load overview data.</p>;
  }

  const sourceChartData = Object.entries(data.eventsBySource).map(([source, count]) => ({
    source,
    count,
  }));

  const syncEntries = Object.entries(data.latestSyncs);

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-bold">Overview</h2>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Active Subscribers" value={data.subscribers.total} sub={`${data.subscribers.daily} daily, ${data.subscribers.weekly} weekly`} />
        <KpiCard label="Upcoming Events" value={data.upcomingEvents} />
        <KpiCard label="Pending Review" value={data.pendingEvents} />
        <KpiCard label="7-Day Open Rate" value={`${data.email7d.openRate}%`} sub={`${data.email7d.delivered} delivered, ${data.email7d.opened} opened`} />
      </div>

      {/* Events by Source */}
      {sourceChartData.length > 0 && (
        <div className="p-4 rounded-xl border border-border bg-background">
          <h3 className="text-sm font-bold mb-3">Events by Source</h3>
          <BarBreakdownChart
            data={sourceChartData}
            xKey="source"
            bars={[{ key: "count", color: "#e8572a", name: "Events" }]}
            height={200}
          />
        </div>
      )}

      {/* Sync Status */}
      {syncEntries.length > 0 && (
        <div className="p-4 rounded-xl border border-border bg-background">
          <h3 className="text-sm font-bold mb-3">Latest Syncs</h3>
          <div className="space-y-2">
            {syncEntries.map(([source, log]) => (
              <div key={source} className="flex items-center justify-between text-sm">
                <span className="capitalize font-medium">{source.replace("_", " ")}</span>
                <div className="flex items-center gap-3">
                  {log.status === "success" ? (
                    <span className="text-green-700">{log.synced} synced</span>
                  ) : (
                    <span className="text-red-600">Error</span>
                  )}
                  {log.duration_ms && (
                    <span className="text-muted-foreground text-xs">{(log.duration_ms / 1000).toFixed(1)}s</span>
                  )}
                  <span className="text-xs text-muted-foreground">
                    {new Date(log.created_at).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="h-6 w-32 bg-muted rounded animate-pulse" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="p-4 rounded-xl border border-border bg-background">
            <div className="h-3 w-20 bg-muted rounded animate-pulse mb-2" />
            <div className="h-8 w-16 bg-muted rounded animate-pulse" />
          </div>
        ))}
      </div>
      <div className="h-48 bg-muted rounded-xl animate-pulse" />
    </div>
  );
}
