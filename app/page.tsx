"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, FileImage } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { useTasks } from "@/lib/queries/use-task";
import { CreateTaskDialog } from "@/components/create-task-dialog";
import { LoadingErrorState } from "@/components/loading-error-state";
import { useRouter } from "next/navigation";
import { Task } from "@/lib/types";

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

function TaskCard({ task }: { task: Task }) {
  return (
    <Link href={`/tasks/${task.id}`}>
      <Card className="hover:shadow-md transition-shadow cursor-pointer">
        <CardHeader>
          <div className="flex items-center gap-2">
            <FileImage className="h-5 w-5 text-blue-500" />
            <CardTitle className="text-lg">{task.name}</CardTitle>
          </div>
          <CardDescription>{task.type}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>{task.itemCount} items</span>
            <span>{new Date(task.createdAt).toLocaleDateString()}</span>
          </div>
        </CardContent>
      </Card>
    </Link>
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
