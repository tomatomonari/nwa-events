import type { Metadata } from "next";
import URLImportForm from "@/components/URLImportForm";

export const metadata: Metadata = {
  title: "Add an Event — NWA.events",
  description: "Submit an event to NWA.events by pasting a URL. We'll extract the details automatically.",
};

export default function SubmitPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
      <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-2">
        Add an Event
      </h1>
      <p className="text-muted-foreground mb-8">
        Found an event worth sharing? Paste the link and we&apos;ll handle the rest.
      </p>
      <URLImportForm />
    </div>
  );
}
