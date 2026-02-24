import { type HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

const variants = {
  default: "bg-accent/8 text-accent border border-accent/15",
  success: "bg-success/8 text-success border border-success/15",
  destructive: "bg-destructive/8 text-destructive border border-destructive/15",
  outline: "border border-border text-foreground",
  muted: "bg-muted text-muted-foreground border border-transparent",
} as const;

type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  variant?: keyof typeof variants;
};

export function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        variants[variant],
        className
      )}
      {...props}
    />
  );
}
