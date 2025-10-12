import { TrimRange } from "./video-editor-trim";

export function TrimRangeOverlay({
  range,
  isSelected,
  startPct,
  endPct,
  onRangeClick,
  onHandlePointerDown,
}: {
  range: TrimRange;
  isSelected: boolean;
  startPct: number;
  endPct: number;
  onRangeClick: (
    e: React.PointerEvent<HTMLDivElement>,
    rangeId: string
  ) => void;
  onHandlePointerDown: (
    e: React.PointerEvent<HTMLDivElement>,
    type: "left" | "right",
    rangeId: string
  ) => void;
}) {
  return (
    <>
      {/* Range overlay */}
      <div
        onPointerDown={(e) => {
          if (e.button !== 0) return;
          e.stopPropagation();
          onRangeClick(e, range.id);
        }}
        className={`absolute top-3 bottom-3 rounded-lg transition-opacity ${
          isSelected
            ? "bg-primary/25 ring-1 ring-primary/30 cursor-move"
            : "bg-primary/10 ring-1 ring-primary/15 opacity-40 cursor-pointer"
        }`}
        style={{
          left: `${startPct}%`,
          width: `${Math.max(endPct - startPct, 0)}%`,
        }}
      />

      {/* Left handle */}
      <div
        onPointerDown={(e) => onHandlePointerDown(e, "left", range.id)}
        className={`absolute top-2.5 bottom-2.5 w-2.5 rounded-full shadow-sm cursor-ew-resize border translate-x-[-50%] transition-opacity ${
          isSelected
            ? "bg-primary hover:bg-primary/90 border-primary/50"
            : "bg-primary/50 border-primary/30 opacity-40"
        }`}
        style={{ left: `${startPct}%` }}
      />

      {/* Right handle */}
      <div
        onPointerDown={(e) => onHandlePointerDown(e, "right", range.id)}
        className={`absolute top-2.5 bottom-2.5 w-2.5 rounded-full shadow-sm cursor-ew-resize border translate-x-[-50%] transition-opacity ${
          isSelected
            ? "bg-primary hover:bg-primary/90 border-primary/50"
            : "bg-primary/50 border-primary/30 opacity-40"
        }`}
        style={{ left: `${endPct}%` }}
      />
    </>
  );
}
