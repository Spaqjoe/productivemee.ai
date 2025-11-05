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

export function Topbar() {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [user, setUser] = useState<any>(null);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [notificationSheetOpen, setNotificationSheetOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [aiSheetOpen, setAiSheetOpen] = useState(false);
  const [aiSessionId, setAiSessionId] = useState<string | null>(null);
  const [profileOpen, setProfileOpen] = useState(false);
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
    <nav className="h-16 md:bg-[hsl(var(--card))] md:border md:border-border md:rounded-lg mx-4 my-4 flex items-center justify-between px-4 md:px-6">
      <div className="flex items-center space-x-3 md:space-x-4">
        <Button variant="ghost" size="icon" className="md:hidden cursor-pointer" aria-label="Open menu" onClick={() => setMobileMenuOpen(true)}>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5"><path d="M3.75 5.25h16.5v1.5H3.75v-1.5Zm0 6h16.5v1.5H3.75v-1.5Zm0 6h16.5v1.5H3.75v-1.5Z" /></svg>
        </Button>
        <span className="md:hidden font-bold">PM</span>
        {/* AI Quick Search - replaces logo */}
        <form
          className="hidden md:flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1 w-64"
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

      <div className="flex items-center space-x-3 md:space-x-4">
        {/* Mobile Menu Sheet */}
        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen} side="left">
          <SheetContent className="flex h-full w-full max-w-sm flex-col overflow-hidden p-4 bg-[hsl(var(--card))]">
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
        <div onMouseEnter={() => setProfileOpen(true)}>
          <DropdownMenu open={profileOpen} onOpenChange={setProfileOpen}>
            <DropdownMenuTrigger className="h-10 w-10 rounded-full p-0">
              <Avatar className="cursor-pointer border-2 border-[hsl(var(--border))]">
                <AvatarImage src={user?.user_metadata?.avatar_url} />
                <AvatarFallback>
                  {user?.user_metadata?.full_name?.[0]?.toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent onMouseEnter={() => setProfileOpen(true)} onMouseLeave={() => setProfileOpen(false)} className="w-56 bg-primary border-primary">
              <div className="px-2 py-1.5">
                <div className="text-sm font-semibold text-white">
                  {user?.user_metadata?.full_name || "User"}
                </div>
                <div className="text-xs text-muted-foreground text-white/70">
                  {user?.email}
                </div>
              </div>
              <DropdownMenuSeparator className="bg-white/20" />
              <DropdownMenuItem onClick={() => router.push("/settings")} className="text-white hover:bg-white/20">
                Profile
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-white/20" />
              <DropdownMenuItem onClick={handleSignOut} variant="destructive" className="text-white hover:bg-red-600">
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Notifications Sheet */}
      <Sheet
        open={notificationSheetOpen}
        onOpenChange={setNotificationSheetOpen}
        className="shadow-2xl"
      >
        <SheetContent className="flex h-full flex-col gap-4 overflow-y-auto px-6 pb-8 pt-16 text-[hsl(var(--foreground))] dark:text-[hsl(var(--foreground))] bg-[hsl(var(--card))]">
          <div className="flex items-center justify-between">
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
            <div className="space-y-3">
              {notifications.map((notif) => {
                const meta = getNotificationMeta(notif.kind);
                return (
                  <div
                    key={notif.id}
                    className="group relative rounded-xl border border-border bg-[hsl(var(--card))] p-4 shadow-sm transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-md dark:border-white/10"
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
            <div className="text-white/70 text-center py-8">No new notifications</div>
          )}
        </SheetContent>
      </Sheet>

      {/* AI Copilot Sheet - right sidebar */}
      <Sheet open={aiSheetOpen} onOpenChange={setAiSheetOpen}>
        <SheetContent className="flex h-full w-full flex-col overflow-hidden bg-[hsl(var(--card))] border-none">
          <div className="px-6 pt-6 pb-2">
            <SheetTitle className="text-lg font-semibold">AI Assistant</SheetTitle>
            <p className="text-sm text-muted-foreground">Ask, get streamed suggestions, and apply.</p>
          </div>

          {/* Messages area */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 space-y-3">
            {aiMessages.map((m, i) => (
              <div key={i} className={m.role === "user" ? "ml-auto max-w-[85%] rounded-lg bg-primary text-primary-foreground px-3 py-2 text-sm" : "mr-auto max-w-[85%] rounded-lg bg-background/40 px-3 py-2 text-sm"}>
                {m.content}
              </div>
            ))}
            {aiStreaming && <div className="text-xs text-muted-foreground">Streaming...</div>}
          </div>

          {/* Composer */}
          <form
            className="p-4 border-t mt-auto"
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
                className="flex-1 h-10 rounded-md border border-border bg-background px-3 text-sm outline-none"
              />
              <Button type="submit" disabled={aiStreaming || !aiInput.trim()} className="bg-primary text-primary-foreground">Send</Button>
            </div>
          </form>
        </SheetContent>
      </Sheet>

      {/* Mobile Bottom Bar */}
      <div className="md:hidden fixed bottom-4 left-4 right-4 z-40">
        <div className="mx-auto rounded-full bg-[hsl(var(--card))] border border-border px-4 py-3 flex items-center justify-between">
          <Button variant="ghost" className="cursor-pointer" onClick={() => router.push('/dashboard')}>
            <RxDashboard className="h-5 w-5" />
          </Button>
          <Button variant="ghost" className="cursor-pointer" onClick={() => router.push('/tasks')}>
            <RxCheck className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" className="-mt-8 h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-lg" onClick={() => setAiSheetOpen(true)}>
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
    </nav>
  );
}
