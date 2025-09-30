import { Label } from "react-konva";
import { Textarea } from "../ui/textarea";
import { Sparkles } from "lucide-react";
import { useState } from "react";
import { GenerateInstructionDialog } from "./dialogs/generate-instruction-dialog";
import { cn } from "@/lib/utils";

export function InstructionInput({
  taskId,
  itemId,
  hasVideo,
  title,
  description,
  defaultValue,
  disableAI,
  disabled,
  onSettle,
}: {
  taskId: string;
  itemId: string;
  hasVideo?: boolean;
  title: string;
  description: string;
  defaultValue?: string;
  disableAI?: boolean;
  disabled?: boolean;
  onSettle?: (value: string) => void;
}) {
  const [aiDialogOpen, setAiDialogOpen] = useState(false);
  const [instruction, setInstruction] = useState(defaultValue);

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <Label className="text-sm font-medium">{title}</Label>
        {!disableAI && (
          <Sparkles
            className={cn(
              "w-4 h-4",
              disabled ? "opacity-50 pointer-events-none" : "cursor-pointer"
            )}
            onClick={() => setAiDialogOpen(true)}
          />
        )}
      </div>

      <Textarea
        placeholder={description}
        value={instruction}
        onChange={(e) => setInstruction(e.target.value)}
        onBlur={(e) => onSettle?.(e.target.value)}
        disabled={disabled}
        className="w-full field-sizing-content resize-none min-h-0"
      />

      {aiDialogOpen && (
        <GenerateInstructionDialog
          taskId={taskId}
          itemId={itemId}
          hasVideo={hasVideo}
          open={aiDialogOpen}
          onOpenChange={setAiDialogOpen}
        />
      )}
    </div>
  );
}
