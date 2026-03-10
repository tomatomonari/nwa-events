/** Client-side click tracking — fire-and-forget via sendBeacon */

function getSessionId(): string {
  if (typeof window === "undefined") return "";
  let id = localStorage.getItem("nwa_session_id");
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem("nwa_session_id", id);
  }
  return id;
}

export function trackClick(eventId: string, clickType: "view" | "register") {
  if (typeof navigator === "undefined") return;

  const body = JSON.stringify({
    event_id: eventId,
    click_type: clickType,
    session_id: getSessionId(),
  });

  if (navigator.sendBeacon) {
    navigator.sendBeacon("/api/track", new Blob([body], { type: "application/json" }));
  } else {
    fetch("/api/track", { method: "POST", body, keepalive: true }).catch(() => {});
  }
}
