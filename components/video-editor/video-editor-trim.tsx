import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Pause, Play } from "lucide-react";
import { useHotkeys } from "react-hotkeys-hook";

const MIN_RANGE = 1; // seconds

export function VideoEditorTrim({ videoSrc }: { videoSrc: string }) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const timelineRef = useRef<HTMLDivElement | null>(null);

  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [start, setStart] = useState(0);
  const [end, setEnd] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const handleLoadedMetadata = useCallback(() => {
    const v = videoRef.current;
    const d = v && Number.isFinite(v.duration) ? v.duration : 0;
    setDuration(d);
    setStart(0);
    setEnd(Math.max(d, MIN_RANGE));
    setCurrentTime(0);
  }, []);

  const handleTimeUpdate = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    const t = v.currentTime;
    setCurrentTime(t);

    // Constrain to selection while playing
    if (t > end) {
      // stop at range end
      if (!v.paused) v.pause();
      setIsPlaying(false);
      v.currentTime = end;
      setCurrentTime(end);
    }
    if (t < start) {
      // stop at range start
      v.currentTime = start;
      setCurrentTime(start);
    }
  }, [start, end]);

  const clamp = (v: number, min: number, max: number) =>
    Math.min(Math.max(v, min), max);

  const formatTime = (s: number) => {
    if (!Number.isFinite(s) || s < 0) s = 0;
    const m = Math.floor(s / 60);
    const sec = Math.floor(s - m * 60);
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  // Text buffers for mm:ss inputs
  const [startText, setStartText] = useState("");
  const [endText, setEndText] = useState("");

  useEffect(() => {
    setStartText(formatTime(start));
  }, [start]);
  useEffect(() => {
    setEndText(formatTime(end));
  }, [end]);

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

  const commitStart = (next: number) => {
    const clamped = clamp(next, 0, Math.max(0, end - MIN_RANGE));
    setStart(clamped);
    const v = videoRef.current;
    const t = v?.currentTime ?? currentTime;
    if (t < clamped) {
      // keep playhead inside selection
      if (v) v.currentTime = clamped;
      setCurrentTime(clamped);
    }
  };

  const commitEnd = (next: number) => {
    const clamped = clamp(
      next,
      Math.min(duration, start + MIN_RANGE),
      duration || next
    );
    setEnd(clamped);
    const v = videoRef.current;
    const t = v?.currentTime ?? currentTime;
    if (t > clamped) {
      if (v) v.currentTime = clamped;
      setCurrentTime(clamped);
    }
  };

  const togglePlayPause = async () => {
    const v = videoRef.current;
    if (!v) return;

    if (isPlaying) {
      v.pause();
      setIsPlaying(false);
      return;
    }
    const t = v.currentTime;
    if (t < start || t >= end) {
      v.currentTime = start;
      setCurrentTime(start);
    }
    await v.play();
    setIsPlaying(true);
  };

  // Spacebar play/pause
  useHotkeys("space", togglePlayPause, {
    preventDefault: true,
  });

  // Timeline interactions
  type DragType = "none" | "left" | "right" | "scrub";
  const dragRef = useRef<{ type: DragType; wasPlaying: boolean }>({
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
        const maxLeft = end - MIN_RANGE;
        const next = clamp(time, 0, Math.max(0, maxLeft));
        commitStart(next);
        return;
      }

      if (t === "right") {
        const minRight = start + MIN_RANGE;
        const next = clamp(time, Math.min(minRight, duration), duration);
        commitEnd(next);
        return;
      }
    },
    [start, end, duration]
  );

  const onGlobalPointerUp = useCallback(() => {
    const { type, wasPlaying } = dragRef.current;
    if (type === "scrub") {
      // Resume if was playing before scrub
      const v = videoRef.current;
      if (wasPlaying && v && v.paused) {
        // Only resume if playhead is within the selection
        const t = v.currentTime;
        if (t >= start && t < end) {
          v.play().catch(() => {});
          setIsPlaying(true);
        }
      }
    }
    dragRef.current.type = "none";
    dragRef.current.wasPlaying = false;
    window.removeEventListener("pointermove", onGlobalPointerMove);
    window.removeEventListener("pointerup", onGlobalPointerUp);
  }, [onGlobalPointerMove]);

  const beginDrag = (type: DragType, clientX?: number) => {
    dragRef.current = { type, wasPlaying: isPlaying };
    // Pause while scrubbing for precision
    if (type === "scrub" && isPlaying) {
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

    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
    beginDrag("scrub", e.clientX);
  };

  const onHandlePointerDown = (
    e: React.PointerEvent<HTMLDivElement>,
    type: "left" | "right"
  ) => {
    if (e.button !== 0) return;
    e.stopPropagation();
    beginDrag(type);
  };

  const percent = (time: number) => {
    const d = duration || 1;
    return (clamp(time, 0, d) / d) * 100;
  };

  const startPct = percent(start);
  const endPct = percent(end);
  const playheadPct = percent(currentTime);

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
      <div className="flex items-center w-full">
        <Button variant="ghost" onClick={togglePlayPause}>
          {isPlaying ? (
            <Pause className="h-4 w-4" />
          ) : (
            <Play className="h-4 w-4" />
          )}
        </Button>

        <div className="text-sm text-muted-foreground">
          {formatTime(currentTime)} / {formatTime(duration)}
        </div>

        <div className="flex items-center gap-2 ml-auto">
          <label className="text-sm text-muted-foreground">Start (mm:ss)</label>
          <Input
            type="text"
            inputMode="numeric"
            value={startText}
            onChange={(e) => setStartText(e.target.value)}
            onBlur={() => {
              const parsed = parseMMSS(startText);
              if (parsed == null) {
                setStartText(formatTime(start));
                return;
              }
              commitStart(parsed);
            }}
            placeholder="0:00"
            className="w-28"
          />
          <label className="text-sm text-muted-foreground">End (mm:ss)</label>
          <Input
            type="text"
            inputMode="numeric"
            value={endText}
            onChange={(e) => setEndText(e.target.value)}
            onBlur={() => {
              const parsed = parseMMSS(endText);
              if (parsed == null) {
                setEndText(formatTime(end));
                return;
              }
              commitEnd(parsed);
            }}
            placeholder={formatTime(duration)}
            className="w-28"
          />
        </div>
      </div>

      {/* Timeline */}
      <div className="w-full">
        <div
          ref={timelineRef}
          onPointerDown={onTrackPointerDown}
          className="relative h-16 rounded-md border bg-gradient-to-b from-muted/70 to-muted/50 select-none cursor-pointer shadow-sm"
        >
          {/* Base track */}
          <div className="absolute inset-y-3 left-0 right-0 bg-muted-foreground/15" />

          {/* Selected range overlay */}
          <div
            className="absolute top-3 bottom-3 rounded-lg bg-primary/25 ring-1 ring-primary/30"
            style={{
              left: `${startPct}%`,
              width: `${Math.max(endPct - startPct, 0)}%`,
            }}
          />

          {/* Left handle */}
          <div
            onPointerDown={(e) => onHandlePointerDown(e, "left")}
            className="absolute top-2.5 bottom-2.5 w-2.5 rounded-full bg-primary shadow-sm hover:bg-primary/90 cursor-ew-resize border border-primary/50 translate-x-[-50%]"
            style={{ left: `${startPct}%` }}
          />

          {/* Right handle */}
          <div
            onPointerDown={(e) => onHandlePointerDown(e, "right")}
            className="absolute top-2.5 bottom-2.5 w-2.5 rounded-full bg-primary shadow-sm hover:bg-primary/90 cursor-ew-resize border border-primary/50 translate-x-[-50%]"
            style={{ left: `${endPct}%` }}
          />

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
    </div>
  );
}
