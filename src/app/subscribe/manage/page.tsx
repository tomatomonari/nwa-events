"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

type Category = "business" | "fun" | "both";
type Cadence = "daily" | "weekly";

interface Prefs {
  email: string;
  cadence: Cadence;
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
  const [category, setCategory] = useState<Category>("business");
  const [cadence, setCadence] = useState<Cadence>("weekly");
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
        if (data.categories.includes("business") && data.categories.includes("fun")) {
          setCategory("both");
        } else if (data.categories.includes("fun")) {
          setCategory("fun");
        } else {
          setCategory("business");
        }
        setStatus("loaded");
      })
      .catch(() => setStatus("invalid"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, action]);

  async function handleSave() {
    setStatus("saving");
    const categories = category === "both" ? ["business", "fun"] : [category];

    try {
      const res = await fetch("/api/subscribe/manage", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, cadence, categories }),
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
        {/* Category */}
        <div>
          <label className="block text-sm font-medium mb-2">Events</label>
          <div className="grid grid-cols-3 gap-2">
            {([
              { value: "business" as const, label: "Business", icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 00.75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 00-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0112 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 01-.673-.38m0 0A2.18 2.18 0 013 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 013.413-.387m7.5 0V5.25A2.25 2.25 0 0013.5 3h-3a2.25 2.25 0 00-2.25 2.25v.894m7.5 0a48.667 48.667 0 00-7.5 0" /></svg> },
              { value: "fun" as const, label: "Fun", icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" /></svg> },
              { value: "both" as const, label: "Both", icon: null },
            ]).map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setCategory(opt.value)}
                className={`cursor-pointer px-4 py-2.5 text-sm font-medium rounded-xl border transition-colors flex items-center justify-center gap-1.5 ${
                  category === opt.value
                    ? "border-accent bg-accent-light text-accent"
                    : "border-border text-muted-foreground hover:border-accent/30"
                }`}
              >
                {opt.icon}{opt.label}
              </button>
            ))}
          </div>
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
                Your week at a glance, every Sunday.
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
