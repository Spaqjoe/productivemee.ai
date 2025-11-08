"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Sheet, SheetHeader, SheetTitle, SheetContent } from "@/components/ui/sheet";
import { MdNotifications, MdNotificationsNone } from "react-icons/md";
import { IoSunnyOutline, IoMoonOutline, IoClose } from "react-icons/io5";
import { useTheme } from "@/components/theme-provider";
import { useState, useEffect, useRef } from "react";
import { FaTasks, FaClock, FaCalendarCheck } from "react-icons/fa";
import { HiOutlineBellAlert, HiOutlineSparkles } from "react-icons/hi2";
import { RxDashboard, RxCheck, RxCalendar, RxPieChart, RxQuestionMarkCircled, RxGear } from "react-icons/rx";
import { RiStockLine } from "react-icons/ri";
import { Card } from "@/components/ui/card";

export function Topbar() {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [user, setUser] = useState<any>(null);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [notificationSheetOpen, setNotificationSheetOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [aiSheetOpen, setAiSheetOpen] = useState(false);
  const [aiSessionId, setAiSessionId] = useState<string | null>(null);
  const [aiMessages, setAiMessages] = useState<Array<{ role: "user" | "assistant" | "system"; content: string }>>([
    { role: "assistant", content: "Hi there! How can I help you today?" },
  ]);
  const [aiInput, setAiInput] = useState("");
  const [aiStreaming, setAiStreaming] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
    const getUser = async () => {
      // Create client only when needed (lazy initialization)
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();
  }, []);

  useEffect(() => {
    if (user) {
      // Create client only when needed (lazy initialization)
      const supabase = createClient();
      const fetchNotifications = async () => {
        const { data } = await supabase
          .from("notifications")
          .select("*")
          .eq("user_id", user.id)
          .eq("read", false)
          .order("created_at", { ascending: false });

        if (data) setNotifications(data);
      };
      fetchNotifications();

      // Subscribe to real-time updates
      const channel = supabase.channel('notifications-changes')
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`
        }, () => {
          fetchNotifications();
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user]);

  // Auto-scroll chat
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [aiMessages, aiSheetOpen]);

  // Ensure a session when opening
  useEffect(() => {
    const ensureSession = async () => {
      if (!aiSheetOpen || aiSessionId) return;
      // Create client only when needed (lazy initialization)
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data, error } = await supabase
        .from("ai_sessions")
        .insert([{ user_id: user.id, title: "Chat" }])
        .select()
        .single();
      if (!error && data) setAiSessionId(data.id);
    };
    ensureSession();
  }, [aiSheetOpen]);

  const sendAiPrompt = async (prompt: string) => {
    if (!prompt.trim()) return;
    setAiMessages((m) => [...m, { role: "user", content: prompt }]);
    setAiInput("");
    setAiStreaming(true);

    try {
      // Create client only when needed (lazy initialization)
      const supabase = createClient();
      // Persist user message
      if (aiSessionId) {
        await supabase.from("ai_messages").insert({ session_id: aiSessionId, role: "user", content: prompt });
      }

      const res = await fetch("/api/ai/copilot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      if (!res.body) throw new Error("No stream");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let assistantBuffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n").filter(Boolean);
        for (const line of lines) {
          try {
            const payload = JSON.parse(line);
            if (typeof payload?.draft === "string") {
              assistantBuffer = payload.draft;
              setAiMessages((m) => {
                const copy = [...m];
                // live-update last assistant or push
                if (copy[copy.length - 1]?.role === "assistant") copy[copy.length - 1] = { role: "assistant", content: assistantBuffer };
                else copy.push({ role: "assistant", content: assistantBuffer });
                return copy;
              });
            }
          } catch { }
        }
      }

      if (assistantBuffer && aiSessionId) {
        await supabase.from("ai_messages").insert({ session_id: aiSessionId, role: "assistant", content: assistantBuffer });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setAiStreaming(false);
    }
  };

  const handleSignOut = async () => {
    // Create client only when needed (lazy initialization)
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/auth/sign-in");
  };

  const handleClearAll = async () => {
    if (!user) return;

    try {
      // Create client only when needed (lazy initialization)
      const supabase = createClient();
      const { error } = await supabase
        .from("notifications")
        .delete()
        .eq("user_id", user.id)
        .eq("read", false);

      if (error) throw error;
      setNotifications([]);
    } catch (error) {
      console.error("Failed to clear all notifications:", error);
    }
  };

  const handleDeleteNotification = async (id: string) => {
    try {
      // Create client only when needed (lazy initialization)
      const supabase = createClient();
      const { error } = await supabase
        .from("notifications")
        .delete()
        .eq("id", id);

      if (error) throw error;
      setNotifications(notifications.filter(n => n.id !== id));
    } catch (error) {
      console.error("Failed to delete notification:", error);
    }
  };

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  const getNotificationMeta = (kind: string) => {
    switch (kind) {
      case "task_created":
        return {
          icon: <FaTasks className="h-5 w-5 text-primary" />,
          title: "New Task Added",
        };
      case "task_due":
        return {
          icon: <FaClock className="h-5 w-5 text-amber-400" />,
          title: "Task Due Soon",
        };
      case "event_due":
        return {
          icon: <FaCalendarCheck className="h-5 w-5 text-emerald-400" />,
          title: "Event Due Date",
        };
      case "stock_update":
        return {
          icon: <RiStockLine className="h-5 w-5 text-pink-400" />,
          title: "Market Price Alert",
        };
      case "event_reminder":
        return {
          icon: <FaCalendarCheck className="h-5 w-5 text-blue-400" />,
          title: "Event Reminder",
        };
      case "news_saved_digest":
        return {
          icon: <HiOutlineBellAlert className="h-5 w-5 text-purple-400" />,
          title: "News Digest",
        };
      default:
        return {
          icon: <HiOutlineBellAlert className="h-5 w-5 text-white/60" />,
          title: "Notification",
        };
    }
  };

  return (
    <>
      <nav className="relative mx-4 my-4 flex h-16 items-center justify-between rounded-none border-0 bg-transparent px-2 sm:px-4 md:px-6 overflow-visible md:rounded-3xl md:border md:border-white/10 md:bg-white/5 md:shadow-[0_20px_60px_-30px_rgba(129,140,248,0.4)] md:backdrop-blur-2xl md:overflow-hidden">
        <span className="pointer-events-none absolute inset-[-35%] bg-[radial-gradient(circle_at_center,rgba(129,140,248,0.35),transparent_60%)] opacity-70 hidden md:block" />
        <span className="pointer-events-none absolute -inset-24 animate-liquid-pulse bg-[conic-gradient(from_180deg_at_50%_50%,rgba(129,140,248,0.15),transparent_60%)] opacity-70 hidden md:block" />
        <div className="relative z-10 flex items-center space-x-3 md:space-x-4">
          <Button variant="ghost" size="icon" className="md:hidden cursor-pointer" aria-label="Open menu" onClick={() => setMobileMenuOpen(true)}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5"><path d="M3.75 5.25h16.5v1.5H3.75v-1.5Zm0 6h16.5v1.5H3.75v-1.5Zm0 6h16.5v1.5H3.75v-1.5Z" /></svg>
          </Button>
          <span className="md:hidden font-bold">PM</span>
          {/* AI Quick Search - replaces logo */}
          <form
            className="hidden md:flex items-center gap-2 w-64 rounded-full border border-white/10 bg-white/10 px-3 py-1 backdrop-blur"
            onSubmit={(e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget as HTMLFormElement);
              const query = String(fd.get("q") || "");
              if (!query.trim()) return;
              setAiSheetOpen(true);
              void sendAiPrompt(query);
              (e.currentTarget as HTMLFormElement).reset();
            }}
          >
            <input
              name="q"
              placeholder="Ask or search..."
              className="bg-transparent outline-none text-sm w-full"
            />
            <Button type="submit" size="sm" className="h-7 px-3 bg-primary text-primary-foreground">Go</Button>
          </form>
        </div>

        <div className="relative z-10 flex items-center space-x-3 md:space-x-4">
          {/* Mobile Menu Sheet */}
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen} side="left" showCloseButton={false}>
            <SheetContent className="relative flex h-full w-full max-w-sm flex-col overflow-hidden border border-white/10 bg-white/10 p-4 backdrop-blur-2xl">
              <button
                type="button"
                className="absolute left-4 top-4 inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white md:hidden"
                aria-label="Close menu"
                onClick={() => setMobileMenuOpen(false)}
              >
                <IoClose className="h-5 w-5" />
              </button>
              <nav className="space-y-2 mt-16">
                <Button variant="ghost" className="w-full justify-start gap-2" onClick={() => { setMobileMenuOpen(false); router.push('/help'); }}>
                  <RxQuestionMarkCircled className="h-5 w-5" /> Help
                </Button>
                <Button variant="ghost" className="w-full justify-start gap-2" onClick={() => { setMobileMenuOpen(false); router.push('/settings'); }}>
                  <RxGear className="h-5 w-5" /> Settings
                </Button>
              </nav>
              <div className="mt-auto pt-4 flex justify-start">
                <Button variant="ghost" size="icon" className="cursor-pointer" onClick={() => { toggleTheme(); }}>
                  {mounted && theme === 'dark' ? <IoSunnyOutline className="h-5 w-5" /> : <IoMoonOutline className="h-5 w-5" />}
                </Button>
              </div>
            </SheetContent>
          </Sheet>
          {/* AI Sparkles (desktop only) */}
          <Button
            variant="ghost"
            size="icon"
            className="hidden md:inline-flex cursor-pointer"
            aria-label="Open AI Copilot"
            onClick={() => setAiSheetOpen(true)}
          >
            <HiOutlineSparkles className="h-5 w-5" />
          </Button>

          {/* Theme toggle (desktop only) */}
          <Button
            variant="ghost"
            size="icon"
            className="hidden md:inline-flex cursor-pointer"
            onClick={toggleTheme}
            aria-label="Toggle theme"
          >
            {mounted && theme === "dark" ? (
              <IoSunnyOutline className="h-5 w-5" />
            ) : (
              <IoMoonOutline className="h-5 w-5" />
            )}
          </Button>

          {/* Notifications */}
          <Button variant="ghost" size="icon" className="cursor-pointer" onClick={() => setNotificationSheetOpen(true)}>
            {notifications.length > 0 ? (
              <div className="relative">
                <MdNotifications className="h-5 w-5" />
                <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">
                  {notifications.length}
                </span>
              </div>
            ) : (
              <MdNotificationsNone className="h-5 w-5" />
            )}
          </Button>

          {/* Theme toggle removed from topbar */}

          {/* Profile dropdown */}
          <div>
            <DropdownMenu>
              <DropdownMenuTrigger className="h-10 w-10 rounded-full p-0 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-transparent">
                <Avatar className="cursor-pointer border-2 border-[hsl(var(--border))]">
                  <AvatarImage src={user?.user_metadata?.avatar_url} />
                  <AvatarFallback>
                    {user?.user_metadata?.full_name?.[0]?.toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="mt-3 w-64 rounded-none border-0 bg-transparent p-0 shadow-none">
                <Card className="p-0 text-white shadow-[0_20px_60px_-30px_rgba(79,70,229,0.55)] hover:translate-y-0">
                  <div className="px-4 py-4">
                    <div className="text-sm font-semibold">
                      {user?.user_metadata?.full_name || "User"}
                    </div>
                    <div className="text-xs text-white/70">
                      {user?.email}
                    </div>
                  </div>
                  <DropdownMenuSeparator className="bg-white/10" />
                  <DropdownMenuItem
                    onClick={() => {
                      router.push("/settings");
                    }}
                    className="px-4 py-3 text-sm text-white transition-colors hover:bg-white/15 focus:bg-white/15"
                  >
                    Profile
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-white/10" />
                  <DropdownMenuItem
                    onClick={() => {
                      void handleSignOut();
                    }}
                    variant="destructive"
                    className="px-4 py-3 text-sm text-red-200 transition-colors hover:bg-red-500/20 focus:bg-red-500/20 focus:text-red-100"
                  >
                    Logout
                  </DropdownMenuItem>
                </Card>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Notifications Sheet */}
        <Sheet
          open={notificationSheetOpen}
          onOpenChange={setNotificationSheetOpen}
          className="shadow-[0_25px_70px_-35px_rgba(129,140,248,0.55)] border border-white/10 bg-white/10 backdrop-blur-2xl sm:w-[420px]"
        >
          <SheetContent
            className="relative flex h-full flex-col space-y-0 overflow-hidden px-0 pb-0 pt-0 text-[hsl(var(--foreground))]"
          >
            <span className="pointer-events-none absolute inset-[-35%] bg-[radial-gradient(circle_at_center,rgba(129,140,248,0.28),transparent_60%)] opacity-70" />
            <span className="pointer-events-none absolute -inset-24 animate-liquid-pulse bg-[conic-gradient(from_200deg_at_50%_50%,rgba(14,116,144,0.22),rgba(129,140,248,0.12),rgba(236,72,153,0.15),rgba(14,116,144,0.22))] blur-3xl" />
            <div className="relative z-10 flex h-full flex-col overflow-hidden">
              <div className="flex items-center justify-between px-6 pt-12 pb-4">
                <SheetTitle className="text-lg font-semibold text-[hsl(var(--foreground))] dark:text-[hsl(var(--foreground))]">Notifications</SheetTitle>
                {notifications.length > 0 && (
                  <Button
                    onClick={handleClearAll}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs px-3 py-1"
                  >
                    Clear All
                  </Button>
                )}
              </div>

              {notifications.length > 0 ? (
                <div className="flex-1 overflow-y-auto space-y-3 px-6 pb-10">
                  {notifications.map((notif) => {
                    const meta = getNotificationMeta(notif.kind);
                    return (
                      <div
                        key={notif.id}
                        className="group relative rounded-2xl border border-white/15 bg-white/10 p-4 shadow-[0_18px_40px_-30px_rgba(129,140,248,0.55)] backdrop-blur"
                      >
                        <button
                          onClick={() => handleDeleteNotification(notif.id)}
                          className="absolute right-3 top-3 text-muted-foreground transition-opacity hover:text-foreground dark:text-white/60 dark:hover:text-white"
                          aria-label="Dismiss notification"
                        >
                          <IoClose className="h-4 w-4" />
                        </button>

                        <div className="flex items-start gap-3 pr-6">
                          <div className="mt-1">
                            {meta.icon}
                          </div>

                          <div className="flex-1">
                            <div className="text-sm font-semibold text-foreground dark:text-white">
                              {meta.title}
                            </div>
                            <div className="text-xs text-muted-foreground mt-1 dark:text-white/70">
                              {notif.payload?.title || notif.payload?.message || "No details"}
                            </div>
                            <div className="text-xs text-muted-foreground/70 mt-1 dark:text-white/50">
                              {notif.created_at ? new Date(notif.created_at).toLocaleString() : ""}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-1 items-center justify-center px-6 pb-12 text-center text-sm text-white/70">
                  No new notifications
                </div>
              )}
            </div>
          </SheetContent>
        </Sheet>

        {/* AI Copilot Sheet - right sidebar */}
        <Sheet
          open={aiSheetOpen}
          onOpenChange={setAiSheetOpen}
          className="shadow-[0_30px_80px_-40px_rgba(236,72,153,0.55)] border border-white/10 bg-white/10 backdrop-blur-2xl sm:w-[520px]"
        >
          <SheetContent
            className="relative flex h-full flex-col space-y-0 overflow-hidden px-0 pb-0 pt-0 text-[hsl(var(--foreground))]"
          >
            <span className="pointer-events-none absolute inset-[-35%] bg-[radial-gradient(circle_at_center,rgba(236,72,153,0.2),transparent_60%)] opacity-70" />
            <span className="pointer-events-none absolute -inset-24 animate-liquid-pulse bg-[conic-gradient(from_210deg_at_50%_50%,rgba(236,72,153,0.16),rgba(129,140,248,0.1),rgba(14,116,144,0.24),rgba(236,72,153,0.16))] blur-3xl" />
            <div className="relative z-10 flex h-full flex-col">
              <div className="px-6 pt-12 pb-3">
                <SheetTitle className="text-lg font-semibold">AI Assistant</SheetTitle>
                <p className="text-sm text-muted-foreground">Ask, get streamed suggestions, and apply.</p>
              </div>

              {/* Messages area */}
              <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 pb-4 space-y-3">
                {aiMessages.map((m, i) => (
                  <div key={i} className={m.role === "user" ? "ml-auto max-w-[85%] rounded-lg bg-primary text-primary-foreground px-3 py-2 text-sm" : "mr-auto max-w-[85%] rounded-lg bg-background/40 px-3 py-2 text-sm"}>
                    {m.content}
                  </div>
                ))}
                {aiStreaming && <div className="text-xs text-muted-foreground">Streaming...</div>}
              </div>

              {/* Composer */}
              <form
                className="border-t border-white/10 p-4 mt-auto"
                onSubmit={(e) => {
                  e.preventDefault();
                  void sendAiPrompt(aiInput);
                }}
              >
                <div className="flex items-center gap-2">
                  <input
                    name="prompt"
                    value={aiInput}
                    onChange={(e) => setAiInput(e.target.value)}
                    placeholder="Type here..."
                    className="flex-1 h-11 rounded-full border border-white/20 bg-white/10 px-4 text-sm text-white outline-none placeholder:text-white/50"
                  />
                  <Button type="submit" disabled={aiStreaming || !aiInput.trim()} className="h-11 rounded-full bg-primary px-5 text-primary-foreground shadow-lg shadow-indigo-500/40">
                    Send
                  </Button>
                </div>
              </form>
            </div>
          </SheetContent>
        </Sheet>

      </nav>

      {/* Mobile Bottom Bar */}
      <div className="md:hidden fixed bottom-6 left-4 right-4 z-40 md:bottom-4">
        <div className="relative mx-auto flex items-center justify-between overflow-hidden rounded-3xl border border-white/10 bg-white/10 px-4 py-3 shadow-[0_18px_40px_-25px_rgba(14,116,144,0.45)] backdrop-blur-2xl">
          <span className="pointer-events-none absolute inset-[-35%] bg-[radial-gradient(circle_at_center,rgba(14,116,144,0.3),transparent_60%)] opacity-70" />
          <span className="pointer-events-none absolute -inset-20 animate-liquid-pulse bg-[conic-gradient(from_210deg_at_50%_50%,rgba(129,140,248,0.15),rgba(236,72,153,0.16),rgba(14,116,144,0.28),rgba(129,140,248,0.15))] blur-3xl" />
          <div className="relative z-10 flex w-full items-center justify-between text-slate-100">
            <Button variant="ghost" className="cursor-pointer" onClick={() => router.push('/dashboard')}>
              <RxDashboard className="h-5 w-5" />
            </Button>
            <Button variant="ghost" className="cursor-pointer" onClick={() => router.push('/tasks')}>
              <RxCheck className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" className="-mt-8 h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-lg shadow-indigo-500/40" onClick={() => setAiSheetOpen(true)}>
              <HiOutlineSparkles className="h-6 w-6" />
            </Button>
            <Button variant="ghost" className="cursor-pointer" onClick={() => router.push('/calendar')}>
              <RxCalendar className="h-5 w-5" />
            </Button>
            <Button variant="ghost" className="cursor-pointer" onClick={() => router.push('/finance')}>
              <RxPieChart className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
