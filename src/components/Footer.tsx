import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-border mt-16">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h3 className="text-lg font-semibold mb-2">
              NWA<span className="text-accent">.events</span>
            </h3>
            <p className="text-sm text-muted-foreground max-w-sm">
              One place to discover everything happening in Northwest Arkansas.
              Networking, tech, startups, career — all in one feed.
            </p>
          </div>
          <div>
            <h4 className="text-sm font-semibold mb-3">Stay in the loop</h4>
            <p className="text-sm text-muted-foreground mb-3">
              Get a daily or weekly digest of upcoming events.
            </p>
            <Link
              href="/subscribe"
              className="inline-block px-4 py-2 text-sm font-medium rounded-lg bg-accent text-white hover:bg-accent/90 transition-colors"
            >
              Subscribe
            </Link>
          </div>
        </div>
        <div className="mt-8 pt-6 border-t border-border text-xs text-muted-foreground">
          Built for the NWA community
        </div>
      </div>
    </footer>
  );
}
