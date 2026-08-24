"use client";

import { useState } from "react";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { Button } from "@/components/ui/Button";
import { submitReport } from "@/lib/data/reports";
import type { ReportTargetType } from "@/lib/types";

const REASONS = ["Inappropriate content", "Not from this meet", "Spam", "Harassment", "Other"];

export function ReportDialog({
  open,
  onClose,
  reporterId,
  targetType,
  targetId,
}: {
  open: boolean;
  onClose: () => void;
  reporterId: string;
  targetType: ReportTargetType;
  targetId: string;
}) {
  const [reason, setReason] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  async function submit() {
    if (!reason) return;
    setSubmitting(true);
    try {
      await submitReport({ reporterId, targetType, targetId, reason });
      setDone(true);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <BottomSheet
      open={open}
      onClose={() => {
        onClose();
        setDone(false);
        setReason(null);
      }}
      title={done ? "Reported" : `Report ${targetType}`}
    >
      {done ? (
        <p className="text-sm text-muted">
          Thanks — our team will review this. Only the app sees reports, not other users.
        </p>
      ) : (
        <>
          <div className="mb-4 space-y-2">
            {REASONS.map((r) => (
              <label
                key={r}
                className="flex cursor-pointer items-center gap-3 rounded-xl border border-border p-3 has-[:checked]:border-accent has-[:checked]:bg-accent/5"
              >
                <input
                  type="radio"
                  name="reason"
                  className="accent-accent"
                  checked={reason === r}
                  onChange={() => setReason(r)}
                />
                <span className="text-sm">{r}</span>
              </label>
            ))}
          </div>
          <Button className="w-full" variant="danger" disabled={!reason || submitting} onClick={submit}>
            {submitting ? "Submitting…" : "Submit report"}
          </Button>
        </>
      )}
    </BottomSheet>
  );
}
