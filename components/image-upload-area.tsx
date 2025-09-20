"use client";

import { useRef, useState } from "react";
import { Upload, X, Loader2, Clipboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useDeleteImage, useUploadImage } from "@/lib/queries/use-image";
import { ImageSize, useImageLoader } from "@/lib/hooks/use-image-loader";
import { ImageEditor } from "./image-editor/image-editor";

function ImageUploadPlaceholder({
  showLoading,
  onPasteImage,
}: {
  showLoading?: boolean;
  onPasteImage: ({ file }: { file: File }) => void;
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
    toast.warning("Not an image");
  };

  if (showLoading) {
    return (
      <>
        <Loader2 className="mx-auto h-6 w-6 text-muted-foreground mb-2 animate-spin" />
        <p className="text-sm text-muted-foreground mb-1">Uploading image...</p>
      </>
    );
  }

  return (
    <>
      <Upload className="mx-auto h-6 w-6 text-muted-foreground mb-2" />
      <p className="text-sm text-muted-foreground mb-1">
        Click to upload or drag and drop
      </p>
      <p className="text-xs text-muted-foreground">PNG, JPG</p>

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
    </>
  );
}

function ImageInfo({
  image,
  imageSize,
}: {
  image: string | File | null;
  imageSize?: ImageSize;
}) {
  return (
    <div className="mt-2 space-y-1 text-center">
      <p className="text-xs text-muted-foreground font-medium">
        {typeof image === "string"
          ? image.split("/").pop() || "image"
          : image?.name}
      </p>
      {imageSize && (
        <p className="text-xs text-muted-foreground">
          {imageSize.width} × {imageSize.height} px
        </p>
      )}
    </div>
  );
}

interface ImageUploadAreaProps {
  taskId: string;
  image?: string | File;
  label: string;
  onImageUploaded?: ({
    file,
    overwriteImage,
  }: {
    file: File;
    overwriteImage?: boolean;
  }) => void;
  onImageRemoved?: () => void;
}

export function ImageUploadArea({
  taskId,
  image,
  label,
  onImageUploaded,
  onImageRemoved,
}: ImageUploadAreaProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const { imageEl, imageSize } = useImageLoader(image);
  const [showEditor, setShowEditor] = useState(false);

  const { mutateAsync: uploadImage, isLoading: isUploading } = useUploadImage();
  const { mutateAsync: deleteImage, isLoading: isDeleting } = useDeleteImage();

  const _uploadImage = async ({
    file,
    overwriteImage,
  }: {
    file?: File;
    overwriteImage?: boolean;
  }) => {
    if (!file) return;

    const uploaded = await uploadImage({
      taskId,
      file,
      overwriteImage,
    });
    if (uploaded) {
      if (imageEl) {
        // Force image element to reload by updating the src
        imageEl.src = imageEl.src + "?t=" + Date.now();
      }
      onImageUploaded?.({ file, overwriteImage });
    }
  };

  const _removeImage = async () => {
    if (typeof image === "string") {
      const imageName = image.split("/").pop();
      if (!imageName) return;
      const deleted = await deleteImage({ taskId, filename: imageName });
      deleted && onImageRemoved?.();
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    const file = Array.from(e.dataTransfer.files).find((file) =>
      file.type.startsWith("image/")
    );
    await _uploadImage({ file });
  };

  return (
    <div className="flex-1">
      <Label className="text-sm font-medium mb-2 block">{label}</Label>
      <div
        className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-3 text-center hover:border-muted-foreground/50 transition-colors cursor-pointer relative"
        onDrop={handleDrop}
        onClick={image ? undefined : () => fileInputRef.current?.click()}
      >
        {image ? (
          <div>
            <img
              src={imageEl?.src}
              className="max-w-full max-h-48 mx-auto rounded"
              onClick={() => image && setShowEditor(true)}
            />
            <Button
              variant="destructive"
              size="icon"
              className="absolute top-2 right-2 h-6 w-6"
              onClick={_removeImage}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <X className="h-3 w-3" />
              )}
            </Button>
          </div>
        ) : (
          <ImageUploadPlaceholder
            onPasteImage={_uploadImage}
            showLoading={isUploading}
          />
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          disabled={isUploading}
          onChange={async (e) => {
            const file = e.target.files?.[0];
            await _uploadImage({ file });
          }}
        />
      </div>

      {image && <ImageInfo image={image} imageSize={imageSize} />}

      {/* Image Editor */}
      {showEditor && image && (
        <div className="fixed inset-0 z-50 bg-background">
          <ImageEditor
            image={image}
            onClose={() => setShowEditor(false)}
            onSave={async (newImage) => {
              await _uploadImage({ file: newImage, overwriteImage: true });
              setShowEditor(false);
            }}
          />
        </div>
      )}
    </div>
  );
}
