import Link from "next/link";
import { Avatar } from "@/components/ui/Avatar";
import type { RsvpWithProfile } from "@/lib/types";

const GROUPS: { status: "going" | "spectating" | "interested"; label: string }[] = [
  { status: "going", label: "Going" },
  { status: "spectating", label: "Spectating" },
  { status: "interested", label: "Interested" },
];

export function RsvpList({ attendees }: { attendees: RsvpWithProfile[] }) {
  if (attendees.length === 0) {
    return <p className="text-sm text-muted">No RSVPs yet — be the first.</p>;
  }
  return (
    <div className="space-y-5">
      {GROUPS.map((group) => {
        const list = attendees.filter((a) => a.status === group.status);
        if (list.length === 0) return null;
        return (
          <div key={group.status}>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
              {group.label} · {list.length}
            </p>
            <div className="space-y-2.5">
              {list.map((a) => (
                <Link
                  key={a.id}
                  href={`/profile/${a.profile.username}`}
                  className="flex items-center gap-3"
                >
                  <Avatar url={a.profile.avatar_url} name={a.profile.username} size="sm" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{a.profile.username}</p>
                    {a.car && (
                      <p className="truncate text-xs text-muted">
                        {a.car.year ? `${a.car.year} ` : ""}
                        {a.car.make} {a.car.model}
                      </p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
