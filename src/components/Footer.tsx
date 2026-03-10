"use client";

import { useState } from "react";

export default function Footer() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    setStatus("loading");
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, cadence: "weekly", categories: ["business"] }),
      });
      if (res.ok) {
        setStatus("success");
        setEmail("");
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  }

  return (
    <footer className="border-t border-border mt-16">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h3 className="text-lg font-semibold mb-2">
              NWA<span className="text-accent">.events</span>
            </h3>
            <p className="text-sm text-muted-foreground max-w-sm">
              One place to discover everything happening in Northwest Arkansas.
              Networking, tech, startups, career — all in one feed.
            </p>
          </div>
          <div>
            <h4 className="text-sm font-semibold mb-3">Stay in the loop</h4>
            <p className="text-sm text-muted-foreground mb-3">
              Get a weekly digest of upcoming events.
            </p>
            {status === "success" ? (
              <p className="text-sm text-accent font-medium">Check your inbox to confirm!</p>
            ) : (
              <form onSubmit={handleSubmit} className="flex">
                <input
                  type="email"
                  required
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="flex-1 min-w-0 px-4 py-2.5 text-sm border border-border border-r-0 rounded-l-lg bg-background hover:border-accent/40 focus:outline-none focus:border-accent transition-colors"
                />
                <button
                  type="submit"
                  disabled={status === "loading"}
                  className="px-5 py-2.5 text-sm font-semibold bg-accent text-white rounded-r-lg hover:bg-accent/90 transition-colors disabled:opacity-50"
                >
                  {status === "loading" ? "..." : "Subscribe"}
                </button>
              </form>
            )}
            {status === "error" && (
              <p className="text-xs text-red-600 mt-2">Something went wrong. Try again.</p>
            )}
          </div>
        </div>
        <div className="mt-8 pt-6 border-t border-border text-xs text-muted-foreground">
          Built for the NWA community
        </div>
      </div>
    </footer>
  );
}
