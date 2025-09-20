import { useLocalStorage } from "usehooks-ts";

export const useDrawingSettings = () => {
  const [brushSize, setBrushSize] = useLocalStorage<number>("brushSize", 50);
  const [brushColor, setBrushColor] = useLocalStorage<string>(
    "brushColor",
    "#000000"
  );

  return {
    brushSize,
    setBrushSize,
    brushColor,
    setBrushColor,
  };
};
