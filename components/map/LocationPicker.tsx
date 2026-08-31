"use client";

import dynamic from "next/dynamic";
import { MapPin } from "lucide-react";

const hasMapbox = Boolean(process.env.NEXT_PUBLIC_MAPBOX_TOKEN);
const PickerMapbox = dynamic(() => import("./LocationPickerMapbox"), { ssr: false });
const PickerLeaflet = dynamic(() => import("./LocationPickerLeaflet"), { ssr: false });

export interface LocationPickerProps {
  center: { lat: number; lng: number };
  onChange: (loc: { lat: number; lng: number }) => void;
}

/** "Drop a pin" location picker for hosting a meet — the pin stays fixed in
 * the center of the frame and the map moves under it, Uber-pickup style. */
export function LocationPicker(props: LocationPickerProps) {
  return (
    <div className="relative -mx-4 h-72 w-[calc(100%+2rem)] overflow-hidden rounded-2xl border border-border sm:mx-0 sm:h-80 sm:w-full">
      {hasMapbox ? <PickerMapbox {...props} /> : <PickerLeaflet {...props} />}
      <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center">
        <MapPin size={36} className="-mt-9 fill-accent text-accent drop-shadow-lg" />
      </div>
    </div>
  );
}
