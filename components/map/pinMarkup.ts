import type { MeetTimeStatus } from "@/lib/types";

// Returns raw HTML for a map pin, shared between the Mapbox and Leaflet
// implementations so pins look identical regardless of which renderer loaded.
// Tailwind classes here are string literals (not interpolated) so the JIT
// scanner picks them up even though they're injected via innerHTML at runtime.
export function pinMarkupHtml(status: MeetTimeStatus, hasRsvp: boolean): string {
  const checkmark = hasRsvp
    ? `<span class="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-white text-[9px] font-bold text-live shadow ring-1 ring-live">✓</span>`
    : "";

  if (status === "live") {
    return `
      <div class="relative flex items-center justify-center">
        <span class="pin-live flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-live text-white shadow-lg">
          <span class="h-2.5 w-2.5 rounded-full bg-white"></span>
        </span>
        ${checkmark}
      </div>`;
  }
  if (status === "upcoming") {
    return `
      <div class="relative flex items-center justify-center">
        <span class="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-accent text-white shadow-lg">
          <span class="h-2.5 w-2.5 rounded-full bg-white"></span>
        </span>
        ${checkmark}
      </div>`;
  }
  // past
  return `
    <div class="relative flex items-center justify-center opacity-60">
      <span class="flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-past text-white shadow">
        <span class="h-2 w-2 rounded-full bg-white"></span>
      </span>
      ${checkmark}
    </div>`;
}
