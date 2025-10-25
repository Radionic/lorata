import { ToggleGroup } from "@/components/ui/toggle-group";
import { ToggleGroupItem } from "@/components/ui/toggle-group";
import { Brush, Copy, Crop, Pentagon, Save, X } from "lucide-react";
import { useRef } from "react";
import { ImageEditorDraw } from "./image-editor-draw";
import { Button } from "../ui/button";
import { toast } from "sonner";
import { ImageEditorCrop } from "./image-editor-crop";
import { ImageEditorPolygon } from "./image-editor-polygon";
import { useLocalStorage } from "usehooks-ts";
import { useHotkeys } from "react-hotkeys-hook";

export interface ImageEditorRef {
  getImageBlob: () => Promise<Blob | undefined | null>;
}

export function ImageEditor({
  imageEl,
  imageName,
  onClose,
  onSave,
}: {
  imageEl: HTMLImageElement;
  imageName: string;
  onClose?: () => void;
  onSave?: (newImage: File) => void;
}) {
  const [tool, setTool] = useLocalStorage<"draw" | "polygon" | "crop">(
    "image-editor-tool",
    "draw"
  );
  const editorRef = useRef<ImageEditorRef>(null);

  const handleSaveImage = async () => {
    const blob = await editorRef.current?.getImageBlob();
    if (!blob) return;

    const file = new File([blob], imageName, { type: "image/png" });
    onSave?.(file);
  };

  const handleCopyImage = async () => {
    const blob = await editorRef.current?.getImageBlob();
    if (!blob) return;

    await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
    toast.success("Copied to clipboard");
  };

  useHotkeys("esc", () => onClose?.());

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 px-4 py-3 border-b bg-background">
        <ToggleGroup
          className="w-72"
          type="single"
          variant="outline"
          size="sm"
          value={tool}
          onValueChange={(value) =>
            setTool(value as "draw" | "crop" | "polygon")
          }
        >
          <ToggleGroupItem value="draw" className="gap-2">
            <Brush className="h-4 w-4" />
            Draw
          </ToggleGroupItem>
          <ToggleGroupItem value="polygon" className="gap-2">
            <Pentagon className="h-4 w-4" />
            Polygon
          </ToggleGroupItem>
          <ToggleGroupItem value="crop" className="gap-2">
            <Crop className="h-4 w-4" />
            Crop
          </ToggleGroupItem>
        </ToggleGroup>

        <div className="ml-auto flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleSaveImage}
            className="gap-2 select-none"
          >
            <Save className="h-4 w-4" />
            {tool === "draw"
              ? "Save Drawing"
              : tool === "crop"
              ? "Crop Image"
              : "Save Polygon"}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleCopyImage}
            className="gap-2 select-none"
          >
            <Copy className="h-4 w-4" />
            Copy
          </Button>

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
        {tool === "draw" && (
          <ImageEditorDraw ref={editorRef} imageEl={imageEl} />
        )}

        {tool === "polygon" && (
          <ImageEditorPolygon ref={editorRef} imageEl={imageEl} />
        )}

        {tool === "crop" && (
          <ImageEditorCrop ref={editorRef} imageEl={imageEl} />
        )}
      </div>
    </div>
  );
}
