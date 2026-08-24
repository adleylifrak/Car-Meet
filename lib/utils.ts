import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function initials(name: string): string {
  return name.slice(0, 2).toUpperCase();
}

export function formatMeetTime(startIso: string, endIso: string): string {
  const start = new Date(startIso);
  const end = new Date(endIso);
  const dateFmt = new Intl.DateTimeFormat("en-US", { weekday: "short", month: "short", day: "numeric" });
  const timeFmt = new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit" });
  return `${dateFmt.format(start)} · ${timeFmt.format(start)}–${timeFmt.format(end)}`;
}

export function relativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const diffMin = Math.round(diffMs / 60000);
  if (Math.abs(diffMin) < 1) return "just now";
  const diffHr = Math.round(diffMin / 60);
  const diffDay = Math.round(diffHr / 24);
  if (diffMin < 60 && diffMin > 0) return `${diffMin}m ago`;
  if (diffMin < 0 && diffMin > -60) return `in ${-diffMin}m`;
  if (diffHr < 24 && diffHr > 0) return `${diffHr}h ago`;
  if (diffHr < 0 && diffHr > -24) return `in ${-diffHr}h`;
  if (diffDay > 0) return `${diffDay}d ago`;
  return `in ${-diffDay}d`;
}
