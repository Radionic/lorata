import { useEffect, useState } from "react";

export type MediaType = "image" | "video";

export const useMediaLoader = (
  media: File | string | undefined,
  type: MediaType
) => {
  const [imageEl, setImageEl] = useState<HTMLImageElement>();
  const [videoEl, setVideoEl] = useState<HTMLVideoElement>();
  const [mediaName, setMediaName] = useState<string>();

  useEffect(() => {
    if (!media) return;

    // Reset previous state
    setImageEl(undefined);
    setVideoEl(undefined);

    const url = typeof media === "string" ? media : URL.createObjectURL(media);
    const name = (typeof media === "string" ? media : media.name)
      .split("?")[0]
      .split("/")
      .pop();
    setMediaName(name);

    if (type === "image") {
      const img = new window.Image();
      img.onload = () => {
        setImageEl(img);
      };
      img.src = url;

      return () => {
        if (typeof media !== "string") {
          URL.revokeObjectURL(img.src);
        }
      };
    }

    if (type === "video") {
      const video = document.createElement("video");
      video.preload = "metadata";
      const onLoaded = () => {
        setVideoEl(video);
      };
      video.addEventListener("loadedmetadata", onLoaded);
      video.src = url;

      return () => {
        video.removeEventListener("loadedmetadata", onLoaded);
        if (typeof media !== "string") {
          URL.revokeObjectURL(video.src);
        }
      };
    }
  }, [media, type]);

  const releaseMedia = () => {
    if (imageEl) imageEl.src = "";
    if (videoEl) videoEl.src = "";
    setImageEl(undefined);
    setVideoEl(undefined);
    setMediaName(undefined);
  };

  return {
    imageEl,
    videoEl,
    mediaName,
    releaseMedia,
  } as const;
};
