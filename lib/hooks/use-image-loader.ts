import { useState, useEffect } from "react";

export interface ImageSize {
  width: number;
  height: number;
}

export const useImageLoader = (image?: File | string) => {
  const [imageEl, setImageEl] = useState<HTMLImageElement | null>(null);
  const [imageSize, setImageSize] = useState<ImageSize>({
    width: 0,
    height: 0,
  });

  useEffect(() => {
    if (!image) return;

    const img = new window.Image();
    img.onload = () => {
      setImageEl(img);
      setImageSize({ width: img.width, height: img.height });
    };
    img.src = typeof image === "string" ? image : URL.createObjectURL(image);

    return () => {
      if (typeof image !== "string") {
        URL.revokeObjectURL(img.src);
      }
    };
  }, [image]);

  return {
    imageEl,
    imageSize,
  };
};
