"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";

export function StocksWidget() {
  const [stocks, setStocks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStocks = async () => {
      try {
        const response = await fetch("/api/stocks?symbols=SPY,AAPL,TSLA");
        const data = await response.json();
        setStocks(data);
      } catch (error) {
        console.error("Failed to fetch stocks:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStocks();
  }, []);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Stock Watchlist</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse">Loading...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/10 rounded-full blur-3xl"></div>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Stocks</CardTitle>
        <div className="h-8 w-8 flex items-center justify-center">
          <span className="text-2xl grayscale">📈</span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {stocks.length > 0 ? (
            stocks.map((stock, idx) => (
              <div key={idx} className="flex items-center justify-between">
                <div>
                  <div className="font-semibold">{stock.symbol}</div>
                  <div className="text-sm text-muted-foreground">${stock.price}</div>
                </div>
                <Badge variant={stock.change >= 0 ? "default" : "destructive"}>
                  {stock.change >= 0 ? "+" : ""}{stock.change}%
                </Badge>
              </div>
            ))
          ) : (
            <div className="text-sm text-muted-foreground">No stock data available</div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

