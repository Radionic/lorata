import { useLocalStorage } from "usehooks-ts";
import { useAICaptioning } from "@/lib/queries/use-ai";
import { Label } from "@/components/ui/label";
import { VideoOptions, MediaSelection } from "@/app/api/ai/route";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Prompt } from "../prompt-editor";
import { toast } from "sonner";
import { Help } from "@/components/help";
import { PromptDialog } from "./prompt-dialog";
import { MediaSelectionSection } from "./media-selection-section";

export function GenerateInstructionDialog({
  taskId,
  itemId,
  taskType,
  hasVideo,
  open,
  onOpenChange,
  onInstructionGenerated,
}: {
  taskId: string;
  itemId?: string;
  taskType?: string;
  hasVideo?: boolean;
  open: boolean;
  onOpenChange?: (open: boolean) => void;
  onInstructionGenerated?: () => void;
}) {
  const [prompts, setPrompts] = useLocalStorage<Prompt[]>(
    "generate-instruction-prompts",
    [
      {
        id: "image-captioning",
        name: "Image Captioning",
        content:
          "You are an image captioning expert, please describe this image in 1 sentence.",
      },
      {
        id: "image-editing",
        name: "Image Editing",
        content:
          "Please write a 'Edit instruction' to transform the first image to the second image in 1 sentence.",
      },
      {
        id: "video-captioning",
        name: "Video Captioning",
        content:
          "You are a video captioning expert, please describe this video in 1 sentence.",
      },
    ]
  );
  const [selectedPromptId, setSelectedPromptId] = useLocalStorage<
    string | null
  >("generate-instruction-selected-prompt-id", null);

  const [videoOptions, setVideoOptions] = useLocalStorage<VideoOptions>(
    "generate-instruction-video-options",
    {
      numFrames: 5,
      interval: 1,
    }
  );

  const [overwrite, setOverwrite] = useLocalStorage<boolean>(
    "generate-instruction-overwrite",
    false
  );

  const [mediaSelection, setMediaSelection] = useLocalStorage<MediaSelection>(
    "generate-instruction-media-selection",
    {
      // For image-editing tasks
      sourceImage1: true,
      sourceImage2: true,
      sourceImage3: true,
      targetImage: true,
      // For image-to-video tasks
      sourceImage: true,
      targetVideo: true,
    }
  );

  const { mutateAsync: generateInstruction, isLoading } = useAICaptioning();

  const onSubmit = async () => {
    const prompt = prompts.find((p) => p.id === selectedPromptId)?.content;
    if (!prompt) {
      toast.error("Please select a prompt");
      return;
    }

    await generateInstruction({
      taskId,
      prompt,
      itemId,
      overwrite: !itemId ? overwrite : undefined,
      videoOptions: hasVideo ? videoOptions : undefined,
      mediaSelection,
    });

    onOpenChange?.(false);
    onInstructionGenerated?.();
  };

  return (
    <PromptDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Generate instruction"
      prompts={prompts}
      onPromptsChange={setPrompts}
      selectedPromptId={selectedPromptId}
      onSelectedPromptChange={setSelectedPromptId}
      isSubmitting={isLoading}
      submitLabel="Generate"
      submittingLabel="Generating..."
      onSubmit={onSubmit}
    >
      {(taskType === "image-editing" || taskType === "image-to-video") && (
        <MediaSelectionSection
          taskType={taskType}
          mediaSelection={mediaSelection}
          onMediaSelectionChange={setMediaSelection}
          showTargetVideo
        />
      )}

      {hasVideo && (
        <div className="space-y-2">
          <Label>Video Options</Label>
          <div className="text-sm">
            Extract{" "}
            <Input
              type="number"
              className="w-14 h-8 inline mb-1"
              value={videoOptions.numFrames}
              onChange={(e) =>
                setVideoOptions({
                  ...videoOptions,
                  numFrames: parseInt(e.target.value),
                })
              }
            />{" "}
            video frames for video captioning. Extract every{" "}
            <Input
              type="number"
              className="w-14 h-8 inline"
              value={videoOptions.interval}
              onChange={(e) =>
                setVideoOptions({
                  ...videoOptions,
                  interval: parseFloat(e.target.value),
                })
              }
            />{" "}
            seconds.
          </div>
        </div>
      )}

      {!itemId && (
        <div className="flex items-center gap-2">
          <Switch checked={overwrite} onCheckedChange={setOverwrite} />
          <Label>Overwrite existing instructions</Label>
          <Help>This doesn't affect locked items</Help>
        </div>
      )}
    </PromptDialog>
  );
}
