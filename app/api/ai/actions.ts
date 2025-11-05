import { z } from "zod";
import { NextRequest, NextResponse } from "next/server";
import { createClient as createServerSupabase } from "@/lib/supabase/server";

// Input schemas
const CreateTaskSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  priority: z.enum(["low", "medium", "high"]).default("medium"),
  due_date: z.string().optional(),
});

const UpdateTaskSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  priority: z.enum(["low", "medium", "high"]).optional(),
  stage: z.enum(["todo", "pending", "done"]).optional(),
  due_date: z.string().optional(),
});

const ScheduleEventSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  starts_at: z.string().min(1),
  priority: z.enum(["low", "medium", "high"]).default("medium"),
});

const AnalyzeBudgetSchema = z.object({
  month: z.string().min(1), // YYYY-MM
});

const SummarizeNewsSchema = z.object({
  symbols: z.array(z.string()).default([]),
});

const ScreenTimeAdviceSchema = z.object({
  range: z.enum(["day", "week", "month"]).default("week"),
});

type ActionName =
  | "createTask"
  | "updateTask"
  | "scheduleEvent"
  | "analyzeBudget"
  | "summarizeNews"
  | "screenTimeAdvice";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const action = (body?.action as ActionName) || "";
    const supabase = await createServerSupabase();

    switch (action) {
      case "createTask": {
        const input = CreateTaskSchema.parse(body?.input);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        const { data, error } = await supabase
          .from("tasks")
          .insert([{ ...input, user_id: user.id }])
          .select()
          .single();
        if (error) throw error;
        return NextResponse.json({ ok: true, task: data });
      }

      case "updateTask": {
        const input = UpdateTaskSchema.parse(body?.input);
        const { error } = await supabase.from("tasks").update(input).eq("id", input.id);
        if (error) throw error;
        return NextResponse.json({ ok: true });
      }

      case "scheduleEvent": {
        const input = ScheduleEventSchema.parse(body?.input);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        const { data, error } = await supabase
          .from("events")
          .insert([{ ...input, user_id: user.id }])
          .select()
          .single();
        if (error) throw error;
        return NextResponse.json({ ok: true, event: data });
      }

      case "analyzeBudget": {
        const input = AnalyzeBudgetSchema.parse(body?.input);
        // Placeholder: aggregate incomes/expenses in given month
        const { data: summary } = await supabase.rpc("analyze_budget_month", { p_month: input.month }).select();
        return NextResponse.json({ ok: true, summary });
      }

      case "summarizeNews": {
        const input = SummarizeNewsSchema.parse(body?.input);
        return NextResponse.json({ ok: true, summary: { symbols: input.symbols, highlights: [] } });
      }

      case "screenTimeAdvice": {
        const input = ScreenTimeAdviceSchema.parse(body?.input);
        return NextResponse.json({ ok: true, advice: { range: input.range, tips: [] } });
      }

      default:
        return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    }
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Invalid request" }, { status: 400 });
  }
}


