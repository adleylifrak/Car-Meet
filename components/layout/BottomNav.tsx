"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, MapPin, Plus, User, CalendarCheck } from "lucide-react";
import { cn } from "@/lib/utils";

const HIDDEN_PREFIXES = ["/login", "/signup", "/onboarding", "/auth"];

const items = [
  { href: "/map", label: "Map", icon: MapPin },
  { href: "/my-meets", label: "My meets", icon: CalendarCheck },
  { href: "/meets/new", label: "Host", icon: Plus, emphasize: true },
  { href: "/notifications", label: "Alerts", icon: Bell },
  { href: "/me", label: "Profile", icon: User },
];

export function BottomNav() {
  const pathname = usePathname();
  if (HIDDEN_PREFIXES.some((p) => pathname.startsWith(p))) return null;

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface/95 backdrop-blur pb-[env(safe-area-inset-bottom)]">
      <div className="mx-auto flex max-w-lg items-center justify-between px-2">
        {items.map(({ href, label, icon: Icon, emphasize }) => {
          const active = pathname === href || (href !== "/map" && pathname.startsWith(href));
          if (emphasize) {
            return (
              <Link
                key={href}
                href={href}
                aria-label={label}
                className="flex flex-1 flex-col items-center justify-center py-2"
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-accent text-accent-foreground shadow-sm">
                  <Icon size={22} />
                </span>
              </Link>
            );
          }
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-medium",
                active ? "text-accent" : "text-muted"
              )}
            >
              <Icon size={22} strokeWidth={active ? 2.4 : 2} />
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
