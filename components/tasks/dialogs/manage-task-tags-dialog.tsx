"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Task } from "@/lib/types";
import { TaskTagEditor } from "@/components/tasks/tags/task-tag-editor";

interface ManageTaskTagsDialogProps {
  open: boolean;
  onOpenChange?: (open: boolean) => void;
  task: Task;
}

export function ManageTaskTagsDialog({
  open,
  onOpenChange,
  task,
}: ManageTaskTagsDialogProps) {
  if (!task) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent onOpenAutoFocus={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>Manage tags</DialogTitle>
        </DialogHeader>
        <TaskTagEditor taskId={task.id} />
      </DialogContent>
    </Dialog>
  );
}
