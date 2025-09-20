"use client";

import { Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ImageUploadArea } from "@/components/image-upload-area";
import { ImageEditingTaskItem } from "@/lib/types";
import { getImageUrl } from "@/lib/urls";
import {
  useDeleteTaskItem,
  useUpdateTaskItem,
} from "@/lib/queries/use-task-item";
import { Textarea } from "@/components/ui/textarea";

interface ImageEditItemProps {
  item: ImageEditingTaskItem;
  taskId: string;
}

export function ImageEditItem({ item, taskId }: ImageEditItemProps) {
  const sourceImageUrl = getImageUrl({
    taskId,
    filename: item.data.sourceImage,
  });
  const targetImageUrl = getImageUrl({
    taskId,
    filename: item.data.targetImage,
  });
  const { mutate: updateTaskItem } = useUpdateTaskItem();
  const { mutate: deleteTaskItem } = useDeleteTaskItem();

  const handleImageUploaded = async ({
    type,
    file,
  }: {
    type: "source" | "target";
    file: File;
  }) => {
    const image = type === "source" ? "sourceImage" : "targetImage";
    updateTaskItem({
      taskId,
      item: {
        ...item,
        data: {
          ...item.data,
          [image]: file.name,
        },
      },
    });
  };

  const handleImageRemoved = ({ type }: { type: "source" | "target" }) => {
    const image = type === "source" ? "sourceImage" : "targetImage";
    updateTaskItem({
      taskId,
      item: {
        ...item,
        data: {
          ...item.data,
          [image]: null,
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
            <ImageUploadArea
              taskId={taskId}
              image={sourceImageUrl}
              label="Source Image"
              onImageUploaded={({ file }) =>
                handleImageUploaded({ file, type: "source" })
              }
              onImageRemoved={() => handleImageRemoved({ type: "source" })}
            />
            <ImageUploadArea
              taskId={taskId}
              image={targetImageUrl}
              label="Target Image"
              onImageUploaded={({ file }) =>
                handleImageUploaded({ file, type: "target" })
              }
              onImageRemoved={() => handleImageRemoved({ type: "target" })}
            />
          </div>

          <div>
            <Label
              htmlFor={`instruction-${item.id}`}
              className="text-sm font-medium mb-2 block"
            >
              Edit Instruction
            </Label>
            <Textarea
              id={`instruction-${item.id}`}
              placeholder="Describe the editing task..."
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
