"use client";
import { useState } from "react";
import { Download, Filter, Plus, Sparkles, Tag, Upload } from "lucide-react";
import { Button } from "../ui/button";
import { useCreateTaskItems } from "@/lib/queries/use-task-item";
import { Task } from "@/lib/types";
import { GenerateInstructionDialog } from "@/components/tasks/dialogs/generate-instruction-dialog";
import { ExportTaskDialog } from "@/components/tasks/dialogs/export-task-dialog";
import { ImportMediaDialog } from "@/components/tasks/dialogs/import-media-dialog";
import { AutoTagDialog } from "@/components/tasks/dialogs/auto-tag-dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { TaskItemTagFilter } from "@/components/tasks/tags/task-item-tag-filter";

export function TaskActionButtons({
  task,
  selectedTags = [],
  onTagsChange,
}: {
  task: Task;
  selectedTags?: string[];
  onTagsChange?: (tags: string[]) => void;
}) {
  const { mutate: createTaskItems } = useCreateTaskItems();

  const isVideoTask =
    task?.type === "text-to-video" || task?.type === "image-to-video";

  const [exportDialogOpen, setExportDialogOpen] = useState<boolean>(false);
  const [generateDialogOpen, setGenerateDialogOpen] = useState<boolean>(false);
  const [importDialogOpen, setImportDialogOpen] = useState<boolean>(false);
  const [autoTagDialogOpen, setAutoTagDialogOpen] = useState<boolean>(false);

  return (
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
        <PopoverContent align="start" className="p-0 w-[400px]">
          <TaskItemTagFilter
            taskId={task.id}
            selectedTags={selectedTags}
            onTagsChange={(tags) => onTagsChange?.(tags)}
          />
        </PopoverContent>
      </Popover>

      <Button
        variant="outline"
        onClick={() => setAutoTagDialogOpen(true)}
        className="gap-2"
      >
        <Tag className="h-4 w-4" />
        Auto Tag
      </Button>

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

      {autoTagDialogOpen && (
        <AutoTagDialog
          taskId={task.id}
          taskType={task.type}
          open={autoTagDialogOpen}
          onOpenChange={setAutoTagDialogOpen}
        />
      )}
    </div>
  );
}
