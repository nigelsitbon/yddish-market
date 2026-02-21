import { type HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

const variants = {
  default: "bg-accent/10 text-accent",
  success: "bg-success/10 text-success",
  destructive: "bg-destructive/10 text-destructive",
  outline: "border text-foreground",
  muted: "bg-muted text-muted-foreground",
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
