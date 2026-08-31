"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { UserPlus, CalendarCheck, MapPinned } from "lucide-react";
import { TopBar } from "@/components/layout/TopBar";
import { getCurrentProfileClient, getProfileById } from "@/lib/data/profiles";
import { getNotifications, markAllNotificationsRead, markNotificationRead } from "@/lib/data/notifications";
import { relativeTime } from "@/lib/utils";
import type { AppNotification, Profile } from "@/lib/types";

const ICONS = {
  new_follower: UserPlus,
  new_rsvp: CalendarCheck,
  new_meet_nearby: MapPinned,
};

function messageFor(n: AppNotification, actor?: Profile | null) {
  const who = actor?.username ?? "Someone";
  switch (n.type) {
    case "new_follower":
      return `${who} started following you`;
    case "new_rsvp":
      return `${who} RSVP'd to a meet you're following`;
    case "new_meet_nearby":
      return `${who} posted a new meet near you`;
  }
}

export default function NotificationsScreen() {
  const [items, setItems] = useState<AppNotification[]>([]);
  const [actors, setActors] = useState<Record<string, Profile | null>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const profile = await getCurrentProfileClient();
      if (!profile) return setLoading(false);
      const notifs = await getNotifications(profile.id);
      setItems(notifs);
      const actorIds = Array.from(new Set(notifs.map((n) => n.actor_id).filter(Boolean))) as string[];
      const resolved = await Promise.all(actorIds.map((id) => getProfileById(id)));
      setActors(Object.fromEntries(actorIds.map((id, i) => [id, resolved[i]])));
      setLoading(false);
      markAllNotificationsRead(profile.id);
    })();
  }, []);

  return (
    <div>
      <TopBar title="Notifications" />
      <div className="divide-y divide-border">
        {loading && <p className="p-4 text-sm text-muted">Loading…</p>}
        {!loading && items.length === 0 && (
          <p className="p-4 text-sm text-muted">Nothing yet — you&apos;ll see followers, RSVPs, and nearby meets here.</p>
        )}
        {items.map((n) => {
          const Icon = ICONS[n.type];
          const actor = n.actor_id ? actors[n.actor_id] : null;
          const content = (
            <div
              className={`flex items-start gap-3 px-4 py-3.5 ${n.read ? "" : "bg-accent/5"}`}
              onClick={() => markNotificationRead(n.id)}
            >
              <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-raised text-muted">
                <Icon size={16} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm">{messageFor(n, actor)}</p>
                <p className="mt-0.5 text-xs text-muted">{relativeTime(n.created_at)}</p>
              </div>
              {!n.read && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-accent" />}
            </div>
          );
          return n.meet_id ? (
            <Link key={n.id} href={`/meets/${n.meet_id}`}>
              {content}
            </Link>
          ) : actor ? (
            <Link key={n.id} href={`/profile/${actor.username}`}>
              {content}
            </Link>
          ) : (
            <div key={n.id}>{content}</div>
          );
        })}
      </div>
    </div>
  );
}
