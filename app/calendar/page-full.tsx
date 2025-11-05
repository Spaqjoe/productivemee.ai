"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { RxPlus, RxChevronLeft, RxChevronRight } from "react-icons/rx";
import { MdDelete, MdEdit } from "react-icons/md";

const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const colors = {
    Business: "bg-yellow-500",
    Personal: "bg-red-500",
    Meetings: "bg-blue-500",
    Holiday: "bg-green-500",
};

export default function CalendarPage() {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [view, setView] = useState<"month" | "week" | "day">("month");
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingEvent, setEditingEvent] = useState<any>(null);
    const [events, setEvents] = useState<any[]>([]);

    const [formData, setFormData] = useState({
        title: "",
        description: "",
        starts_at: "",
        ends_at: "",
        all_day: false,
    });

    const fetchEvents = async () => {
        // Create client only when needed (lazy initialization)
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const start = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        const end = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

        const { data } = await supabase
            .from("events")
            .select("*")
            .eq("user_id", user.id)
            .gte("starts_at", start.toISOString())
            .lte("starts_at", end.toISOString());

        if (data) setEvents(data);
    };

    useEffect(() => {
        fetchEvents();
    }, [currentDate]);

    const getDaysInMonth = (date: Date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const firstDay = new Date(year, month, 1);
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const startDay = firstDay.getDay();

        const days = [];
        for (let i = 0; i < startDay; i++) days.push(null);
        for (let i = 1; i <= daysInMonth; i++) days.push(i);
        return days;
    };

    const handleCreateEvent = () => {
        setEditingEvent(null);
        setFormData({ title: "", description: "", starts_at: "", ends_at: "", all_day: false });
        setIsDialogOpen(true);
    };

    const handleEditEvent = (event: any) => {
        setEditingEvent(event);
        setFormData({
            title: event.title,
            description: event.description || "",
            starts_at: new Date(event.starts_at).toISOString().slice(0, 16),
            ends_at: event.ends_at ? new Date(event.ends_at).toISOString().slice(0, 16) : "",
            all_day: event.all_day,
        });
        setIsDialogOpen(true);
    };

    const handleSaveEvent = async () => {
        try {
            // Create client only when needed (lazy initialization)
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            if (editingEvent) {
                const { error } = await supabase
                    .from("events")
                    .update({ ...formData, user_id: user.id })
                    .eq("id", editingEvent.id);
                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from("events")
                    .insert([{ ...formData, user_id: user.id }]);
                if (error) throw error;
            }

            setIsDialogOpen(false);
            setEditingEvent(null);
            fetchEvents();
        } catch (error) {
            console.error("Error saving event:", error);
        }
    };

    const handleDeleteEvent = async (id: string) => {
        try {
            // Create client only when needed (lazy initialization)
            const supabase = createClient();
            const { error } = await supabase.from("events").delete().eq("id", id);
            if (error) throw error;
            fetchEvents();
        } catch (error) {
            console.error("Error deleting event:", error);
        }
    };

    const getWeekDays = () => {
        const startOfWeek = new Date(currentDate);
        startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
        const days = [];
        for (let i = 0; i < 7; i++) {
            const date = new Date(startOfWeek);
            date.setDate(startOfWeek.getDate() + i);
            days.push(date);
        }
        return days;
    };

    const renderWeekView = () => {
        const weekDays = getWeekDays();
        const hours = Array.from({ length: 24 }, (_, i) => i);

        return (
            <div className="space-y-2">
                {/* Week day headers */}
                <div className="grid grid-cols-8 gap-2">
                    <div className="text-sm font-semibold text-muted-foreground"></div>
                    {weekDays.map((day, idx) => (
                        <div key={idx} className="text-center">
                            <div className="text-xs text-muted-foreground">{daysOfWeek[day.getDay()]}</div>
                            <div className={day.toDateString() === new Date().toDateString() ? "text-primary font-bold" : ""}>
                                {day.getDate()}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Time slots */}
                <div className="grid grid-cols-8 gap-2 max-h-[600px] overflow-y-auto">
                    {hours.map((hour) => (
                        <>
                            <div key={`time-${hour}`} className="text-xs text-muted-foreground text-right pr-2">
                                {String(hour).padStart(2, '0')}:00
                            </div>
                            {weekDays.map((day, idx) => (
                                <div key={`${day}-${hour}`} className="border border-border min-h-[60px] p-1">
                                    {getEventsForDayAndHour(day, hour).map((event) => (
                                        <div
                                            key={event.id}
                                            className="bg-primary/20 text-xs p-1 rounded mb-1 cursor-pointer hover:opacity-80"
                                        >
                                            {event.title}
                                        </div>
                                    ))}
                                </div>
                            ))}
                        </>
                    ))}
                </div>
            </div>
        );
    };

    const renderDayView = () => {
        const hours = Array.from({ length: 24 }, (_, i) => i);
        return (
            <div className="space-y-2">
                <div className="text-center text-2xl font-bold mb-4">
                    {currentDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                </div>
                <div className="border rounded-lg overflow-hidden">
                    {hours.map((hour) => (
                        <div key={hour} className="grid grid-cols-24 border-b last:border-0">
                            <div className="col-span-3 text-xs text-muted-foreground p-2 text-right border-r">
                                {String(hour).padStart(2, '0')}:00
                            </div>
                            <div className="col-span-21 p-2 min-h-[80px]">
                                {getEventsForDayAndHour(currentDate, hour).map((event) => (
                                    <div
                                        key={event.id}
                                        className="bg-primary/20 text-sm p-2 rounded mb-2 cursor-pointer hover:opacity-80 flex items-center justify-between"
                                        onClick={() => handleEditEvent(event)}
                                    >
                                        <div>
                                            <div className="font-semibold">{event.title}</div>
                                            <div className="text-xs text-muted-foreground">{event.description}</div>
                                        </div>
                                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => { e.stopPropagation(); handleDeleteEvent(event.id); }}>
                                            <MdDelete className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    const getEventsForDayAndHour = (day: Date, hour: number) => {
        return events.filter(event => {
            const eventDate = new Date(event.starts_at);
            return eventDate.toDateString() === day.toDateString() && eventDate.getHours() === hour;
        });
    };

    const getEventsForDate = (date: number | null) => {
        if (!date) return [];
        const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, "0")}-${String(date).padStart(2, "0")}`;
        return events.filter(e => {
            const eventDate = new Date(e.starts_at).toISOString().split('T')[0];
            return eventDate === dateStr;
        });
    };

    const monthName = currentDate.toLocaleDateString("en-US", { month: "long", year: "numeric" });
    const days = getDaysInMonth(currentDate);
    const today = new Date().getDate();

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Calendar</h1>
                    <p className="text-muted-foreground">Manage your events and schedule</p>
                </div>
                <Button onClick={handleCreateEvent}>
                    <RxPlus className="mr-2" />
                    New Event
                </Button>
            </div>

            {/* View Tabs */}
            <div className="flex gap-2 border-b">
                {(["month", "week", "day"] as const).map((v) => (
                    <button
                        key={v}
                        onClick={() => setView(v)}
                        className={cn(
                            "px-6 py-2 text-sm font-medium transition-colors capitalize border-b-2",
                            view === v
                                ? "border-primary text-primary"
                                : "border-transparent text-muted-foreground hover:text-foreground"
                        )}
                    >
                        {v}
                    </button>
                ))}
            </div>

            {/* Month Navigation */}
            {view === "month" && (
                <>
                    <div className="flex items-center justify-between">
                        <Button variant="ghost" size="icon" onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))}>
                            <RxChevronLeft className="h-5 w-5" />
                        </Button>
                        <h2 className="text-2xl font-bold">{monthName}</h2>
                        <Button variant="ghost" size="icon" onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))}>
                            <RxChevronRight className="h-5 w-5" />
                        </Button>
                    </div>

                    {/* Calendar Grid */}
                    <Card>
                        <CardContent className="p-6">
                            <div className="grid grid-cols-7 gap-2 mb-2">
                                {daysOfWeek.map((day) => (
                                    <div key={day} className="text-center text-sm font-semibold text-muted-foreground p-2">
                                        {day}
                                    </div>
                                ))}
                            </div>

                            <div className="grid grid-cols-7 gap-2">
                                {days.map((day, idx) => (
                                    <div
                                        key={idx}
                                        className={cn(
                                            "min-h-[100px] border rounded-lg p-2 transition-colors",
                                            day === today ? "border-primary bg-primary/5" : "border-border",
                                            !day && "border-transparent"
                                        )}
                                    >
                                        {day && (
                                            <>
                                                <div className={cn("text-sm font-semibold mb-1", day === today && "text-primary")}>
                                                    {day}
                                                </div>
                                                <div className="space-y-1">
                                                    {getEventsForDate(day).map((event) => (
                                                        <div
                                                            key={event.id}
                                                            className="bg-primary/20 text-xs p-1 rounded text-white cursor-pointer hover:opacity-80"
                                                            onClick={() => handleEditEvent(event)}
                                                        >
                                                            {event.title}
                                                        </div>
                                                    ))}
                                                </div>
                                            </>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </>
            )}

            {view === "week" && (
                <Card>
                    <CardContent className="p-6">{renderWeekView()}</CardContent>
                </Card>
            )}

            {view === "day" && (
                <Card>
                    <CardContent className="p-6">{renderDayView()}</CardContent>
                </Card>
            )}

            {/* Event Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="bg-card border-border" onClose={() => setIsDialogOpen(false)}>
                    <DialogHeader>
                        <DialogTitle>{editingEvent ? "Edit Event" : "Create Event"}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-2 text-card-foreground">Title</label>
                            <Input
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                placeholder="Event title"
                                className="bg-background text-foreground"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2 text-card-foreground">Description</label>
                            <Input
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                placeholder="Event description"
                                className="bg-background text-foreground"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2 text-card-foreground">Start Time</label>
                            <Input
                                type="datetime-local"
                                value={formData.starts_at}
                                onChange={(e) => setFormData({ ...formData, starts_at: e.target.value })}
                                className="bg-background text-foreground"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2 text-card-foreground">End Time</label>
                            <Input
                                type="datetime-local"
                                value={formData.ends_at}
                                onChange={(e) => setFormData({ ...formData, ends_at: e.target.value })}
                                className="bg-background text-foreground"
                            />
                        </div>
                        <Button onClick={handleSaveEvent} className="w-full">
                            {editingEvent ? "Update" : "Create"}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}

function cn(...classes: (string | undefined | null | false)[]): string {
    return classes.filter(Boolean).join(" ");
}

