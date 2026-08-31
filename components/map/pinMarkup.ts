import type { MeetTimeStatus } from "@/lib/types";

const statusColor: Record<MeetTimeStatus, string> = {
  live: "#22c55e",
  upcoming: "#ff5a1f",
  past: "#73737d",
};

/** A smoking tire marker shared by Mapbox, Leaflet, and the pin picker. */
export function smokingTireMarkupHtml(
  status: MeetTimeStatus = "upcoming",
  hasRsvp = false
): string {
  const color = statusColor[status];
  const checkmark = hasRsvp
    ? `<span class="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-white text-[9px] font-bold text-live shadow ring-1 ring-live">✓</span>`
    : "";
  const liveClass = status === "live" ? " pin-live" : "";
  const opacity = status === "past" ? " opacity-60" : "";

  return `
    <div class="relative h-11 w-11${opacity}" aria-hidden="true">
      <svg viewBox="0 0 48 48" class="h-11 w-11 overflow-visible drop-shadow-lg${liveClass}">
        <g fill="#d1d5db" opacity="0.9">
          <circle cx="35" cy="10" r="4.5"/>
          <circle cx="40.5" cy="6.5" r="3"/>
          <circle cx="42" cy="13.5" r="2.5"/>
        </g>
        <g transform="rotate(-18 23 27)">
          <circle cx="23" cy="27" r="15" fill="#17171a" stroke="white" stroke-width="2"/>
          <circle cx="23" cy="27" r="10.5" fill="none" stroke="#3f3f46" stroke-width="3" stroke-dasharray="3 3"/>
          <circle cx="23" cy="27" r="6" fill="${color}" stroke="white" stroke-width="1.5"/>
          <circle cx="23" cy="27" r="2" fill="white"/>
        </g>
      </svg>
      ${checkmark}
    </div>`;
}

export function pinMarkupHtml(status: MeetTimeStatus, hasRsvp: boolean): string {
  return smokingTireMarkupHtml(status, hasRsvp);
}
