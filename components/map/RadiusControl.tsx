"use client";

import { useState } from "react";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { Button } from "@/components/ui/Button";
import { milesToMeters, metersToMiles } from "@/lib/geo";

const MIN_MI = 1;
const MAX_MI = 100;

export function RadiusControl({
  radiusMeters,
  onChange,
}: {
  radiusMeters: number;
  onChange: (meters: number) => void;
}) {
  const [open, setOpen] = useState(false);
  const [draftMi, setDraftMi] = useState(Math.round(metersToMiles(radiusMeters)));

  return (
    <>
      <button
        onClick={() => {
          setDraftMi(Math.round(metersToMiles(radiusMeters)));
          setOpen(true);
        }}
        className="rounded-full border border-border bg-surface px-4 py-2 text-sm font-medium shadow-sm active:scale-95"
      >
        Within {Math.round(metersToMiles(radiusMeters))} mi
      </button>

      <BottomSheet open={open} onClose={() => setOpen(false)} title="Browse radius">
        <p className="mb-6 text-sm text-muted">
          Show meets within this distance of your location.
        </p>
        <div className="mb-2 flex items-baseline justify-between">
          <span className="text-3xl font-semibold tabular-nums">{draftMi} mi</span>
        </div>
        <input
          type="range"
          min={MIN_MI}
          max={MAX_MI}
          step={1}
          value={draftMi}
          onChange={(e) => setDraftMi(Number(e.target.value))}
          className="w-full accent-accent"
          aria-label="Browse radius in miles"
        />
        <div className="mb-6 flex justify-between text-xs text-muted">
          <span>{MIN_MI} mi</span>
          <span>{MAX_MI} mi</span>
        </div>
        <Button
          className="w-full"
          onClick={() => {
            onChange(milesToMeters(draftMi));
            setOpen(false);
          }}
        >
          Apply
        </Button>
      </BottomSheet>
    </>
  );
}
