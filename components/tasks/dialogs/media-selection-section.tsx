import { MediaSelection } from "@/app/api/ai/route";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

export type MediaSelectionSectionProps = {
  taskType?: string;
  mediaSelection: MediaSelection;
  onMediaSelectionChange: (selection: MediaSelection) => void;
  showTargetVideo?: boolean;
};

export function MediaSelectionSection({
  taskType,
  mediaSelection,
  onMediaSelectionChange,
  showTargetVideo = false,
}: MediaSelectionSectionProps) {
  if (taskType !== "image-editing" && taskType !== "image-to-video") {
    return null;
  }

  return (
    <div className="space-y-2">
      <Label>Input Media</Label>
      <div className="space-y-2">
        {taskType === "image-editing" && (
          <div className="grid grid-cols-2 gap-2">
            <div className="flex items-center gap-2">
              <Switch
                checked={mediaSelection.sourceImage1}
                onCheckedChange={(checked) =>
                  onMediaSelectionChange({
                    ...mediaSelection,
                    sourceImage1: checked,
                  })
                }
              />
              <Label>Source Image 1</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={mediaSelection.sourceImage2}
                onCheckedChange={(checked) =>
                  onMediaSelectionChange({
                    ...mediaSelection,
                    sourceImage2: checked,
                  })
                }
              />
              <Label>Source Image 2</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={mediaSelection.sourceImage3}
                onCheckedChange={(checked) =>
                  onMediaSelectionChange({
                    ...mediaSelection,
                    sourceImage3: checked,
                  })
                }
              />
              <Label>Source Image 3</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={mediaSelection.targetImage}
                onCheckedChange={(checked) =>
                  onMediaSelectionChange({
                    ...mediaSelection,
                    targetImage: checked,
                  })
                }
              />
              <Label>Target Image</Label>
            </div>
          </div>
        )}

        {taskType === "image-to-video" && (
          <div className="grid grid-cols-2 gap-2">
            <div className="flex items-center gap-2">
              <Switch
                checked={mediaSelection.sourceImage}
                onCheckedChange={(checked) =>
                  onMediaSelectionChange({
                    ...mediaSelection,
                    sourceImage: checked,
                  })
                }
              />
              <Label>Source Image</Label>
            </div>
            {showTargetVideo && (
              <div className="flex items-center gap-2">
                <Switch
                  checked={mediaSelection.targetVideo}
                  onCheckedChange={(checked) =>
                    onMediaSelectionChange({
                      ...mediaSelection,
                      targetVideo: checked,
                    })
                  }
                />
                <Label>Target Video</Label>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
