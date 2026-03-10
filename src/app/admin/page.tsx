"use client";

import { useState } from "react";
import AdminShell from "./components/AdminShell";
import type { AdminTab } from "./components/AdminSidebar";
import OverviewTab from "./components/tabs/OverviewTab";
import EventsTab from "./components/tabs/EventsTab";
import SourcesTab from "./components/tabs/SourcesTab";
import SubscribersTab from "./components/tabs/SubscribersTab";
import EngagementTab from "./components/tabs/EngagementTab";
import EmailTab from "./components/tabs/EmailTab";

export default function AdminPage() {
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [activeTab, setActiveTab] = useState<AdminTab>("overview");

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/events?status=pending", {
      headers: { "x-admin-password": password },
    });
    if (res.ok) {
      setAuthenticated(true);
    } else {
      alert("Wrong password");
    }
  }

  if (!authenticated) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-muted">
        <div className="w-full max-w-sm px-4">
          <div className="p-6 rounded-xl border border-border bg-background">
            <h1 className="text-lg font-bold mb-1">NWA.events</h1>
            <p className="text-sm text-muted-foreground mb-4">Admin Dashboard</p>
            <form onSubmit={handleLogin} className="space-y-3">
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2.5 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-accent/30"
              />
              <button
                type="submit"
                className="w-full px-4 py-2.5 text-sm font-medium rounded-lg bg-accent text-white hover:bg-accent/90"
              >
                Login
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <AdminShell activeTab={activeTab} onTabChange={setActiveTab}>
      {activeTab === "overview" && <OverviewTab password={password} />}
      {activeTab === "events" && <EventsTab password={password} />}
      {activeTab === "sources" && <SourcesTab password={password} />}
      {activeTab === "subscribers" && <SubscribersTab password={password} />}
      {activeTab === "engagement" && <EngagementTab password={password} />}
      {activeTab === "email" && <EmailTab password={password} />}
    </AdminShell>
  );
}
