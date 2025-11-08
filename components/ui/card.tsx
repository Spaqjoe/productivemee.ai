import * as React from "react";
import { cn } from "@/lib/utils";

const Card = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => (
    <div
        ref={ref}
        className={cn(
            "group relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 text-card-foreground shadow-[0_20px_60px_-30px_rgba(79,70,229,0.55)] backdrop-blur-2xl transition-transform duration-500 ease-out hover:-translate-y-1 hover:shadow-[0_25px_80px_-40px_rgba(79,70,229,0.55)]",
            className
        )}
        {...props}
    >
        <span className="pointer-events-none absolute inset-[-45%] bg-[radial-gradient(circle_at_center,rgba(129,140,248,0.45),transparent_60%)] opacity-70" />
        <span className="pointer-events-none absolute -inset-24 animate-liquid-pulse bg-[conic-gradient(from_210deg_at_50%_50%,rgba(14,116,144,0.3),rgba(129,140,248,0.1),rgba(236,72,153,0.15),rgba(14,116,144,0.3))] blur-3xl" />
        <div className="relative z-10 h-full w-full [mask-image:linear-gradient(to_bottom,rgba(255,255,255,0.95),rgba(255,255,255,0.75),rgba(255,255,255,0.35))]">
            {children}
        </div>
    </div>
));
Card.displayName = "Card";

const CardHeader = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
    <div
        ref={ref}
        className={cn("relative flex flex-col space-y-1.5 p-6", className)}
        {...props}
    />
));
CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef<
    HTMLParagraphElement,
    React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
    <h3
        ref={ref}
        className={cn(
            "text-2xl font-semibold leading-none tracking-tight",
            className
        )}
        {...props}
    />
));
CardTitle.displayName = "CardTitle";

const CardDescription = React.forwardRef<
    HTMLParagraphElement,
    React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
    <p
        ref={ref}
        className={cn("text-sm text-muted-foreground", className)}
        {...props}
    />
));
CardDescription.displayName = "CardDescription";

const CardContent = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
    <div ref={ref} className={cn("relative p-6 pt-0", className)} {...props} />
));
CardContent.displayName = "CardContent";

const CardFooter = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
    <div
        ref={ref}
        className={cn("relative flex items-center p-6 pt-0", className)}
        {...props}
    />
));
CardFooter.displayName = "CardFooter";

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent };

