import { ToggleGroup } from "@/components/ui/toggle-group";
import { ToggleGroupItem } from "@/components/ui/toggle-group";
import { Brush, Copy, Crop, Save, X } from "lucide-react";
import { useRef } from "react";
import { ImageEditorDraw, ImageEditorDrawRef } from "./image-editor-draw";
import { Button } from "../ui/button";
import { toast } from "sonner";
import { ImageEditorCrop, ImageEditorCropRef } from "./image-editor-crop";
import { useLocalStorage } from "usehooks-ts";

export function ImageEditor({
  image,
  onClose,
  onSave,
}: {
  image: File | string;
  onClose?: () => void;
  onSave?: (newImage: File) => void;
}) {
  const [tool, setTool] = useLocalStorage<"draw" | "crop">(
    "image-editor-tool",
    "draw"
  );
  const editorRef = useRef<ImageEditorDrawRef | ImageEditorCropRef>(null);

  const handleSaveImage = async () => {
    const blob = await editorRef.current?.getImageBlob();
    if (!blob) return;

    const filename =
      typeof image === "string"
        ? image.split("/").pop() || `edited-image-${Date.now()}.png`
        : image.name;
    const file = new File([blob], filename, { type: "image/png" });
    onSave?.(file);
  };

  const handleCopyImage = async () => {
    const blob = await editorRef.current?.getImageBlob();
    if (!blob) return;

    await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
    toast.success("Copied to clipboard");
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 px-4 py-3 border-b bg-background">
        <ToggleGroup
          type="single"
          variant="outline"
          size="sm"
          value={tool}
          onValueChange={(value) => setTool(value as "draw" | "crop")}
        >
          <ToggleGroupItem value="draw" className="gap-2">
            <Brush className="h-4 w-4" />
            Draw
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
            {tool === "draw" ? "Save Drawing" : "Crop Image"}
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
        {tool === "draw" && <ImageEditorDraw ref={editorRef} image={image} />}

        {tool === "crop" && <ImageEditorCrop ref={editorRef} image={image} />}
      </div>
    </div>
  );
}
