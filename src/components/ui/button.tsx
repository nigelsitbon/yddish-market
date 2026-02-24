import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

const variants = {
  default: "btn-gradient-dark text-[#FFFFFF] shadow-sm hover:shadow-md",
  accent: "btn-gradient-accent text-[#FFFFFF] shadow-sm hover:shadow-md",
  outline: "border border-foreground/20 bg-transparent hover:bg-foreground/5 text-foreground",
  ghost: "hover:bg-muted text-foreground",
  destructive: "bg-destructive text-[#FFFFFF] hover:bg-destructive/90 shadow-sm",
  link: "text-accent underline-offset-4 hover:underline p-0 h-auto",
} as const;

const sizes = {
  default: "h-10 px-6 text-sm",
  sm: "h-8 px-4 text-xs",
  lg: "h-12 px-8 text-base",
  icon: "h-10 w-10",
} as const;

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: keyof typeof variants;
  size?: keyof typeof sizes;
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center rounded-xl font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30 disabled:pointer-events-none disabled:opacity-50",
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";
