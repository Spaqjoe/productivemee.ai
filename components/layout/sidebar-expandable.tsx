"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useState } from "react";
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

export function SidebarExpandable() {
    const pathname = usePathname();
    const [isHovered, setIsHovered] = useState(false);

    return (
        <aside
            className={cn(
                "relative hidden md:block mt-4 ml-4 mb-24 md:mb-4 h-[calc(100vh-2rem)] overflow-hidden rounded-3xl border border-white/10 bg-[hsl(var(--sidebar))] text-[hsl(var(--sidebar-foreground))] shadow-[0_20px_60px_-30px_rgba(2,132,199,0.35)] backdrop-blur-2xl transition-all duration-300 ease-in-out",
                isHovered ? "w-64" : "w-20"
            )}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <span className="pointer-events-none absolute inset-[-40%] bg-[radial-gradient(circle_at_center,rgba(14,116,144,0.35),transparent_60%)] opacity-70" />
            <span className="pointer-events-none absolute -inset-24 animate-liquid-pulse bg-[conic-gradient(from_200deg_at_50%_50%,rgba(14,116,144,0.3),rgba(129,140,248,0.12),rgba(236,72,153,0.18),rgba(14,116,144,0.3))] blur-3xl" />
            <nav className="relative z-10 p-6 flex flex-col h-full">
                {/* Logo */}
                <div className="mb-8 flex items-center gap-3 overflow-hidden">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-lg">
                        PM
                    </div>
                    {isHovered && (
                        <h2 className="whitespace-nowrap text-xl font-bold transition-opacity duration-300 opacity-100">
                            Productive Me
                        </h2>
                    )}
                </div>

                {/* Primary Navigation Items */}
                <div className="space-y-2">
                    {primaryNavItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = pathname === item.href;

                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={cn(
                                    "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors relative group",
                                    isActive
                                        ? "bg-primary text-primary-foreground font-bold border-l-4 border-primary"
                                        : "text-foreground hover:bg-accent hover:text-accent-foreground border-l-4 border-transparent"
                                )}
                            >
                                <Icon className={cn("h-5 w-5 shrink-0", isActive && "text-primary-foreground")} />
                                {isHovered && (
                                    <span className={cn("whitespace-nowrap transition-opacity duration-300 opacity-100", isActive && "font-bold")}>
                                        {item.label}
                                    </span>
                                )}
                            </Link>
                        );
                    })}
                </div>

                {/* Support Navigation Items - pushed to bottom */}
                <div className="mt-auto pt-6 space-y-2">
                    {supportNavItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = pathname === item.href;

                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={cn(
                                    "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors relative group",
                                    isActive
                                        ? "bg-primary text-primary-foreground font-bold border-l-4 border-primary"
                                        : "text-foreground hover:bg-accent hover:text-accent-foreground border-l-4 border-transparent"
                                )}
                            >
                                <Icon className={cn("h-5 w-5 shrink-0", isActive && "text-primary-foreground")} />
                                {isHovered && (
                                    <span className={cn("whitespace-nowrap transition-opacity duration-300 opacity-100", isActive && "font-bold")}>
                                        {item.label}
                                    </span>
                                )}
                            </Link>
                        );
                    })}
                </div>
            </nav>
        </aside>
    );
}
