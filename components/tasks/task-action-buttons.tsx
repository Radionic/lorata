"use client";
import { useState } from "react";
import { Download, Plus, Sparkles, Upload } from "lucide-react";
import { Button } from "../ui/button";
import { useCreateTaskItems } from "@/lib/queries/use-task-item";
import { Task } from "@/lib/types";
import { GenerateInstructionDialog } from "@/components/tasks/dialogs/generate-instruction-dialog";
import { ExportTaskDialog } from "@/components/tasks/dialogs/export-task-dialog";
import { ImportMediaDialog } from "@/components/tasks/dialogs/import-media-dialog";

export function TaskActionButtons({ task }: { task: Task }) {
  const { mutate: createTaskItems } = useCreateTaskItems();

  const isVideoTask =
    task?.type === "text-to-video" || task?.type === "image-to-video";

  const [exportDialogOpen, setExportDialogOpen] = useState<boolean>(false);
  const [generateDialogOpen, setGenerateDialogOpen] = useState<boolean>(false);
  const [importDialogOpen, setImportDialogOpen] = useState<boolean>(false);

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
        onClick={() => setImportDialogOpen(true)}
        className="gap-2"
      >
        <Upload className="h-4 w-4" />
        Import
      </Button>

      <Button
        variant="outline"
        onClick={() => setExportDialogOpen(true)}
        className="gap-2"
      >
        <Download className="h-4 w-4" />
        Export
      </Button>

      <Button
        onClick={() => createTaskItems({ taskId: task.id })}
        className="gap-2"
      >
        <Plus className="h-4 w-4" />
        Add Item
      </Button>

      {exportDialogOpen && (
        <ExportTaskDialog
          task={task}
          isVideoTask={isVideoTask}
          open={exportDialogOpen}
          onOpenChange={setExportDialogOpen}
        />
      )}

      {generateDialogOpen && (
        <GenerateInstructionDialog
          taskId={task.id}
          taskType={task.type}
          hasVideo={isVideoTask}
          open={generateDialogOpen}
          onOpenChange={setGenerateDialogOpen}
        />
      )}

      {importDialogOpen && (
        <ImportMediaDialog
          taskId={task.id}
          open={importDialogOpen}
          onOpenChange={setImportDialogOpen}
        />
      )}
    </div>
  );
}
