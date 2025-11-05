"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useState, useEffect } from "react";

export function NewsWidget() {
  const [news, setNews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNews = async () => {
      try {
        const response = await fetch("/api/news?topic=world&max=3");
        const data = await response.json();
        setNews(data.articles || []);
      } catch (error) {
        console.error("Failed to fetch news:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchNews();
  }, []);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>News</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse">Loading...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl"></div>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Latest News</CardTitle>
        <div className="h-8 w-8 flex items-center justify-center">
          <span className="text-2xl grayscale">📰</span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {news.length > 0 ? (
            news.map((article, idx) => (
              <div key={idx} className="space-y-1">
                <h3 className="text-sm font-semibold line-clamp-2">{article.title}</h3>
                <p className="text-xs text-muted-foreground">{article.source}</p>
              </div>
            ))
          ) : (
            <div className="text-sm text-muted-foreground">No news available</div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

