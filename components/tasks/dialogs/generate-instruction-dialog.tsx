import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useLocalStorage } from "usehooks-ts";
import { useAICaptioning } from "@/lib/queries/use-ai";
import { Label } from "@/components/ui/label";
import { VideoOptions } from "@/app/api/ai/route";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Prompt, PromptEditor } from "../prompt-editor";
import { toast } from "sonner";

export function GenerateInstructionDialog({
  taskId,
  itemId,
  hasVideo,
  open,
  onOpenChange,
  onInstructionGenerated,
}: {
  taskId: string;
  itemId?: string;
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

  const [overwriteInstruction, setOverwriteInstruction] =
    useLocalStorage<boolean>("generate-instruction-overwrite", false);

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
      overwriteInstruction: !itemId ? overwriteInstruction : undefined,
      videoOptions: hasVideo ? videoOptions : undefined,
    });

    onOpenChange?.(false);
    onInstructionGenerated?.();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Generate instruction</DialogTitle>
        </DialogHeader>

        <div className="space-y-2">
          <Label>Prompt</Label>
          <PromptEditor
            prompts={prompts}
            onPromptsChange={setPrompts}
            selectedId={selectedPromptId}
            onSelectedChange={(id) => setSelectedPromptId(id)}
          />
        </div>

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
                    interval: parseInt(e.target.value),
                  })
                }
              />{" "}
              seconds.
            </div>
          </div>
        )}

        {!itemId && (
          <div className="flex items-center gap-3">
            <Switch
              checked={overwriteInstruction}
              onCheckedChange={setOverwriteInstruction}
            />
            <Label>Overwrite existing instructions</Label>
          </div>
        )}

        <DialogFooter>
          <DialogFooter>
            <Button type="submit" onClick={onSubmit} disabled={isLoading}>
              {isLoading ? "Generating..." : "Generate"}
            </Button>
          </DialogFooter>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
