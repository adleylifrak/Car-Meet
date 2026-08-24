"use client";

import { useEffect, useMemo, useRef } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { getMeetTimeStatus } from "@/lib/types";
import { pinMarkupHtml } from "./pinMarkup";
import type { MapMeetsProps } from "./types";

const TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

export default function MapMapbox({
  center,
  meets,
  rsvpMeetIds,
  selectedMeetId,
  onSelectMeet,
  radiusMeters,
}: MapMeetsProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<Map<string, mapboxgl.Marker>>(new Map());

  useEffect(() => {
    if (!containerRef.current || mapRef.current || !TOKEN) return;
    mapboxgl.accessToken = TOKEN;
    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: [center.lng, center.lat],
      zoom: 11,
      attributionControl: true,
    });
    map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), "bottom-right");

    map.on("load", () => {
      map.addSource("user-radius", {
        type: "geojson",
        data: circleGeoJson(center, radiusMeters),
      });
      map.addLayer({
        id: "user-radius-fill",
        type: "fill",
        source: "user-radius",
        paint: { "fill-color": "#ff5a1f", "fill-opacity": 0.06 },
      });
      map.addLayer({
        id: "user-radius-line",
        type: "line",
        source: "user-radius",
        paint: { "line-color": "#ff5a1f", "line-width": 1.5 },
      });

      new mapboxgl.Marker({ color: "#3b82f6" }).setLngLat([center.lng, center.lat]).addTo(map);
    });

    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    mapRef.current?.setCenter([center.lng, center.lat]);
    const src = mapRef.current?.getSource("user-radius") as mapboxgl.GeoJSONSource | undefined;
    src?.setData(circleGeoJson(center, radiusMeters));
  }, [center, center.lat, center.lng, radiusMeters]);

  const meetsKey = useMemo(
    () => meets.map((m) => `${m.id}:${m.location.lat}:${m.location.lng}`).join("|"),
    [meets]
  );

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const seen = new Set<string>();
    for (const meet of meets) {
      seen.add(meet.id);
      const status = getMeetTimeStatus(meet);
      const hasRsvp = rsvpMeetIds.has(meet.id);
      let marker = markersRef.current.get(meet.id);
      if (!marker) {
        const el = document.createElement("div");
        el.addEventListener("click", (e) => {
          e.stopPropagation();
          onSelectMeet(meet.id);
        });
        marker = new mapboxgl.Marker({ element: el })
          .setLngLat([meet.location.lng, meet.location.lat])
          .addTo(map);
        markersRef.current.set(meet.id, marker);
      }
      marker.getElement().innerHTML = pinMarkupHtml(status, hasRsvp);
      marker.setLngLat([meet.location.lng, meet.location.lat]);
    }
    for (const [id, marker] of markersRef.current) {
      if (!seen.has(id)) {
        marker.remove();
        markersRef.current.delete(id);
      }
    }
  }, [meetsKey, rsvpMeetIds, selectedMeetId, meets, onSelectMeet]);

  if (!TOKEN) return null;

  return <div ref={containerRef} className="h-full w-full" />;
}

function circleGeoJson(
  center: { lat: number; lng: number },
  radiusMeters: number,
  points = 64
): GeoJSON.Feature<GeoJSON.Polygon> {
  const coords: [number, number][] = [];
  const distanceX = radiusMeters / (111320 * Math.cos((center.lat * Math.PI) / 180));
  const distanceY = radiusMeters / 110540;
  for (let i = 0; i < points; i++) {
    const theta = (i / points) * (2 * Math.PI);
    coords.push([center.lng + distanceX * Math.cos(theta), center.lat + distanceY * Math.sin(theta)]);
  }
  coords.push(coords[0]);
  return {
    type: "Feature",
    properties: {},
    geometry: { type: "Polygon", coordinates: [coords] },
  };
}
