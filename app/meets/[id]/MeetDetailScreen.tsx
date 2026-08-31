"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { MapPin, MoreVertical, Repeat } from "lucide-react";
import { TopBar } from "@/components/layout/TopBar";
import { Avatar } from "@/components/ui/Avatar";
import { Card } from "@/components/ui/Card";
import { RsvpButtons } from "@/components/meets/RsvpButtons";
import { RsvpList } from "@/components/meets/RsvpList";
import { CheckinCamera } from "@/components/checkin/CheckinCamera";
import { CollageGrid } from "@/components/checkin/CollageGrid";
import { ReportDialog } from "@/components/checkin/ReportDialog";
import { getMeetById } from "@/lib/data/meets";
import { getRsvpsForMeet } from "@/lib/data/rsvps";
import { getCollageForMeet } from "@/lib/data/checkins";
import { getCurrentProfileClient } from "@/lib/data/profiles";
import { getMeetTimeStatus, type MeetWithHost, type Profile, type RsvpWithProfile, type CheckinWithProfile } from "@/lib/types";
import { formatMeetTime } from "@/lib/utils";

const statusLabel = { live: "Live now", upcoming: "Upcoming", past: "Past" } as const;
const statusClass = { live: "bg-live text-white", upcoming: "bg-accent text-accent-foreground", past: "bg-past text-white" } as const;

export default function MeetDetailScreen({ meetId }: { meetId: string }) {
  const [meet, setMeet] = useState<MeetWithHost | null | undefined>(undefined);
  const [attendees, setAttendees] = useState<RsvpWithProfile[]>([]);
  const [collage, setCollage] = useState<CheckinWithProfile[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [reportOpen, setReportOpen] = useState(false);

  const load = useCallback(async () => {
    const [m, rsvps, checkins] = await Promise.all([
      getMeetById(meetId),
      getRsvpsForMeet(meetId),
      getCollageForMeet(meetId),
    ]);
    setMeet(m);
    setAttendees(rsvps);
    setCollage(checkins);
  }, [meetId]);

  useEffect(() => {
    queueMicrotask(() => {
      load();
      getCurrentProfileClient().then(setProfile);
    });
  }, [load]);

  if (meet === undefined) {
    return (
      <div>
        <TopBar title="Meet" />
        <p className="p-4 text-sm text-muted">Loading…</p>
      </div>
    );
  }
  if (meet === null) {
    return (
      <div>
        <TopBar title="Meet" />
        <p className="p-4 text-sm text-muted">This meet couldn&apos;t be found.</p>
      </div>
    );
  }

  const status = getMeetTimeStatus(meet);
  const isHost = profile?.id === meet.host_id;
  const myRsvp = attendees.find((a) => a.profile_id === profile?.id) ?? null;

  return (
    <div>
      <TopBar
        title={meet.title}
        right={
          <button onClick={() => setReportOpen(true)} className="rounded-full p-1.5 hover:bg-surface-raised" aria-label="More">
            <MoreVertical size={18} />
          </button>
        }
      />

      <div className="space-y-5 p-4">
        <div className="flex items-center gap-2">
          <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusClass[status]}`}>
            {statusLabel[status]}
          </span>
          {meet.recurrence && (
            <span className="flex items-center gap-1 rounded-full bg-surface-raised px-2.5 py-1 text-xs font-medium capitalize text-muted">
              <Repeat size={12} /> {meet.recurrence}
            </span>
          )}
        </div>

        <div>
          <h1 className="text-xl font-semibold">{meet.title}</h1>
          <p className="mt-1 text-sm text-muted">{formatMeetTime(meet.start_time, meet.end_time)}</p>
        </div>

        <Link href={`/profile/${meet.host.username}`} className="flex items-center gap-2.5">
          <Avatar url={meet.host.avatar_url} name={meet.host.username} size="sm" />
          <div className="text-sm">
            <span className="text-muted">Hosted by </span>
            <span className="font-medium">{meet.host.username}</span>
          </div>
        </Link>

        {meet.address && (
          <p className="flex items-start gap-2 text-sm text-muted">
            <MapPin size={16} className="mt-0.5 shrink-0 text-accent" />
            <span>{meet.address}</span>
          </p>
        )}

        {meet.description && <p className="text-sm leading-relaxed">{meet.description}</p>}

        {meet.gallery_urls.length > 0 && (
          <div>
            <div className="mb-2">
              <p className="text-sm font-semibold">Host photos</p>
              <p className="text-xs text-muted">Parking, entry points, and meet details</p>
            </div>
            <div className="no-scrollbar flex gap-2 overflow-x-auto">
              {meet.gallery_urls.map((url, i) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={i} src={url} alt="" className="h-32 w-44 shrink-0 rounded-xl object-cover" />
              ))}
            </div>
          </div>
        )}

        {profile && (
          <Card className="p-4">
            <p className="mb-3 text-sm font-semibold">Your RSVP</p>
            <RsvpButtons
              meetId={meet.id}
              profileId={profile.id}
              currentStatus={myRsvp?.status ?? null}
              currentCarId={myRsvp?.car_id ?? null}
              onChanged={load}
            />
          </Card>
        )}

        <div>
          <p className="mb-3 text-sm font-semibold">Who&apos;s going</p>
          <RsvpList attendees={attendees} />
        </div>

        <div>
          <div className="mb-3 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold">Attendee collage</p>
              <p className="text-xs text-muted">Photos submitted during this meet</p>
            </div>
            <span className="text-xs text-muted">{collage.length} check-ins</span>
          </div>
          {profile && (
            <div className="mb-3">
              <CheckinCamera
                meetId={meet.id}
                profileId={profile.id}
                active={status === "live"}
                onCheckedIn={load}
              />
            </div>
          )}
          {profile && (
            <CollageGrid checkins={collage} isHost={isHost} viewerId={profile.id} onRefresh={load} />
          )}
        </div>
      </div>

      {profile && (
        <ReportDialog
          open={reportOpen}
          onClose={() => setReportOpen(false)}
          reporterId={profile.id}
          targetType="profile"
          targetId={meet.host.id}
        />
      )}
    </div>
  );
}
