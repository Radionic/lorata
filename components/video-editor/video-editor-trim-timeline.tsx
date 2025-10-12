import { forwardRef } from "react";
import { TrimRangeOverlay } from "./trim-range-overlay";
import { TrimRange } from "./video-editor-trim";

export const VideoEditorTrimTimeline = forwardRef<
  HTMLDivElement,
  {
    ranges: TrimRange[];
    selectedRangeId: string | null;
    currentTime: number;
    duration: number;
    onTrackPointerDown: React.PointerEventHandler<HTMLDivElement>;
    onRangeClick: (
      e: React.PointerEvent<HTMLDivElement>,
      rangeId: string
    ) => void;
    onHandlePointerDown: (
      e: React.PointerEvent<HTMLDivElement>,
      type: "left" | "right",
      rangeId: string
    ) => void;
  }
>(
  (
    {
      ranges,
      selectedRangeId,
      currentTime,
      duration,
      onTrackPointerDown,
      onRangeClick,
      onHandlePointerDown,
    },
    ref
  ) => {
    const percent = (time: number) => {
      const d = duration || 1;
      const clamp = (v: number, min: number, max: number) =>
        Math.min(Math.max(v, min), max);
      return (clamp(time, 0, d) / d) * 100;
    };

    const playheadPct = percent(currentTime);

    return (
      <div className="w-full">
        <div
          ref={ref}
          onPointerDown={onTrackPointerDown}
          className="relative h-16 rounded-md border bg-gradient-to-b from-muted/70 to-muted/50 select-none cursor-pointer shadow-sm"
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
  }
);
