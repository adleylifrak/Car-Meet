"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { LocationPickerProps } from "./LocationPicker";

export default function LocationPickerLeaflet({ center, onChange, locked }: LocationPickerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const lockedRef = useRef(locked);

  useEffect(() => {
    lockedRef.current = locked;
  }, [locked]);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = L.map(containerRef.current, {
      center: [center.lat, center.lng],
      zoom: 14,
      minZoom: 1,
      maxBounds: [[-85.051129, -180], [85.051129, 180]],
      maxBoundsViscosity: 1,
      zoomControl: true,
    });
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      minZoom: 1,
      noWrap: true,
      bounds: [[-85.051129, -180], [85.051129, 180]],
      attribution: "&copy; OpenStreetMap contributors",
    }).addTo(map);
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
      map.setView([center.lat, center.lng], map.getZoom(), { animate: false });
    }
  }, [center]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const handlers = [
      map.dragging,
      map.touchZoom,
      map.doubleClickZoom,
      map.scrollWheelZoom,
      map.boxZoom,
      map.keyboard,
    ];
    handlers.forEach((handler) => locked ? handler.disable() : handler.enable());
  }, [locked]);

  return <div ref={containerRef} className="relative z-0 h-full w-full" />;
}
