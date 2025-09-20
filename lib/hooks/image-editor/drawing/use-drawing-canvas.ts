import { useState } from "react";
import Konva from "konva";
import { DrawingData } from "@/components/image-editor/image-editor-draw";

export interface CursorPosition {
  x: number;
  y: number;
}

export const useDrawingCanvas = ({
  brushColor,
  brushSize,
  brushOpacity,
  enabled,
}: {
  brushColor: string;
  brushSize: number;
  brushOpacity: number;
  enabled?: boolean;
}) => {
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawings, setDrawings] = useState<DrawingData[]>([]);
  const [mousePos, setMousePos] = useState<CursorPosition | null>(null);

  const toWorld = (
    stage: Konva.Stage,
    pointer: { x: number; y: number }
  ): { x: number; y: number } => {
    const scale = stage.scaleX() || 1;
    return {
      x: (pointer.x - stage.x()) / scale,
      y: (pointer.y - stage.y()) / scale,
    };
  };

  const handleMouseDown = (e: Konva.KonvaEventObject<MouseEvent>) => {
    if (!enabled) return;
    e.evt.preventDefault();

    const stage = e.target.getStage();
    const pointer = stage?.getPointerPosition();
    if (!stage || !pointer) return;

    setIsDrawing(true);

    // Left click = draw, Right click = erase
    const isRightClick = e.evt.button === 2;
    const shouldErase = isRightClick;

    const worldPos = toWorld(stage, pointer);
    const newDrawing: DrawingData = {
      id: Date.now().toString(),
      points: [worldPos.x, worldPos.y],
      color: brushColor,
      strokeWidth: brushSize,
      opacity: brushOpacity,
      tool: shouldErase ? "eraser" : "pen",
    };
    setDrawings((prev) => [...prev, newDrawing]);
  };

  const handleMouseMove = (e: Konva.KonvaEventObject<MouseEvent>) => {
    if (!enabled) return;

    const stage = e.target.getStage();
    const pointer = stage?.getPointerPosition();
    if (!stage || !pointer) return;
    setMousePos(pointer);

    if (!isDrawing) return;

    const worldPos = toWorld(stage, pointer);
    const lastDrawing = drawings[drawings.length - 1];
    setDrawings(() => [
      ...drawings.slice(0, drawings.length - 1),
      {
        ...lastDrawing,
        points: lastDrawing.points.concat([worldPos.x, worldPos.y]),
      },
    ]);
  };

  const handleMouseUp = () => {
    setIsDrawing(false);
  };

  const handleMouseLeave = () => {
    setMousePos(null);
  };

  const clearDrawings = () => {
    setDrawings([]);
  };

  return {
    mousePos,
    isDrawing,
    drawings,
    setDrawings,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleMouseLeave,
    clearDrawings,
  };
};
