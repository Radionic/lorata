"use client";

import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { X, Scissors } from "lucide-react";
import { useLocalStorage } from "usehooks-ts";
import { Button } from "@/components/ui/button";
import { VideoEditorTrim } from "./video-editor-trim";
import { useState, useMemo } from "react";
import { useTrimVideo } from "@/lib/queries/use-video";

export function VideoEditor({
  videoEl,
  videoName,
  taskId,
  onClose,
}: {
  videoEl: HTMLVideoElement;
  videoName: string;
  taskId: string;
  onClose?: () => void;
}) {
  const [tool, setTool] = useLocalStorage<"trim">("video-editor-tool", "trim");
  const [start, setStart] = useState(0);
  const [end, setEnd] = useState(0);
  const [editorSrc, setEditorSrc] = useState<string>(videoEl.src);

  const { mutateAsync: trimVideo, isLoading: isTrimming } = useTrimVideo();

  const canTrim = useMemo(
    () => end > start && end - start >= 0.1,
    [start, end]
  );

  const handleTrim = async () => {
    const ok = await trimVideo({
      taskId,
      filename: videoName,
      start,
      end,
    });
    if (ok) {
      // Update both the preview element and editor's src to bust cache
      if (videoEl) {
        videoEl.src = videoEl.src + "?t=" + Date.now();
        videoEl.load?.();
      }
      setEditorSrc((prev) => prev + "?t=" + Date.now());
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 px-4 py-3 border-b bg-background">
        <ToggleGroup
          type="single"
          variant="outline"
          size="sm"
          value={tool}
          onValueChange={(value) => setTool((value as "trim") || "trim")}
        >
          <ToggleGroupItem value="trim" className="gap-2">
            <Scissors className="h-4 w-4" />
            Trim
          </ToggleGroupItem>
        </ToggleGroup>

        <div className="text-sm text-muted-foreground truncate max-w-[40%] ml-2">
          {videoName}
        </div>

        <div className="ml-auto flex items-center gap-2">
          {tool === "trim" && (
            <Button
              variant="default"
              size="sm"
              onClick={handleTrim}
              disabled={!canTrim || isTrimming}
              className="gap-2 select-none"
            >
              <Scissors className="h-4 w-4" />
              {isTrimming ? "Trimming..." : "Trim Video"}
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            className="gap-2 select-none"
          >
            <X className="h-4 w-4" />
            Close
          </Button>
        </div>
      </div>

      <div className="flex-1">
        {tool === "trim" && (
          <VideoEditorTrim
            videoSrc={editorSrc}
            start={start}
            end={end}
            onStartChanged={setStart}
            onEndChanged={setEnd}
          />
        )}
      </div>
    </div>
  );
}
