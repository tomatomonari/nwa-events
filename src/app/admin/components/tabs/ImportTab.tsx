"use client";

import { useState } from "react";
import { format } from "date-fns";

interface ImportTabProps {
  password: string;
}

interface PreviewEvent {
  title: string;
  description: string | null;
  start_date: string;
  end_date: string | null;
  location_name: string | null;
  location_address: string | null;
  organizer_name: string;
  image_url: string | null;
  source_url: string;
  city: string | null;
  hosts: string[];
  signals: string[];
}

export default function ImportTab({ password }: ImportTabProps) {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [preview, setPreview] = useState<PreviewEvent | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handlePreview(e: React.FormEvent) {
    e.preventDefault();
    if (!url.trim()) return;

    setLoading(true);
    setError(null);
    setPreview(null);
    setSuccess(null);

    try {
      const res = await fetch("/api/admin/import-luma", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-password": password,
        },
        body: JSON.stringify({ url: url.trim() }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to fetch event");
        return;
      }

      setPreview(data.event);
    } catch {
      setError("Network error — could not reach server");
    } finally {
      setLoading(false);
    }
  }

  async function handleImport() {
    if (!url.trim()) return;

    setImporting(true);
    setError(null);

    try {
      const res = await fetch("/api/admin/import-luma", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-password": password,
        },
        body: JSON.stringify({ url: url.trim(), confirm: true }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Import failed");
        return;
      }

      setSuccess(`Imported "${preview?.title}" — ${data.synced} synced, ${data.skipped} skipped`);
      setPreview(null);
      setUrl("");
    } catch {
      setError("Network error — could not reach server");
    } finally {
      setImporting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold">Import Luma Event</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Paste a Luma event URL to import it. Works with private events if the URL includes the invite token.
        </p>
      </div>

      <form onSubmit={handlePreview} className="flex gap-3">
        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://luma.com/event-slug?tk=..."
          className="flex-1 px-4 py-2.5 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-accent/30"
        />
        <button
          type="submit"
          disabled={loading || !url.trim()}
          className="px-5 py-2.5 text-sm font-medium rounded-lg bg-accent text-white hover:bg-accent/90 disabled:opacity-50 transition-colors"
        >
          {loading ? "Fetching..." : "Preview"}
        </button>
      </form>

      {error && (
        <div className="p-4 rounded-xl border border-red-200 bg-red-50 text-red-700 text-sm">
          {error}
        </div>
      )}

      {success && (
        <div className="p-4 rounded-xl border border-green-200 bg-green-50 text-green-700 text-sm">
          {success}
        </div>
      )}

      {preview && (
        <div className="p-5 rounded-xl border border-border bg-background space-y-4">
          <div className="flex items-start gap-4">
            {preview.image_url && (
              <img
                src={preview.image_url}
                alt=""
                className="w-24 h-24 rounded-lg object-cover flex-shrink-0"
              />
            )}
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-base">{preview.title}</h3>
              <p className="text-sm text-muted-foreground mt-1">
                {format(new Date(preview.start_date), "EEEE, MMMM d · h:mm a")}
                {preview.end_date &&
                  ` – ${format(new Date(preview.end_date), "h:mm a")}`}
              </p>
              <p className="text-sm text-muted-foreground">
                {preview.organizer_name}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            {preview.location_name && (
              <div>
                <span className="text-muted-foreground">Venue: </span>
                {preview.location_name}
              </div>
            )}
            {preview.location_address && (
              <div>
                <span className="text-muted-foreground">Address: </span>
                {preview.location_address}
              </div>
            )}
            {preview.city && (
              <div>
                <span className="text-muted-foreground">City: </span>
                {preview.city}
              </div>
            )}
            {preview.hosts.length > 0 && (
              <div>
                <span className="text-muted-foreground">Hosts: </span>
                {preview.hosts.join(", ")}
              </div>
            )}
            {preview.signals.length > 0 && (
              <div>
                <span className="text-muted-foreground">Signals: </span>
                {preview.signals.join(", ")}
              </div>
            )}
            <div>
              <span className="text-muted-foreground">Source: </span>
              <a
                href={preview.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent hover:underline"
              >
                {preview.source_url}
              </a>
            </div>
          </div>

          {preview.description && (
            <p className="text-sm text-muted-foreground line-clamp-3">
              {preview.description}
            </p>
          )}

          <div className="flex gap-3 pt-2">
            <button
              onClick={handleImport}
              disabled={importing}
              className="px-5 py-2.5 text-sm font-medium rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 transition-colors"
            >
              {importing ? "Importing..." : "Import Event"}
            </button>
            <button
              onClick={() => {
                setPreview(null);
                setUrl("");
              }}
              className="px-5 py-2.5 text-sm font-medium rounded-lg bg-muted text-muted-foreground hover:bg-border transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
