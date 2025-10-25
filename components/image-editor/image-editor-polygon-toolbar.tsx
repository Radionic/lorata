import { Button } from "@/components/ui/button";
import { Undo, Redo, RotateCcw } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { SketchPicker } from "react-color";
import { useState } from "react";

export interface ImageEditorPolygonToolbarProps {
  fillColor: string;
  canUndo?: boolean;
  canRedo?: boolean;
  onFillColorChange?: (color: string) => void;
  onUndo?: () => void;
  onRedo?: () => void;
  onClear?: () => void;
}

export function ImageEditorPolygonToolbar({
  fillColor,
  canUndo,
  canRedo,
  onFillColorChange,
  onUndo,
  onRedo,
  onClear,
}: ImageEditorPolygonToolbarProps) {
  const [showColorPicker, setShowColorPicker] = useState(false);

  return (
    <div className="flex items-center gap-2 px-4 py-3 border-b bg-background">
      <Popover open={showColorPicker} onOpenChange={setShowColorPicker}>
        <PopoverTrigger>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowColorPicker(!showColorPicker)}
            className="gap-2 select-none"
          >
            <div
              className="w-4 h-4 rounded border border-gray-300"
              style={{ backgroundColor: fillColor }}
            />
            Fill Color
          </Button>
        </PopoverTrigger>
        <PopoverContent className="border-0 shadow-none size-fit p-0 mt-2">
          <SketchPicker
            color={fillColor}
            onChange={(color) => onFillColorChange?.(color.hex)}
            presetColors={[
              "#000000",
              "#ffffff",
              "#ff0000",
              "#00ff00",
              "#0000ff",
              "#ffff00",
              "#ff00ff",
              "#00ffff",
            ]}
            disableAlpha
          />
        </PopoverContent>
      </Popover>

      <Button
        variant="outline"
        size="sm"
        onClick={onUndo}
        disabled={!canUndo}
        className="gap-2 select-none"
      >
        <Undo className="h-4 w-4" />
        Undo
      </Button>

      <Button
        variant="outline"
        size="sm"
        onClick={onRedo}
        disabled={!canRedo}
        className="gap-2 select-none"
      >
        <Redo className="h-4 w-4" />
        Redo
      </Button>

      <Button
        variant="outline"
        size="sm"
        onClick={onClear}
        className="gap-2 select-none"
      >
        <RotateCcw className="h-4 w-4" />
        Clear
      </Button>

      <div className="ml-4 text-sm text-muted-foreground">
        Click to add point • Right-click to delete polygon or point •
        Shift-click to add point to existing polygon • Press Tab to toggle point
        visibility
      </div>
    </div>
  );
}
