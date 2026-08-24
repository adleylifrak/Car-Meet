"use client";

import { Camera, ImagePlus, Loader2, X } from "lucide-react";
import { useRef, useState } from "react";
import { uploadImage, type StorageBucket } from "@/lib/storage";
import { cn } from "@/lib/utils";

export function ImagePicker({
  urls,
  onChange,
  bucket,
  pathPrefix,
  max = 5,
  cameraOnly = false,
  label,
}: {
  urls: string[];
  onChange: (urls: string[]) => void;
  bucket: StorageBucket;
  pathPrefix: string;
  max?: number;
  cameraOnly?: boolean;
  label?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      const remaining = max - urls.length;
      const picked = Array.from(files).slice(0, Math.max(remaining, 0));
      const uploaded = await Promise.all(
        picked.map((f) => uploadImage(f, bucket, pathPrefix))
      );
      onChange([...urls, ...uploaded]);
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div>
      {label && <p className="mb-2 text-sm font-medium">{label}</p>}
      <div className="flex flex-wrap gap-2">
        {urls.map((url, i) => (
          <div key={i} className="relative h-20 w-20 overflow-hidden rounded-xl border border-border">
            {/* eslint-disable-next-line @next/next/no-img-element -- previews are user-uploaded blob/remote URLs, not build-time assets */}
            <img src={url} alt="" className="h-full w-full object-cover" />
            <button
              type="button"
              onClick={() => onChange(urls.filter((_, idx) => idx !== i))}
              className="absolute right-0.5 top-0.5 rounded-full bg-black/60 p-0.5 text-white"
              aria-label="Remove image"
            >
              <X size={12} />
            </button>
          </div>
        ))}
        {urls.length < max && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className={cn(
              "flex h-20 w-20 flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-border text-muted hover:bg-surface-raised",
              uploading && "opacity-60"
            )}
          >
            {uploading ? (
              <Loader2 size={18} className="animate-spin" />
            ) : cameraOnly ? (
              <Camera size={18} />
            ) : (
              <ImagePlus size={18} />
            )}
            <span className="text-[10px]">{cameraOnly ? "Camera" : "Add"}</span>
          </button>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture={cameraOnly ? "environment" : undefined}
        multiple={!cameraOnly}
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
    </div>
  );
}
