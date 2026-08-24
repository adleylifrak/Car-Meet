"use client";

import { Chip } from "@/components/ui/Chip";

export type MeetFilter = "live" | "upcoming" | "past" | "going";

const OPTIONS: { key: MeetFilter; label: string }[] = [
  { key: "live", label: "Live now" },
  { key: "upcoming", label: "Upcoming" },
  { key: "past", label: "Past" },
  { key: "going", label: "Going" },
];

export function FilterChips({
  active,
  onToggle,
}: {
  active: Set<MeetFilter>;
  onToggle: (key: MeetFilter) => void;
}) {
  return (
    <div className="no-scrollbar flex gap-2 overflow-x-auto px-4 py-2">
      {OPTIONS.map((opt) => (
        <Chip key={opt.key} active={active.has(opt.key)} onClick={() => onToggle(opt.key)}>
          {opt.label}
        </Chip>
      ))}
    </div>
  );
}
