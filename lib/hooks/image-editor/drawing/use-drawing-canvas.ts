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

  const handleMouseDown = (e: Konva.KonvaEventObject<MouseEvent>) => {
    if (!enabled) return;
    e.evt.preventDefault();

    const pos = e.target.getStage()?.getPointerPosition();
    if (!pos) return;

    setIsDrawing(true);

    // Left click = draw, Right click = erase
    const isRightClick = e.evt.button === 2;
    const shouldErase = isRightClick;

    const newDrawing: DrawingData = {
      id: Date.now().toString(),
      points: [pos.x, pos.y],
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
    const point = stage?.getPointerPosition();
    if (!point) return;
    setMousePos(point);

    if (!isDrawing) return;

    const lastDrawing = drawings[drawings.length - 1];
    setDrawings(() => [
      ...drawings.slice(0, drawings.length - 1),
      {
        ...lastDrawing,
        points: lastDrawing.points.concat([point.x, point.y]),
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
