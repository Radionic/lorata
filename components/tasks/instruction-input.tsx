import { Label } from "react-konva";
import { Textarea } from "../ui/textarea";
import { Sparkles } from "lucide-react";
import { useState } from "react";
import { GenerateInstructionDialog } from "./dialog/generate-instruction-dialog";

export function InstructionInput({
  taskId,
  itemId,
  hasVideo,
  title,
  defaultValue,
  disableAI,
  onSettle,
}: {
  taskId: string;
  itemId: string;
  hasVideo?: boolean;
  title: string;
  defaultValue?: string;
  disableAI?: boolean;
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
            className="w-4 h-4 cursor-pointer"
            onClick={() => setAiDialogOpen(true)}
          />
        )}
      </div>

      <Textarea
        placeholder="Describe the image-to-video task..."
        value={instruction}
        onChange={(e) => setInstruction(e.target.value)}
        onBlur={(e) => onSettle?.(e.target.value)}
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
