"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface DropdownMenuContextType {
    open: boolean;
    setOpen: (open: boolean) => void;
}

const DropdownMenuContext = React.createContext<DropdownMenuContextType | undefined>(undefined);

interface DropdownMenuProps {
    children: React.ReactNode;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
}

export function DropdownMenu({ children, open: controlledOpen, onOpenChange }: DropdownMenuProps) {
    const [uncontrolledOpen, setUncontrolledOpen] = React.useState(false);
    const isControlled = controlledOpen !== undefined;
    const open = isControlled ? (controlledOpen as boolean) : uncontrolledOpen;
    const setOpen = (next: boolean) => {
        if (!isControlled) setUncontrolledOpen(next);
        onOpenChange?.(next);
    };

    return (
        <DropdownMenuContext.Provider value={{ open, setOpen }}>
            <div className="relative">{children}</div>
        </DropdownMenuContext.Provider>
    );
}

interface DropdownMenuTriggerProps
    extends React.ButtonHTMLAttributes<HTMLButtonElement> { }

const DropdownMenuTrigger = React.forwardRef<
    HTMLButtonElement,
    DropdownMenuTriggerProps
>(({ className, children, ...props }, ref) => {
    const context = React.useContext(DropdownMenuContext);

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
        if (context) {
            context.setOpen(!context.open);
        }
        props.onClick?.(e);
    };

    return (
        <button
            ref={ref}
            className={cn("inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground", className)}
            onClick={handleClick}
            {...props}
        >
            {children}
        </button>
    );
});
DropdownMenuTrigger.displayName = "DropdownMenuTrigger";

interface DropdownMenuContentProps
    extends React.HTMLAttributes<HTMLDivElement> { }

const DropdownMenuContent = React.forwardRef<
    HTMLDivElement,
    DropdownMenuContentProps
>(({ className, ...props }, ref) => {
    const context = React.useContext(DropdownMenuContext);

    // Close on click outside
    React.useEffect(() => {
        if (!context?.open) return;

        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as Element;
            if (!target.closest('.dropdown-content') && !target.closest('button')) {
                context.setOpen(false);
            }
        };

        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, [context?.open, context]);

    if (!context?.open) return null;

    return (
        <div
            ref={ref}
            className={cn(
                "z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md",
                "absolute right-0 mt-2 dropdown-content",
                className
            )}
            {...props}
        />
    );
});
DropdownMenuContent.displayName = "DropdownMenuContent";

interface DropdownMenuItemProps extends React.HTMLAttributes<HTMLDivElement> {
    variant?: "default" | "destructive";
}

const DropdownMenuItem = React.forwardRef<
    HTMLDivElement,
    DropdownMenuItemProps
>(({ className, variant, onClick, ...props }, ref) => {
    const context = React.useContext(DropdownMenuContext);

    const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
        context?.setOpen(false);
        onClick?.(e);
    };

    return (
        <div
            ref={ref}
            className={cn(
                "relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors",
                "hover:bg-accent hover:text-accent-foreground",
                variant === "destructive" && "text-destructive hover:text-destructive-foreground",
                className
            )}
            onClick={handleClick}
            {...props}
        />
    );
});
DropdownMenuItem.displayName = "DropdownMenuItem";

interface DropdownMenuLabelProps
    extends React.HTMLAttributes<HTMLDivElement> { }

const DropdownMenuLabel = React.forwardRef<
    HTMLDivElement,
    DropdownMenuLabelProps
>(({ className, ...props }, ref) => (
    <div
        ref={ref}
        className={cn("px-2 py-1.5 text-sm font-semibold", className)}
        {...props}
    />
));
DropdownMenuLabel.displayName = "DropdownMenuLabel";

interface DropdownMenuSeparatorProps
    extends React.HTMLAttributes<HTMLDivElement> { }

const DropdownMenuSeparator = React.forwardRef<
    HTMLDivElement,
    DropdownMenuSeparatorProps
>(({ className, ...props }, ref) => (
    <div
        ref={ref}
        className={cn("-mx-1 my-1 h-px bg-muted", className)}
        {...props}
    />
));
DropdownMenuSeparator.displayName = "DropdownMenuSeparator";

export {
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
};
