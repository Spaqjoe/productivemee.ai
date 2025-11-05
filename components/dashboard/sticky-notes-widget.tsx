"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function StickyNotesWidget() {
  const [events, setEvents] = useState<any[]>([]);
  const [reminders, setReminders] = useState<any[]>([]);

  useEffect(() => {
    // Create client only when needed (lazy initialization)
    const supabase = createClient();
    
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch today's events
      const today = new Date().toISOString().split('T')[0];
      const { data: eventsData } = await supabase
        .from("events")
        .select("*")
        .eq("user_id", user.id)
        .gte("starts_at", `${today}T00:00:00`)
        .lt("starts_at", `${today}T23:59:59`)
        .order("starts_at", { ascending: true })
        .limit(3);

      // Fetch reminders
      const { data: remindersData } = await supabase
        .from("reminders")
        .select("*")
        .eq("user_id", user.id)
        .eq("done", false)
        .order("remind_at", { ascending: true })
        .limit(3);

      if (eventsData) setEvents(eventsData);
      if (remindersData) setReminders(remindersData);
    };

    fetchData();
  }, []);

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <Card className="relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-500/10 rounded-full blur-3xl"></div>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Events & Reminders</CardTitle>
        <div className="h-8 w-8 flex items-center justify-center">
          <span className="text-2xl grayscale">📝</span>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <h3 className="text-xs font-semibold mb-2 text-muted-foreground">TODAY</h3>
          <div className="space-y-2">
            {events.length > 0 ? (
              events.map((event, idx) => (
                <div key={idx} className="flex items-center justify-between">
                  <span className="text-sm">{event.title}</span>
                  <Badge variant="outline" className="text-xs">{formatTime(event.starts_at)}</Badge>
                </div>
              ))
            ) : (
              <div className="text-xs text-muted-foreground">No events today</div>
            )}
          </div>
        </div>

        <div>
          <h3 className="text-xs font-semibold mb-2 text-muted-foreground">REMINDERS</h3>
          <div className="space-y-1.5">
            {reminders.length > 0 ? (
              reminders.map((reminder, idx) => (
                <div key={idx} className="text-xs text-muted-foreground">• {reminder.note}</div>
              ))
            ) : (
              <div className="text-xs text-muted-foreground">No reminders</div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

