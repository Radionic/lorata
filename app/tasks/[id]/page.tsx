"use client";

import { useParams } from "next/navigation";
import { useTask } from "@/lib/queries/use-task";
import { TaskItemsPage } from "@/components/tasks/task-items-page";
import { TaskActionButtons } from "@/components/tasks/task-action-buttons";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

export default function TaskPage() {
  const params = useParams();
  const router = useRouter();
  const taskId = params.id as string;

  const { data: task } = useTask(taskId);

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

        <TaskActionButtons taskId={taskId} task={task} />
      </div>

      <TaskItemsPage task={task} />
    </div>
  );
}
