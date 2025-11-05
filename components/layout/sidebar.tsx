"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  RxDashboard,
  RxCheck,
  RxCalendar,
  RxPieChart,
  RxQuestionMarkCircled,
  RxGear,
} from "react-icons/rx";

const primaryNavItems = [
  { label: "Dashboard", href: "/dashboard", icon: RxDashboard },
  { label: "Task Manager", href: "/tasks", icon: RxCheck },
  { label: "Calendar", href: "/calendar", icon: RxCalendar },
  { label: "Finance", href: "/finance", icon: RxPieChart },
];

const supportNavItems = [
  { label: "Help", href: "/help", icon: RxQuestionMarkCircled },
  { label: "Settings", href: "/settings", icon: RxGear },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-54 border-r bg-background text-[hsl(var(--sidebar-foreground))] p-4">
      <div className="flex h-full flex-col">
        <nav className="space-y-2">
          {primaryNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-foreground hover:bg-accent hover:text-accent-foreground"
                )}
              >
                <Icon className="h-5 w-5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto pt-6">
          <p className="px-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">
            Support
          </p>
          <nav className="space-y-2">
            {supportNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-foreground hover:bg-accent hover:text-accent-foreground"
                  )}
                >
                  <Icon className="h-5 w-5" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
    </aside>
  );
}
