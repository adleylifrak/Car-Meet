"use client";

import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import type { LocationPickerProps } from "./LocationPicker";

const TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

export default function LocationPickerMapbox({ center, onChange, locked }: LocationPickerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const lockedRef = useRef(locked);

  useEffect(() => {
    lockedRef.current = locked;
  }, [locked]);

  useEffect(() => {
    if (!containerRef.current || mapRef.current || !TOKEN) return;
    mapboxgl.accessToken = TOKEN;
    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: [center.lng, center.lat],
      zoom: 14,
    });
    map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), "bottom-right");
    map.on("moveend", () => {
      if (lockedRef.current) return;
      const c = map.getCenter();
      onChange({ lat: c.lat, lng: c.lng });
    });
    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const current = map.getCenter();
    if (Math.abs(current.lat - center.lat) > 0.000001 || Math.abs(current.lng - center.lng) > 0.000001) {
      map.jumpTo({ center: [center.lng, center.lat] });
    }
  }, [center]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const handlers = [
      map.boxZoom,
      map.doubleClickZoom,
      map.dragPan,
      map.dragRotate,
      map.keyboard,
      map.scrollZoom,
      map.touchZoomRotate,
    ];
    handlers.forEach((handler) => locked ? handler.disable() : handler.enable());
  }, [locked]);

  if (!TOKEN) return null;
  return <div ref={containerRef} className="relative z-0 h-full w-full" />;
}
