"use client";

import { useState } from "react";
import Link from "next/link";

type Category = "business" | "fun" | "both";
type Cadence = "daily" | "weekly";

export default function SubscribePage() {
  const [email, setEmail] = useState("");
  const [category, setCategory] = useState<Category>("business");
  const [cadence, setCadence] = useState<Cadence>("weekly");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setMessage("");

    const categories =
      category === "both" ? ["business", "fun"] : [category];

    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, cadence, categories }),
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
        Get a curated digest of upcoming NWA events delivered to your inbox.
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

        {/* Submit */}
        <button
          type="submit"
          disabled={status === "loading"}
          className="w-full py-3 text-sm font-semibold rounded-xl bg-accent text-white hover:bg-accent/90 transition-colors disabled:opacity-50"
        >
          {status === "loading" ? "Subscribing..." : "Subscribe"}
        </button>

        {status === "error" && message && (
          <p className="text-sm text-red-600 text-center">{message}</p>
        )}
      </form>
    </div>
  );
}
