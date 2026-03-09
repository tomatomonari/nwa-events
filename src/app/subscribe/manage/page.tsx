"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

type Cadence = "daily" | "weekly";

const DAYS = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"] as const;

interface Prefs {
  email: string;
  cadence: Cadence;
  weekly_day: string;
  categories: string[];
}

export default function ManagePage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-lg mx-auto px-4 py-16 text-center">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      }
    >
      <ManageContent />
    </Suspense>
  );
}

function ManageContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const action = searchParams.get("action");

  const [prefs, setPrefs] = useState<Prefs | null>(null);
  const [cadence, setCadence] = useState<Cadence>("weekly");
  const [weeklyDay, setWeeklyDay] = useState("sunday");
  const [status, setStatus] = useState<"loading" | "loaded" | "saving" | "saved" | "error" | "unsubscribed" | "invalid">("loading");
  const [showUnsubConfirm, setShowUnsubConfirm] = useState(false);

  useEffect(() => {
    if (!token) {
      setStatus("invalid");
      return;
    }

    // Handle direct unsubscribe link
    if (action === "unsubscribe") {
      handleUnsubscribe();
      return;
    }

    fetch(`/api/subscribe/manage?token=${token}`)
      .then((res) => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then((data: Prefs) => {
        setPrefs(data);
        setCadence(data.cadence);
        setWeeklyDay(data.weekly_day || "sunday");
        setStatus("loaded");
      })
      .catch(() => setStatus("invalid"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, action]);

  async function handleSave() {
    setStatus("saving");

    try {
      const res = await fetch("/api/subscribe/manage", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, cadence, weekly_day: cadence === "weekly" ? weeklyDay : undefined, categories: ["business"] }),
      });

      if (res.ok) {
        setStatus("saved");
        setTimeout(() => setStatus("loaded"), 2000);
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  }

  async function handleUnsubscribe() {
    try {
      const res = await fetch("/api/subscribe/manage", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });

      if (res.ok) {
        setStatus("unsubscribed");
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  }

  if (status === "invalid") {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-semibold mb-3">Invalid link</h1>
        <p className="text-muted-foreground mb-6">
          This manage link is invalid or expired.
        </p>
        <Link href="/subscribe" className="text-sm text-accent hover:underline">
          Subscribe
        </Link>
      </div>
    );
  }

  if (status === "unsubscribed") {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-semibold mb-3">Unsubscribed</h1>
        <p className="text-muted-foreground mb-6">
          You&apos;ve been unsubscribed and won&apos;t receive any more emails.
        </p>
        <Link href="/" className="text-sm text-accent hover:underline">
          Back to events
        </Link>
      </div>
    );
  }

  if (status === "loading" || !prefs) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-16">
      <h1 className="text-2xl font-semibold mb-2">Manage subscription</h1>
      <p className="text-muted-foreground mb-8">
        Update your preferences for <strong>{prefs.email}</strong>.
      </p>

      <div className="space-y-6">
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
          <p className="text-xs text-muted-foreground mt-2">
            We only send when there are events to share.
          </p>
        </div>

        {/* Save */}
        <button
          onClick={handleSave}
          disabled={status === "saving"}
          className="w-full py-3 text-sm font-semibold rounded-xl bg-accent text-white hover:bg-accent/90 transition-colors disabled:opacity-50"
        >
          {status === "saving" ? "Saving..." : status === "saved" ? "Saved!" : "Save preferences"}
        </button>

        {status === "error" && (
          <p className="text-sm text-red-600 text-center">Something went wrong. Try again.</p>
        )}

        {/* Unsubscribe */}
        <div className="pt-4 border-t border-border">
          {showUnsubConfirm ? (
            <div className="text-center space-y-3">
              <p className="text-sm text-muted-foreground">
                Are you sure? You&apos;ll stop receiving all event digests.
              </p>
              <div className="flex items-center justify-center gap-3">
                <button
                  onClick={handleUnsubscribe}
                  className="px-4 py-2 text-sm font-medium rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                >
                  Yes, unsubscribe
                </button>
                <button
                  onClick={() => setShowUnsubConfirm(false)}
                  className="px-4 py-2 text-sm font-medium rounded-lg text-muted-foreground hover:text-foreground transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowUnsubConfirm(true)}
              className="w-full text-center text-sm text-muted-foreground hover:text-red-600 transition-colors"
            >
              Unsubscribe
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
