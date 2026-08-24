import { Award } from "lucide-react";
import type { BadgeType } from "@/lib/types";

const MILESTONES: BadgeType[] = ["5", "10", "25", "50", "100"];

export function BadgeRow({ earned }: { earned: BadgeType[] }) {
  const earnedSet = new Set(earned);
  return (
    <div className="flex gap-3 overflow-x-auto">
      {MILESTONES.map((m) => {
        const has = earnedSet.has(m);
        return (
          <div key={m} className="flex flex-col items-center gap-1">
            <div
              className={`flex h-14 w-14 items-center justify-center rounded-full border-2 ${
                has ? "border-accent bg-accent/10 text-accent" : "border-border text-muted opacity-40"
              }`}
            >
              <Award size={22} />
            </div>
            <span className={`text-[11px] font-medium ${has ? "" : "text-muted"}`}>{m}</span>
          </div>
        );
      })}
    </div>
  );
}
