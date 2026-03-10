"use client";

import { useState, useEffect, useCallback } from "react";

interface SourceField {
  key: string;
  label: string;
  placeholder: string;
  required?: boolean;
}

interface SourceItem {
  id: string;
  [key: string]: any;
}

interface SourceManagerProps {
  title: string;
  apiPath: string;
  password: string;
  fields: SourceField[];
  displayKey: string;
  nameKey?: string;
  responseKey: string;
  addingLabel?: string;
}

export default function SourceManager({
  title,
  apiPath,
  password,
  fields,
  displayKey,
  nameKey = "name",
  responseKey,
  addingLabel,
}: SourceManagerProps) {
  const [items, setItems] = useState<SourceItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [formValues, setFormValues] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    for (const f of fields) init[f.key] = "";
    return init;
  });

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(apiPath, {
        headers: { "x-admin-password": password },
      });
      if (res.ok) {
        const data = await res.json();
        setItems(data[responseKey] || []);
      }
    } finally {
      setLoading(false);
    }
  }, [apiPath, password, responseKey]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    const requiredField = fields.find((f) => f.required !== false);
    if (requiredField && !formValues[requiredField.key]?.trim()) return;

    setAdding(true);
    setMessage(null);
    try {
      const body: Record<string, any> = {};
      for (const f of fields) {
        body[f.key] = formValues[f.key] || (f.required === false ? null : formValues[f.key]);
      }

      const res = await fetch(apiPath, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-password": password,
        },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (res.ok) {
        const syncInfo = data.sync?.synced ? ` Synced ${data.sync.synced} events.` : "";
        setMessage({ type: "success", text: `Added successfully.${syncInfo}` });
        const reset: Record<string, string> = {};
        for (const f of fields) reset[f.key] = "";
        setFormValues(reset);
        fetchItems();
      } else {
        setMessage({ type: "error", text: data.error || "Failed to add" });
      }
    } catch {
      setMessage({ type: "error", text: "Network error" });
    } finally {
      setAdding(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm(`Remove this ${title.toLowerCase().replace(/s$/, "")}?`)) return;
    await fetch(apiPath, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        "x-admin-password": password,
      },
      body: JSON.stringify({ id }),
    });
    fetchItems();
  }

  return (
    <div>
      <h3 className="text-sm font-bold mb-3">{title}</h3>

      <form onSubmit={handleAdd} className="flex gap-2 mb-2">
        {fields.map((field) => (
          <input
            key={field.key}
            type="text"
            placeholder={field.placeholder}
            value={formValues[field.key]}
            onChange={(e) => setFormValues((prev) => ({ ...prev, [field.key]: e.target.value }))}
            disabled={adding}
            className="flex-1 px-3 py-2 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-accent/30 disabled:opacity-50"
          />
        ))}
        <button
          type="submit"
          disabled={adding}
          className="px-4 py-2 text-sm font-medium rounded-lg bg-accent text-white hover:bg-accent/90 transition-colors disabled:opacity-50 whitespace-nowrap"
        >
          {adding ? (addingLabel || "Adding...") : "Add"}
        </button>
      </form>

      {message && (
        <p className={`text-xs mb-3 ${message.type === "success" ? "text-green-700" : "text-red-600"}`}>
          {message.text}
        </p>
      )}

      {loading ? (
        <p className="text-muted-foreground text-sm">Loading...</p>
      ) : items.length === 0 ? (
        <p className="text-muted-foreground text-sm">None configured.</p>
      ) : (
        <div className="space-y-2">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between p-3 rounded-lg border border-border bg-background"
            >
              <div>
                <span className="font-medium text-sm">{item[displayKey]}</span>
                {item[nameKey] && (
                  <span className="ml-2 text-sm text-muted-foreground">
                    ({item[nameKey]})
                  </span>
                )}
              </div>
              <button
                onClick={() => handleDelete(item.id)}
                className="px-3 py-1 text-xs font-medium rounded-lg bg-red-100 text-red-700 hover:bg-red-200 transition-colors"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
