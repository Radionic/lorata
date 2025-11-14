import { TextToVideoTaskItem } from "@/lib/types";

import { Trash2, Lock, Unlock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MediaUploadArea } from "@/components/tasks/media-upload-area";
import { getMediaUrl } from "@/lib/urls";
import {
  useDeleteTaskItem,
  useUpdateTaskItem,
  useSetItemLocked,
} from "@/lib/queries/use-task-item";
import { InstructionInput } from "../instruction-input";
import { TaskItemTagEditor } from "@/components/tasks/tags/task-item-tag-editor";
import { cn } from "@/lib/utils";

export function TextToVideoItem({
  taskId,
  item,
}: {
  taskId: string;
  item: TextToVideoTaskItem;
}) {
  const videoUrl = getMediaUrl({ taskId, filename: item.data.video });
  const { mutate: updateTaskItem } = useUpdateTaskItem();
  const { mutate: deleteTaskItem } = useDeleteTaskItem();
  const { mutate: setItemLocked } = useSetItemLocked();

  const handleVideoUploaded = async ({ file }: { file: File }) => {
    updateTaskItem({
      taskId,
      item: {
        ...item,
        data: {
          ...item.data,
          video: file.name,
        },
      },
    });
  };

  const handleVideoRemoved = () => {
    updateTaskItem({
      taskId,
      item: {
        ...item,
        data: {
          ...item.data,
          video: null,
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
          <MediaUploadArea
            taskId={taskId}
            media={videoUrl}
            label="Video"
            type="video"
            disabled={item.locked}
            onMediaUploaded={handleVideoUploaded}
            onMediaRemoved={handleVideoRemoved}
          />

          <InstructionInput
            key={item.data.instruction}
            taskId={taskId}
            itemId={item.id}
            taskType="text-to-video"
            title="Description"
            description="Describe the video..."
            defaultValue={item.data.instruction || undefined}
            disabled={item.locked}
            onSettle={handleInstructionSettled}
            hasVideo
          />

          <TaskItemTagEditor
            taskId={taskId}
            itemId={item.id}
            disabled={item.locked}
          />
        </div>
      </CardContent>
    </Card>
  );
}
