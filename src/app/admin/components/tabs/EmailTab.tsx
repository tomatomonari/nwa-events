"use client";

import { useState, useEffect } from "react";
import TrendLineChart from "../charts/TrendLineChart";
import BarBreakdownChart from "../charts/BarBreakdownChart";
import KpiCard from "../charts/KpiCard";

interface EmailData {
  totals: { delivered: number; opened: number; clicked: number; bounced: number };
  openRate: number;
  clickRate: number;
  bounceRate: number;
  dailyTrend: { date: string; delivered: number; opened: number; clicked: number; bounced: number }[];
}

interface EmailTabProps {
  password: string;
}

export default function EmailTab({ password }: EmailTabProps) {
  const [data, setData] = useState<EmailData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/stats/email", {
      headers: { "x-admin-password": password },
    })
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, [password]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-6 w-32 bg-muted rounded animate-pulse" />
        <div className="grid grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 bg-muted rounded-xl animate-pulse" />
          ))}
        </div>
        <div className="h-64 bg-muted rounded-xl animate-pulse" />
      </div>
    );
  }

  if (!data) {
    return <p className="text-muted-foreground">Failed to load email data.</p>;
  }

  const hasData = data.totals.delivered > 0;

  const funnelData = [
    { stage: "Delivered", count: data.totals.delivered },
    { stage: "Opened", count: data.totals.opened },
    { stage: "Clicked", count: data.totals.clicked },
    { stage: "Bounced", count: data.totals.bounced },
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-bold">Email</h2>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Delivered" value={data.totals.delivered} />
        <KpiCard label="Open Rate" value={`${data.openRate}%`} sub={`${data.totals.opened} opened`} />
        <KpiCard label="Click Rate" value={`${data.clickRate}%`} sub={`${data.totals.clicked} clicked`} />
        <KpiCard label="Bounce Rate" value={`${data.bounceRate}%`} sub={`${data.totals.bounced} bounced`} />
      </div>

      {!hasData ? (
        <div className="p-8 rounded-xl border border-border bg-background text-center">
          <p className="text-muted-foreground text-sm">No email events yet.</p>
          <p className="text-xs text-muted-foreground mt-1">
            Set up Resend webhooks to track delivery, opens, and clicks.
          </p>
        </div>
      ) : (
        <>
          {/* Delivery Funnel */}
          <div className="p-4 rounded-xl border border-border bg-background">
            <h3 className="text-sm font-bold mb-3">Delivery Funnel</h3>
            <BarBreakdownChart
              data={funnelData}
              xKey="stage"
              bars={[{ key: "count", color: "#e8572a", name: "Count" }]}
              layout="horizontal"
              height={180}
            />
          </div>

          {/* Daily Performance */}
          {data.dailyTrend.length > 0 && (
            <div className="p-4 rounded-xl border border-border bg-background">
              <h3 className="text-sm font-bold mb-3">Daily Email Performance</h3>
              <TrendLineChart
                data={data.dailyTrend}
                xKey="date"
                lines={[
                  { key: "delivered", color: "#e8572a", name: "Delivered" },
                  { key: "opened", color: "#6b6560", name: "Opened" },
                  { key: "clicked", color: "#e8e4df", name: "Clicked" },
                ]}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}
