"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Settings, History } from "lucide-react";
import { TopBar } from "@/components/layout/TopBar";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { GarageList } from "@/components/profile/GarageList";
import { FollowButton } from "@/components/profile/FollowButton";
import { BlockReportMenu } from "@/components/profile/BlockReportMenu";
import {
  getProfileByUsername,
  getGarage,
  getFollowCounts,
  isFollowing,
  getCurrentProfileClient,
} from "@/lib/data/profiles";
import { isBlocked } from "@/lib/data/reports";
import { hasSupabaseConfig, createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import type { Car, Profile } from "@/lib/types";

export default function ProfileScreen({ username }: { username: string }) {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null | undefined>(undefined);
  const [viewer, setViewer] = useState<Profile | null>(null);
  const [cars, setCars] = useState<Car[]>([]);
  const [counts, setCounts] = useState({ followers: 0, following: 0 });
  const [following, setFollowing] = useState(false);
  const [blocked, setBlocked] = useState(false);

  useEffect(() => {
    (async () => {
      const [p, v] = await Promise.all([getProfileByUsername(username), getCurrentProfileClient()]);
      setProfile(p);
      setViewer(v);
      if (!p) return;
      const [garage, followCounts] = await Promise.all([
        getGarage(p.id),
        getFollowCounts(p.id),
      ]);
      setCars(garage);
      setCounts(followCounts);
      if (v && v.id !== p.id) {
        const [isF, isB] = await Promise.all([isFollowing(v.id, p.id), isBlocked(v.id, p.id)]);
        setFollowing(isF);
        setBlocked(isB);
      }
    })();
  }, [username]);

  async function handleLogout() {
    if (hasSupabaseConfig) {
      const supabase = createClient();
      await supabase.auth.signOut();
    }
    router.push("/login");
  }

  if (profile === undefined) {
    return (
      <div>
        <TopBar title="Profile" />
        <p className="p-4 text-sm text-muted">Loading…</p>
      </div>
    );
  }
  if (profile === null) {
    return (
      <div>
        <TopBar title="Profile" />
        <p className="p-4 text-sm text-muted">This user couldn&apos;t be found.</p>
      </div>
    );
  }

  const isOwner = viewer?.id === profile.id;

  return (
    <div>
      <TopBar
        title={profile.username}
        right={
          isOwner ? (
            <Link href="/me/edit" className="rounded-full p-1.5 hover:bg-surface-raised" aria-label="Settings">
              <Settings size={18} />
            </Link>
          ) : (
            viewer && <BlockReportMenu viewerId={viewer.id} targetId={profile.id} initiallyBlocked={blocked} />
          )
        }
      />

      <div className="space-y-6 p-4">
        <div className="flex items-center gap-4">
          <Avatar url={profile.avatar_url} name={profile.username} size="xl" />
          <div className="flex-1">
            <p className="text-lg font-semibold">{profile.username}</p>
            <div className="mt-1 flex gap-4 text-sm text-muted">
              <span>
                <span className="font-semibold text-foreground">{counts.followers}</span> followers
              </span>
              <span>
                <span className="font-semibold text-foreground">{counts.following}</span> following
              </span>
            </div>
          </div>
        </div>

        {profile.bio && <p className="text-sm leading-relaxed">{profile.bio}</p>}

        <div className="flex items-center gap-2">
          {isOwner ? (
            <>
              <Link href="/me/edit">
                <Button variant="secondary" size="sm">Edit profile</Button>
              </Link>
              <Link href="/me/history">
                <Button variant="outline" size="sm">
                  <History size={14} /> Full history
                </Button>
              </Link>
              <Button variant="ghost" size="sm" onClick={handleLogout}>Log out</Button>
            </>
          ) : (
            viewer && <FollowButton viewerId={viewer.id} targetId={profile.id} initiallyFollowing={following} />
          )}
        </div>

        <div className="flex items-center gap-6 rounded-2xl border border-border bg-surface p-4">
          <div>
            <p className="text-2xl font-semibold">{profile.meets_attended_count}</p>
            <p className="text-xs text-muted">meets attended</p>
          </div>
        </div>

        <div>
          <p className="mb-3 text-sm font-semibold">Garage</p>
          <GarageList cars={cars} />
        </div>
      </div>
    </div>
  );
}
