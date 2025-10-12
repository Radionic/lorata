import { useCallback, useEffect, useRef, useState } from "react";
import { useHotkeys } from "react-hotkeys-hook";
import { toast } from "sonner";
import { VideoEditorTrimControls } from "./video-editor-trim-controls";
import { VideoEditorTrimTimeline } from "./video-editor-trim-timeline";

export type TrimRange = {
  id: string;
  start: number;
  end: number;
};

const clamp = (v: number, min: number, max: number) =>
  Math.min(Math.max(v, min), max);

const formatTime = (s: number) => {
  if (!Number.isFinite(s) || s < 0) s = 0;
  const m = Math.floor(s / 60);
  const sec = Math.floor(s - m * 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
};

const parseMMSS = (text: string): number | null => {
  const t = text.trim();
  if (!t) return null;
  const parts = t.split(":");
  if (parts.length !== 2) return null;
  const m = Number(parts[0]);
  const s = Number(parts[1]);
  if (!Number.isFinite(m) || !Number.isFinite(s)) return null;
  if (s < 0 || s >= 60) return null;
  return m * 60 + s;
};

export function VideoEditorTrim({
  videoSrc,
  minRange = 1,
  ranges,
  selectedRangeId,
  onRangesChanged,
  onSelectedRangeChanged,
}: {
  videoSrc: string;
  minRange?: number;
  ranges: TrimRange[];
  selectedRangeId: string | null;
  onRangesChanged: (ranges: TrimRange[]) => void;
  onSelectedRangeChanged: (id: string | null) => void;
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const timelineRef = useRef<HTMLDivElement | null>(null);

  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const handleLoadedMetadata = useCallback(() => {
    const v = videoRef.current;
    const d = v && Number.isFinite(v.duration) ? v.duration : 0;
    setDuration(d);
    setCurrentTime(0);
    // Initialize with one range if empty
    if (ranges.length === 0) {
      const newRange: TrimRange = {
        id: crypto.randomUUID(),
        start: 0,
        end: Math.max(d, minRange),
      };
      onRangesChanged([newRange]);
      onSelectedRangeChanged(newRange.id);
    }
  }, [minRange, ranges.length, onRangesChanged, onSelectedRangeChanged]);

  const selectedRange = ranges.find((r) => r.id === selectedRangeId);
  const start = selectedRange?.start ?? 0;
  const end = selectedRange?.end ?? duration;

  const handleTimeUpdate = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    const t = v.currentTime;
    setCurrentTime(t);

    // Constrain to selected range while playing
    if (selectedRangeId && selectedRange && !v.paused) {
      // Only stop at range end during playback
      if (t >= selectedRange.end) {
        v.pause();
        setIsPlaying(false);
        v.currentTime = selectedRange.end;
        setCurrentTime(selectedRange.end);
      }
    }
  }, [selectedRangeId, selectedRange]);

  // Text buffers for mm:ss inputs
  const [startText, setStartText] = useState("");
  const [endText, setEndText] = useState("");

  useEffect(() => {
    setStartText(formatTime(start));
  }, [start]);
  useEffect(() => {
    setEndText(formatTime(end));
  }, [end]);

  const commitStart = useCallback(
    (next: number) => {
      if (!selectedRange) return;
      const clamped = clamp(next, 0, Math.max(0, selectedRange.end - minRange));
      const updated = ranges.map((r) =>
        r.id === selectedRangeId ? { ...r, start: clamped } : r
      );
      onRangesChanged(updated);
      const v = videoRef.current;
      const t = v?.currentTime ?? currentTime;
      if (t < clamped) {
        // keep playhead inside selection
        if (v) v.currentTime = clamped;
        setCurrentTime(clamped);
      }
    },
    [
      minRange,
      selectedRange,
      ranges,
      selectedRangeId,
      onRangesChanged,
      currentTime,
    ]
  );

  const commitEnd = useCallback(
    (next: number) => {
      if (!selectedRange) return;
      const clamped = clamp(
        next,
        Math.min(duration, selectedRange.start + minRange),
        duration || next
      );
      const updated = ranges.map((r) =>
        r.id === selectedRangeId ? { ...r, end: clamped } : r
      );
      onRangesChanged(updated);
      const v = videoRef.current;
      const t = v?.currentTime ?? currentTime;
      if (t > clamped) {
        if (v) v.currentTime = clamped;
        setCurrentTime(clamped);
      }
    },
    [
      minRange,
      selectedRange,
      duration,
      ranges,
      selectedRangeId,
      onRangesChanged,
      currentTime,
    ]
  );

  const togglePlayPause = async () => {
    const v = videoRef.current;
    if (!v) return;

    if (isPlaying) {
      v.pause();
      setIsPlaying(false);
      return;
    }

    const t = v.currentTime;
    // If there's a selected range, play within it
    if (selectedRange) {
      // Play from start if at the end of the range
      if (t < selectedRange.start || t >= selectedRange.end) {
        v.currentTime = selectedRange.start;
        setCurrentTime(selectedRange.start);
      }
    } else {
      // Play from start if at the end of the video
      if (duration > 0 && t >= duration - 0.1) {
        v.currentTime = 0;
        setCurrentTime(0);
      }
    }
    await v.play();
    setIsPlaying(true);
  };

  // Spacebar play/pause
  useHotkeys("space", togglePlayPause, {
    preventDefault: true,
  });

  const addNewRange = () => {
    const newRange: TrimRange = {
      id: crypto.randomUUID(),
      start: 0,
      end: Math.min(duration, minRange * 5),
    };
    onRangesChanged([...ranges, newRange]);
    onSelectedRangeChanged(newRange.id);
  };

  const deleteSelectedRange = () => {
    if (!selectedRangeId) return;

    // Prevent deleting the last range
    if (ranges.length === 1) {
      toast.warning("Cannot delete the last range");
      return;
    }

    const updated = ranges.filter((r) => r.id !== selectedRangeId);
    onRangesChanged(updated);

    // Select the first remaining range
    if (updated.length > 0) {
      onSelectedRangeChanged(updated[0].id);
    }
  };

  // Timeline interactions
  type DragType = "none" | "left" | "right" | "scrub" | "move";
  const dragRef = useRef<{
    type: DragType;
    wasPlaying: boolean;
    rangeId?: string;
    initialTime?: number;
    originalStart?: number;
    originalEnd?: number;
  }>({
    type: "none",
    wasPlaying: false,
  });

  const getTimeFromClientX = (clientX: number) => {
    const el = timelineRef.current;
    if (!el || duration <= 0) return 0;

    const rect = el.getBoundingClientRect();
    const ratio = clamp((clientX - rect.left) / rect.width, 0, 1);
    return ratio * duration;
  };

  const onGlobalPointerMove = useCallback(
    (e: PointerEvent) => {
      const t = dragRef.current.type;
      if (t === "none") return;

      const time = getTimeFromClientX(e.clientX);

      if (t === "scrub") {
        const clamped = clamp(time, 0, duration);
        const v = videoRef.current;
        if (v) v.currentTime = clamped;
        setCurrentTime(clamped);
        return;
      }

      if (t === "left") {
        commitStart(time);
        return;
      }

      if (t === "right") {
        commitEnd(time);
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
    },
    [duration, commitStart, commitEnd, ranges, onRangesChanged]
  );

  const onGlobalPointerUp = useCallback(() => {
    const { type, wasPlaying } = dragRef.current;
    if (type === "scrub") {
      // Resume if was playing before scrub
      const v = videoRef.current;
      if (wasPlaying && v && v.paused) {
        // Only resume if playhead is within the selection
        const t = v.currentTime;
        if (
          selectedRange &&
          t >= selectedRange.start &&
          t < selectedRange.end
        ) {
          v.play().catch(() => {});
          setIsPlaying(true);
        }
      }
    }
    dragRef.current.type = "none";
    dragRef.current.wasPlaying = false;
    dragRef.current.rangeId = undefined;
    window.removeEventListener("pointermove", onGlobalPointerMove);
    window.removeEventListener("pointerup", onGlobalPointerUp);
  }, [onGlobalPointerMove, selectedRange]);

  const beginDrag = (type: DragType, clientX?: number, rangeId?: string) => {
    const initialTime =
      clientX !== undefined ? getTimeFromClientX(clientX) : undefined;
    const range = rangeId ? ranges.find((r) => r.id === rangeId) : undefined;

    dragRef.current = {
      type,
      wasPlaying: isPlaying,
      rangeId,
      initialTime,
      originalStart: range?.start,
      originalEnd: range?.end,
    };

    // Pause while scrubbing/moving for precision
    if ((type === "scrub" || type === "move") && isPlaying) {
      const v = videoRef.current;
      v?.pause();
      setIsPlaying(false);
    }
    window.addEventListener("pointermove", onGlobalPointerMove);
    window.addEventListener("pointerup", onGlobalPointerUp);

    // If click-to-seek
    if (type === "scrub" && typeof clientX === "number") {
      const time = getTimeFromClientX(clientX);
      const clamped = clamp(time, 0, duration);
      const v = videoRef.current;
      if (v) v.currentTime = clamped;
      setCurrentTime(clamped);
    }
  };

  const onTrackPointerDown: React.PointerEventHandler<HTMLDivElement> = (e) => {
    // If pressed not primary button, ignore
    if (e.button !== 0) return;

    // Don't deselect if there's only one range
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
    // Select the range when dragging its handle
    onSelectedRangeChanged(rangeId);
    beginDrag(type, undefined, rangeId);
  };

  const onRangeClick = (
    e: React.PointerEvent<HTMLDivElement>,
    rangeId: string
  ) => {
    // Select the range
    onSelectedRangeChanged(rangeId);
    // Always start move drag when clicking a range
    beginDrag("move", e.clientX, rangeId);
  };

  const handleStartBlur = () => {
    const parsed = parseMMSS(startText);
    if (parsed == null) {
      setStartText(formatTime(start));
      return;
    }
    commitStart(parsed);
  };

  const handleEndBlur = () => {
    const parsed = parseMMSS(endText);
    if (parsed == null) {
      setEndText(formatTime(end));
      return;
    }
    commitEnd(parsed);
  };

  return (
    <div className="container mx-auto flex flex-col items-center gap-4 py-4">
      {/* Video */}
      <div className="border rounded-sm shadow">
        <video
          ref={videoRef}
          src={videoSrc}
          className="h-[70dvh]"
          controls={false}
          onLoadedMetadata={handleLoadedMetadata}
          onTimeUpdate={handleTimeUpdate}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
        />
      </div>

      {/* Controls */}
      <VideoEditorTrimControls
        isPlaying={isPlaying}
        currentTime={currentTime}
        duration={duration}
        selectedRange={selectedRange}
        startText={startText}
        endText={endText}
        onPlayPause={togglePlayPause}
        onAddNewRange={addNewRange}
        onDeleteRange={deleteSelectedRange}
        onStartTextChange={setStartText}
        onEndTextChange={setEndText}
        onStartBlur={handleStartBlur}
        onEndBlur={handleEndBlur}
        formatTime={formatTime}
      />

      {/* Timeline */}
      <VideoEditorTrimTimeline
        ref={timelineRef}
        ranges={ranges}
        selectedRangeId={selectedRangeId}
        currentTime={currentTime}
        duration={duration}
        onTrackPointerDown={onTrackPointerDown}
        onRangeClick={onRangeClick}
        onHandlePointerDown={onHandlePointerDown}
      />
    </div>
  );
}
