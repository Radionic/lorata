import { ReactNode } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Prompt, PromptEditor } from "../prompt-editor";

type PromptDialogProps = {
  open: boolean;
  onOpenChange?: (open: boolean) => void;
  title: string;
  prompts: Prompt[];
  onPromptsChange: (prompts: Prompt[]) => void;
  selectedPromptId: string | null;
  onSelectedPromptChange: (id: string | null) => void;
  isSubmitting: boolean;
  submitLabel: string;
  submittingLabel: string;
  onSubmit: () => void | Promise<void>;
  children?: ReactNode;
};

export function PromptDialog({
  open,
  onOpenChange,
  title,
  prompts,
  onPromptsChange,
  selectedPromptId,
  onSelectedPromptChange,
  isSubmitting,
  submitLabel,
  submittingLabel,
  onSubmit,
  children,
}: PromptDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-2">
          <Label>Prompt</Label>
          <PromptEditor
            prompts={prompts}
            onPromptsChange={onPromptsChange}
            selectedId={selectedPromptId}
            onSelectedChange={(id) => onSelectedPromptChange(id)}
          />
        </div>

        {children}

        <DialogFooter>
          <Button type="submit" onClick={onSubmit} disabled={isSubmitting}>
            {isSubmitting ? submittingLabel : submitLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
