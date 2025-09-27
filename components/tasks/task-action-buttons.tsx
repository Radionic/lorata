"use client";
import { useState } from "react";
import { Download, Plus, Sparkles } from "lucide-react";
import { Button } from "../ui/button";
import { useCreateTaskItem } from "@/lib/queries/use-task-item";
import { Task } from "@/lib/types";
import { GenerateInstructionDialog } from "@/components/tasks/dialogs/generate-instruction-dialog";
import { ExportTaskDialog } from "@/components/tasks/dialogs/export-task-dialog";

export function TaskActionButtons({
  taskId,
  task,
}: {
  taskId: string;
  task?: Task | null;
}) {
  const { mutate: createTaskItem } = useCreateTaskItem();

  const isVideoTask =
    task?.type === "text-to-video" || task?.type === "image-to-video";

  const [exportDialogOpen, setExportDialogOpen] = useState<boolean>(false);
  const [generateDialogOpen, setGenerateDialogOpen] = useState<boolean>(false);

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        onClick={() => setGenerateDialogOpen(true)}
        className="gap-2"
      >
        <Sparkles className="h-4 w-4" />
        Generate Caption
      </Button>

      <Button
        variant="outline"
        onClick={() => setExportDialogOpen(true)}
        className="gap-2"
      >
        <Download className="h-4 w-4" />
        Export
      </Button>

      <Button onClick={() => createTaskItem({ taskId })} className="gap-2">
        <Plus className="h-4 w-4" />
        Add Item
      </Button>

      {exportDialogOpen && (
        <ExportTaskDialog
          taskId={taskId}
          isVideoTask={isVideoTask}
          open={exportDialogOpen}
          onOpenChange={setExportDialogOpen}
        />
      )}

      {generateDialogOpen && (
        <GenerateInstructionDialog
          taskId={taskId}
          hasVideo={isVideoTask}
          open={generateDialogOpen}
          onOpenChange={setGenerateDialogOpen}
        />
      )}
    </div>
  );
}
