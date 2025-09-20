"use client";

import { useState } from "react";
import { Plus, FileImage } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTasks } from "@/lib/queries/use-task";
import { CreateTaskDialog } from "@/components/tasks/dialog/create-task-dialog";
import { LoadingErrorState } from "@/components/loading-error-state";
import { useRouter } from "next/navigation";
import { TaskCard } from "@/components/tasks/task-card";

function PageHeader({ onCreateTask }: { onCreateTask: () => void }) {
  return (
    <div className="flex items-center justify-between mb-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Data Labelling Tasks
        </h1>
      </div>

      <Button onClick={onCreateTask}>
        <Plus className="mr-2 h-4 w-4" />
        Create Task
      </Button>
    </div>
  );
}

export default function Page() {
  const router = useRouter();
  const { data: tasks, isLoading, error } = useTasks();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleCreateTask = () => setIsDialogOpen(true);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4">
        <PageHeader onCreateTask={handleCreateTask} />

        <LoadingErrorState
          loadingMessage="Loading tasks..."
          errorTitle="Error loading tasks"
          onRetry={router.refresh}
          isLoading={isLoading}
          error={error}
        >
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {tasks?.map((task) => (
              <TaskCard key={task.id} task={task} />
            ))}
            {tasks?.length === 0 && (
              <div className="text-center py-12">
                <FileImage className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No tasks yet</h3>
                <Button onClick={handleCreateTask}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Task
                </Button>
              </div>
            )}
          </div>
        </LoadingErrorState>
      </div>

      <CreateTaskDialog open={isDialogOpen} onOpenChange={setIsDialogOpen} />
    </div>
  );
}
