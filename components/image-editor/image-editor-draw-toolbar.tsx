import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { RotateCcw, Undo, Redo } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { SketchPicker } from "react-color";
import { useState } from "react";

export interface ImageEditorDrawToolbarProps {
  brushSize: number;
  brushColor: string;
  canUndo?: boolean;
  canRedo?: boolean;
  onBrushSizeChange?: (size: number) => void;
  onBrushColorChange?: (color: string) => void;
  onUndo?: () => void;
  onRedo?: () => void;
  onClear?: () => void;
}

export function ImageEditorDrawToolbar({
  brushSize,
  brushColor,
  canUndo,
  canRedo,
  onBrushSizeChange,
  onBrushColorChange,
  onUndo,
  onRedo,
  onClear,
}: ImageEditorDrawToolbarProps) {
  const [showColorPicker, setShowColorPicker] = useState(false);

  return (
    <div className="flex items-center gap-2 px-4 py-3 border-b bg-background">
      <div className="flex items-center gap-2 ml-4">
        <label className="text-sm font-medium">Size:</label>
        <Slider
          value={[brushSize]}
          onValueChange={(value) => onBrushSizeChange?.(value[0])}
          max={300}
          min={10}
          step={10}
          className="w-20"
        />
        <span className="text-sm text-muted-foreground w-8">{brushSize}</span>
      </div>

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
              style={{ backgroundColor: brushColor }}
            />
            Color
          </Button>
        </PopoverTrigger>
        <PopoverContent className="border-0 shadow-none size-fit p-0 mt-2">
          <SketchPicker
            color={brushColor}
            onChange={(color) => onBrushColorChange?.(color.hex)}
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
    </div>
  );
}
