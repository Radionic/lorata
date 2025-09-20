"use client";

import "react-image-crop/dist/ReactCrop.css";
import { forwardRef, useImperativeHandle, useState, useMemo } from "react";
import ReactCrop, { PixelCrop } from "react-image-crop";
import { ImageEditorCropToolbar } from "./image-editor-crop-toolbar";
import { useLocalStorage } from "usehooks-ts";
import { useContainerViewport } from "@/lib/hooks/use-container-viewport";
import { computeFitScale } from "@/lib/fit";

export interface ImageEditorCropRef {
  getImageBlob: () => Promise<Blob | undefined | null>;
}

export const ImageEditorCrop = forwardRef<
  ImageEditorCropRef,
  {
    imageEl: HTMLImageElement;
  }
>(function ({ imageEl }, ref) {
  const [aspectRatio, setAspectRatio] = useLocalStorage<number | undefined>(
    "image-editor-crop-aspect-ratio",
    undefined
  );
  const [crop, setCrop] = useState<PixelCrop>({
    unit: "px",
    x: 0,
    y: 0,
    width: 100 * (aspectRatio || 1),
    height: 100,
  });
  const [imgRef, setImgRef] = useState<HTMLImageElement | null>(null);
  const {
    containerRef,
    width: viewportWidth,
    height: viewportHeight,
  } = useContainerViewport();

  const handleAspectRatioChange = (newAspectRatio?: number) => {
    setAspectRatio(newAspectRatio);

    if (newAspectRatio) {
      setCrop({
        unit: "px",
        x: 0,
        y: 0,
        width: 100 * newAspectRatio,
        height: 100,
      });
    }
  };

  const getCroppedImg = (
    image: HTMLImageElement,
    crop: PixelCrop
  ): Promise<Blob> => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    if (!ctx) {
      throw new Error("No 2d context");
    }

    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;

    const scaledCropWidth = crop.width * scaleX;
    const scaledCropHeight = crop.height * scaleY;

    canvas.width = scaledCropWidth;
    canvas.height = scaledCropHeight;

    ctx.drawImage(
      image,
      crop.x * scaleX,
      crop.y * scaleY,
      scaledCropWidth,
      scaledCropHeight,
      0,
      0,
      scaledCropWidth,
      scaledCropHeight
    );

    return new Promise((resolve) => {
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          }
        },
        "image/png",
        1
      );
    });
  };

  useImperativeHandle(ref, () => ({
    getImageBlob: async () => {
      if (!imgRef || !crop) return;

      return await getCroppedImg(imgRef, crop);
    },
  }));

  // Compute display size to fit image to viewport
  const { displayWidth, displayHeight } = useMemo(() => {
    const scale = computeFitScale(
      viewportWidth,
      viewportHeight,
      imageEl.naturalWidth,
      imageEl.naturalHeight,
      { margin: 16 }
    );
    return {
      displayWidth: Math.floor(imageEl.naturalWidth * scale),
      displayHeight: Math.floor(imageEl.naturalHeight * scale),
    };
  }, [
    viewportWidth,
    viewportHeight,
    imageEl.naturalWidth,
    imageEl.naturalHeight,
  ]);

  // Compute actual crop size in pixels
  const cropSize = useMemo(() => {
    if (!crop || displayWidth <= 0 || displayHeight <= 0) return undefined;
    return {
      width: Math.round((crop.width / displayWidth) * imageEl.naturalWidth),
      height: Math.round((crop.height / displayHeight) * imageEl.naturalHeight),
    };
  }, [
    crop,
    displayWidth,
    displayHeight,
    imageEl.naturalWidth,
    imageEl.naturalHeight,
  ]);

  return (
    <div className="flex flex-col w-full h-full justify-center">
      <ImageEditorCropToolbar
        onAspectRatioChange={handleAspectRatioChange}
        selectedAspectRatio={aspectRatio}
        cropSize={cropSize}
      />

      <div
        ref={containerRef}
        className="flex-1 flex items-center justify-center p-4"
      >
        <ReactCrop
          crop={crop}
          onChange={(pixelCrop) => setCrop(pixelCrop)}
          onComplete={(pixelCrop) => setCrop(pixelCrop)}
          aspect={aspectRatio}
          style={{
            width: displayWidth,
            height: displayHeight,
          }}
        >
          <img ref={setImgRef} src={imageEl.src} />
        </ReactCrop>
      </div>
    </div>
  );
});
