"use client";

import dynamic from "next/dynamic";
import type { MapMeetsProps } from "./types";

const hasMapbox = Boolean(process.env.NEXT_PUBLIC_MAPBOX_TOKEN);

const MapMapbox = dynamic(() => import("./MapMapbox"), { ssr: false });
const MapLeaflet = dynamic(() => import("./MapLeaflet"), { ssr: false });

/** Picks Mapbox GL when a token is configured, otherwise falls back to
 * Leaflet + OpenStreetMap — no code elsewhere needs to know which one loaded. */
export function MapView(props: MapMeetsProps) {
  return hasMapbox ? <MapMapbox {...props} /> : <MapLeaflet {...props} />;
}
