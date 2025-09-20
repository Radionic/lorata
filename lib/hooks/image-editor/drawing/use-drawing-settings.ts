import { useLocalStorage } from "usehooks-ts";

export const useDrawingSettings = () => {
  const [brushSize, setBrushSize] = useLocalStorage<number>("brushSize", 50);
  const [brushOpacity, setBrushOpacity] = useLocalStorage<number>(
    "brushOpacity",
    0.5
  );
  const [brushColor, setBrushColor] = useLocalStorage<string>(
    "brushColor",
    "#000000"
  );

  return {
    brushSize,
    setBrushSize,
    brushOpacity,
    setBrushOpacity,
    brushColor,
    setBrushColor,
  };
};
