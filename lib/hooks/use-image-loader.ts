import { useState, useEffect } from "react";

export const useImageLoader = (image?: File | string) => {
  const [imageEl, setImageEl] = useState<HTMLImageElement>();
  const [imageName, setImageName] = useState<string>();

  useEffect(() => {
    if (!image) return;

    const img = new window.Image();
    img.onload = () => {
      setImageEl(img);
      setImageName(img.src.split("?")[0].split("/").pop());
    };
    img.src = typeof image === "string" ? image : URL.createObjectURL(image);

    return () => {
      if (typeof image !== "string") {
        URL.revokeObjectURL(img.src);
      }
    };
  }, [image]);

  const releaseImage = () => {
    if (imageEl) {
      imageEl.src = "";
    }
    setImageEl(undefined);
    setImageName(undefined);
  };

  return {
    imageEl,
    imageName,
    releaseImage,
  };
};
