"use client";

import { useRef, useState } from "react";
import { Upload, Loader2, Clipboard, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useDeleteMedia, useUploadMedia } from "@/lib/queries/use-media";
import { useMediaLoader } from "@/lib/hooks/use-media-loader";
import { ImageEditor } from "../image-editor/image-editor";
import { VideoEditor } from "../video-editor/video-editor";
import { useCreateTaskItems } from "@/lib/queries/use-task-item";
import { useTask } from "@/lib/queries/use-task";

function formatDuration(seconds: number) {
  if (!seconds || !isFinite(seconds)) return "";
  const m = Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0");
  const s = Math.floor(seconds % 60)
    .toString()
    .padStart(2, "0");
  return `${m}:${s}`;
}

function MediaUploadPlaceholder({
  showLoading,
  onPasteImage,
  allowedType,
}: {
  showLoading?: boolean;
  onPasteImage: ({ file }: { file: File }) => void;
  allowedType?: "image" | "video";
}) {
  const handlePasteImage = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const clipboardItems = await navigator.clipboard.read();
    for (const clipboardItem of clipboardItems) {
      for (const mimeType of clipboardItem.types) {
        if (mimeType.startsWith("image/")) {
          const blob = await clipboardItem.getType(mimeType);
          const extension = mimeType.split("/")[1];
          const filename = `pasted-image-${Date.now()}.${extension}`;
          const file = new File([blob], filename, { type: mimeType });
          onPasteImage({ file });
          return;
        }
      }
    }
    toast.warning("Clipboard does not contain an image");
  };

  if (showLoading) {
    return (
      <>
        <Loader2 className="mx-auto h-6 w-6 text-muted-foreground mb-2 animate-spin" />
        <p className="text-sm text-muted-foreground mb-1">Uploading media...</p>
      </>
    );
  }

  return (
    <>
      <Upload className="mx-auto h-6 w-6 text-muted-foreground mb-2" />
      <p className="text-sm text-muted-foreground mb-1">
        Click to upload or drag and drop
      </p>
      <p className="text-xs text-muted-foreground">
        {allowedType === "image" ? "Images (jpg, png)" : "Videos (mp4, webm)"}
      </p>

      {allowedType !== "video" && (
        <div className="mt-3">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePasteImage}
            className="text-xs"
          >
            <Clipboard className="h-3 w-3 mr-1" />
            Paste Image
          </Button>
        </div>
      )}
    </>
  );
}

function MediaInfo({
  type,
  name,
  width,
  height,
  duration,
}: {
  type: "image" | "video";
  name: string;
  width?: number;
  height?: number;
  duration?: number;
}) {
  return (
    <div className="mt-2 space-y-1 text-center">
      <p className="text-xs text-muted-foreground font-medium">{name}</p>
      <p className="text-xs text-muted-foreground">
        {width} × {height} px{" "}
        {type === "video" && `(${formatDuration(duration || 0)})`}
      </p>
    </div>
  );
}

interface MediaUploadAreaProps {
  taskId: string;
  media?: string;
  label: string;
  type: "image" | "video";
  allowRemoveItem?: boolean;
  disableRemoveItem?: boolean;
  disabled?: boolean;
  onMediaUploaded?: ({
    file,
    overwrite,
  }: {
    file: File;
    overwrite?: boolean;
  }) => void;
  onMediaRemoved?: () => void;
  onItemRemoved?: () => void;
}

export function MediaUploadArea({
  taskId,
  media,
  label,
  type,
  allowRemoveItem,
  disableRemoveItem,
  disabled,
  onMediaUploaded,
  onMediaRemoved,
  onItemRemoved,
}: MediaUploadAreaProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const { imageEl, videoEl, mediaName, releaseMedia } = useMediaLoader(
    media,
    type
  );
  const [showEditor, setShowEditor] = useState(false);

  const { mutateAsync: uploadMedia, isLoading: isUploading } = useUploadMedia();
  const { mutateAsync: deleteMedia, isLoading: isDeleting } = useDeleteMedia();
  const { mutateAsync: createTaskItems } = useCreateTaskItems();
  const { data: task } = useTask(taskId);

  const _uploadMedia = async ({
    file,
    overwrite,
  }: {
    file?: File;
    overwrite?: boolean;
  }) => {
    if (!file) return;

    const uploaded = await uploadMedia({
      taskId,
      file,
      overwrite,
    });
    if (uploaded) {
      if (imageEl) {
        imageEl.src = imageEl.src + "?t=" + Date.now();
      }
      if (videoEl) {
        videoEl.src = videoEl.src + "?t=" + Date.now();
      }
      onMediaUploaded?.({ file, overwrite });
    }
  };

  const _removeMedia = async () => {
    if (!mediaName) return;
    releaseMedia();
    const deleted = await deleteMedia({ taskId, filename: mediaName });
    deleted && onMediaRemoved?.();
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    if (disabled) return;

    const file = Array.from(e.dataTransfer.files).find((file) =>
      type
        ? file.type.startsWith(type + "/")
        : file.type.startsWith("image/") || file.type.startsWith("video/")
    );
    if (!file) {
      toast.warning(`Please drop a ${type ?? "image or video"} file`);
      return;
    }
    await _uploadMedia({ file });
  };

  return (
    <div className="flex-1">
      <div className="flex items-center justify-between mb-1 min-h-6">
        <Label className="text-sm font-medium block">{label}</Label>
        {allowRemoveItem && (
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-muted-foreground hover:bg-background hover:text-destructive"
            onClick={() => {
              _removeMedia();
              onItemRemoved?.();
            }}
            disabled={disabled || disableRemoveItem}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        )}
      </div>

      <div
        className={`border-2 border-dashed border-muted-foreground/25 rounded-lg p-3 text-center transition-colors relative ${
          disabled
            ? "opacity-50 pointer-events-none"
            : "hover:border-muted-foreground/50 cursor-pointer"
        }`}
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        onClick={media ? undefined : () => fileInputRef.current?.click()}
      >
        {media ? (
          <div>
            {type === "image" && (
              <img
                src={imageEl?.src || media}
                className="max-w-full max-h-48 mx-auto rounded"
                onClick={() => media && setShowEditor(true)}
              />
            )}
            {type === "video" && (
              <video
                src={videoEl?.src || media}
                className="max-w-full max-h-48 mx-auto rounded"
                onClick={() => media && setShowEditor(true)}
              />
            )}
            <Button
              variant="destructive"
              size="icon"
              className="absolute top-2 right-2 h-6 w-6"
              onClick={_removeMedia}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Trash2 className="h-3 w-3" />
              )}
            </Button>
          </div>
        ) : (
          <MediaUploadPlaceholder
            onPasteImage={_uploadMedia}
            showLoading={isUploading}
            allowedType={type}
          />
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept={
            type === "image" ? "image/jpeg,image/png" : "video/mp4,video/webm"
          }
          className="hidden"
          disabled={isUploading}
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (file && type && !file.type.startsWith(type + "/")) {
              toast.warning(`Please select a ${type} file`);
              return;
            }
            await _uploadMedia({ file });
          }}
        />
      </div>

      {type === "image" && imageEl && mediaName && (
        <MediaInfo
          type="image"
          name={mediaName}
          width={imageEl?.width}
          height={imageEl?.height}
        />
      )}
      {type === "video" && videoEl && mediaName && (
        <MediaInfo
          type="video"
          name={mediaName}
          width={videoEl?.videoWidth}
          height={videoEl?.videoHeight}
          duration={videoEl?.duration}
        />
      )}

      {/* Image Editor */}
      {showEditor && type === "image" && imageEl && mediaName && (
        <div className="fixed inset-0 z-50 bg-background">
          <ImageEditor
            imageEl={imageEl}
            imageName={mediaName}
            onClose={() => setShowEditor(false)}
            onSave={async (newImage) => {
              await _uploadMedia({ file: newImage, overwrite: true });
              setShowEditor(false);
            }}
          />
        </div>
      )}

      {/* Video Editor */}
      {showEditor && type === "video" && videoEl && mediaName && (
        <div className="fixed inset-0 z-50 bg-background">
          <VideoEditor
            videoEl={videoEl}
            videoName={mediaName}
            taskId={taskId}
            onClose={() => setShowEditor(false)}
            onVideoTrimmed={async (outputPaths) => {
              if (!task) return;

              const itemsData = outputPaths.map((path) => {
                if (task.type === "text-to-video") {
                  return { video: path };
                } else if (task.type === "image-to-video") {
                  return { targetVideo: path };
                }
                return {};
              });

              await createTaskItems({ taskId, itemsData });

              toast.success(
                `Created ${outputPaths.length} task item${
                  outputPaths.length > 1 ? "s" : ""
                } with trimmed videos`
              );
            }}
          />
        </div>
      )}
    </div>
  );
}
