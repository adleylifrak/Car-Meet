"use client";

import { useRef, useState } from "react";
import { Camera, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { uploadImage } from "@/lib/storage";
import { submitCheckin } from "@/lib/data/checkins";

export function CheckinCamera({
  meetId,
  profileId,
  active,
  onCheckedIn,
}: {
  meetId: string;
  profileId: string;
  active: boolean;
  onCheckedIn: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setError(null);
    setBusy(true);
    try {
      const photoUrl = await uploadImage(file, "checkins", meetId);
      const result = await submitCheckin({ meetId, profileId, photoUrl });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      onCheckedIn();
    } catch {
      setError("Something went wrong uploading that photo.");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  if (!active) {
    return (
      <Button variant="secondary" size="sm" disabled className="w-full">
        Check-in opens when the meet is live
      </Button>
    );
  }

  return (
    <div>
      <Button
        size="sm"
        className="w-full"
        disabled={busy}
        onClick={() => inputRef.current?.click()}
      >
        {busy ? (
          <Loader2 size={16} className="animate-spin" />
        ) : (
          <Camera size={16} />
        )}
        {busy ? "Checking in…" : "Check in with a photo"}
      </Button>
      {error && <p className="mt-1.5 text-xs text-danger">{error}</p>}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />
    </div>
  );
}
