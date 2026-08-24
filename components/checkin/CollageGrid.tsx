"use client";

import { useState } from "react";
import { MoreVertical, RefreshCw, Trash2, Flag } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { usePullToRefresh } from "./usePullToRefresh";
import { ReportDialog } from "./ReportDialog";
import { removeCheckin } from "@/lib/data/checkins";
import type { CheckinWithProfile } from "@/lib/types";

export function CollageGrid({
  checkins,
  isHost,
  viewerId,
  onRefresh,
}: {
  checkins: CheckinWithProfile[];
  isHost: boolean;
  viewerId: string;
  onRefresh: () => Promise<void>;
}) {
  const { pullDistance, refreshing, handlers } = usePullToRefresh(onRefresh);
  const [menuFor, setMenuFor] = useState<string | null>(null);
  const [reportTarget, setReportTarget] = useState<string | null>(null);
  const [removing, setRemoving] = useState<Set<string>>(new Set());

  async function handleRemove(id: string) {
    setMenuFor(null);
    setRemoving((s) => new Set(s).add(id));
    await removeCheckin(id);
    await onRefresh();
  }

  return (
    <div {...handlers} className="relative">
      <div
        className="flex items-center justify-center overflow-hidden text-xs text-muted transition-all"
        style={{ height: pullDistance > 0 || refreshing ? 32 : 0 }}
      >
        <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
        <span className="ml-1.5">{refreshing ? "Refreshing…" : "Pull to refresh"}</span>
      </div>

      {checkins.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted">
          No check-ins yet. Photos show up here once people check in during the meet.
        </p>
      ) : (
        <div className="grid grid-cols-3 gap-1">
          {checkins
            .filter((c) => !removing.has(c.id))
            .map((c) => (
              <div key={c.id} className="group relative aspect-square overflow-hidden rounded-lg bg-surface-raised">
                {c.photo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={c.photo_url} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <Avatar url={c.profile.avatar_url} name={c.profile.username} size="sm" />
                  </div>
                )}
                <button
                  onClick={() => setMenuFor(menuFor === c.id ? null : c.id)}
                  className="absolute right-1 top-1 rounded-full bg-black/50 p-1 text-white"
                  aria-label="Photo options"
                >
                  <MoreVertical size={14} />
                </button>
                {menuFor === c.id && (
                  <div className="absolute right-1 top-8 z-10 w-36 rounded-xl border border-border bg-surface py-1 shadow-lg">
                    {isHost && (
                      <button
                        onClick={() => handleRemove(c.id)}
                        className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-danger hover:bg-surface-raised"
                      >
                        <Trash2 size={14} /> Remove
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setReportTarget(c.id);
                        setMenuFor(null);
                      }}
                      className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-surface-raised"
                    >
                      <Flag size={14} /> Report
                    </button>
                  </div>
                )}
              </div>
            ))}
        </div>
      )}

      <ReportDialog
        open={Boolean(reportTarget)}
        onClose={() => setReportTarget(null)}
        reporterId={viewerId}
        targetType="photo"
        targetId={reportTarget ?? ""}
      />
    </div>
  );
}
