"use client";

import "react-image-crop/dist/ReactCrop.css";
import { forwardRef, useImperativeHandle, useState } from "react";
import ReactCrop, { PixelCrop } from "react-image-crop";
import { ImageEditorCropToolbar } from "./image-editor-crop-toolbar";
import { useLocalStorage } from "usehooks-ts";

export interface ImageEditorCropRef {
  getImageBlob: () => Promise<Blob | undefined | null>;
}

export const ImageEditorCrop = forwardRef<
  ImageEditorCropRef,
  {
    image: File | string;
  }
>(function ({ image }, ref) {
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

    canvas.width = crop.width;
    canvas.height = crop.height;

    ctx.drawImage(
      image,
      crop.x * scaleX,
      crop.y * scaleY,
      crop.width * scaleX,
      crop.height * scaleY,
      0,
      0,
      crop.width,
      crop.height
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

  return (
    <div className="flex flex-col w-full h-full justify-center">
      <ImageEditorCropToolbar
        onAspectRatioChange={handleAspectRatioChange}
        selectedAspectRatio={aspectRatio}
        crop={crop}
      />

      <div className="flex-1 flex items-center justify-center p-4">
        <ReactCrop
          crop={crop}
          onChange={(pixelCrop) => setCrop(pixelCrop)}
          onComplete={(pixelCrop) => setCrop(pixelCrop)}
          aspect={aspectRatio}
        >
          <img
            ref={setImgRef}
            src={
              typeof image === "string"
                ? image
                : URL.createObjectURL(image as File)
            }
          />
        </ReactCrop>
      </div>
    </div>
  );
});
