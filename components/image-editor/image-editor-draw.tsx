"use client";

import {
  useRef,
  forwardRef,
  useImperativeHandle,
  useState,
  useEffect,
} from "react";
import { Stage, Layer, Line, Image } from "react-konva";
import { useHotkeys } from "react-hotkeys-hook";
import Konva from "konva";
import { useHistory } from "@/lib/hooks/use-history";
import { useDrawingCanvas } from "@/lib/hooks/image-editor/drawing/use-drawing-canvas";
import { useDrawingSettings } from "@/lib/hooks/image-editor/drawing/use-drawing-settings";
import { ImageEditorDrawToolbar } from "./image-editor-draw-toolbar";
import { useContainerViewport } from "@/lib/hooks/use-container-viewport";
import { computeFitScale } from "@/lib/fit";

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
    imageEl: HTMLImageElement;
  }
>(function ({ imageEl }, ref) {
  const stageRef = useRef<Konva.Stage>(null);
  const [stageScale, setStageScale] = useState(1);
  const {
    containerRef,
    width: viewportWidth,
    height: viewportHeight,
  } = useContainerViewport();
  const imageX = (viewportWidth - imageEl.width) / 2;
  const imageY = (viewportHeight - imageEl.height) / 2;

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

  // Fit the image to the viewport initially and when viewport changes
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;

    const fitScale = computeFitScale(
      viewportWidth,
      viewportHeight,
      imageEl.width,
      imageEl.height,
      { margin: 16 }
    );

    stage.scale({ x: fitScale, y: fitScale });
    setStageScale(fitScale);

    // Center the stage so the image (centered in stage at scale 1) remains centered
    const pos = {
      x: (viewportWidth - viewportWidth * fitScale) / 2,
      y: (viewportHeight - viewportHeight * fitScale) / 2,
    };
    stage.position(pos);
    stage.batchDraw();
  }, [imageEl, viewportWidth, viewportHeight]);

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

  const handleWheel = (e: Konva.KonvaEventObject<WheelEvent>) => {
    e.evt.preventDefault();

    const stage = stageRef.current;
    if (!stage) return;

    const oldScale = stage.scaleX();
    const pointer = stage.getPointerPosition();
    if (!pointer) return;

    const mousePointTo = {
      x: (pointer.x - stage.x()) / oldScale,
      y: (pointer.y - stage.y()) / oldScale,
    };

    let direction = e.evt.deltaY > 0 ? -1 : 1;
    if (e.evt.ctrlKey) {
      direction = -direction;
    }

    const scaleBy = 1.02;
    const nextScale = direction > 0 ? oldScale * scaleBy : oldScale / scaleBy;
    const newScale = Math.max(0.1, Math.min(10, nextScale));

    stage.scale({ x: newScale, y: newScale });
    setStageScale(newScale);

    const newPos = {
      x: pointer.x - mousePointTo.x * newScale,
      y: pointer.y - mousePointTo.y * newScale,
    };
    stage.position(newPos);
    stage.batchDraw();
  };

  const getImageBlob = async () => {
    const stage = stageRef.current;
    if (!stage) return;

    // Compute crop in current screen-space using stage transform
    const scale = stage.scaleX() || 1;
    const pos = stage.position();
    const cropX = pos.x + imageX * scale;
    const cropY = pos.y + imageY * scale;
    const cropWidth = imageEl.width * scale;
    const cropHeight = imageEl.height * scale;

    // Keep export at the displayed resolution regardless of zoom
    const pixelRatio = 1 / scale;

    const dataURL = stage.toDataURL({
      x: cropX,
      y: cropY,
      width: cropWidth,
      height: cropHeight,
      pixelRatio,
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
      <div
        ref={containerRef}
        className="relative flex-1 overflow-hidden bg-muted/20"
      >
        <Stage
          ref={stageRef}
          width={viewportWidth}
          height={viewportHeight}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={_handleMouseUp}
          onMouseLeave={handleMouseLeave}
          onWheel={handleWheel}
          onContextMenu={(e) => e.evt.preventDefault()}
          className="cursor-none"
        >
          <Layer>
            {imageEl && (
              <Image
                image={imageEl}
                width={imageEl.width}
                height={imageEl.height}
                x={imageX}
                y={imageY}
              />
            )}
          </Layer>

          <Layer
            clipX={imageX}
            clipY={imageY}
            clipWidth={imageEl.width}
            clipHeight={imageEl.height}
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
              width: brushSize * stageScale,
              height: brushSize * stageScale,
            }}
          />
        )}
      </div>
    </div>
  );
});
