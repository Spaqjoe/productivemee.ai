import { NextResponse } from "next/server";

// Minimal MCP-like discovery endpoint that exposes schemas and function metadata
export async function GET() {
  const spec = {
    name: "productive-me-mcp",
    version: "1.0.0",
    description: "MCP endpoint exposing AI function metadata and schemas",
    auth: {
      type: "supabase-session",
      header: "Authorization",
    },
    endpoints: {
      copilot: {
        method: "POST",
        path: "/api/ai/copilot",
        streaming: true,
        input: { type: "object", properties: { prompt: { type: "string" } }, required: ["prompt"] },
        output: { type: "stream", contentType: "application/json" },
      },
      actions: {
        method: "POST",
        path: "/api/ai/actions",
        input: {
          type: "object",
          properties: {
            action: { type: "string", enum: [
              "createTask",
              "updateTask",
              "scheduleEvent",
              "analyzeBudget",
              "summarizeNews",
              "screenTimeAdvice",
            ] },
            input: { $ref: "#/schemas/ActionInputs" },
          },
          required: ["action", "input"],
        },
        output: { type: "object" },
      },
    },
    schemas: {
      ActionInputs: {
        oneOf: [
          { $ref: "#/schemas/CreateTask" },
          { $ref: "#/schemas/UpdateTask" },
          { $ref: "#/schemas/ScheduleEvent" },
          { $ref: "#/schemas/AnalyzeBudget" },
          { $ref: "#/schemas/SummarizeNews" },
          { $ref: "#/schemas/ScreenTimeAdvice" },
        ],
      },
      CreateTask: {
        type: "object",
        properties: {
          title: { type: "string", minLength: 1 },
          description: { type: "string" },
          priority: { type: "string", enum: ["low", "medium", "high"], default: "medium" },
          due_date: { type: "string" },
        },
        required: ["title"],
      },
      UpdateTask: {
        type: "object",
        properties: {
          id: { type: "string", minLength: 1 },
          title: { type: "string" },
          description: { type: "string" },
          priority: { type: "string", enum: ["low", "medium", "high"] },
          stage: { type: "string", enum: ["todo", "pending", "done"] },
          due_date: { type: "string" },
        },
        required: ["id"],
      },
      ScheduleEvent: {
        type: "object",
        properties: {
          title: { type: "string", minLength: 1 },
          description: { type: "string" },
          starts_at: { type: "string", minLength: 1 },
          priority: { type: "string", enum: ["low", "medium", "high"], default: "medium" },
        },
        required: ["title", "starts_at"],
      },
      AnalyzeBudget: {
        type: "object",
        properties: {
          month: { type: "string", description: "YYYY-MM" },
        },
        required: ["month"],
      },
      SummarizeNews: {
        type: "object",
        properties: {
          symbols: { type: "array", items: { type: "string" }, default: [] },
        },
      },
      ScreenTimeAdvice: {
        type: "object",
        properties: {
          range: { type: "string", enum: ["day", "week", "month"], default: "week" },
        },
      },
    },
  } as const;

  return NextResponse.json(spec, { status: 200 });
}


