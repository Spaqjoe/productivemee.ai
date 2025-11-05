"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { IoClose } from "react-icons/io5";

interface SheetProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    children: React.ReactNode;
    className?: string;
    overlayClassName?: string;
    side?: "left" | "right";
}

export function Sheet({ open, onOpenChange, children, className, overlayClassName, side = "right" }: SheetProps) {
    const [mounted, setMounted] = React.useState(open);
    const [visible, setVisible] = React.useState(open);

    React.useEffect(() => {
        if (open) {
            setMounted(true);
            requestAnimationFrame(() => setVisible(true));
        } else {
            setVisible(false);
            const timeout = setTimeout(() => setMounted(false), 250);
            return () => clearTimeout(timeout);
        }
    }, [open]);

    if (!mounted) return null;

    const isLeft = side === "left";

    return (
        <>
            {/* Backdrop */}
            <div
                className={cn(
                    "fixed inset-0 z-40 bg-black/40 transition-opacity duration-300 ease-out",
                    visible ? "opacity-100" : "opacity-0 pointer-events-none",
                    overlayClassName
                )}
                onClick={() => onOpenChange(false)}
            />

            {/* Sheet content */}
            <div
                className={cn(
                    "fixed top-6 bottom-6 z-50 w-[calc(100%-2rem)] sm:w-[420px] rounded-2xl border border-border/30 bg-card shadow-2xl transition-transform duration-300 ease-out transform overflow-hidden",
                    isLeft ? "left-4" : "right-4",
                    visible ? "translate-x-0" : isLeft ? "-translate-x-full" : "translate-x-full",
                    className
                )}
            >
                <button
                    onClick={() => onOpenChange(false)}
                    className={cn(
                        "absolute top-4 rounded-full bg-black/40 p-2 text-card-foreground backdrop-blur transition-opacity hover:bg-black/60 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-transparent",
                        isLeft ? "left-4" : "right-4"
                    )}
                >
                    <IoClose className="h-4 w-4" />
                    <span className="sr-only">Close</span>
                </button>
                {children}
            </div>
        </>
    );
}

interface SheetHeaderProps extends React.HTMLAttributes<HTMLDivElement> { }

export function SheetHeader({ className, ...props }: SheetHeaderProps) {
    return (
        <div
            className={cn("flex flex-col space-y-2 pb-4", className)}
            {...props}
        />
    );
}

interface SheetTitleProps extends React.HTMLAttributes<HTMLHeadingElement> { }

export function SheetTitle({ className, ...props }: SheetTitleProps) {
    return (
        <h2
            className={cn("text-lg font-semibold text-foreground", className)}
            {...props}
        />
    );
}

interface SheetContentProps extends React.HTMLAttributes<HTMLDivElement> { }

export function SheetContent({ className, ...props }: SheetContentProps) {
    return (
        <div
            className={cn("space-y-4 text-foreground", className)}
            {...props}
        />
    );
}
