"use client";

import { useState } from "react";
import { Search, Loader2 } from "lucide-react";
import { BottomSheet } from "@/components/ui/BottomSheet";

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

interface GeoResult {
  label: string;
  lat: number;
  lng: number;
}

interface MapboxFeature {
  place_name: string;
  center: [number, number];
}

interface NominatimResult {
  display_name: string;
  lat: string;
  lon: string;
}

async function geocode(query: string): Promise<GeoResult[]> {
  if (MAPBOX_TOKEN) {
    const res = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
        query
      )}.json?access_token=${MAPBOX_TOKEN}&limit=5`
    );
    const json: { features?: MapboxFeature[] } = await res.json();
    return (json.features ?? []).map((f) => ({
      label: f.place_name,
      lat: f.center[1],
      lng: f.center[0],
    }));
  }
  // OpenStreetMap Nominatim fallback — fine for light, dev-time use.
  const res = await fetch(
    `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5`,
    { headers: { Accept: "application/json" } }
  );
  const json: NominatimResult[] = await res.json();
  return (json ?? []).map((f) => ({
    label: f.display_name,
    lat: parseFloat(f.lat),
    lng: parseFloat(f.lon),
  }));
}

/** Manual location search — the fallback path when one-time geolocation is
 * denied or unavailable, and a way to browse a different area on purpose. */
export function LocationSearch({
  open,
  onClose,
  onSelect,
}: {
  open: boolean;
  onClose: () => void;
  onSelect: (loc: { lat: number; lng: number; label: string }) => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<GeoResult[]>([]);
  const [loading, setLoading] = useState(false);

  async function runSearch(q: string) {
    setQuery(q);
    if (q.trim().length < 3) {
      setResults([]);
      return;
    }
    setLoading(true);
    try {
      setResults(await geocode(q));
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <BottomSheet open={open} onClose={onClose} title="Search a location">
      <div className="mb-3 flex items-center gap-2 rounded-full border border-border bg-background px-4 py-2.5">
        <Search size={18} className="text-muted" />
        <input
          autoFocus
          value={query}
          onChange={(e) => runSearch(e.target.value)}
          placeholder="City, address, or landmark"
          className="w-full bg-transparent text-sm outline-none placeholder:text-muted"
        />
        {loading && <Loader2 size={16} className="animate-spin text-muted" />}
      </div>
      <ul className="max-h-72 overflow-y-auto">
        {results.map((r, i) => (
          <li key={i}>
            <button
              onClick={() => {
                onSelect(r);
                onClose();
              }}
              className="w-full rounded-xl px-2 py-3 text-left text-sm hover:bg-surface-raised"
            >
              {r.label}
            </button>
          </li>
        ))}
        {!loading && query.length >= 3 && results.length === 0 && (
          <li className="px-2 py-4 text-sm text-muted">No matches found.</li>
        )}
      </ul>
    </BottomSheet>
  );
}
