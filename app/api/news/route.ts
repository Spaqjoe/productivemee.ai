import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q") || "technology";
  const topic = searchParams.get("topic") || "world";
  const max = parseInt(searchParams.get("max") || "10");

  try {
    const apiKey = process.env.GNEWS_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json(
        { error: "GNews API key not configured" },
        { status: 500 }
      );
    }

    const response = await fetch(
      `https://gnews.io/api/v4/top-headlines?topic=${topic}&max=${max}&lang=en&token=${apiKey}`
    );
    
    if (!response.ok) {
      throw new Error("Failed to fetch news");
    }

    const data = await response.json();

    return NextResponse.json({
      articles: data.articles || [],
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch news", articles: [] },
      { status: 500 }
    );
  }
}

