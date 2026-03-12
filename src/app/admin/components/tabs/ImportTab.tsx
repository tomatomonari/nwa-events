"use client";

import { useState, useMemo } from "react";
import { format, addWeeks, getDay } from "date-fns";

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

const EMPTY_FORM = {
  title: "",
  start_date: "",
  start_time: "",
  end_time: "",
  location_name: "",
  location_address: "",
  organizer_name: "",
  description: "",
  source_url: "",
};

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

export default function ImportTab({ password }: ImportTabProps) {
  // URL import state
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [preview, setPreview] = useState<PreviewEvent | null>(null);
  const [urlRecurring, setUrlRecurring] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Manual create state
  const [form, setForm] = useState(EMPTY_FORM);
  const [manualRecurring, setManualRecurring] = useState(false);
  const [recurringDay, setRecurringDay] = useState<number | null>(null); // 0=Sun..6=Sat
  const [recurringWeeks, setRecurringWeeks] = useState(4);
  const [manualLoading, setManualLoading] = useState(false);
  const [manualError, setManualError] = useState<string | null>(null);
  const [manualSuccess, setManualSuccess] = useState<string | null>(null);

  // Auto-select day of week from date field
  const inferredDay = useMemo(() => {
    if (!form.start_date) return null;
    const d = new Date(form.start_date + "T00:00:00");
    return isNaN(d.getTime()) ? null : getDay(d);
  }, [form.start_date]);

  function updateForm(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  // --- URL Import ---
  async function handlePreview(e: React.FormEvent) {
    e.preventDefault();
    if (!url.trim()) return;

    setLoading(true);
    setError(null);
    setPreview(null);
    setSuccess(null);

    try {
      const res = await fetch("/api/admin/import-event", {
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
      const res = await fetch("/api/admin/import-event", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-password": password,
        },
        body: JSON.stringify({
          url: url.trim(),
          confirm: true,
          recurring: urlRecurring || undefined,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Import failed");
        return;
      }

      setSuccess(
        `Imported "${preview?.title}" — ${data.synced} synced, ${data.skipped} skipped`
      );
      setPreview(null);
      setUrl("");
      setUrlRecurring(false);
    } catch {
      setError("Network error — could not reach server");
    } finally {
      setImporting(false);
    }
  }

  // --- Manual Create ---
  async function handleManualCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title || !form.start_date || !form.organizer_name) return;

    setManualLoading(true);
    setManualError(null);
    setManualSuccess(null);

    const baseEvent = {
      title: form.title,
      location_name: form.location_name || null,
      location_address: form.location_address || null,
      organizer_name: form.organizer_name,
      description: form.description || null,
      source_url: form.source_url || null,
    };

    try {
      let payload: Record<string, unknown>;

      if (manualRecurring && recurringWeeks > 1) {
        // Generate array of events with weekly offsets
        const baseDate = new Date(form.start_date + "T00:00:00");
        const events = Array.from({ length: recurringWeeks }, (_, i) => {
          const date = addWeeks(baseDate, i);
          const dateStr = format(date, "yyyy-MM-dd");
          const startDateTime = form.start_time
            ? `${dateStr}T${form.start_time}:00`
            : `${dateStr}T00:00:00`;
          const endDateTime = form.end_time
            ? `${dateStr}T${form.end_time}:00`
            : null;
          return {
            ...baseEvent,
            start_date: startDateTime,
            end_date: endDateTime,
          };
        });
        payload = { events, recurring: true };
      } else {
        // Single event
        const startDateTime = form.start_time
          ? `${form.start_date}T${form.start_time}:00`
          : `${form.start_date}T00:00:00`;
        const endDateTime = form.end_time
          ? `${form.start_date}T${form.end_time}:00`
          : null;
        payload = {
          event: { ...baseEvent, start_date: startDateTime, end_date: endDateTime },
          recurring: manualRecurring || undefined,
        };
      }

      const res = await fetch("/api/admin/import-event", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-password": password,
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (!res.ok) {
        setManualError(data.error || "Creation failed");
        return;
      }

      const countLabel = manualRecurring && recurringWeeks > 1
        ? `${recurringWeeks} instances of`
        : "";
      setManualSuccess(
        `Created ${countLabel} "${form.title}" — ${data.synced} synced, ${data.skipped} skipped`
      );
      setForm(EMPTY_FORM);
      setManualRecurring(false);
      setRecurringDay(null);
      setRecurringWeeks(4);
    } catch {
      setManualError("Network error — could not reach server");
    } finally {
      setManualLoading(false);
    }
  }

  const inputClass =
    "w-full px-4 py-2.5 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-accent/30";

  return (
    <div className="space-y-10">
      {/* ---- Section 1: Import from URL ---- */}
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-bold">Import from URL</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Paste any event URL — Luma links use structured scraping, everything
            else is parsed with AI.
          </p>
        </div>

        <form onSubmit={handlePreview} className="flex gap-3">
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://luma.com/event-slug or any event page URL"
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
                {preview.start_date && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {format(
                      new Date(preview.start_date),
                      "EEEE, MMMM d · h:mm a"
                    )}
                    {preview.end_date &&
                      ` – ${format(new Date(preview.end_date), "h:mm a")}`}
                  </p>
                )}
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
              {preview.hosts?.length > 0 && (
                <div>
                  <span className="text-muted-foreground">Hosts: </span>
                  {preview.hosts.join(", ")}
                </div>
              )}
              {preview.signals?.length > 0 && (
                <div>
                  <span className="text-muted-foreground">Signals: </span>
                  {preview.signals.join(", ")}
                </div>
              )}
              {preview.source_url && (
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
              )}
            </div>

            {preview.description && (
              <p className="text-sm text-muted-foreground line-clamp-3">
                {preview.description}
              </p>
            )}

            <div className="flex items-center gap-4 pt-2">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={urlRecurring}
                  onChange={(e) => setUrlRecurring(e.target.checked)}
                  className="rounded border-border text-accent focus:ring-accent/30"
                />
                Mark as recurring
              </label>
            </div>

            <div className="flex gap-3">
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
                  setUrlRecurring(false);
                }}
                className="px-5 py-2.5 text-sm font-medium rounded-lg bg-muted text-muted-foreground hover:bg-border transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Divider */}
      <hr className="border-border" />

      {/* ---- Section 2: Create Manually ---- */}
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-bold">Create Manually</h2>
          <p className="text-sm text-muted-foreground mt-1">
            For events with no URL — recurring meetups, word-of-mouth events,
            etc.
          </p>
        </div>

        {manualError && (
          <div className="p-4 rounded-xl border border-red-200 bg-red-50 text-red-700 text-sm">
            {manualError}
          </div>
        )}

        {manualSuccess && (
          <div className="p-4 rounded-xl border border-green-200 bg-green-50 text-green-700 text-sm">
            {manualSuccess}
          </div>
        )}

        <form onSubmit={handleManualCreate} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => updateForm("title", e.target.value)}
                placeholder="Wednesday Morning Coffee Meetup"
                className={inputClass}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Organizer <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.organizer_name}
                onChange={(e) => updateForm("organizer_name", e.target.value)}
                placeholder="NWA Tech Council"
                className={inputClass}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                {manualRecurring ? "First Date" : "Date"} <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={form.start_date}
                onChange={(e) => updateForm("start_date", e.target.value)}
                className={inputClass}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Start Time
              </label>
              <input
                type="time"
                value={form.start_time}
                onChange={(e) => updateForm("start_time", e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                End Time
              </label>
              <input
                type="time"
                value={form.end_time}
                onChange={(e) => updateForm("end_time", e.target.value)}
                className={inputClass}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Venue Name
              </label>
              <input
                type="text"
                value={form.location_name}
                onChange={(e) => updateForm("location_name", e.target.value)}
                placeholder="The Record"
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Address
              </label>
              <input
                type="text"
                value={form.location_address}
                onChange={(e) =>
                  updateForm("location_address", e.target.value)
                }
                placeholder="123 Main St, Bentonville, AR"
                className={inputClass}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Event URL
            </label>
            <input
              type="url"
              value={form.source_url}
              onChange={(e) => updateForm("source_url", e.target.value)}
              placeholder="https://..."
              className={inputClass}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Description
            </label>
            <textarea
              value={form.description}
              onChange={(e) => updateForm("description", e.target.value)}
              placeholder="Brief description of the event..."
              rows={3}
              className={inputClass}
            />
          </div>

          <div className="space-y-3">
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={manualRecurring}
                onChange={(e) => {
                  setManualRecurring(e.target.checked);
                  if (e.target.checked && inferredDay !== null) {
                    setRecurringDay(inferredDay);
                  }
                }}
                className="rounded border-border text-accent focus:ring-accent/30"
              />
              Recurring event
            </label>

            {manualRecurring && (
              <div className="pl-6 space-y-3 border-l-2 border-accent/20">
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                    Day of week
                  </label>
                  <div className="flex gap-1.5">
                    {DAYS.map((label, i) => (
                      <button
                        key={label}
                        type="button"
                        onClick={() => setRecurringDay(i)}
                        className={`px-2.5 py-1 text-xs font-medium rounded-full transition-colors ${
                          (recurringDay ?? inferredDay) === i
                            ? "bg-accent text-white"
                            : "bg-muted text-muted-foreground hover:bg-border"
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                    Number of weeks
                  </label>
                  <input
                    type="number"
                    min={2}
                    max={52}
                    value={recurringWeeks}
                    onChange={(e) =>
                      setRecurringWeeks(
                        Math.max(2, Math.min(52, parseInt(e.target.value) || 2))
                      )
                    }
                    className="w-20 px-3 py-1.5 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-accent/30"
                  />
                </div>
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={
              manualLoading ||
              !form.title ||
              !form.start_date ||
              !form.organizer_name
            }
            className="px-5 py-2.5 text-sm font-medium rounded-lg bg-accent text-white hover:bg-accent/90 disabled:opacity-50 transition-colors"
          >
            {manualLoading
              ? "Creating..."
              : manualRecurring && recurringWeeks > 1
                ? `Create ${recurringWeeks} Events`
                : "Create Event"}
          </button>
        </form>
      </div>
    </div>
  );
}
