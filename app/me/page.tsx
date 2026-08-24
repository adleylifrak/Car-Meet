"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getCurrentProfileClient } from "@/lib/data/profiles";

export default function MePage() {
  const router = useRouter();
  useEffect(() => {
    getCurrentProfileClient().then((p) => {
      router.replace(p ? `/profile/${p.username}` : "/login");
    });
  }, [router]);
  return <p className="p-4 text-sm text-muted">Loading…</p>;
}
