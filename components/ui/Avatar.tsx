import { cn, initials } from "@/lib/utils";
import Image from "next/image";

const sizeClasses = {
  xs: "h-6 w-6 text-[10px]",
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-16 w-16 text-lg",
  xl: "h-24 w-24 text-2xl",
} as const;

export function Avatar({
  url,
  name,
  size = "md",
  className,
}: {
  url?: string | null;
  name: string;
  size?: keyof typeof sizeClasses;
  className?: string;
}) {
  if (url) {
    return (
      <div
        className={cn(
          "relative overflow-hidden rounded-full border border-border shrink-0",
          sizeClasses[size],
          className
        )}
      >
        <Image src={url} alt={name} fill className="object-cover" sizes="96px" />
      </div>
    );
  }
  return (
    <div
      className={cn(
        "flex items-center justify-center rounded-full bg-accent/15 font-semibold text-accent shrink-0",
        sizeClasses[size],
        className
      )}
      aria-label={name}
    >
      {initials(name)}
    </div>
  );
}
