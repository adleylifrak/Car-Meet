"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { Lock, Unlock } from "lucide-react";
import { smokingTireMarkupHtml } from "./pinMarkup";

const hasMapbox = Boolean(process.env.NEXT_PUBLIC_MAPBOX_TOKEN);
const PickerMapbox = dynamic(() => import("./LocationPickerMapbox"), { ssr: false });
const PickerLeaflet = dynamic(() => import("./LocationPickerLeaflet"), { ssr: false });

export interface LocationPickerProps {
  center: { lat: number; lng: number };
  onChange: (loc: { lat: number; lng: number }) => void;
  locked: boolean;
}

/** The marker stays centered while the map moves underneath it. Locking freezes
 * all map gestures so the chosen location cannot be shifted accidentally. */
export function LocationPicker({
  center,
  onChange,
}: Omit<LocationPickerProps, "locked">) {
  const [locked, setLocked] = useState(false);
  const mapProps = { center, onChange, locked };

  return (
    <div className="relative -mx-4 h-72 w-[calc(100%+2rem)] overflow-hidden rounded-2xl border border-border sm:mx-0 sm:h-80 sm:w-full">
      {hasMapbox ? <PickerMapbox {...mapProps} /> : <PickerLeaflet {...mapProps} />}
      <div
        className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center"
        dangerouslySetInnerHTML={{ __html: smokingTireMarkupHtml("upcoming") }}
      />
      <button
        type="button"
        onClick={() => setLocked((value) => !value)}
        className={`absolute bottom-3 left-1/2 z-30 flex -translate-x-1/2 items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold shadow-lg backdrop-blur ${locked
          ? "border-live bg-live text-white"
          : "border-border bg-surface/95 text-foreground"
        }`}
        aria-pressed={locked}
      >
        {locked ? <Lock size={15} /> : <Unlock size={15} />}
        {locked ? "Pin locked" : "Lock pin here"}
      </button>
    </div>
  );
}
