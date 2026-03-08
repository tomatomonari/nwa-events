import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");

  if (!token) {
    return NextResponse.json({ error: "Token required" }, { status: 400 });
  }

  const supabase = getServiceClient();

  const { data: subscriber } = await supabase
    .from("subscribers")
    .select("email, cadence, categories")
    .eq("manage_token", token)
    .single();

  if (!subscriber) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(subscriber);
}

export async function PATCH(req: NextRequest) {
  try {
    const { token, cadence, categories } = await req.json();

    if (!token) {
      return NextResponse.json({ error: "Token required" }, { status: 400 });
    }

    const validCadence = cadence === "daily" ? "daily" : "weekly";
    const validCategories: string[] = Array.isArray(categories)
      ? categories.filter((c: string) => ["business", "fun"].includes(c))
      : ["business"];

    if (validCategories.length === 0) {
      return NextResponse.json({ error: "At least one category required" }, { status: 400 });
    }

    const supabase = getServiceClient();

    const { data } = await supabase
      .from("subscribers")
      .update({
        cadence: validCadence,
        categories: validCategories,
        updated_at: new Date().toISOString(),
      })
      .eq("manage_token", token)
      .select("id")
      .single();

    if (!data) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Updated" });
  } catch {
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { token } = await req.json();

    if (!token) {
      return NextResponse.json({ error: "Token required" }, { status: 400 });
    }

    const supabase = getServiceClient();

    const { data } = await supabase
      .from("subscribers")
      .delete()
      .eq("manage_token", token)
      .select("id")
      .single();

    if (!data) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Unsubscribed" });
  } catch {
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
