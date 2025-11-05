import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const range = searchParams.get("range") || "day";

    // Calculate date range
    const now = new Date();
    let startDate = new Date(now);
    
    if (range === "week") {
      startDate.setDate(now.getDate() - 7);
    } else if (range === "month") {
      startDate.setMonth(now.getMonth() - 1);
    } else {
      startDate.setHours(0, 0, 0, 0);
    }

    const { data, error } = await supabase
      .from("screentime_sessions")
      .select("*")
      .eq("user_id", user.id)
      .gte("started_at", startDate.toISOString())
      .order("started_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch screentime data" },
      { status: 500 }
    );
  }
}

