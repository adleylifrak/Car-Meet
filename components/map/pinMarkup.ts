import type { MeetTimeStatus } from "@/lib/types";

const statusColor: Record<MeetTimeStatus, string> = {
  past: "#17171a",
  live: "#ef4444",
  upcoming: "#3b82f6",
};

/** Filled teardrop marker shared by Mapbox, Leaflet, and the pin picker.
 * Live and past status take priority. Green is reserved for upcoming meets the user is attending. */
export function mapPinMarkupHtml(
  status: MeetTimeStatus = "upcoming",
  hasRsvp = false
): string {
  const color = status === "upcoming" && hasRsvp ? "#22c55e" : statusColor[status];
  const liveClass = status === "live" ? " pin-live" : "";

  return `
    <div class="h-11 w-11" aria-hidden="true">
      <svg viewBox="0 0 48 48" class="h-11 w-11 overflow-visible drop-shadow-lg${liveClass}">
        <path
          fill="${color}"
          stroke="white"
          stroke-width="1.5"
          d="M24 2C14.06 2 6 10.06 6 20c0 12.9 18 26 18 26s18-13.1 18-26C42 10.06 33.94 2 24 2Z"
        />
        <circle cx="24" cy="20" r="7.5" fill="white" />
      </svg>
    </div>`;
}

export function pinMarkupHtml(status: MeetTimeStatus, hasRsvp: boolean): string {
  return mapPinMarkupHtml(status, hasRsvp);
}
