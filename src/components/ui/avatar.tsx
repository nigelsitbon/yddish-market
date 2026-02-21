import Image from "next/image";
import { cn } from "@/lib/utils";

type AvatarProps = {
  src?: string | null;
  alt: string;
  fallback?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
};

const sizes = {
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-14 w-14 text-base",
};

export function Avatar({ src, alt, fallback, size = "md", className }: AvatarProps) {
  const initials = fallback ?? alt.charAt(0).toUpperCase();

  return (
    <div
      className={cn(
        "relative rounded-full overflow-hidden bg-muted flex items-center justify-center flex-shrink-0",
        sizes[size],
        className
      )}
    >
      {src ? (
        <Image
          src={src}
          alt={alt}
          fill
          className="object-cover"
          sizes={size === "lg" ? "56px" : size === "md" ? "40px" : "32px"}
        />
      ) : (
        <span className="font-medium text-muted-foreground">{initials}</span>
      )}
    </div>
  );
}
