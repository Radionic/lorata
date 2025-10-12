"use client";

import { useParams } from "next/navigation";
import { ImageEditItem } from "@/components/tasks/items/image-editing-item";
import { useTaskItems } from "@/lib/queries/use-task-item";
import {
  ImageEditingTaskItem,
  Task,
  TextToImageTaskItem,
  TextToVideoTaskItem,
  ImageToVideoTaskItem,
} from "@/lib/types";
import { LoadingErrorState } from "@/components/loading-error-state";
import { useRouter } from "next/navigation";
import { match } from "ts-pattern";
import { TextToImageItem } from "./items/text-to-image-item";
import { TextToVideoItem } from "./items/text-to-video-item";
import { ImageToVideoItem } from "./items/image-to-video-item";
import { cn } from "@/lib/utils";
import { Info, X } from "lucide-react";
import { useLocalStorage } from "usehooks-ts";
import { Button } from "@/components/ui/button";

export function TaskItemsPage({ task }: { task?: Task }) {
  const router = useRouter();
  const params = useParams();
  const taskId = params.id as string;

  const { data: items, isLoading, error } = useTaskItems(taskId);
  const [showI2VExportBanner, setShowI2VExportBanner] = useLocalStorage(
    "show-i2v-export-banner",
    true
  );

  if (!task) {
    return null;
  }

  if (!isLoading && !items?.length) {
    return (
      <p className="text-center text-lg text-muted-foreground">
        No items found
      </p>
    );
  }

  return (
    <LoadingErrorState
      loadingMessage="Loading task items..."
      errorTitle="Error loading task items"
      onRetry={router.refresh}
      isLoading={isLoading}
      error={error}
    >
      {task.type === "image-to-video" && showI2VExportBanner && (
        <div className="mb-8 flex items-center gap-2 rounded-md bg-blue-500/10 border border-blue-500/20 px-3 py-2 text-sm text-blue-700">
          <Info className="h-4 w-4 mt-0.5 shrink-0" />
          <p className="flex-1">
            You can leave the source image blank to automatically use the first
            frame of the target video as the source image when exporting.
          </p>
          <Button
            variant="ghost"
            size="icon"
            className="h-5 w-5 -mt-0.5 -mr-1 hover:bg-blue-500/20 text-blue-700"
            onClick={() => setShowI2VExportBanner(true)}
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      )}
      <div
        className={cn(
          "grid gap-6",
          task.type === "text-to-image" || task.type === "text-to-video"
            ? "grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
            : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
        )}
      >
        {match(task.type)
          .with("text-to-image", () =>
            items?.map((item) => (
              <TextToImageItem
                key={item.id}
                taskId={taskId}
                item={item as TextToImageTaskItem}
              />
            ))
          )
          .with("text-to-video", () =>
            items?.map((item) => (
              <TextToVideoItem
                key={item.id}
                taskId={taskId}
                item={item as TextToVideoTaskItem}
              />
            ))
          )
          .with("image-to-video", () =>
            items?.map((item) => (
              <ImageToVideoItem
                key={item.id}
                taskId={taskId}
                item={item as ImageToVideoTaskItem}
              />
            ))
          )
          .with("image-editing", () =>
            items?.map((item) => (
              <ImageEditItem
                key={item.id}
                taskId={taskId}
                item={item as ImageEditingTaskItem}
              />
            ))
          )
          .exhaustive()}
      </div>
    </LoadingErrorState>
  );
}
