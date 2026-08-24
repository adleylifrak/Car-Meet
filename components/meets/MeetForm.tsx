"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { ImagePicker } from "@/components/ui/ImagePicker";
import { LocationPicker } from "@/components/map/LocationPicker";
import { createMeet } from "@/lib/data/meets";
import { formatRadius, milesToMeters } from "@/lib/geo";
import type { Recurrence } from "@/lib/types";

function toLocalInputValue(date: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours()
  )}:${pad(date.getMinutes())}`;
}

export function MeetForm({
  hostId,
  initialCenter,
}: {
  hostId: string;
  initialCenter: { lat: number; lng: number };
}) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState(initialCenter);
  const [gallery, setGallery] = useState<string[]>([]);
  const [radiusMi, setRadiusMi] = useState(15);
  const [recurrence, setRecurrence] = useState<Recurrence>(null);

  const [startTime, setStartTime] = useState(() => toLocalInputValue(new Date(Date.now() + 3600_000)));
  const [endTime, setEndTime] = useState(() => toLocalInputValue(new Date(Date.now() + 4 * 3600_000)));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!title.trim()) return setError("Give your meet a title.");
    const start = new Date(startTime);
    const end = new Date(endTime);
    if (end <= start) return setError("End time has to be after the start time.");

    setSubmitting(true);
    try {
      const meet = await createMeet({
        hostId,
        title: title.trim(),
        description: description.trim(),
        lat: location.lat,
        lng: location.lng,
        notificationRadiusMeters: milesToMeters(radiusMi),
        startTime: start.toISOString(),
        endTime: end.toISOString(),
        galleryUrls: gallery,
        recurrence,
      });
      router.push(`/meets/${meet.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't create the meet.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 pb-8">
      <div>
        <label className="mb-1.5 block text-sm font-medium">Title</label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Downtown Rooftop Meet"
          className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm outline-none focus:border-accent"
        />
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium">Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          placeholder="Parking, entry point, layout, any ground rules…"
          className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm outline-none focus:border-accent"
        />
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium">Drop a pin</label>
        <LocationPicker center={location} onChange={setLocation} />
        <p className="mt-1 text-xs text-muted">Move the map so the pin sits on your meet spot.</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1.5 block text-sm font-medium">Starts</label>
          <input
            type="datetime-local"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-accent"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium">Ends</label>
          <input
            type="datetime-local"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-accent"
          />
        </div>
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium">
          Notify people within {formatRadius(milesToMeters(radiusMi))}
        </label>
        <input
          type="range"
          min={1}
          max={100}
          value={radiusMi}
          onChange={(e) => setRadiusMi(Number(e.target.value))}
          className="w-full accent-accent"
        />
        <p className="mt-1 text-xs text-muted">
          Everyone in this radius gets a push notification when you post (and on each recurrence).
        </p>
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium">Repeats</label>
        <div className="flex gap-2">
          {(["none", "weekly", "monthly"] as const).map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => setRecurrence(opt === "none" ? null : opt)}
              className={`rounded-full border px-3.5 py-1.5 text-sm font-medium capitalize ${
                (recurrence ?? "none") === opt
                  ? "border-accent bg-accent text-accent-foreground"
                  : "border-border bg-surface"
              }`}
            >
              {opt}
            </button>
          ))}
        </div>
      </div>

      <ImagePicker
        label="Photos (parking, entry, layout — up to 5)"
        urls={gallery}
        onChange={setGallery}
        bucket="meet-galleries"
        pathPrefix={hostId}
        max={5}
      />

      {error && <p className="text-sm text-danger">{error}</p>}

      <Button type="submit" className="w-full" disabled={submitting}>
        {submitting ? "Posting…" : "Post meet"}
      </Button>
    </form>
  );
}
