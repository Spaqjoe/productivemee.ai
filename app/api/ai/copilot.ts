import { NextRequest } from "next/server";
import { createClient as createServerSupabase } from "@/lib/supabase/server";

// Minimal streaming placeholder using TextEncoder
export async function POST(req: NextRequest) {
  const { prompt } = await req.json();
  const supabase = await createServerSupabase();

  // Example: pull last 5 tasks as context
  const { data: { user } } = await supabase.auth.getUser();
  let tasks: any[] = [];
  if (user) {
    const { data } = await supabase
      .from("tasks")
      .select("id,title,priority,stage,created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(5);
    tasks = data || [];
  }

  const enc = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(enc.encode(`{"status":"stream-start"}\n`));
      controller.enqueue(enc.encode(`{"context":${JSON.stringify(tasks)}}\n`));
      controller.enqueue(enc.encode(`{"draft":"Analyzing your request: ${String(prompt || "").slice(0, 200)}"}\n`));
      controller.enqueue(enc.encode(`{"proposedActions":[{"action":"createTask","input":{"title":"Sample Task from Copilot"}}]}\n`));
      controller.enqueue(enc.encode(`{"status":"stream-end"}\n`));
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Transfer-Encoding": "chunked",
    },
  });
}


