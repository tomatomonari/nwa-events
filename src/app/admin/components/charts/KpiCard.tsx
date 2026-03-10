"use client";

interface KpiCardProps {
  label: string;
  value: string | number;
  sub?: string;
}

export default function KpiCard({ label, value, sub }: KpiCardProps) {
  return (
    <div className="p-4 rounded-xl border border-border bg-background">
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <p className="text-2xl font-bold">{value}</p>
      {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
    </div>
  );
}
