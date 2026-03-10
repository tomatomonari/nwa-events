"use client";

import { useState } from "react";
import Link from "next/link";

type Cadence = "daily" | "weekly";

const DAYS = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"] as const;

export default function SubscribePage() {
  const [email, setEmail] = useState("");
  const [cadence, setCadence] = useState<Cadence>("weekly");
  const [weeklyDay, setWeeklyDay] = useState("sunday");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setMessage("");

    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, cadence, weekly_day: cadence === "weekly" ? weeklyDay : undefined, categories: ["business"] }),
      });

      const data = await res.json();

      if (res.ok) {
        setStatus("success");
      } else {
        setStatus("error");
        setMessage(data.error || "Something went wrong.");
      }
    } catch {
      setStatus("error");
      setMessage("Something went wrong. Try again.");
    }
  }

  if (status === "success") {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <div className="w-14 h-14 rounded-full bg-accent-light flex items-center justify-center mx-auto mb-6">
          <svg className="w-7 h-7 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>
        <h1 className="text-2xl font-semibold mb-3">Check your inbox!</h1>
        <p className="text-muted-foreground mb-6">
          We sent a confirmation link to <strong>{email}</strong>.<br />
          Click it to start receiving your event digest.
        </p>
        <Link href="/" className="text-sm text-accent hover:underline">
          Back to events
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-16">
      <h1 className="text-2xl font-semibold mb-2">Subscribe to event updates</h1>
      <p className="text-muted-foreground mb-8">
        Get a curated digest of upcoming NWA business events delivered to your inbox.
      </p>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Email */}
        <div>
          <label htmlFor="email" className="block text-sm font-medium mb-1.5">
            Email
          </label>
          <input
            id="email"
            type="email"
            required
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2.5 text-sm rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-colors"
          />
        </div>

        {/* Cadence */}
        <div>
          <label className="block text-sm font-medium mb-2">Frequency</label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setCadence("weekly")}
              className={`cursor-pointer px-4 py-3 text-left rounded-xl border transition-colors ${
                cadence === "weekly"
                  ? "border-accent bg-accent-light"
                  : "border-border hover:border-accent/30"
              }`}
            >
              <div className={`text-sm font-medium ${cadence === "weekly" ? "text-accent" : ""}`}>Weekly</div>
              <div className="text-xs text-muted-foreground mt-0.5">
                Your week at a glance.
              </div>
            </button>
            <button
              type="button"
              onClick={() => setCadence("daily")}
              className={`cursor-pointer px-4 py-3 text-left rounded-xl border transition-colors ${
                cadence === "daily"
                  ? "border-accent bg-accent-light"
                  : "border-border hover:border-accent/30"
              }`}
            >
              <div className={`text-sm font-medium ${cadence === "daily" ? "text-accent" : ""}`}>Daily</div>
              <div className="text-xs text-muted-foreground mt-0.5">
                Never miss what&apos;s happening.
              </div>
            </button>
          </div>
          {cadence === "weekly" && (
            <div className="mt-3">
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                Deliver on
              </label>
              <div className="grid grid-cols-7 gap-1.5">
                {DAYS.map((day) => (
                  <button
                    key={day}
                    type="button"
                    onClick={() => setWeeklyDay(day)}
                    className={`py-2 text-xs rounded-lg border transition-colors capitalize ${
                      weeklyDay === day
                        ? "border-accent bg-accent-light text-accent font-medium"
                        : "border-border text-muted-foreground hover:border-accent/30"
                    }`}
                  >
                    {day.slice(0, 3)}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={status === "loading"}
          className="w-full py-3 text-sm font-semibold rounded-xl bg-accent text-white hover:bg-accent/90 transition-colors disabled:opacity-50 cursor-pointer"
        >
          {status === "loading" ? "Subscribing..." : "Subscribe"}
        </button>

        <p className="text-xs text-muted-foreground text-center">
          We only send when there are events to share.
        </p>

        {status === "error" && message && (
          <p className="text-sm text-red-600 text-center">{message}</p>
        )}
      </form>
    </div>
  );
}
