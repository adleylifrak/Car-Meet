"use client";

import { useRef, useState, type TouchEvent } from "react";

const THRESHOLD = 70;

/** Minimal pull-to-refresh: only arms when the container is scrolled to the
 * top, so it never fights normal vertical scrolling. */
export function usePullToRefresh(onRefresh: () => Promise<void> | void) {
  const startY = useRef<number | null>(null);
  const [pullDistance, setPullDistance] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  function onTouchStart(e: TouchEvent<HTMLDivElement>) {
    const el = e.currentTarget;
    if (el.scrollTop <= 0) startY.current = e.touches[0].clientY;
  }

  function onTouchMove(e: TouchEvent<HTMLDivElement>) {
    if (startY.current == null || refreshing) return;
    const delta = e.touches[0].clientY - startY.current;
    if (delta > 0) setPullDistance(Math.min(delta, 120));
  }

  async function onTouchEnd() {
    if (pullDistance > THRESHOLD) {
      setRefreshing(true);
      await onRefresh();
      setRefreshing(false);
    }
    setPullDistance(0);
    startY.current = null;
  }

  return {
    pullDistance,
    refreshing,
    handlers: { onTouchStart, onTouchMove, onTouchEnd },
  };
}
