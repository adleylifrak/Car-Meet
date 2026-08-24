"use client";

import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Avatar } from "@/components/ui/Avatar";
import { getMeetTimeStatus, type MeetWithHost, type RsvpWithProfile } from "@/lib/types";
import { formatMeetTime } from "@/lib/utils";
import { formatDistance, distanceMeters } from "@/lib/geo";
import { X } from "lucide-react";

const statusLabel = { live: "Live now", upcoming: "Upcoming", past: "Past" } as const;
const statusClass = {
  live: "text-live",
  upcoming: "text-accent",
  past: "text-muted",
} as const;

export function MeetPreviewCard({
  meet,
  attendees,
  userLocation,
  onClose,
}: {
  meet: MeetWithHost;
  attendees: RsvpWithProfile[];
  userLocation: { lat: number; lng: number };
  onClose: () => void;
}) {
  const status = getMeetTimeStatus(meet);
  const going = attendees.filter((a) => a.status === "going" || a.status === "spectating");

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 z-30 px-3 pb-3">
      <Link href={`/meets/${meet.id}`} className="pointer-events-auto block">
        <Card className="p-4 active:scale-[0.99] transition-transform">
          <div className="mb-1.5 flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className={`text-xs font-semibold ${statusClass[status]}`}>
                {statusLabel[status]} · {formatDistance(distanceMeters(userLocation, meet.location))}
              </p>
              <h3 className="truncate text-base font-semibold">{meet.title}</h3>
            </div>
            <button
              onClick={(e) => {
                e.preventDefault();
                onClose();
              }}
              className="shrink-0 rounded-full p-1 text-muted hover:bg-surface-raised"
              aria-label="Close preview"
            >
              <X size={16} />
            </button>
          </div>
          <p className="mb-3 text-sm text-muted">{formatMeetTime(meet.start_time, meet.end_time)}</p>
          <div className="flex items-center justify-between">
            <div className="flex -space-x-2">
              {going.slice(0, 5).map((a) => (
                <Avatar key={a.id} url={a.profile.avatar_url} name={a.profile.username} size="xs" className="ring-2 ring-surface" />
              ))}
              {going.length === 0 && <span className="text-xs text-muted">No one yet — be first</span>}
            </div>
            {going.length > 0 && (
              <span className="text-xs font-medium text-muted">
                {going.length} going · tap for details
              </span>
            )}
          </div>
        </Card>
      </Link>
    </div>
  );
}
