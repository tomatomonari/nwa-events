import Link from "next/link";

export default function Header() {
  return (
    <header className="border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-xl font-semibold tracking-tight">
            NWA<span className="text-accent">.events</span>
          </span>
        </Link>
        <nav className="flex items-center gap-6">
          <Link
            href="/submit"
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Add Event
          </Link>
        </nav>
      </div>
    </header>
  );
}
