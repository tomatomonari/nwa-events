import Link from "next/link";
import { format } from "date-fns";
import type { Event } from "@/lib/types";

interface EventCardProps {
  event: Event;
}

export default function EventCard({ event }: EventCardProps) {
  const date = new Date(event.start_date);

  return (
    <Link href={`/events/${event.id}`} className="block group">
      <article className="rounded-xl border border-border bg-background p-5 hover:shadow-md hover:border-border/80 transition-all duration-200">
        <div className="flex items-start gap-4">
          {/* Date block */}
          <div className="flex-shrink-0 text-center min-w-[3rem]">
            <div className="text-xs font-semibold uppercase text-accent">
              {format(date, "MMM")}
            </div>
            <div className="text-2xl font-bold leading-tight">
              {format(date, "d")}
            </div>
            <div className="text-xs text-muted-foreground">
              {format(date, "EEE")}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-base group-hover:text-accent transition-colors line-clamp-2">
              {event.title}
            </h3>

            <div className="mt-1.5 flex items-center gap-1.5 text-sm text-muted-foreground">
              <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2m6-2a10 10 0 11-20 0 10 10 0 0120 0z" />
              </svg>
              <span>{format(date, "h:mm a")}</span>
            </div>

            {(event.location_name || event.is_online) && (
              <div className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a2 2 0 01-2.828 0l-4.243-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="truncate">
                  {event.is_online ? "Online" : event.location_name}
                </span>
              </div>
            )}

            {/* Organizer */}
            <div className="mt-3 flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs font-medium text-muted-foreground flex-shrink-0 overflow-hidden">
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
              <div className="text-xs text-muted-foreground truncate">
                <span className="font-medium text-foreground/80">
                  {event.organizer_name}
                </span>
                {event.organizer_title && (
                  <span>
                    {" "}
                    &middot; {event.organizer_title}
                    {event.organizer_company && ` at ${event.organizer_company}`}
                  </span>
                )}
              </div>
            </div>

            {/* Primary category badge */}
            <div className="mt-3">
              <span
                className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                  event.primary_category === "business"
                    ? "bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300"
                    : "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300"
                }`}
              >
                {event.primary_category === "business" ? "Business" : "Fun"}
              </span>
            </div>
          </div>
        </div>
      </article>
    </Link>
  );
}
