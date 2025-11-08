import * as React from "react";
import { Button, ButtonProps } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const CardButton = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, children, size, ...props }, ref) => (
    <Button
      ref={ref}
      variant="ghost"
      size={size}
      className={cn(
        "group relative inline-flex h-12 items-center justify-center overflow-hidden rounded-3xl border border-white/10 bg-white/10 px-6 text-sm font-semibold text-white shadow-[0_20px_60px_-30px_rgba(79,70,229,0.55)] backdrop-blur-2xl transition-transform duration-300 hover:-translate-y-1 hover:bg-white/15 hover:shadow-[0_25px_80px_-40px_rgba(79,70,229,0.55)] focus-visible:ring-primary focus-visible:ring-offset-0",
        className
      )}
      {...props}
    >
      <span className="pointer-events-none absolute inset-[-45%] bg-[radial-gradient(circle_at_center,rgba(129,140,248,0.45),transparent_60%)] opacity-70 transition-opacity duration-300 group-hover:opacity-90" />
      <span className="pointer-events-none absolute -inset-24 animate-liquid-pulse bg-[conic-gradient(from_210deg_at_50%_50%,rgba(14,116,144,0.3),rgba(129,140,248,0.1),rgba(236,72,153,0.15),rgba(14,116,144,0.3))] blur-3xl" />
      <span className="relative z-10 inline-flex items-center gap-2">
        {children}
      </span>
    </Button>
  )
);
CardButton.displayName = "CardButton";

export { CardButton };


