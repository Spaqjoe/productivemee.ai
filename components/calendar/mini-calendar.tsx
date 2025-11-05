"use client";

import { useState } from "react";
import { RxChevronLeft, RxChevronRight } from "react-icons/rx";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface MiniCalendarProps {
    currentDate: Date;
    onDateChange: (date: Date) => void;
}

export function MiniCalendar({ currentDate, onDateChange }: MiniCalendarProps) {
    const [viewMonth, setViewMonth] = useState(new Date(currentDate));

    const year = viewMonth.getFullYear();
    const month = viewMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDay = firstDay.getDay();
    const daysInMonth = lastDay.getDate();

    const days = [];
    for (let i = 0; i < startDay; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(i);

    const getToday = () => new Date();

    const isToday = (day: number) => {
        const today = getToday();
        return today.getFullYear() === year &&
            today.getMonth() === month &&
            day === today.getDate();
    };

    const isSelected = (day: number) => {
        return currentDate.getFullYear() === year &&
            currentDate.getMonth() === month &&
            day === currentDate.getDate();
    };

    const goToPrevMonth = () => {
        setViewMonth(new Date(year, month - 1));
    };

    const goToNextMonth = () => {
        setViewMonth(new Date(year, month + 1));
    };

    const handleDateClick = (day: number) => {
        onDateChange(new Date(year, month, day));
    };

    return (
        <Card className="rounded-lg border">
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <button onClick={goToPrevMonth} className="p-1 hover:bg-accent rounded">
                        <RxChevronLeft className="h-4 w-4" />
                    </button>
                    <CardTitle className="text-sm font-semibold">
                        {viewMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                    </CardTitle>
                    <button onClick={goToNextMonth} className="p-1 hover:bg-accent rounded">
                        <RxChevronRight className="h-4 w-4" />
                    </button>
                </div>
            </CardHeader>
            <CardContent className="p-4">
                {/* Day labels */}
                <div className="grid grid-cols-7 gap-1 mb-2">
                    {["S", "M", "T", "W", "T", "F", "S"].map((day, idx) => (
                        <div key={idx} className="text-center text-xs text-muted-foreground font-medium">
                            {day}
                        </div>
                    ))}
                </div>

                {/* Calendar grid */}
                <div className="grid grid-cols-7 gap-1">
                    {days.map((day, idx) => (
                        <button
                            key={idx}
                            onClick={() => day && handleDateClick(day)}
                            className={cn(
                                "aspect-square text-xs rounded-md hover:bg-accent transition-colors relative dark:hover:bg-white/10",
                                !day && "text-transparent pointer-events-none",
                                isToday(day || 0) && "bg-primary text-primary-foreground font-bold ring-2 ring-primary/50",
                                !isToday(day || 0) && isSelected(day || 0) && "bg-primary/20 border-2 border-primary",
                                !isToday(day || 0) && !isSelected(day || 0) && "hover:bg-muted"
                            )}
                        >
                            {day}
                        </button>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}

function cn(...classes: (string | undefined | null | false)[]): string {
    return classes.filter(Boolean).join(" ");
}
