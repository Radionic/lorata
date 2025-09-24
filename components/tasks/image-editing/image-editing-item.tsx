"use client";

import { Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MediaUploadArea } from "@/components/media-upload-area";
import { ImageEditingTaskItem } from "@/lib/types";
import { getMediaUrl } from "@/lib/urls";
import {
  useDeleteTaskItem,
  useUpdateTaskItem,
} from "@/lib/queries/use-task-item";
import { InstructionInput } from "../instruction-input";
import { useState } from "react";

interface ImageEditItemProps {
  item: ImageEditingTaskItem;
  taskId: string;
}

export function ImageEditItem({ item, taskId }: ImageEditItemProps) {
  const sourceImageUrl = getMediaUrl({
    taskId,
    filename: item.data.sourceImage,
  });
  const targetImageUrl = getMediaUrl({
    taskId,
    filename: item.data.targetImage,
  });
  const [instruction, setInstruction] = useState(item.data.instruction);

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

  const handleInstructionSettled = (instruction: string) => {
    setInstruction(instruction);
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
                handleImageUploaded({ file, type: "source" })
              }
              onMediaRemoved={() => handleImageRemoved({ type: "source" })}
            />
            <MediaUploadArea
              taskId={taskId}
              media={targetImageUrl}
              label="Target Image"
              type="image"
              onMediaUploaded={({ file }) =>
                handleImageUploaded({ file, type: "target" })
              }
              onMediaRemoved={() => handleImageRemoved({ type: "target" })}
            />
          </div>

          <InstructionInput
            title="Edit Instruction"
            value={instruction}
            onChange={setInstruction}
            onSettle={handleInstructionSettled}
            images={[sourceImageUrl, targetImageUrl].filter(
              (url) => typeof url === "string"
            )}
          />
        </div>
      </CardContent>
    </Card>
  );
}
