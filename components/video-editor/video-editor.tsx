"use client";

import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { X, Scissors } from "lucide-react";
import { useLocalStorage } from "usehooks-ts";
import { Button } from "@/components/ui/button";
import { VideoEditorTrim } from "./video-editor-trim";

export function VideoEditor({
  videoEl,
  videoName,
  onClose,
}: {
  videoEl: HTMLVideoElement;
  videoName: string;
  onClose?: () => void;
}) {
  const [tool, setTool] = useLocalStorage<"trim">("video-editor-tool", "trim");

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
        {tool === "trim" && <VideoEditorTrim videoSrc={videoEl.src} />}
      </div>
    </div>
  );
}
