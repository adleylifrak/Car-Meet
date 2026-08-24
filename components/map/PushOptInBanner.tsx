"use client";

import { useEffect, useState } from "react";
import { Bell, X } from "lucide-react";
import { enablePushNotifications, getPushPermissionState, pushSupported } from "@/lib/push";

export function PushOptInBanner({ profileId }: { profileId: string }) {
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    getPushPermissionState().then((state) => setVisible(state === "default"));
  }, []);

  if (!pushSupported() || !visible || dismissed) return null;

  return (
    <div className="pointer-events-auto flex items-center gap-3 rounded-2xl border border-border bg-surface/95 p-3 shadow-sm backdrop-blur">
      <Bell size={18} className="shrink-0 text-accent" />
      <p className="flex-1 text-xs">
        Get notified when a meet posts near you — even with the app closed.
      </p>
      <button
        onClick={async () => {
          const ok = await enablePushNotifications(profileId);
          setVisible(!ok);
        }}
        className="shrink-0 rounded-full bg-accent px-3 py-1.5 text-xs font-semibold text-accent-foreground"
      >
        Enable
      </button>
      <button onClick={() => setDismissed(true)} className="shrink-0 text-muted" aria-label="Dismiss">
        <X size={16} />
      </button>
    </div>
  );
}
