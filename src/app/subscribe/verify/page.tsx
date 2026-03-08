import { getServiceClient } from "@/lib/supabase";
import Link from "next/link";

export default async function VerifyPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  if (!token) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-semibold mb-3">Invalid link</h1>
        <p className="text-muted-foreground mb-6">
          This verification link is missing or expired.
        </p>
        <Link href="/subscribe" className="text-sm text-accent hover:underline">
          Subscribe again
        </Link>
      </div>
    );
  }

  const supabase = getServiceClient();

  const { data: subscriber } = await supabase
    .from("subscribers")
    .select("*")
    .eq("verification_token", token)
    .single();

  if (!subscriber) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-semibold mb-3">Invalid link</h1>
        <p className="text-muted-foreground mb-6">
          This verification link is invalid or has already been used.
        </p>
        <Link href="/subscribe" className="text-sm text-accent hover:underline">
          Subscribe again
        </Link>
      </div>
    );
  }

  // Mark as verified and clear the token
  await supabase
    .from("subscribers")
    .update({
      verified: true,
      verification_token: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", subscriber.id);

  return (
    <div className="max-w-lg mx-auto px-4 py-16 text-center">
      <div className="w-14 h-14 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-6">
        <svg className="w-7 h-7 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <h1 className="text-2xl font-semibold mb-3">You&apos;re subscribed!</h1>
      <p className="text-muted-foreground mb-6">
        Your email <strong>{subscriber.email}</strong> has been verified.
        You&apos;ll start receiving event digests soon.
      </p>
      <div className="flex items-center justify-center gap-4 text-sm">
        <Link href="/" className="text-accent hover:underline">
          View events
        </Link>
        <span className="text-border">|</span>
        <Link
          href={`/subscribe/manage?token=${subscriber.manage_token}`}
          className="text-accent hover:underline"
        >
          Manage preferences
        </Link>
      </div>
    </div>
  );
}
