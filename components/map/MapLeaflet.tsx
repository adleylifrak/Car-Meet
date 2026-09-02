"use client";

import { useEffect, useMemo, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { getMeetTimeStatus } from "@/lib/types";
import { pinMarkupHtml } from "./pinMarkup";
import type { MapMeetsProps } from "./types";

function metersToLatDegrees(m: number) {
  return m / 111320;
}

export default function MapLeaflet({
  center,
  meets,
  rsvpMeetIds,
  selectedMeetId,
  onSelectMeet,
  radiusMeters,
}: MapMeetsProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<Map<string, L.Marker>>(new Map());
  const circleRef = useRef<L.Circle | null>(null);
  const userMarkerRef = useRef<L.CircleMarker | null>(null);

  // Init map once.
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = L.map(containerRef.current, {
      center: [center.lat, center.lng],
      zoom: 11,
      minZoom: 1,
      maxBounds: [[-85.051129, -180], [85.051129, 180]],
      maxBoundsViscosity: 1,
      zoomControl: false,
      attributionControl: true,
    });
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      minZoom: 1,
      noWrap: true,
      bounds: [[-85.051129, -180], [85.051129, 180]],
      attribution: "&copy; OpenStreetMap contributors",
    }).addTo(map);
    L.control.zoom({ position: "bottomright" }).addTo(map);
    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Recenter when the snapshot location changes materially.
  useEffect(() => {
    mapRef.current?.setView([center.lat, center.lng]);
  }, [center.lat, center.lng]);

  // User location dot.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (userMarkerRef.current) userMarkerRef.current.remove();
    userMarkerRef.current = L.circleMarker([center.lat, center.lng], {
      radius: 6,
      color: "#fff",
      weight: 2,
      fillColor: "#3b82f6",
      fillOpacity: 1,
    }).addTo(map);
  }, [center.lat, center.lng]);

  // Radius circle.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (circleRef.current) circleRef.current.remove();
    circleRef.current = L.circle([center.lat, center.lng], {
      radius: radiusMeters,
      color: "#004080",
      weight: 1.5,
      fillColor: "#004080",
      fillOpacity: 0.06,
    }).addTo(map);
  }, [center.lat, center.lng, radiusMeters]);

  const meetsKey = useMemo(
    () => meets.map((m) => `${m.id}:${m.location.lat}:${m.location.lng}`).join("|"),
    [meets]
  );

  // Pins.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const seen = new Set<string>();
    for (const meet of meets) {
      seen.add(meet.id);
      const status = getMeetTimeStatus(meet);
      const hasRsvp = rsvpMeetIds.has(meet.id);
      const icon = L.divIcon({
        html: pinMarkupHtml(status, hasRsvp),
        className: "",
        iconSize: [44, 44],
        iconAnchor: [22, 44],
      });
      let marker = markersRef.current.get(meet.id);
      if (marker) {
        marker.setIcon(icon);
        marker.setLatLng([meet.location.lat, meet.location.lng]);
      } else {
        marker = L.marker([meet.location.lat, meet.location.lng], { icon });
        marker.on("click", () => onSelectMeet(meet.id));
        marker.addTo(map);
        markersRef.current.set(meet.id, marker);
      }
    }
    for (const [id, marker] of markersRef.current) {
      if (!seen.has(id)) {
        marker.remove();
        markersRef.current.delete(id);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [meetsKey, rsvpMeetIds, selectedMeetId]);

  return <div ref={containerRef} className="h-full w-full" />;
}

export { metersToLatDegrees };
