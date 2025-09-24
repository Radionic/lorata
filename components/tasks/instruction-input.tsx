import { Label } from "react-konva";
import { Textarea } from "../ui/textarea";
import { Sparkles } from "lucide-react";
import { useState } from "react";
import { GenerateInstructionDialog } from "./dialog/generate-instruction-dialog";

export function InstructionInput({
  images,
  title,
  value,
  disableAI,
  onChange,
  onSettle,
}: {
  images?: string[];
  title: string;
  value?: string;
  disableAI?: boolean;
  onChange?: (value: string) => void;
  onSettle?: (value: string) => void;
}) {
  const [aiDialogOpen, setAiDialogOpen] = useState(false);

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
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        onBlur={(e) => onSettle?.(e.target.value)}
        className="w-full field-sizing-content resize-none min-h-0"
      />

      {aiDialogOpen && (
        <GenerateInstructionDialog
          images={images}
          open={aiDialogOpen}
          onOpenChange={setAiDialogOpen}
          onInstructionGenerated={onSettle}
        />
      )}
    </div>
  );
}
