"use client";

import { useParams } from "next/navigation";
import { ImageEditItem } from "@/components/tasks/image-editing/image-editing-item";
import { useTaskItems } from "@/lib/queries/use-task-item";
import { ImageEditingTaskItem, Task, TextToImageTaskItem } from "@/lib/types";
import { LoadingErrorState } from "@/components/loading-error-state";
import { useRouter } from "next/navigation";
import { match } from "ts-pattern";
import { TextToImageItem } from "./text-to-image/text-to-image-item";
import { cn } from "@/lib/utils";

export function TaskItemsPage({ task }: { task?: Task }) {
  const router = useRouter();
  const params = useParams();
  const taskId = params.id as string;

  const { data: items, isLoading, error } = useTaskItems(taskId);

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
      <div
        className={cn(
          "grid gap-6",
          task.type === "text-to-image"
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
