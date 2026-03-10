"use client";

import { useEffect, useLayoutEffect, useRef, useState, useCallback } from "react";
import { format } from "date-fns";
import type { Event } from "@/lib/types";
import { getSignalDef } from "@/lib/signals";
import { trackClick } from "@/lib/tracking";

interface EventModalProps {
  event: Event | null;
  sourceRect: DOMRect | null;
  onClose: () => void;
}

export default function EventModal({ event, sourceRect, onClose }: EventModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);
  const [closing, setClosing] = useState(false);
  const displayEvent = useRef<Event | null>(null);

  if (event) {
    displayEvent.current = event;
  }

  // Body scroll lock + ESC key
  useEffect(() => {
    if (!event && !closing) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") handleClose();
    }
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [event, closing]);

  // FLIP open animation
  useLayoutEffect(() => {
    if (!event || !modalRef.current || closing) return;

    const modal = modalRef.current;

    if (sourceRect) {
      const modalRect = modal.getBoundingClientRect();
      const scale = sourceRect.width / modalRect.width;
      const translateX =
        sourceRect.left + sourceRect.width / 2 - (modalRect.left + modalRect.width / 2);
      const translateY =
        sourceRect.top + sourceRect.height / 2 - (modalRect.top + modalRect.height / 2);

      modal.style.transform = `translate(${translateX}px, ${translateY}px) scale(${scale})`;
      modal.style.opacity = "0";
      modal.style.transition = "none";

      // Force reflow
      modal.getBoundingClientRect();

      requestAnimationFrame(() => {
        modal.style.transition =
          "transform 450ms cubic-bezier(0.45, 0, 0.55, 1), opacity 200ms ease-out";
        modal.style.transform = "none";
        modal.style.opacity = "1";
      });
    } else {
      modal.style.animation = "modal-in 200ms ease-out";
    }
  }, [event, sourceRect]);

  const handleClose = useCallback(() => {
    if (closing) return;
    setClosing(true);

    if (modalRef.current) {
      modalRef.current.style.transition =
        "transform 350ms cubic-bezier(0.45, 0, 0.55, 1), opacity 250ms ease-in";
      modalRef.current.style.transform = "scale(0.97)";
      modalRef.current.style.opacity = "0";
    }
    if (backdropRef.current) {
      backdropRef.current.style.transition = "opacity 400ms cubic-bezier(0.25, 0.1, 0.25, 1)";
      backdropRef.current.style.opacity = "0";
    }

    setTimeout(() => {
      setClosing(false);
      displayEvent.current = null;
      onClose();
    }, 350);
  }, [closing, onClose]);

  if (!event && !closing) return null;

  const ev = displayEvent.current;
  if (!ev) return null;

  const startDate = new Date(ev.start_date);
  const endDate = ev.end_date ? new Date(ev.end_date) : null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto">
      {/* Backdrop */}
      <div
        ref={backdropRef}
        className="fixed inset-0 bg-black/50"
        style={{ animation: "fade-in 500ms cubic-bezier(0.25, 0.1, 0.25, 1)" }}
        onClick={handleClose}
      />

      {/* Modal panel */}
      <div
        ref={modalRef}
        className="relative w-full max-w-2xl mx-4 my-8 sm:my-16 rounded-xl bg-background border border-border shadow-xl"
      >
        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-background/80 backdrop-blur border border-border hover:bg-muted transition-colors cursor-pointer"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Image */}
        {ev.image_url && (
          <div className="w-full h-48 sm:h-64 rounded-t-xl overflow-hidden bg-muted">
            <img
              src={ev.image_url}
              alt={ev.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        <div className="p-6">
          {/* Signal & recurring badges */}
          {(ev.signals?.length > 0 || ev.recurring) && (
            <div className="flex flex-wrap gap-2 mb-4">
              {ev.recurring && (
                <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-700">
                  🔁 Recurring
                </span>
              )}
              {ev.signals?.map((code) => {
                const def = getSignalDef(code);
                if (!def) return null;
                return (
                  <span
                    key={code}
                    className={`px-2.5 py-1 text-xs font-medium rounded-full ${def.color}`}
                  >
                    {def.label}
                  </span>
                );
              })}
            </div>
          )}

          <h2 className="text-xl sm:text-2xl font-bold tracking-tight mb-4">
            {ev.title}
          </h2>

          {/* Date & Time + Location */}
          <div className="flex flex-col gap-3 mb-6 p-4 rounded-xl bg-muted/50 border border-border">
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5 text-muted-foreground flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <div>
                <div className="font-medium">{format(startDate, "EEEE, MMMM d, yyyy")}</div>
                <div className="text-sm text-muted-foreground">
                  {format(startDate, "h:mm a")}
                  {endDate && ` — ${format(endDate, "h:mm a")}`}
                </div>
              </div>
            </div>

            {(ev.location_name || ev.is_online) && (
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5 text-muted-foreground flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a2 2 0 01-2.828 0l-4.243-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <div>
                  <div className="font-medium">
                    {ev.is_online
                      ? "Online Event"
                      : ev.location_name && ev.city
                        ? `${ev.location_name} · ${ev.city}`
                        : ev.location_name || ev.city}
                  </div>
                  {ev.location_address && (
                    <div className="text-sm text-muted-foreground">
                      {ev.location_address}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Organizer */}
          <div className="flex items-center gap-3 p-4 rounded-xl border border-border mb-6">
            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-sm font-semibold text-muted-foreground flex-shrink-0 overflow-hidden">
              {ev.organizer_avatar_url ? (
                <img
                  src={ev.organizer_avatar_url}
                  alt={ev.organizer_name}
                  className="w-full h-full object-cover"
                />
              ) : (
                ev.organizer_name.charAt(0).toUpperCase()
              )}
            </div>
            <div>
              <div className="font-medium">{ev.organizer_name}</div>
              {(ev.organizer_title || ev.organizer_company) && (
                <div className="text-sm text-muted-foreground">
                  {ev.organizer_title}
                  {ev.organizer_title && ev.organizer_company && " at "}
                  {ev.organizer_company}
                </div>
              )}
              {ev.hosts?.length > 0 && (
                <div className="text-sm text-muted-foreground">
                  Hosted by {ev.hosts.join(", ")}
                </div>
              )}
            </div>
          </div>

          {/* Description */}
          {ev.description && (
            <div className="prose prose-neutral max-w-none mb-6">
              <p className="whitespace-pre-wrap text-foreground/80 leading-relaxed text-sm">
                {ev.description}
              </p>
            </div>
          )}

          {/* CTA */}
          {ev.source_url && (
            <a
              href={ev.source_url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackClick(ev.id, "register")}
              className="inline-flex items-center gap-2 px-6 py-3 text-sm font-medium rounded-lg bg-accent text-white hover:bg-accent/90 transition-colors"
            >
              Register on {ev.source_platform || "event page"}
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
