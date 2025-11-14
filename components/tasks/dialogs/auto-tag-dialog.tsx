import { useLocalStorage } from "usehooks-ts";
import { useAutoTagging } from "@/lib/queries/use-ai";
import { Label } from "@/components/ui/label";
import { MediaSelection } from "@/app/api/ai/route";
import { Switch } from "@/components/ui/switch";
import { Prompt } from "../prompt-editor";
import { toast } from "sonner";
import { PromptDialog } from "./prompt-dialog";
import { MediaSelectionSection } from "./media-selection-section";

export function AutoTagDialog({
  taskId,
  taskType,
  open,
  onOpenChange,
}: {
  taskId: string;
  taskType?: string;
  open: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const [prompts, setPrompts] = useLocalStorage<Prompt[]>("auto-tag-prompts", [
    {
      id: "default-tagging",
      name: "Default Tagging",
      content:
        "Analyze this image and provide relevant tags as a comma-separated list. Only choose from the following tags: 'cat', 'dog', 'human'",
    },
  ]);
  const [selectedPromptId, setSelectedPromptId] = useLocalStorage<
    string | null
  >("auto-tag-selected-prompt-id", null);

  const [mediaSelection, setMediaSelection] = useLocalStorage<MediaSelection>(
    "auto-tag-media-selection",
    {
      // For image-editing tasks
      sourceImage1: true,
      sourceImage2: true,
      sourceImage3: true,
      targetImage: true,
      // For image-to-video tasks
      sourceImage: true,
      targetVideo: false,
    }
  );

  const [overwrite, setOverwrite] = useLocalStorage<boolean>(
    "auto-tag-overwrite",
    false
  );

  const { mutateAsync: autoTag, isLoading } = useAutoTagging();

  const onSubmit = async () => {
    const prompt = prompts.find((p) => p.id === selectedPromptId)?.content;
    if (!prompt) {
      toast.error("Please select a prompt");
      return;
    }

    await autoTag({
      taskId,
      prompt,
      overwrite,
      mediaSelection,
    });

    onOpenChange?.(false);
  };

  return (
    <PromptDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Auto Tag Images"
      prompts={prompts}
      onPromptsChange={setPrompts}
      selectedPromptId={selectedPromptId}
      onSelectedPromptChange={setSelectedPromptId}
      isSubmitting={isLoading}
      submitLabel="Start Tagging"
      submittingLabel="Tagging..."
      onSubmit={onSubmit}
    >
      {(taskType === "image-editing" || taskType === "image-to-video") && (
        <MediaSelectionSection
          taskType={taskType}
          mediaSelection={mediaSelection}
          onMediaSelectionChange={setMediaSelection}
        />
      )}

      <div className="flex items-center gap-2">
        <Switch checked={overwrite} onCheckedChange={setOverwrite} />
        <Label>Overwrite existing tags</Label>
      </div>
    </PromptDialog>
  );
}
