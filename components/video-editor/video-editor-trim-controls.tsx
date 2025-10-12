import { Button } from "@/components/ui/button";
import { Pause, Play, Plus, Trash2 } from "lucide-react";
import { TrimRange } from "./video-editor-trim";
import { Label } from "../ui/label";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";

export function VideoEditorTrimControls({
  isPlaying,
  currentTime,
  duration,
  selectedRange,
  startText,
  endText,
  onPlayPause,
  onAddNewRange,
  onDeleteRange,
  onStartTextChange,
  onEndTextChange,
  onStartBlur,
  onEndBlur,
  formatTime,
}: {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  selectedRange?: TrimRange;
  startText: string;
  endText: string;
  onPlayPause: () => void;
  onAddNewRange: () => void;
  onDeleteRange: () => void;
  onStartTextChange: (value: string) => void;
  onEndTextChange: (value: string) => void;
  onStartBlur: () => void;
  onEndBlur: () => void;
  formatTime: (seconds: number) => string;
}) {
  return (
    <div className="flex items-center w-full">
      <Button variant="ghost" onClick={onPlayPause}>
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
        {selectedRange && (
          <>
            <InputGroup>
              <InputGroupInput
                type="text"
                inputMode="numeric"
                value={startText}
                onChange={(e) => onStartTextChange(e.target.value)}
                onBlur={onStartBlur}
                placeholder="0:00"
                className="w-16"
              />
              <InputGroupAddon>
                <Label className="text-sm text-muted-foreground">
                  Start (mm:ss)
                </Label>
              </InputGroupAddon>
            </InputGroup>

            <InputGroup>
              <InputGroupInput
                type="text"
                inputMode="numeric"
                value={endText}
                onChange={(e) => onEndTextChange(e.target.value)}
                onBlur={onEndBlur}
                placeholder={formatTime(duration)}
                className="w-16"
              />
              <InputGroupAddon>
                <Label className="text-sm text-muted-foreground">
                  End (mm:ss)
                </Label>
              </InputGroupAddon>
            </InputGroup>
          </>
        )}
        <Button
          variant="outline"
          size="sm"
          onClick={onAddNewRange}
          className="gap-2"
        >
          <Plus className="h-4 w-4" />
          New Range
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onDeleteRange}
          disabled={!selectedRange}
          className="gap-2"
        >
          <Trash2 className="h-4 w-4" />
          Delete Range
        </Button>
      </div>
    </div>
  );
}
