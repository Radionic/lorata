import { Button } from "@/components/ui/button";

export interface ImageEditorCropToolbarProps {
  onAspectRatioChange?: (aspectRatio?: number) => void;
  selectedAspectRatio?: number | undefined;
  cropSize?: { width: number; height: number };
}

const ASPECT_RATIOS = [
  { label: "Free", value: undefined },
  { label: "1:1", value: 1 },
  { label: "4:3", value: 4 / 3 },
  { label: "3:2", value: 3 / 2 },
  { label: "16:9", value: 16 / 9 },
  { label: "3:4", value: 3 / 4 },
  { label: "2:3", value: 2 / 3 },
  { label: "9:16", value: 9 / 16 },
];

export function ImageEditorCropToolbar({
  onAspectRatioChange,
  selectedAspectRatio,
  cropSize,
}: ImageEditorCropToolbarProps) {
  return (
    <div className="flex items-center gap-2 px-4 py-3 border-b bg-background">
      <div className="flex gap-2">
        {ASPECT_RATIOS.map((ratio) => {
          const aspectValue = ratio.value || 1;
          const baseSize = 20;
          const width = aspectValue >= 1 ? baseSize : baseSize * aspectValue;
          const height = aspectValue >= 1 ? baseSize / aspectValue : baseSize;

          return (
            <Button
              key={ratio.label}
              variant={
                selectedAspectRatio === ratio.value ? "default" : "outline"
              }
              size="sm"
              onClick={() => onAspectRatioChange?.(ratio.value)}
              className="flex flex-col items-center gap-1 size-12 aspect-square"
            >
              <div
                className={`border-2 flex items-center justify-center rounded-xs font-medium ${
                  selectedAspectRatio === ratio.value
                    ? "border-primary-foreground text-primary-foreground"
                    : "border-current"
                }`}
                style={{
                  width: `${width}px`,
                  height: `${height}px`,
                }}
              />
              <span className="text-[10px]">{ratio.label}</span>
            </Button>
          );
        })}
      </div>

      <div className="flex-1" />

      {cropSize && (
        <div className="text-muted-foreground">
          Crop size: {cropSize.width} × {cropSize.height} px
        </div>
      )}
    </div>
  );
}
