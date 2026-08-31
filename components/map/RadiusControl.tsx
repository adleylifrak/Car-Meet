"use client";

import { useState } from "react";
import { Bell, BellOff } from "lucide-react";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { Button } from "@/components/ui/Button";
import { milesToMeters, metersToMiles } from "@/lib/geo";

const MIN_MI = 1;
const MAX_MI = 100;

export function RadiusControl({
  radiusMeters,
  muted,
  onApply,
}: {
  radiusMeters: number;
  muted: boolean;
  onApply: (radiusMeters: number, muted: boolean) => void;
}) {
  const [open, setOpen] = useState(false);
  const [draftMi, setDraftMi] = useState(Math.round(metersToMiles(radiusMeters)));
  const [draftMuted, setDraftMuted] = useState(muted);

  return (
    <>
      <button
        onClick={() => {
          setDraftMi(Math.round(metersToMiles(radiusMeters)));
          setDraftMuted(muted);
          setOpen(true);
        }}
        className="flex items-center gap-2 rounded-full border border-border bg-surface px-4 py-2 text-sm font-medium shadow-sm active:scale-95"
        aria-label="Notification distance"
      >
        {muted ? <BellOff size={16} /> : <Bell size={16} />}
        {muted ? "Muted" : `${Math.round(metersToMiles(radiusMeters))} mi`}
      </button>

      <BottomSheet open={open} onClose={() => setOpen(false)} title="Meet notifications">
        <p className="mb-6 text-sm text-muted">
          The map shows meets globally. This distance only controls which new nearby meets notify you.
        </p>

        <button
          type="button"
          onClick={() => setDraftMuted((value) => !value)}
          className={`mb-6 flex w-full items-center justify-between rounded-xl border p-3 text-left ${draftMuted
            ? "border-danger bg-danger/10"
            : "border-border bg-surface"
          }`}
        >
          <span>
            <span className="block text-sm font-semibold">Mute all meet notifications</span>
            <span className="block text-xs text-muted">Per-meet notification choices are kept for later.</span>
          </span>
          {draftMuted ? <BellOff size={20} className="text-danger" /> : <Bell size={20} />}
        </button>

        <div className={draftMuted ? "opacity-40" : ""}>
          <div className="mb-2 flex items-baseline justify-between">
            <span className="text-3xl font-semibold tabular-nums">{draftMi} mi</span>
          </div>
          <input
            type="range"
            min={MIN_MI}
            max={MAX_MI}
            step={1}
            value={draftMi}
            disabled={draftMuted}
            onChange={(e) => setDraftMi(Number(e.target.value))}
            className="w-full accent-accent"
            aria-label="Notification distance in miles"
          />
          <div className="mb-6 flex justify-between text-xs text-muted">
            <span>{MIN_MI} mi</span>
            <span>{MAX_MI} mi</span>
          </div>
        </div>

        <Button
          className="w-full"
          onClick={() => {
            onApply(milesToMeters(draftMi), draftMuted);
            setOpen(false);
          }}
        >
          Save notification settings
        </Button>
      </BottomSheet>
    </>
  );
}
