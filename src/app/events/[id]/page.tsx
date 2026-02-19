import { getSupabase } from "@/lib/supabase";
import { format } from "date-fns";
import { notFound } from "next/navigation";
import type { Event } from "@/lib/types";
import type { Metadata } from "next";
import Link from "next/link";

interface PageProps {
  params: Promise<{ id: string }>;
}

async function getEvent(id: string): Promise<Event | null> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return null;

  try {
    const { data, error } = await getSupabase()
      .from("events")
      .select("*")
      .eq("id", id)
      .eq("status", "approved")
      .single();

    if (error || !data) return null;
    return data as Event;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const event = await getEvent(id);
  if (!event) return { title: "Event Not Found" };

  return {
    title: `${event.title} — NWA.events`,
    description: event.description?.slice(0, 160) || `${event.title} in Northwest Arkansas`,
    openGraph: {
      title: event.title,
      description: event.description?.slice(0, 160) || undefined,
      images: event.image_url ? [event.image_url] : undefined,
    },
  };
}

export default async function EventDetailPage({ params }: PageProps) {
  const { id } = await params;
  const event = await getEvent(id);
  if (!event) notFound();

  const startDate = new Date(event.start_date);
  const endDate = event.end_date ? new Date(event.end_date) : null;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        Back to events
      </Link>

      {event.image_url && (
        <div className="w-full h-56 sm:h-72 rounded-xl overflow-hidden mb-6 bg-muted">
          <img
            src={event.image_url}
            alt={event.title}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* Categories */}
      {event.categories.length > 0 && (
        <div className="flex gap-2 mb-4">
          {event.categories.map((cat) => (
            <span
              key={cat}
              className="px-2.5 py-1 text-xs font-medium rounded-full bg-muted text-muted-foreground"
            >
              {cat}
            </span>
          ))}
        </div>
      )}

      <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-4">
        {event.title}
      </h1>

      {/* Date & Time */}
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

        {(event.location_name || event.is_online) && (
          <div className="flex items-center gap-3">
            <svg className="w-5 h-5 text-muted-foreground flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a2 2 0 01-2.828 0l-4.243-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <div>
              <div className="font-medium">
                {event.is_online ? "Online Event" : event.location_name}
              </div>
              {event.location_address && (
                <div className="text-sm text-muted-foreground">
                  {event.location_address}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Organizer */}
      <div className="flex items-center gap-3 p-4 rounded-xl border border-border mb-6">
        <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-sm font-semibold text-muted-foreground flex-shrink-0 overflow-hidden">
          {event.organizer_avatar_url ? (
            <img
              src={event.organizer_avatar_url}
              alt={event.organizer_name}
              className="w-full h-full object-cover"
            />
          ) : (
            event.organizer_name.charAt(0).toUpperCase()
          )}
        </div>
        <div>
          <div className="font-medium">{event.organizer_name}</div>
          {(event.organizer_title || event.organizer_company) && (
            <div className="text-sm text-muted-foreground">
              {event.organizer_title}
              {event.organizer_title && event.organizer_company && " at "}
              {event.organizer_company}
            </div>
          )}
        </div>
      </div>

      {/* Description */}
      {event.description && (
        <div className="prose prose-neutral max-w-none mb-8">
          <p className="whitespace-pre-wrap text-foreground/80 leading-relaxed">
            {event.description}
          </p>
        </div>
      )}

      {/* CTA */}
      {event.source_url && (
        <a
          href={event.source_url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-6 py-3 text-sm font-medium rounded-lg bg-accent text-white hover:bg-accent/90 transition-colors"
        >
          Register on {event.source_platform || "event page"}
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        </a>
      )}
    </div>
  );
}
