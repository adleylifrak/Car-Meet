"use client";

import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import type { ReactNode } from "react";

export function TopBar({ title, right }: { title: string; right?: ReactNode }) {
  const router = useRouter();
  return (
    <header className="sticky top-0 z-30 flex items-center justify-between border-b border-border bg-surface/95 px-3 py-3 backdrop-blur">
      <button
        onClick={() => router.back()}
        className="rounded-full p-1.5 hover:bg-surface-raised"
        aria-label="Back"
      >
        <ChevronLeft size={22} />
      </button>
      <h1 className="truncate text-base font-semibold">{title}</h1>
      <div className="min-w-[2.25rem] text-right">{right}</div>
    </header>
  );
}
