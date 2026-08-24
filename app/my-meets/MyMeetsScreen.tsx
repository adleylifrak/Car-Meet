"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { TopBar } from "@/components/layout/TopBar";
import { Card } from "@/components/ui/Card";
import { getCurrentProfileClient } from "@/lib/data/profiles";
import { getMyMeetIds } from "@/lib/data/rsvps";
import { getMeetById } from "@/lib/data/meets";
import { getMeetTimeStatus, type MeetTimeStatus, type MeetWithHost, type Profile } from "@/lib/types";
import { formatMeetTime } from "@/lib/utils";

const statusLabel: Record<MeetTimeStatus, string> = { live: "Live now", upcoming: "Upcoming", past: "Past" };
const statusClass: Record<MeetTimeStatus, string> = {
  live: "bg-live text-white",
  upcoming: "bg-accent text-accent-foreground",
  past: "bg-past text-white",
};

export default function MyMeetsScreen() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [meets, setMeets] = useState<MeetWithHost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const p = await getCurrentProfileClient();
      setProfile(p);
      if (!p) return setLoading(false);
      const ids = await getMyMeetIds(p.id);
      const found = await Promise.all(ids.map((id) => getMeetById(id)));
      setMeets(
        found
          .filter((m): m is MeetWithHost => Boolean(m))
          .sort((a, b) => a.start_time.localeCompare(b.start_time))
      );
      setLoading(false);
    })();
  }, []);

  return (
    <div>
      <TopBar title="My meets" />
      <div className="space-y-3 p-4">
        {loading && <p className="text-sm text-muted">Loading…</p>}
        {!loading && meets.length === 0 && (
          <p className="text-sm text-muted">
            No RSVPs yet. Head back to the map and find something happening near you.
          </p>
        )}
        {meets.map((meet) => {
          const status = getMeetTimeStatus(meet);
          return (
            <Link key={meet.id} href={`/meets/${meet.id}`}>
              <Card className="p-4">
                <div className="mb-1.5 flex items-center gap-2">
                  <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${statusClass[status]}`}>
                    {statusLabel[status]}
                  </span>
                </div>
                <p className="font-semibold">{meet.title}</p>
                <p className="text-sm text-muted">{formatMeetTime(meet.start_time, meet.end_time)}</p>
              </Card>
            </Link>
          );
        })}
        {!profile && !loading && (
          <p className="text-sm text-muted">
            <Link href="/login" className="font-medium text-accent">Log in</Link> to see your RSVP&apos;d meets.
          </p>
        )}
      </div>
    </div>
  );
}
