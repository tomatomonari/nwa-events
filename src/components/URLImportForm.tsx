"use client";

import { useState } from "react";
import { format } from "date-fns";
import type { Event } from "@/lib/types";

export default function URLImportForm() {
  const [url, setUrl] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "preview" | "saving" | "success" | "error">("idle");
  const [preview, setPreview] = useState<Partial<Event> | null>(null);
  const [message, setMessage] = useState("");

  async function handleFetch(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setMessage("");

    try {
      const res = await fetch("/api/import-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to parse URL");
      }

      const data = await res.json();
      setPreview(data.event);
      setStatus("preview");
    } catch (err) {
      setStatus("error");
      setMessage(err instanceof Error ? err.message : "Something went wrong.");
    }
  }

  async function handleSubmit() {
    if (!preview) return;
    setStatus("saving");

    try {
      const res = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...preview, source_url: url, source_platform: "url_import", status: "pending" }),
      });

      if (!res.ok) throw new Error("Failed to save event");

      setStatus("success");
      setMessage("Event submitted! It'll be reviewed and published shortly.");
      setUrl("");
      setPreview(null);
    } catch {
      setStatus("error");
      setMessage("Failed to save. Try again.");
    }
  }

  if (status === "success") {
    return (
      <div className="rounded-xl border border-border bg-background p-8 text-center">
        <div className="text-2xl mb-2">&#10003;</div>
        <p className="font-medium">{message}</p>
        <button
          onClick={() => { setStatus("idle"); setMessage(""); }}
          className="mt-4 text-sm text-accent hover:underline"
        >
          Add another
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* URL Input */}
      <form onSubmit={handleFetch}>
        <label htmlFor="event-url" className="block text-sm font-medium mb-2">
          Event URL
        </label>
        <p className="text-sm text-muted-foreground mb-3">
          Paste a link from Luma, Eventbrite, LinkedIn, or any event page. We&apos;ll extract the details automatically.
        </p>
        <div className="flex gap-2">
          <input
            id="event-url"
            type="url"
            required
            placeholder="https://lu.ma/example-event"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            disabled={status === "loading"}
            className="flex-1 px-4 py-2.5 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-colors"
          />
          <button
            type="submit"
            disabled={status === "loading"}
            className="px-5 py-2.5 text-sm font-medium rounded-lg bg-accent text-white hover:bg-accent/90 transition-colors disabled:opacity-50"
          >
            {status === "loading" ? "Parsing..." : "Import"}
          </button>
        </div>
        {status === "error" && (
          <p className="mt-2 text-sm text-red-500">{message}</p>
        )}
      </form>

      {/* Preview */}
      {(status === "preview" || status === "saving") && preview && (
        <div className="rounded-xl border border-border bg-background p-6 space-y-4">
          <h3 className="font-semibold">Preview</h3>

          <div className="space-y-3 text-sm">
            <div>
              <span className="text-muted-foreground">Title: </span>
              <span className="font-medium">{preview.title}</span>
            </div>
            {preview.start_date && (
              <div>
                <span className="text-muted-foreground">Date: </span>
                <span>{format(new Date(preview.start_date), "PPpp")}</span>
              </div>
            )}
            {(preview.location_name || preview.is_online) && (
              <div>
                <span className="text-muted-foreground">Location: </span>
                <span>{preview.is_online ? "Online" : preview.location_name}</span>
              </div>
            )}
            {preview.organizer_name && (
              <div>
                <span className="text-muted-foreground">Organizer: </span>
                <span>
                  {preview.organizer_name}
                  {preview.organizer_title && `, ${preview.organizer_title}`}
                  {preview.organizer_company && ` at ${preview.organizer_company}`}
                </span>
              </div>
            )}
            {preview.description && (
              <div>
                <span className="text-muted-foreground">Description: </span>
                <span className="line-clamp-3">{preview.description}</span>
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={handleSubmit}
              disabled={status === "saving"}
              className="px-5 py-2 text-sm font-medium rounded-lg bg-accent text-white hover:bg-accent/90 transition-colors disabled:opacity-50"
            >
              {status === "saving" ? "Submitting..." : "Submit Event"}
            </button>
            <button
              onClick={() => { setStatus("idle"); setPreview(null); }}
              className="px-5 py-2 text-sm font-medium rounded-lg border border-border hover:bg-muted transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
