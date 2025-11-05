import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const symbols = searchParams.get("symbols")?.split(",") || ["AAPL"];

  try {
    const apiKey = process.env.ALPHAVANTAGE_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json(
        { error: "Alpha Vantage API key not configured" },
        { status: 500 }
      );
    }

    const stocks = await Promise.all(
      symbols.map(async (symbol) => {
        try {
          const response = await fetch(
            `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${apiKey}`
          );
          
          if (!response.ok) {
            throw new Error(`Failed to fetch data for ${symbol}`);
          }

          const data = await response.json();
          const quote = data["Global Quote"];

          if (!quote || !quote["05. price"]) {
            return { symbol, price: "N/A", change: 0 };
          }

          const price = parseFloat(quote["05. price"]);
          const open = parseFloat(quote["02. open"]);
          const change = ((price - open) / open) * 100;

          return {
            symbol,
            price: price.toFixed(2),
            change: change.toFixed(2),
          };
        } catch (error) {
          return { symbol, price: "N/A", change: 0 };
        }
      })
    );

    return NextResponse.json(stocks);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch stock data" },
      { status: 500 }
    );
  }
}

