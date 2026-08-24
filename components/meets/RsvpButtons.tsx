"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { CarPicker } from "./CarPicker";
import { upsertRsvp, removeRsvp } from "@/lib/data/rsvps";
import type { RsvpStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

const OPTIONS: { key: RsvpStatus; label: string }[] = [
  { key: "interested", label: "Interested" },
  { key: "going", label: "Going" },
  { key: "spectating", label: "Spectating" },
];

export function RsvpButtons({
  meetId,
  profileId,
  currentStatus,
  currentCarId,
  onChanged,
}: {
  meetId: string;
  profileId: string;
  currentStatus: RsvpStatus | null;
  currentCarId: string | null;
  onChanged: () => void;
}) {
  const [carSheetOpen, setCarSheetOpen] = useState(false);
  const [pendingCarId, setPendingCarId] = useState<string | null>(currentCarId);
  const [saving, setSaving] = useState(false);

  async function pick(status: RsvpStatus) {
    if (status === currentStatus) {
      // Tap the active state again to remove the RSVP.
      setSaving(true);
      try {
        await removeRsvp(meetId, profileId);
        onChanged();
      } finally {
        setSaving(false);
      }
      return;
    }
    if (status === "going") {
      setCarSheetOpen(true);
      return;
    }
    setSaving(true);
    try {
      await upsertRsvp({ meetId, profileId, status, carId: null });
      onChanged();
    } finally {
      setSaving(false);
    }
  }

  async function confirmGoing() {
    setSaving(true);
    try {
      await upsertRsvp({ meetId, profileId, status: "going", carId: pendingCarId });
      setCarSheetOpen(false);
      onChanged();
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <div className="grid grid-cols-3 gap-2">
        {OPTIONS.map((opt) => (
          <Button
            key={opt.key}
            variant={currentStatus === opt.key ? "primary" : "outline"}
            size="sm"
            disabled={saving}
            onClick={() => pick(opt.key)}
            className={cn("w-full")}
          >
            {opt.label}
          </Button>
        ))}
      </div>

      <BottomSheet open={carSheetOpen} onClose={() => setCarSheetOpen(false)} title="Which car?">
        <div className="mb-4">
          <CarPicker profileId={profileId} selectedCarId={pendingCarId} onSelect={setPendingCarId} />
        </div>
        <Button className="w-full" onClick={confirmGoing} disabled={saving || !pendingCarId}>
          {saving ? "Saving…" : "Confirm I'm going"}
        </Button>
      </BottomSheet>
    </>
  );
}
