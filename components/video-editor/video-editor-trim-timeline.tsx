import { useCallback, useEffect, useRef, useState } from "react";
import { TrimRangeOverlay } from "./trim-range-overlay";
import { clamp, TrimRange } from "./video-editor-trim";

export const VideoEditorTrimTimeline = ({
  ranges,
  selectedRangeId,
  currentTime,
  duration,
  minRange = 1,
  onSeek,
  onRangesChanged,
  onSelectedRangeChanged,
  onInteractionStart,
  onInteractionEnd,
}: {
  ranges: TrimRange[];
  selectedRangeId: string | null;
  currentTime: number;
  duration: number;
  minRange?: number;
  onSeek: (time: number) => void;
  onRangesChanged: (ranges: TrimRange[]) => void;
  onSelectedRangeChanged: (id: string | null) => void;
  onInteractionStart?: (type: "left" | "right" | "scrub" | "move") => void;
  onInteractionEnd?: (type: "left" | "right" | "scrub" | "move") => void;
}) => {
  const timelineRef = useRef<HTMLDivElement | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  type DragType = "none" | "left" | "right" | "scrub" | "move";
  const dragRef = useRef<{
    type: DragType;
    rangeId?: string;
    initialTime?: number;
    originalStart?: number;
    originalEnd?: number;
  }>({ type: "none" });

  const getTimeFromEvent = useCallback(
    (clientX: number) => {
      const el = timelineRef.current;
      if (!el || duration <= 0) return 0;
      const rect = el.getBoundingClientRect();
      const positionInTimeline = clientX - rect.left;
      const totalWidth = rect.width || el.clientWidth;
      const ratio = clamp(positionInTimeline / totalWidth, 0, 1);
      return clamp(ratio * duration, 0, duration);
    },
    [duration]
  );

  // Handle zoom with mouse wheel
  const handleWheel = useCallback((e: WheelEvent) => {
    if (!e.ctrlKey && !e.metaKey) return;
    e.preventDefault();

    setZoomLevel((prev) => {
      const delta = e.deltaY > 0 ? -0.1 : 0.1;
      const next = prev + delta;
      return clamp(next, 1, 5); // Min 100%, max 500%
    });
  }, []);

  useEffect(() => {
    const el = timelineRef.current;
    if (!el) return;

    el.addEventListener("wheel", handleWheel, { passive: false });
    return () => {
      el.removeEventListener("wheel", handleWheel);
    };
  }, [handleWheel]);

  const beginDrag = useCallback(
    (type: Exclude<DragType, "none">, clientX?: number, rangeId?: string) => {
      const initialTime =
        clientX !== undefined ? getTimeFromEvent(clientX) : undefined;
      const range = rangeId ? ranges.find((r) => r.id === rangeId) : undefined;

      dragRef.current = {
        type,
        rangeId,
        initialTime,
        originalStart: range?.start,
        originalEnd: range?.end,
      };

      // Notify parent to handle pause if needed
      if (onInteractionStart) onInteractionStart(type);

      // If click-to-seek
      if (type === "scrub" && typeof clientX === "number") {
        const t = getTimeFromEvent(clientX);
        onSeek(t);
      }

      const onMove = (e: PointerEvent) => {
        const t = dragRef.current.type;
        if (t === "none") return;
        const time = getTimeFromEvent(e.clientX);

        if (t === "scrub") {
          onSeek(time);
          return;
        }

        if (t === "left") {
          const id = dragRef.current.rangeId;
          const range = ranges.find((r) => r.id === id);
          if (!range) return;
          const clamped = clamp(time, 0, Math.max(0, range.end - minRange));
          const updated = ranges.map((r) =>
            r.id === id ? { ...r, start: clamped } : r
          );
          onRangesChanged(updated);
          // keep playhead inside selection if needed
          if (currentTime < clamped) onSeek(clamped);
          return;
        }

        if (t === "right") {
          const id = dragRef.current.rangeId;
          const range = ranges.find((r) => r.id === id);
          if (!range) return;
          const clamped = clamp(
            time,
            Math.min(duration, range.start + minRange),
            duration || time
          );
          const updated = ranges.map((r) =>
            r.id === id ? { ...r, end: clamped } : r
          );
          onRangesChanged(updated);
          if (currentTime > clamped) onSeek(clamped);
          return;
        }

        if (t === "move") {
          const { rangeId, initialTime, originalStart, originalEnd } =
            dragRef.current;
          if (
            !rangeId ||
            initialTime === undefined ||
            originalStart === undefined ||
            originalEnd === undefined
          )
            return;

          const delta = time - initialTime;
          const rangeLength = originalEnd - originalStart;
          const newStart = clamp(
            originalStart + delta,
            0,
            duration - rangeLength
          );
          const newEnd = newStart + rangeLength;

          const updated = ranges.map((r) =>
            r.id === rangeId ? { ...r, start: newStart, end: newEnd } : r
          );
          onRangesChanged(updated);
          return;
        }
      };

      const onUp = () => {
        const { type } = dragRef.current;
        dragRef.current.type = "none";
        if (type !== "none" && onInteractionEnd) onInteractionEnd(type);
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);
      };

      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);
    },
    [
      getTimeFromEvent,
      ranges,
      onInteractionStart,
      onInteractionEnd,
      onSeek,
      onRangesChanged,
      minRange,
      currentTime,
      duration,
    ]
  );

  const onTrackPointerDown: React.PointerEventHandler<HTMLDivElement> = (e) => {
    if (e.button !== 0) return;
    if (ranges.length > 1) {
      onSelectedRangeChanged(null);
    }
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
    beginDrag("scrub", e.clientX);
  };

  const onHandlePointerDown = (
    e: React.PointerEvent<HTMLDivElement>,
    type: "left" | "right",
    rangeId: string
  ) => {
    if (e.button !== 0) return;
    e.stopPropagation();
    onSelectedRangeChanged(rangeId);
    beginDrag(type, undefined, rangeId);
  };

  const onRangeClick = (
    e: React.PointerEvent<HTMLDivElement>,
    rangeId: string
  ) => {
    onSelectedRangeChanged(rangeId);
    beginDrag("move", e.clientX, rangeId);
  };
  const percent = (time: number) => {
    const d = duration || 1;
    const clamp = (v: number, min: number, max: number) =>
      Math.min(Math.max(v, min), max);
    return (clamp(time, 0, d) / d) * 100;
  };

  const playheadPct = percent(currentTime);

  return (
    <div
      className="w-full overflow-x-auto overflow-y-visible p-2"
      style={{
        scrollbarWidth: zoomLevel > 1 ? "thin" : "none",
      }}
    >
      <div
        ref={timelineRef}
        onPointerDown={onTrackPointerDown}
        className="relative h-16 rounded-md border bg-gradient-to-b from-muted/70 to-muted/50 select-none cursor-pointer shadow-sm"
        style={{
          width: `${zoomLevel * 100}%`,
        }}
      >
        {/* Base track */}
        <div className="absolute inset-y-3 left-0 right-0 bg-muted-foreground/15" />

        {/* All trim ranges */}
        {ranges.map((range) => {
          const isSelected = range.id === selectedRangeId;
          const startPct = percent(range.start);
          const endPct = percent(range.end);
          return (
            <TrimRangeOverlay
              key={range.id}
              range={range}
              isSelected={isSelected}
              startPct={startPct}
              endPct={endPct}
              onRangeClick={onRangeClick}
              onHandlePointerDown={onHandlePointerDown}
            />
          );
        })}

        {/* Playhead */}
        <div
          className="absolute top-0 bottom-0 w-px bg-foreground/80"
          style={{ left: `calc(${playheadPct}% )` }}
        />

        {/* Playhead knob */}
        <div
          className="absolute -top-1.5 h-3 w-3 rounded-full bg-foreground shadow border border-background"
          style={{ left: `calc(${playheadPct}% - 6px)` }}
        />
      </div>
    </div>
  );
};
