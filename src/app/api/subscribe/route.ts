import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";
import { sendVerificationEmail } from "@/lib/email";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const email = (body.email || "").toLowerCase().trim();
    const cadence = body.cadence === "daily" ? "daily" : "weekly";
    const categories: string[] = Array.isArray(body.categories)
      ? body.categories.filter((c: string) => ["business", "fun"].includes(c))
      : ["business"];

    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "Valid email is required" }, { status: 400 });
    }

    if (categories.length === 0) {
      return NextResponse.json({ error: "At least one category is required" }, { status: 400 });
    }

    const supabase = getServiceClient();

    // Check if already exists
    const { data: existing } = await supabase
      .from("subscribers")
      .select("*")
      .eq("email", email)
      .single();

    if (existing) {
      if (existing.verified) {
        return NextResponse.json({ message: "Already subscribed" });
      }

      // Unverified — regenerate token and resend
      const verification_token = crypto.randomUUID();
      await supabase
        .from("subscribers")
        .update({
          verification_token,
          cadence,
          categories,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existing.id);

      await sendVerificationEmail(email, verification_token);
      return NextResponse.json({ message: "Verification email resent" });
    }

    // New subscriber
    const verification_token = crypto.randomUUID();
    const manage_token = crypto.randomUUID();

    const { error } = await supabase.from("subscribers").insert({
      email,
      cadence,
      categories,
      verified: false,
      verification_token,
      manage_token,
    });

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json({ message: "Already subscribed" });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    await sendVerificationEmail(email, verification_token);

    return NextResponse.json({ message: "Verification email sent" }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
