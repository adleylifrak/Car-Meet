"use client";

import { useState } from "react";
import { MoreVertical, Flag, ShieldOff, ShieldCheck } from "lucide-react";
import { ReportDialog } from "@/components/checkin/ReportDialog";
import { blockProfile, unblockProfile } from "@/lib/data/reports";

export function BlockReportMenu({
  viewerId,
  targetId,
  initiallyBlocked = false,
}: {
  viewerId: string;
  targetId: string;
  initiallyBlocked?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [blocked, setBlocked] = useState(initiallyBlocked);

  async function toggleBlock() {
    setOpen(false);
    const next = !blocked;
    setBlocked(next);
    if (next) await blockProfile(viewerId, targetId);
    else await unblockProfile(viewerId, targetId);
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="rounded-full p-1.5 hover:bg-surface-raised"
        aria-label="More options"
      >
        <MoreVertical size={20} />
      </button>
      {open && (
        <div className="absolute right-0 top-9 z-20 w-44 rounded-xl border border-border bg-surface py-1 shadow-lg">
          <button
            onClick={toggleBlock}
            className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm hover:bg-surface-raised"
          >
            {blocked ? <ShieldCheck size={15} /> : <ShieldOff size={15} />}
            {blocked ? "Unblock" : "Block"}
          </button>
          <button
            onClick={() => {
              setOpen(false);
              setReportOpen(true);
            }}
            className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm text-danger hover:bg-surface-raised"
          >
            <Flag size={15} /> Report
          </button>
        </div>
      )}
      <ReportDialog
        open={reportOpen}
        onClose={() => setReportOpen(false)}
        reporterId={viewerId}
        targetType="profile"
        targetId={targetId}
      />
    </div>
  );
}
