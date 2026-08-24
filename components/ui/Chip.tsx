import { cn } from "@/lib/utils";
import type { ButtonHTMLAttributes } from "react";

export function Chip({
  active,
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { active?: boolean }) {
  return (
    <button
      type="button"
      className={cn(
        "shrink-0 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors",
        active
          ? "border-accent bg-accent text-accent-foreground"
          : "border-border bg-surface text-foreground hover:bg-surface-raised",
        className
      )}
      {...props}
    />
  );
}
