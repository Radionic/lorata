import { ImageToVideoTaskItem } from "@/lib/types";

import { Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { MediaUploadArea } from "@/components/media-upload-area";
import { getMediaUrl } from "@/lib/urls";
import {
  useDeleteTaskItem,
  useUpdateTaskItem,
} from "@/lib/queries/use-task-item";
import { Textarea } from "@/components/ui/textarea";

export function ImageToVideoItem({
  taskId,
  item,
}: {
  taskId: string;
  item: ImageToVideoTaskItem;
}) {
  const sourceImageUrl = getMediaUrl({
    taskId,
    filename: item.data.sourceImage,
  });
  const targetVideoUrl = getMediaUrl({
    taskId,
    filename: item.data.targetVideo,
  });
  const { mutate: updateTaskItem } = useUpdateTaskItem();
  const { mutate: deleteTaskItem } = useDeleteTaskItem();

  const handleUploaded = async ({
    side,
    file,
  }: {
    side: "source" | "target";
    file: File;
  }) => {
    const key = side === "source" ? "sourceImage" : "targetVideo";
    updateTaskItem({
      taskId,
      item: {
        ...item,
        data: {
          ...item.data,
          [key]: file.name,
        },
      },
    });
  };

  const handleRemoved = ({ side }: { side: "source" | "target" }) => {
    const key = side === "source" ? "sourceImage" : "targetVideo";
    updateTaskItem({
      taskId,
      item: {
        ...item,
        data: {
          ...item.data,
          [key]: null,
        },
      },
    });
  };

  const handleInstructionChanged = (instruction: string) => {
    updateTaskItem({
      taskId,
      item: {
        ...item,
        data: {
          ...item.data,
          instruction,
        },
      },
    });
  };

  const handleDeleteTaskItem = () => {
    deleteTaskItem({
      taskId,
      itemId: item.id,
    });
  };

  return (
    <Card className="p-4 relative">
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-2 right-2 h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
        onClick={handleDeleteTaskItem}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
      <CardContent className="px-0 pb-0 pt-0">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <MediaUploadArea
              taskId={taskId}
              media={sourceImageUrl}
              label="Source Image"
              type="image"
              onMediaUploaded={({ file }) =>
                handleUploaded({ file, side: "source" })
              }
              onMediaRemoved={() => handleRemoved({ side: "source" })}
            />
            <MediaUploadArea
              taskId={taskId}
              media={targetVideoUrl}
              label="Target Video"
              type="video"
              onMediaUploaded={({ file }) =>
                handleUploaded({ file, side: "target" })
              }
              onMediaRemoved={() => handleRemoved({ side: "target" })}
            />
          </div>

          <div>
            <Label
              htmlFor={`instruction-${item.id}`}
              className="text-sm font-medium mb-2 block"
            >
              Instruction
            </Label>
            <Textarea
              id={`instruction-${item.id}`}
              placeholder="Describe the image-to-video task..."
              defaultValue={item.data.instruction}
              onBlur={(e) => handleInstructionChanged(e.target.value)}
              className="w-full field-sizing-content resize-none min-h-0"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
