"use client";

export type AdminTab = "overview" | "events" | "import" | "sources" | "subscribers" | "engagement" | "email";

const TABS: { id: AdminTab; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "events", label: "Events" },
  { id: "import", label: "Import Event" },
  { id: "sources", label: "Sources" },
  { id: "subscribers", label: "Subscribers" },
  { id: "engagement", label: "Engagement" },
  { id: "email", label: "Email" },
];

interface AdminSidebarProps {
  activeTab: AdminTab;
  onTabChange: (tab: AdminTab) => void;
  onMobileClose?: () => void;
}

export default function AdminSidebar({ activeTab, onTabChange, onMobileClose }: AdminSidebarProps) {
  return (
    <nav className="flex flex-col gap-1 p-3">
      <div className="px-3 py-2 mb-2">
        <p className="text-sm font-bold">NWA.events</p>
        <p className="text-xs text-muted-foreground">Admin</p>
      </div>
      {TABS.map((tab) => (
        <button
          key={tab.id}
          onClick={() => {
            onTabChange(tab.id);
            onMobileClose?.();
          }}
          className={`text-left px-3 py-2 rounded-lg text-sm transition-colors ${
            activeTab === tab.id
              ? "bg-foreground text-background font-medium"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          }`}
        >
          {tab.label}
        </button>
      ))}
    </nav>
  );
}
