"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { setFollowing } from "@/lib/data/profiles";

export function FollowButton({
  viewerId,
  targetId,
  initiallyFollowing,
}: {
  viewerId: string;
  targetId: string;
  initiallyFollowing: boolean;
}) {
  const [following, setFollowingState] = useState(initiallyFollowing);
  const [busy, setBusy] = useState(false);

  async function toggle() {
    setBusy(true);
    const next = !following;
    setFollowingState(next);
    try {
      await setFollowing(viewerId, targetId, next);
    } catch {
      setFollowingState(!next);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Button variant={following ? "secondary" : "primary"} size="sm" onClick={toggle} disabled={busy}>
      {following ? "Following" : "Follow"}
    </Button>
  );
}
