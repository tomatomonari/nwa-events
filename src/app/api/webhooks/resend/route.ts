import { NextRequest, NextResponse } from "next/server";
import { Webhook } from "svix";
import { getServiceClient } from "@/lib/supabase";

const WEBHOOK_SECRET = process.env.RESEND_WEBHOOK_SECRET;

export async function POST(req: NextRequest) {
  if (!WEBHOOK_SECRET) {
    console.error("RESEND_WEBHOOK_SECRET not configured");
    return NextResponse.json({ error: "Not configured" }, { status: 500 });
  }

  const body = await req.text();
  const svixId = req.headers.get("svix-id") ?? "";
  const svixTimestamp = req.headers.get("svix-timestamp") ?? "";
  const svixSignature = req.headers.get("svix-signature") ?? "";

  const wh = new Webhook(WEBHOOK_SECRET);
  let payload: any;

  try {
    payload = wh.verify(body, {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    });
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const eventType = payload.type as string;
  const validTypes = ["email.delivered", "email.opened", "email.clicked", "email.bounced", "email.complained"];

  if (!validTypes.includes(eventType)) {
    return NextResponse.json({ message: "Ignored" });
  }

  const supabase = getServiceClient();
  const data = payload.data;

  await supabase.from("email_events").insert({
    resend_email_id: data.email_id || "",
    event_type: eventType,
    recipient: Array.isArray(data.to) ? data.to[0] : (data.to || ""),
    subject: data.subject || null,
    metadata: data.tags || {},
  });

  return NextResponse.json({ message: "OK" });
}
