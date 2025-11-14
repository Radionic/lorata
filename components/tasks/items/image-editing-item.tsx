"use client";

import { Trash2, Lock, Unlock, Plus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MediaUploadArea } from "@/components/tasks/media-upload-area";
import { ImageEditingTaskItem } from "@/lib/types";
import { getMediaUrl } from "@/lib/urls";
import { useState } from "react";
import {
  useDeleteTaskItem,
  useUpdateTaskItem,
  useSetItemLocked,
} from "@/lib/queries/use-task-item";
import { InstructionInput } from "../instruction-input";
import { TaskItemTagEditor } from "@/components/tasks/tags/task-item-tag-editor";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";

export function ImageEditItem({
  item,
  taskId,
}: {
  item: ImageEditingTaskItem;
  taskId: string;
}) {
  const [extraSlots, setExtraSlots] = useState(
    item.data.sourceImages?.length ? 0 : 1
  );
  const sourceImages = item.data.sourceImages || [];
  const targetImageUrl = getMediaUrl({
    taskId,
    filename: item.data.targetImage,
  });

  const { mutate: updateTaskItem } = useUpdateTaskItem();
  const { mutate: deleteTaskItem } = useDeleteTaskItem();
  const { mutate: setItemLocked } = useSetItemLocked();

  const handleSourceImageUploaded = ({
    file,
    overwrite,
  }: {
    file: File;
    overwrite?: boolean;
  }) => {
    // If this upload is the result of an in-place edit (overwrite),
    // do not append a new source image entry.
    if (overwrite) return;

    setExtraSlots((s) => Math.max(0, s - 1));
    updateTaskItem({
      taskId,
      item: {
        ...item,
        data: {
          ...item.data,
          sourceImages: [...sourceImages, file.name],
        },
      },
    });
  };

  const handleSourceImageRemoved = (imageName: string) => {
    updateTaskItem({
      taskId,
      item: {
        ...item,
        data: {
          ...item.data,
          sourceImages: sourceImages.filter((image) => image !== imageName),
        },
      },
    });
  };

  const handleTargetImageUploaded = (file: File) => {
    updateTaskItem({
      taskId,
      item: {
        ...item,
        data: {
          ...item.data,
          targetImage: file.name,
        },
      },
    });
  };

  const handleTargetImageRemoved = () => {
    updateTaskItem({
      taskId,
      item: {
        ...item,
        data: {
          ...item.data,
          targetImage: null,
        },
      },
    });
  };

  const addSourceImageSlot = () => {
    setExtraSlots((s) => s + 1);
  };

  const handleEmptySlotRemoved = () => {
    setExtraSlots((s) => Math.max(0, s - 1));
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

  const allowRemoveItem = sourceImages.length + extraSlots > 1;

  return (
    <Card
      className={cn(
        "p-4 relative",
        item.locked && "border-green-500/50 bg-green-500/5"
      )}
    >
      <div className="absolute top-2 right-2 flex gap-1 items-center">
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 text-muted-foreground"
          onClick={addSourceImageSlot}
          disabled={item.locked}
        >
          <Plus className="h-4 w-4" />
        </Button>

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
      <CardContent className="px-0 pb-0 pt-0 space-y-4">
        <div className="space-y-2">
          <Label>Source Images</Label>
          <div className="grid grid-cols-2 gap-4 mt-4">
            {sourceImages.map((sourceImage, index) => (
              <MediaUploadArea
                taskId={taskId}
                media={getMediaUrl({ taskId, filename: sourceImage })}
                label={`Source Image ${index + 1}`}
                type="image"
                disabled={item.locked}
                onMediaUploaded={handleSourceImageUploaded}
                onMediaRemoved={() => handleSourceImageRemoved(sourceImage)}
                allowRemoveItem={allowRemoveItem}
              />
            ))}
            {/* Extra empty slots added by the "+ Add Image" button */}
            {extraSlots > 0 &&
              Array.from({ length: extraSlots }).map((_, idx) => (
                <MediaUploadArea
                  key={`extra-${idx}`}
                  taskId={taskId}
                  media={undefined}
                  label={`Source Image ${sourceImages.length + idx + 1}`}
                  type="image"
                  disabled={item.locked}
                  onMediaUploaded={handleSourceImageUploaded}
                  onItemRemoved={handleEmptySlotRemoved}
                  allowRemoveItem={allowRemoveItem}
                />
              ))}
          </div>
        </div>

        <MediaUploadArea
          taskId={taskId}
          media={targetImageUrl}
          label="Target Image"
          type="image"
          disabled={item.locked}
          onMediaUploaded={({ file }) => handleTargetImageUploaded(file)}
          onMediaRemoved={handleTargetImageRemoved}
        />

        <InstructionInput
          key={item.data.instruction}
          taskId={taskId}
          itemId={item.id}
          taskType="image-editing"
          title="Editing Instruction"
          description="Describe the editing..."
          defaultValue={item.data.instruction || undefined}
          disabled={item.locked}
          onSettle={handleInstructionSettled}
        />

        <TaskItemTagEditor
          taskId={taskId}
          itemId={item.id}
          disabled={item.locked}
        />
      </CardContent>
    </Card>
  );
}
