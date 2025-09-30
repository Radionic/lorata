"use client";

import { Trash2, Lock, Unlock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MediaUploadArea } from "@/components/tasks/media-upload-area";
import { ImageEditingTaskItem } from "@/lib/types";
import { getMediaUrl } from "@/lib/urls";
import {
  useDeleteTaskItem,
  useUpdateTaskItem,
  useSetItemLocked,
} from "@/lib/queries/use-task-item";
import { InstructionInput } from "../instruction-input";
import { cn } from "@/lib/utils";

export function ImageEditItem({
  item,
  taskId,
}: {
  item: ImageEditingTaskItem;
  taskId: string;
}) {
  const sourceImageUrl = getMediaUrl({
    taskId,
    filename: item.data.sourceImage,
  });
  const targetImageUrl = getMediaUrl({
    taskId,
    filename: item.data.targetImage,
  });

  const { mutate: updateTaskItem } = useUpdateTaskItem();
  const { mutate: deleteTaskItem } = useDeleteTaskItem();
  const { mutate: setItemLocked } = useSetItemLocked();

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

  const handleToggleLock = () => {
    setItemLocked({
      taskId,
      itemId: item.id,
      locked: !item.locked,
    });
  };

  return (
    <Card
      className={cn(
        "p-4 relative",
        item.locked && "border-green-500/50 bg-green-500/5"
      )}
    >
      <div className="absolute top-2 right-2 flex gap-1">
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10",
            item.locked &&
              "text-green-500 bg-green-500/10 hover:text-green-600 hover:bg-green-600/10"
          )}
          onClick={handleToggleLock}
          title={item.locked ? "Unlock item" : "Lock item"}
        >
          {item.locked ? (
            <Lock className="h-4 w-4" />
          ) : (
            <Unlock className="h-4 w-4" />
          )}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
          onClick={handleDeleteTaskItem}
          disabled={item.locked}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
      <CardContent className="px-0 pb-0 pt-0">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <MediaUploadArea
              taskId={taskId}
              media={sourceImageUrl}
              label="Source Image"
              type="image"
              disabled={item.locked}
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
              disabled={item.locked}
              onMediaUploaded={({ file }) =>
                handleImageUploaded({ file, type: "target" })
              }
              onMediaRemoved={() => handleImageRemoved({ type: "target" })}
            />
          </div>

          <InstructionInput
            key={item.data.instruction}
            taskId={taskId}
            itemId={item.id}
            title="Editing Instruction"
            description="Describe the editing..."
            defaultValue={item.data.instruction}
            disabled={item.locked}
            onSettle={handleInstructionSettled}
          />
        </div>
      </CardContent>
    </Card>
  );
}
