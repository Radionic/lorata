import { TextToImageTaskItem } from "@/lib/types";

import { Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MediaUploadArea } from "@/components/tasks/media-upload-area";
import { getMediaUrl } from "@/lib/urls";
import {
  useDeleteTaskItem,
  useUpdateTaskItem,
} from "@/lib/queries/use-task-item";
import { InstructionInput } from "../instruction-input";

export function TextToImageItem({
  taskId,
  item,
}: {
  taskId: string;
  item: TextToImageTaskItem;
}) {
  const imageUrl = getMediaUrl({ taskId, filename: item.data.image });
  const { mutate: updateTaskItem } = useUpdateTaskItem();
  const { mutate: deleteTaskItem } = useDeleteTaskItem();

  const handleImageUploaded = async ({ file }: { file: File }) => {
    updateTaskItem({
      taskId,
      item: {
        ...item,
        data: {
          ...item.data,
          image: file.name,
        },
      },
    });
  };

  const handleImageRemoved = () => {
    updateTaskItem({
      taskId,
      item: {
        ...item,
        data: {
          ...item.data,
          image: undefined,
        },
      },
    });
  };

  const handleInstructionSettled = (instruction: string) => {
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
          <MediaUploadArea
            taskId={taskId}
            media={imageUrl}
            label="Image"
            type="image"
            onMediaUploaded={handleImageUploaded}
            onMediaRemoved={handleImageRemoved}
          />

          <InstructionInput
            key={item.data.instruction}
            taskId={taskId}
            itemId={item.id}
            title="Description"
            description="Describe the image..."
            defaultValue={item.data.instruction}
            onSettle={handleInstructionSettled}
          />
        </div>
      </CardContent>
    </Card>
  );
}
