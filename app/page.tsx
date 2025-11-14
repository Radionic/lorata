"use client";

import { useState } from "react";
import { Plus, FileImage, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTasks } from "@/lib/queries/use-task";
import { CreateTaskDialog } from "@/components/tasks/dialogs/create-task-dialog";
import { LoadingErrorState } from "@/components/loading-error-state";
import { useRouter } from "next/navigation";
import { TaskCard } from "@/components/tasks/task-card";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { TaskTagFilter } from "@/components/tasks/tags/task-tag-filter";

function PageHeader({
  onCreateTask,
  selectedTags,
  onTagsChange,
}: {
  onCreateTask: () => void;
  selectedTags: string[];
  onTagsChange: (tags: string[]) => void;
}) {
  return (
    <div className="flex items-center justify-between mb-8 gap-4">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">
          Data Labelling Tasks
        </h1>
      </div>

      <div className="flex items-center gap-2">
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="gap-2 relative">
              <Filter className="h-4 w-4" />
              Filter
              {selectedTags.length > 0 && (
                <span className="ml-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                  {selectedTags.length}
                </span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="p-0 w-[400px]">
            <TaskTagFilter
              selectedTags={selectedTags}
              onTagsChange={onTagsChange}
            />
          </PopoverContent>
        </Popover>

        <Button onClick={onCreateTask}>
          <Plus className="mr-2 h-4 w-4" />
          Create Task
        </Button>
      </div>
    </div>
  );
}

export default function Page() {
  const router = useRouter();
  const [selectedTaskTags, setSelectedTaskTags] = useState<string[]>([]);
  const { data: tasks, isLoading, error } = useTasks(selectedTaskTags);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleCreateTask = () => setIsDialogOpen(true);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4">
        <PageHeader
          onCreateTask={handleCreateTask}
          selectedTags={selectedTaskTags}
          onTagsChange={setSelectedTaskTags}
        />

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
          </div>
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
        </LoadingErrorState>
      </div>

      <CreateTaskDialog open={isDialogOpen} onOpenChange={setIsDialogOpen} />
    </div>
  );
}
