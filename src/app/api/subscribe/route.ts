import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json({ error: "Valid email is required" }, { status: 400 });
    }

    const supabase = getServiceClient();

    const { error } = await supabase
      .from("subscribers")
      .insert({ email: email.toLowerCase().trim() });

    if (error) {
      if (error.code === "23505") {
        // Unique violation — already subscribed
        return NextResponse.json({ message: "Already subscribed" });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ message: "Subscribed" }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
