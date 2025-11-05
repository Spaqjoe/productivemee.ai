"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { WeatherWidget } from "@/components/dashboard/weather-widget";
import { ActivityGraph } from "@/components/dashboard/activity-graph";
import { StickyNotesWidget } from "@/components/dashboard/sticky-notes-widget";
import { NewsWidget } from "@/components/dashboard/news-widget";
import { StocksWidget } from "@/components/dashboard/stocks-widget";
import { ScreenTimeWidget } from "@/components/dashboard/screentime-widget";

export default function DashboardPage() {
  const [userName, setUserName] = useState("");

  useEffect(() => {
    const getUser = async () => {
      // Create client only when needed (lazy initialization)
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserName(user.user_metadata?.full_name || user.email || "User");
      }
    };
    getUser();
  }, []);

  return (
    <div className="space-y-4">
      <div className="mb-4">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Hello, {userName}! Here's your productivity overview.</p>
      </div>

      {/* Top row - 4 compact widgets */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <WeatherWidget />
        <StickyNotesWidget />
        <NewsWidget />
        <StocksWidget />
      </div>

      {/* Full width chart */}
      <ActivityGraph />

      {/* Bottom - Screen Time (larger widget) */}
      <ScreenTimeWidget />
    </div>
  );
}

