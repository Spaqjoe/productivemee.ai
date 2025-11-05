"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function EventHistory() {
    const [todayEvents, setTodayEvents] = useState<any[]>([]);
    const [upcomingEvents, setUpcomingEvents] = useState<any[]>([]);

    useEffect(() => {
        // Create client only when needed (lazy initialization)
        const supabase = createClient();
        
        const fetchEvents = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const today = new Date();
            const todayStart = new Date(today.setHours(0, 0, 0, 0));
            const todayEnd = new Date(today.setHours(23, 59, 59, 999));

            // Fetch today's events
            const { data: todayData } = await supabase
                .from("events")
                .select("*")
                .eq("user_id", user.id)
                .gte("starts_at", todayStart.toISOString())
                .lte("starts_at", todayEnd.toISOString())
                .order("starts_at", { ascending: true });

            // Fetch upcoming events
            const { data: upcomingData } = await supabase
                .from("events")
                .select("*")
                .eq("user_id", user.id)
                .gt("starts_at", todayEnd.toISOString())
                .order("starts_at", { ascending: true })
                .limit(5);

            if (todayData) setTodayEvents(todayData);
            if (upcomingData) setUpcomingEvents(upcomingData);
        };

        fetchEvents();

        // Realtime subscription
        const channel = supabase.channel('events-changes')
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'events'
            }, () => {
                fetchEvents();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    const formatTime = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    };

    return (
        <Card className="rounded-lg border">
            <CardHeader>
                <CardTitle className="text-sm font-semibold">Today's Events</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
                {todayEvents.length > 0 ? (
                    todayEvents.map((event) => (
                        <div key={event.id} className="flex items-center gap-2 text-sm">
                            <div className="w-2 h-2 rounded-full bg-primary" />
                            <div className="flex-1">
                                <div className="font-medium">{event.title}</div>
                                <div className="text-xs text-muted-foreground">{formatTime(event.starts_at)}</div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="text-sm text-muted-foreground">No events today</div>
                )}

                {upcomingEvents.length > 0 && (
                    <>
                        <div className="pt-3 border-t">
                            <h3 className="text-xs font-semibold text-muted-foreground mb-2">UPCOMING</h3>
                            {upcomingEvents.map((event) => (
                                <div key={event.id} className="flex items-center gap-2 text-sm mb-2">
                                    <div className="w-2 h-2 rounded-full bg-secondary" />
                                    <div className="flex-1">
                                        <div className="font-medium">{event.title}</div>
                                        <div className="text-xs text-muted-foreground">{formatTime(event.starts_at)}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </CardContent>
        </Card>
    );
}
