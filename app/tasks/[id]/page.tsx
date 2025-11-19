"use client";

import { useParams, useSearchParams, useRouter } from "next/navigation";
import { useTask } from "@/lib/queries/use-task";
import { useTaskItems } from "@/lib/queries/use-task-item";
import { TaskItemsPage } from "@/components/tasks/task-items-page";
import { TaskActionButtons } from "@/components/tasks/task-action-buttons";
import { ArrowLeft } from "lucide-react";

export default function TaskPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const taskId = params.id as string;

  // Read pagination and filters from URL
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "30");
  const selectedTags = searchParams.get("tags")?.split(",");

  const { data: task } = useTask(taskId);
  const {
    data: taskItems,
    isLoading,
    error,
  } = useTaskItems(taskId, selectedTags, page, limit);

  const setPage = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", newPage.toString());
    params.set("limit", limit.toString());
    router.replace(`?${params.toString()}`, { scroll: false });
  };

  const handleTagsChange = (tags: string[]) => {
    const params = new URLSearchParams(searchParams.toString());
    if (tags.length > 0) {
      params.set("tags", tags.join(","));
    } else {
      params.delete("tags");
    }
    params.set("page", "1"); // Reset to page 1 when filters change
    params.set("limit", limit.toString());
    router.replace(`?${params.toString()}`, { scroll: false });
  };

  return (
    <div className="min-h-screen bg-background container mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-2">
          <ArrowLeft
            className="size-6 cursor-pointer"
            onClick={() => router.back()}
          />
          <h1 className="text-3xl font-bold">{task?.name}</h1>
        </div>

        {task && (
          <TaskActionButtons
            task={task}
            selectedTags={selectedTags}
            onTagsChange={handleTagsChange}
          />
        )}
      </div>

      {isLoading ? (
        <p className="text-center text-lg text-muted-foreground">
          Loading task items...
        </p>
      ) : error ? (
        <p className="text-center text-lg text-red-500">
          Error loading task items
        </p>
      ) : (
        <TaskItemsPage
          taskId={taskId}
          taskType={task?.type}
          taskItems={taskItems}
          page={page}
          setPage={setPage}
        />
      )}
    </div>
  );
}
