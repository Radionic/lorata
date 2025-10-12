"use client";

import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { X, Scissors, ChevronDown } from "lucide-react";
import { useLocalStorage } from "usehooks-ts";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import { TrimRange, VideoEditorTrim } from "./video-editor-trim";
import { useState } from "react";
import { useTrimVideo } from "@/lib/queries/use-video";
import { useHotkeys } from "react-hotkeys-hook";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function VideoEditor({
  videoEl,
  videoName,
  taskId,
  onClose,
  onVideoTrimmed,
}: {
  videoEl: HTMLVideoElement;
  videoName: string;
  taskId: string;
  onClose?: () => void;
  onVideoTrimmed?: (outputPaths: string[]) => void;
}) {
  const [tool, setTool] = useLocalStorage<"trim">("video-editor-tool", "trim");
  const [editorSrc, setEditorSrc] = useState<string>(videoEl.src);

  const [ranges, setRanges] = useState<TrimRange[]>([]);
  const [selectedRangeId, setSelectedRangeId] = useState<string | null>(null);
  const selectedRange = ranges.find((r) => r.id === selectedRangeId);

  const { mutateAsync: trimVideo, isLoading: isTrimming } = useTrimVideo();

  const handleTrimSelected = async () => {
    if (!selectedRange) return;
    const outputPaths = await trimVideo({
      taskId,
      filename: videoName,
      segments: [{ start: selectedRange.start, end: selectedRange.end }],
      replace: true,
    });
    if (outputPaths) {
      // Update both the preview element and editor's src to bust cache
      if (videoEl) {
        videoEl.src = videoEl.src + "?t=" + Date.now();
        videoEl.load?.();
      }
      setEditorSrc((prev) => prev + "?t=" + Date.now());
      // Reset ranges
      setRanges([]);
      setSelectedRangeId(null);
    }
  };

  const handleTrimAll = async () => {
    if (ranges.length === 0) return;

    const segments = ranges.map((r) => ({
      start: r.start,
      end: r.end,
    }));

    const outputPaths = await trimVideo({
      taskId,
      filename: videoName,
      segments,
      replace: false,
    });

    if (outputPaths && outputPaths.length > 0) {
      onVideoTrimmed?.(outputPaths);
      setRanges([]);
      setSelectedRangeId(null);
      onClose?.();
    }
  };

  useHotkeys("esc", () => onClose?.());

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
            <ButtonGroup>
              <Button
                variant="outline"
                size="sm"
                disabled={isTrimming || ranges.length === 0}
                onClick={() =>
                  ranges.length > 1 ? handleTrimAll() : handleTrimSelected()
                }
              >
                <Scissors className="h-4 w-4" />
                {isTrimming
                  ? "Trimming..."
                  : ranges.length > 1
                  ? `Trim All (${ranges.length})`
                  : "Trim and Replace"}
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" disabled={isTrimming}>
                    <ChevronDown />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="[--radius:1rem]">
                  <DropdownMenuGroup>
                    <DropdownMenuItem
                      onClick={handleTrimSelected}
                      disabled={!selectedRange}
                    >
                      <Scissors className="h-4 w-4" />
                      <div className="flex flex-col items-start">
                        <span>Trim and Replace</span>
                        <span className="text-xs text-muted-foreground">
                          Replace video in current task item
                        </span>
                      </div>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={handleTrimAll}
                      disabled={ranges.length === 0}
                    >
                      <Scissors className="h-4 w-4" />
                      <div className="flex flex-col items-start">
                        <span>
                          Trim All ({ranges.length} ranges) and Create
                        </span>
                        <span className="text-xs text-muted-foreground">
                          Create new task items with trimmed videos
                        </span>
                      </div>
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            </ButtonGroup>
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
            ranges={ranges}
            selectedRangeId={selectedRangeId}
            onRangesChanged={setRanges}
            onSelectedRangeChanged={setSelectedRangeId}
          />
        )}
      </div>
    </div>
  );
}
