"use client";

import { useRef, forwardRef, useImperativeHandle } from "react";
import { Stage, Layer, Line, Image } from "react-konva";
import { useHotkeys } from "react-hotkeys-hook";
import Konva from "konva";
import { useImageLoader } from "@/lib/hooks/use-image-loader";
import { useHistory } from "@/lib/hooks/use-history";
import { useDrawingCanvas } from "@/lib/hooks/image-editor/drawing/use-drawing-canvas";
import { useDrawingSettings } from "@/lib/hooks/image-editor/drawing/use-drawing-settings";
import { ImageEditorDrawToolbar } from "./image-editor-draw-toolbar";

export interface DrawingData {
  id: string;
  points: number[];
  color: string;
  strokeWidth: number;
  opacity?: number;
  tool: "pen" | "eraser";
}

export interface ImageEditorDrawRef {
  getImageBlob: () => Promise<Blob | undefined | null>;
}

export const ImageEditorDraw = forwardRef<
  ImageEditorDrawRef,
  {
    image: File | string;
  }
>(function ({ image }, ref) {
  const stageRef = useRef<Konva.Stage>(null);
  const stageSize = {
    width: window.innerWidth,
    height: window.innerHeight,
    scale: 1,
  };
  const { imageEl, imageSize } = useImageLoader(image);
  const imageX = (stageSize.width - imageSize.width) / 2;
  const imageY = (stageSize.height - imageSize.height) / 2;

  const {
    brushSize,
    setBrushSize,
    brushOpacity,
    setBrushOpacity,
    brushColor,
    setBrushColor,
  } = useDrawingSettings();

  const {
    drawings,
    mousePos,
    setDrawings,
    clearDrawings,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleMouseLeave,
  } = useDrawingCanvas({
    brushColor,
    brushSize,
    brushOpacity,
    enabled: true,
  });

  const { saveToHistory, undo, redo, canUndo, canRedo } =
    useHistory<DrawingData>();

  const _handleMouseUp = () => {
    handleMouseUp();
    // TODO: latest drawings?
    saveToHistory(drawings);
  };

  const _handleClear = () => {
    clearDrawings();
    saveToHistory([]);
  };

  const handleUndo = () => {
    const previous = undo();
    if (previous) {
      setDrawings(previous);
    }
  };

  const handleRedo = () => {
    const next = redo();
    if (next) {
      setDrawings(next);
    }
  };

  useHotkeys("ctrl+z, cmd+z", handleUndo, { preventDefault: true });
  useHotkeys("ctrl+y, cmd+y, ctrl+shift+z, cmd+shift+z", handleRedo, {
    preventDefault: true,
  });

  const getImageBlob = async () => {
    if (!stageRef.current) return;

    const dataURL = stageRef.current.toDataURL({
      x: imageX,
      y: imageY,
      width: imageSize.width,
      height: imageSize.height,
      pixelRatio: 1,
    });

    const response = await fetch(dataURL);
    return await response.blob();
  };

  useImperativeHandle(ref, () => ({
    getImageBlob,
  }));

  return (
    <div className="w-full h-full flex flex-col">
      {/* Toolbar */}
      <ImageEditorDrawToolbar
        brushSize={brushSize}
        brushOpacity={brushOpacity}
        brushColor={brushColor}
        canUndo={canUndo}
        canRedo={canRedo}
        onBrushSizeChange={setBrushSize}
        onBrushOpacityChange={setBrushOpacity}
        onBrushColorChange={setBrushColor}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onClear={_handleClear}
      />

      {/* Konva Stage */}
      <div className="relative flex-1 overflow-hidden bg-muted/20">
        <Stage
          ref={stageRef}
          width={stageSize.width}
          height={stageSize.height}
          onMouseDown={handleMouseDown}
          onMousemove={handleMouseMove}
          onMouseup={_handleMouseUp}
          onMouseLeave={handleMouseLeave}
          onContextMenu={(e) => e.evt.preventDefault()}
          className="cursor-none"
        >
          <Layer>
            {imageEl && (
              <Image
                image={imageEl}
                width={imageSize.width}
                height={imageSize.height}
                x={imageX}
                y={imageY}
              />
            )}
          </Layer>

          <Layer
            clipX={imageX}
            clipY={imageY}
            clipWidth={imageSize.width}
            clipHeight={imageSize.height}
          >
            {drawings.map((drawing) => (
              <Line
                key={drawing.id}
                points={drawing.points}
                stroke={drawing.color}
                strokeWidth={drawing.strokeWidth}
                opacity={drawing.tool === "eraser" ? 1 : drawing.opacity || 1}
                tension={0.5}
                lineCap="round"
                lineJoin="round"
                globalCompositeOperation={
                  drawing.tool === "eraser" ? "destination-out" : "source-over"
                }
              />
            ))}
          </Layer>
        </Stage>

        {mousePos && (
          <div
            className="absolute rounded-full pointer-events-none translate-x-[-50%] translate-y-[-50%] bg-[rgba(128,128,128,0.5)]"
            style={{
              left: mousePos.x,
              top: mousePos.y,
              width: brushSize,
              height: brushSize,
            }}
          />
        )}
      </div>
    </div>
  );
});
