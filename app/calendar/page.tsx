
"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { RxPlus, RxChevronLeft, RxChevronRight } from "react-icons/rx";
import { MdDelete, MdEdit } from "react-icons/md";
import { MiniCalendar } from "@/components/calendar/mini-calendar";
import { EventHistory } from "@/components/calendar/event-history";

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
    date: "",
    time: "",
    priority: "medium",
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

    // Realtime subscription
    const supabase = createClient();
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
    setFormData({ title: "", description: "", date: "", time: "", priority: "medium" });
    setIsDialogOpen(true);
  };

  const handleEditEvent = (event: any) => {
    setEditingEvent(event);
    const startDate = new Date(event.starts_at);
    setFormData({
      title: event.title,
      description: event.description || "",
      date: startDate.toISOString().split('T')[0],
      time: startDate.toTimeString().slice(0, 5),
      priority: event.priority || "medium",
    });
    setIsDialogOpen(true);
  };

  const handleSaveEvent = async () => {
    try {
      // Create client only when needed (lazy initialization)
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        alert("You must be signed in to save events.");
        return;
      }

      // Ensure profile exists
      const { data: profileExists } = await supabase
        .from("profiles")
        .select("id")
        .eq("id", user.id)
        .single();

      if (!profileExists) {
        // Create profile if it doesn't exist
        const { error: profileError } = await supabase
          .from("profiles")
          .insert({
            id: user.id,
            email: user.email,
            full_name: user.user_metadata?.full_name || "User",
          });

        if (profileError) {
          console.error("Failed to create profile:", profileError);
          alert("Please complete your profile setup first.");
          return;
        }
      }

      // Combine date and time into starts_at timestamp
      const starts_at = new Date(`${formData.date}T${formData.time}`).toISOString();

      const eventData = {
        title: formData.title,
        description: formData.description,
        starts_at: starts_at,
        priority: formData.priority,
        user_id: user.id,
      };

      if (editingEvent) {
        const { error } = await supabase
          .from("events")
          .update(eventData)
          .eq("id", editingEvent.id);
        if (error) {
          console.error("Update error:", JSON.stringify(error, null, 2));
          throw error;
        }
      } else {
        const { error } = await supabase
          .from("events")
          .insert([eventData]);
        if (error) {
          console.error("Insert error:", JSON.stringify(error, null, 2));
          throw error;
        }
      }

      setIsDialogOpen(false);
      setEditingEvent(null);
      fetchEvents();
    } catch (error: any) {
      console.error("Error saving event:", JSON.stringify(error, null, 2));
      alert(`Failed to save event: ${error?.message || 'Unknown error'}`);
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
            <div
              key={idx}
              className={cn(
                "text-center rounded-md border-b-2 border-border p-2 dark:text-white",
                day.toDateString() === new Date().toDateString() && "bg-primary/15 dark:bg-primary/20"
              )}
            >
              <div className="text-xs text-muted-foreground dark:text-white/70">
                {daysOfWeek[day.getDay()]}
              </div>
              <div
                className={cn(
                  "mt-1 inline-flex h-7 w-7 items-center justify-center rounded-md text-sm font-semibold",
                  day.toDateString() === new Date().toDateString()
                    ? "bg-primary text-primary-foreground"
                    : "text-foreground dark:text-white"
                )}
              >
                {day.getDate()}
              </div>
            </div>
          ))}
        </div>

        {/* Time slots */}
        <div className="grid grid-cols-8 gap-2 max-h-[600px] overflow-y-auto">
          {hours.map((hour) => (
            <div key={`hour-${hour}`} className="contents">
              <div className="text-xs text-muted-foreground text-right pr-2">
                {String(hour).padStart(2, '0')}:00
              </div>
              {weekDays.map((day, idx) => (
                <div
                  key={`${day.getTime()}-${hour}`}
                  className="border-2 border-border dark:border-white/15 min-h-[60px] p-1 rounded-md"
                >
                  {getEventsForDayAndHour(day, hour).map((event) => (
                    <div
                      key={event.id}
                      className={cn(
                        "text-xs p-1 rounded border-l-2 mb-1 cursor-pointer hover:opacity-80",
                        getPriorityColor(event.priority || "medium")
                      )}
                    >
                      {event.title}
                    </div>
                  ))}
                </div>
              ))}
            </div>
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
        <div className="border-2 border-border dark:border-white/15 rounded-lg overflow-hidden">
          {hours.map((hour) => (
            <div key={hour} className="grid grid-cols-24 border-b border-border dark:border-white/10 last:border-0">
              <div className="col-span-3 text-xs text-muted-foreground p-2 text-right border-r border-border dark:border-white/10">
                {String(hour).padStart(2, '0')}:00
              </div>
              <div className="col-span-21 p-2 min-h-[80px]">
                {getEventsForDayAndHour(currentDate, hour).map((event) => (
                  <div
                    key={event.id}
                    className={cn(
                      "text-sm p-2 rounded border-l-4 mb-2 cursor-pointer hover:opacity-80 flex items-center justify-between",
                      getPriorityColor(event.priority || "medium")
                    )}
                    onClick={() => handleEditEvent(event)}
                  >
                    <div>
                      <div className="font-semibold">{event.title}</div>
                      <div className="text-xs text-muted-foreground">{event.description || new Date(event.starts_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}</div>
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

  const monthName = currentDate.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  const days = getDaysInMonth(currentDate);
  const today = new Date().getDate();

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return "bg-red-500/20 border-red-500";
      case "medium": return "bg-yellow-500/20 border-yellow-500";
      case "low": return "bg-green-500/20 border-green-500";
      default: return "bg-blue-500/20 border-blue-500";
    }
  };

  const getEventsForDate = (date: number | null) => {
    if (!date) return [];
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, "0")}-${String(date).padStart(2, "0")}`;
    return events.filter(e => {
      const eventDate = new Date(e.starts_at).toISOString().split('T')[0];
      return eventDate === dateStr;
    });
  };

  return (
    <div className="space-y-4">
      {/* Desktop layout */}
      <div className="hidden md:grid grid-cols-12 gap-6">
        {/* Left Sidebar */}
        <div className="col-span-3 space-y-4">
          <MiniCalendar currentDate={currentDate} onDateChange={setCurrentDate} />
          <EventHistory />
        </div>

        {/* Main Content */}
        <div className="col-span-9 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Calendar</h1>
              <p className="text-muted-foreground">Manage your events and schedule</p>
            </div>
            <Button
              variant="default"
              onClick={handleCreateEvent}
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
            >
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
                    ? "border-[hsl(var(--primary))] text-[hsl(var(--primary))]"
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
              <Card className="rounded-lg border">
                <CardContent className="p-6">
                  <div className="grid grid-cols-7 gap-2 mb-2">
                    {daysOfWeek.map((day) => (
                      <div
                        key={day}
                        className="text-center text-sm font-semibold text-foreground p-2 border-b-2 border-border border-[hsl(var(--foreground))] text-[hsl(var(--foreground))]"
                      >
                        {day}
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-7 gap-2">
                    {days.map((day, idx) => (
                      <div
                        key={idx}
                        className={cn(
                          "min-h-[100px] border-2 rounded-lg p-2 transition-colors",
                          "border-border dark:border-white/10",
                          day === today && "border-[hsl(var(--primary))] dark:border-[hsl(var(--primary))]",
                          !day && "border-[hsl(var(--foreground))]"
                        )}
                      >
                        {day && (
                          <>
                            <div className="flex items-start justify-between mb-1">
                              <span
                                className={cn(
                                  "inline-flex h-7 w-7 items-center justify-center rounded-md text-sm font-semibold",
                                  day === today
                                    ? "bg-primary text-primary-foreground shadow-sm"
                                    : "border-[hsl(var(--foreground))] text-[hsl(var(--foreground))]"
                                )}
                              >
                                {day}
                              </span>
                            </div>
                            <div className="space-y-1">
                              {getEventsForDate(day).map((event) => (
                                <div
                                  key={event.id}
                                  className={cn(
                                    "text-xs p-1 rounded border-l-2 cursor-pointer hover:opacity-80",
                                    getPriorityColor(event.priority || "medium")
                                  )}
                                  onClick={() => handleEditEvent(event)}
                                >
                                  <div className="font-medium">{event.title}</div>
                                  <div className="text-[10px] text-muted-foreground">
                                    {new Date(event.starts_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                                  </div>
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
            <Card className="rounded-lg border">
              <CardContent className="p-6">{renderWeekView()}</CardContent>
            </Card>
          )}

          {view === "day" && (
            <Card className="rounded-lg border">
              <CardContent className="p-6">{renderDayView()}</CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Mobile layout */}
      <div className="md:hidden space-y-4">
        {/* Horizontal mini-calendar strip */}
        <div className="mx-4 mt-2 bg-[hsl(var(--card))] rounded-lg p-3">
          <div className="flex items-center justify-between mb-2">
            <Button variant="ghost" size="icon" onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() - 7))}>
              <RxChevronLeft className="h-5 w-5" />
            </Button>
            <div className="text-sm font-semibold text-foreground">
              {currentDate.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
            </div>
            <Button variant="ghost" size="icon" onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() + 7))}>
              <RxChevronRight className="h-5 w-5" />
            </Button>
          </div>
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
            {getWeekDays().map((d, idx) => {
              const isToday = d.toDateString() === new Date().toDateString();
              const isSelected = d.toDateString() === currentDate.toDateString();
              return (
                <button
                  key={idx}
                  onClick={() => setCurrentDate(new Date(d))}
                  className={cn(
                    "flex flex-col items-center justify-center min-w-[44px]",
                    isSelected ? "text-[hsl(var(--primary))]" : "text-foreground"
                  )}
                >
                  <span className="text-[10px] text-muted-foreground">
                    {daysOfWeek[d.getDay()]}
                  </span>
                  <span
                    className={cn(
                      "mt-1 h-8 w-8 flex items-center justify-center rounded-full",
                      isSelected ? "bg-primary text-primary-foreground" : "bg-background text-foreground border border-border"
                    )}
                  >
                    {d.getDate()}
                  </span>
                  <span
                    className={cn(
                      "mt-1 h-1 w-6 rounded-full",
                      isToday ? "bg-primary" : "bg-transparent"
                    )}
                  />
                </button>
              );
            })}
          </div>
        </div>

        {/* Main calendar resized for mobile */}
        <div className="px-4">
          <Card className="rounded-lg border">
            <CardContent className="p-3">
              {view === "day" ? (
                renderDayView()
              ) : view === "week" ? (
                renderWeekView()
              ) : (
                <>
                  <div className="flex items-center justify-between mb-2">
                    <Button variant="ghost" size="icon" onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))}>
                      <RxChevronLeft className="h-5 w-5" />
                    </Button>
                    <div className="text-base font-semibold">{monthName}</div>
                    <Button variant="ghost" size="icon" onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))}>
                      <RxChevronRight className="h-5 w-5" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-7 text-center text-xs text-foreground/70 border-b border-border pb-2">
                    {daysOfWeek.map((d) => (
                      <div key={d}>{d}</div>
                    ))}
                  </div>
                  <div className="grid grid-cols-7 gap-1">
                    {days.map((day, idx) => (
                      <div
                        key={idx}
                        className={cn(
                          "h-10 flex items-center justify-center rounded-md border",
                          day ? "border-border" : "border-transparent",
                          day === today && "border-[hsl(var(--primary))]"
                        )}
                        onClick={() => day && setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), day))}
                      >
                        <span className={cn("text-xs", day === today ? "text-[hsl(var(--primary))]" : "text-foreground")}>{day || ""}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Event history stacked at bottom */}
        <div className="px-4 pb-4">
          <EventHistory />
        </div>
      </div>

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
              <label className="block text-sm font-medium mb-2 text-card-foreground">Date</label>
              <Input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="bg-background text-foreground"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-card-foreground">Time</label>
              <Input
                type="time"
                value={formData.time}
                onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                className="bg-background text-foreground"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-card-foreground">Priority</label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
            <div className="flex gap-3">
              <Button onClick={handleSaveEvent} className="flex-1">
                {editingEvent ? "Update" : "Create"}
              </Button>
              {editingEvent && (
                <Button
                  variant="destructive"
                  onClick={async () => {
                    if (confirm("Are you sure you want to delete this event?")) {
                      await handleDeleteEvent(editingEvent.id);
                      setIsDialogOpen(false);
                    }
                  }}
                >
                  <MdDelete className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(" ");
}
