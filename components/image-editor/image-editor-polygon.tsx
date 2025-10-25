"use client";

import React, {
  useRef,
  forwardRef,
  useImperativeHandle,
  useState,
  useEffect,
} from "react";
import { Stage, Layer, Line, Circle, Image } from "react-konva";
import { useHotkeys } from "react-hotkeys-hook";
import Konva from "konva";
import { useHistory } from "@/lib/hooks/use-history";
import { ImageEditorPolygonToolbar } from "./image-editor-polygon-toolbar";
import { useContainerViewport } from "@/lib/hooks/use-container-viewport";
import { computeFitScale } from "@/lib/fit";
import { useLocalStorage } from "usehooks-ts";
import { ImageEditorRef } from "./image-editor";

// Constants
const POINT_RADIUS = 10;
const START_POINT_RADIUS = 12;
const CLOSE_THRESHOLD = 10;
const INSERT_POINT_THRESHOLD = 50;
const MIN_POLYGON_POINTS = 3;
const ZOOM_SCALE_BY = 1.02;
const MIN_ZOOM = 0.1;
const MAX_ZOOM = 10;
const VIEWPORT_MARGIN = 16;

// Types
type Point = { x: number; y: number };

export interface PolygonData {
  id: string;
  points: Point[];
  color: string;
  closed: boolean;
}

// Helper functions
const calculateDistance = (p1: Point, p2: Point): number => {
  return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
};

const isPointNearStart = (point: Point, startPoint: Point): boolean => {
  return calculateDistance(point, startPoint) < CLOSE_THRESHOLD;
};

const isPointInsidePolygon = (point: Point, polygon: PolygonData): boolean => {
  if (!polygon.closed || polygon.points.length < MIN_POLYGON_POINTS) {
    return false;
  }

  let inside = false;
  const { x, y } = point;
  const points = polygon.points;

  for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
    const xi = points[i].x;
    const yi = points[i].y;
    const xj = points[j].x;
    const yj = points[j].y;

    const intersect =
      yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }

  return inside;
};

// Find the closest edge of a polygon to insert a new point
const findClosestEdge = (
  point: Point,
  polygon: PolygonData
): { index: number; distance: number } | null => {
  if (!polygon.closed || polygon.points.length < MIN_POLYGON_POINTS) {
    return null;
  }

  let closestIndex = 0;
  let minDistance = Infinity;

  for (let i = 0; i < polygon.points.length; i++) {
    const p1 = polygon.points[i];
    const p2 = polygon.points[(i + 1) % polygon.points.length];

    // Calculate distance from point to line segment
    const A = point.x - p1.x;
    const B = point.y - p1.y;
    const C = p2.x - p1.x;
    const D = p2.y - p1.y;

    const dot = A * C + B * D;
    const lenSq = C * C + D * D;
    let param = -1;

    if (lenSq !== 0) param = dot / lenSq;

    let xx, yy;

    if (param < 0) {
      xx = p1.x;
      yy = p1.y;
    } else if (param > 1) {
      xx = p2.x;
      yy = p2.y;
    } else {
      xx = p1.x + param * C;
      yy = p1.y + param * D;
    }

    const dx = point.x - xx;
    const dy = point.y - yy;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < minDistance) {
      minDistance = distance;
      closestIndex = i;
    }
  }

  return { index: closestIndex, distance: minDistance };
};

export const ImageEditorPolygon = forwardRef<
  ImageEditorRef,
  {
    imageEl: HTMLImageElement;
  }
>(function ({ imageEl }, ref) {
  // Refs
  const stageRef = useRef<Konva.Stage>(null);
  const polygonLayerRef = useRef<Konva.Layer>(null);

  // Viewport
  const {
    containerRef,
    width: viewportWidth,
    height: viewportHeight,
  } = useContainerViewport();

  const imageX = (viewportWidth - imageEl.width) / 2;
  const imageY = (viewportHeight - imageEl.height) / 2;

  // State
  const [fillColor, setFillColor] = useLocalStorage<string>(
    "image-editor-polygon-fill-color",
    "#ff0000"
  );
  const [polygons, setPolygons] = useState<PolygonData[]>([]);
  const [currentPolygon, setCurrentPolygon] = useState<PolygonData | null>(
    null
  );
  const [selectedPointIndex, setSelectedPointIndex] = useState<number | null>(
    null
  );
  const [selectedPolygonId, setSelectedPolygonId] = useState<string | null>(
    null
  );
  const [dragOriginalPoints, setDragOriginalPoints] = useState<Point[] | null>(
    null
  );
  const [hideUI, setHideUI] = useState(false);

  // History
  const { saveToHistory, undo, redo, canUndo, canRedo } =
    useHistory<PolygonData>();

  // Fit the image to the viewport initially and when viewport changes
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;

    const fitScale = computeFitScale(
      viewportWidth,
      viewportHeight,
      imageEl.width,
      imageEl.height,
      { margin: VIEWPORT_MARGIN }
    );

    stage.scale({ x: fitScale, y: fitScale });

    const pos = {
      x: (viewportWidth - viewportWidth * fitScale) / 2,
      y: (viewportHeight - viewportHeight * fitScale) / 2,
    };
    stage.position(pos);
    stage.batchDraw();
  }, [imageEl, viewportWidth, viewportHeight]);

  // Stage helpers
  const getStagePointerPosition = (): Point | null => {
    const stage = stageRef.current;
    if (!stage) return null;

    const pointer = stage.getPointerPosition();
    if (!pointer) return null;

    const scale = stage.scaleX();
    const pos = stage.position();

    return {
      x: (pointer.x - pos.x) / scale,
      y: (pointer.y - pos.y) / scale,
    };
  };

  // Stage click handler - creates polygons
  const handleStageClick = (e: Konva.KonvaEventObject<MouseEvent>) => {
    if (e.target instanceof Konva.Circle) return;

    const point = getStagePointerPosition();
    if (!point) return;

    // Check if click is within image bounds
    const isInBounds =
      point.x >= imageX &&
      point.x <= imageX + imageEl.width &&
      point.y >= imageY &&
      point.y <= imageY + imageEl.height;

    if (!isInBounds) return;

    const isShiftPressed = e.evt.shiftKey;

    // Shift-click: Add point to existing polygon
    if (isShiftPressed && !currentPolygon) {
      // Find all closed polygons and their closest edges
      let targetPolygon: PolygonData | null = null;
      let targetEdgeIndex = -1;
      let minDist = Infinity;

      for (const polygon of polygons) {
        if (!polygon.closed) continue;

        const edgeInfo = findClosestEdge(point, polygon);
        if (edgeInfo && edgeInfo.distance < minDist) {
          minDist = edgeInfo.distance;
          targetPolygon = polygon;
          targetEdgeIndex = edgeInfo.index;
        }
      }

      // Insert point if we found a close enough polygon
      if (targetPolygon && minDist < INSERT_POINT_THRESHOLD) {
        const updatedPolygons = polygons.map((polygon) => {
          if (polygon.id === targetPolygon.id) {
            const newPoints = [...polygon.points];
            newPoints.splice(targetEdgeIndex + 1, 0, point);
            return { ...polygon, points: newPoints };
          }
          return polygon;
        });

        setPolygons(updatedPolygons);
        saveToHistory(updatedPolygons);
        setSelectedPolygonId(targetPolygon.id);
        setSelectedPointIndex(targetEdgeIndex + 1);
      }
      return;
    }

    if (currentPolygon) {
      // Close polygon if clicking near start point
      if (
        currentPolygon.points.length >= MIN_POLYGON_POINTS &&
        isPointNearStart(point, currentPolygon.points[0])
      ) {
        const closedPolygon = { ...currentPolygon, closed: true };
        const updatedPolygons = [...polygons, closedPolygon];
        setPolygons(updatedPolygons);
        saveToHistory(updatedPolygons);
        setCurrentPolygon(null);
      } else {
        // Add new point to current polygon
        setCurrentPolygon({
          ...currentPolygon,
          points: [...currentPolygon.points, point],
        });
      }
    } else {
      // Don't start a new polygon inside an existing one
      const isInsideExisting = polygons.some((polygon) =>
        isPointInsidePolygon(point, polygon)
      );
      if (isInsideExisting) return;

      // Start new polygon
      setCurrentPolygon({
        id: Date.now().toString(),
        points: [point],
        color: fillColor,
        closed: false,
      });
      setSelectedPointIndex(null);
      setSelectedPolygonId(null);
    }
  };

  // Point handlers
  const handlePointDragMove = (
    e: Konva.KonvaEventObject<DragEvent>,
    polygonId: string,
    pointIndex: number
  ) => {
    const newPos: Point = { x: e.target.x(), y: e.target.y() };

    setPolygons((prevPolygons) =>
      prevPolygons.map((polygon) =>
        polygon.id === polygonId
          ? {
              ...polygon,
              points: polygon.points.map((p, i) =>
                i === pointIndex ? newPos : p
              ),
            }
          : polygon
      )
    );
  };

  const handlePointDragEnd = () => saveToHistory(polygons);

  const handlePointClick = (polygonId: string, pointIndex: number) => {
    setSelectedPolygonId(polygonId);
    setSelectedPointIndex(pointIndex);
  };

  const handlePointRightClick = (
    e: Konva.KonvaEventObject<MouseEvent>,
    polygonId: string,
    pointIndex: number
  ) => {
    e.evt.preventDefault();

    const updatedPolygons = polygons
      .map((polygon) => {
        if (polygon.id === polygonId) {
          const newPoints = polygon.points.filter(
            (_, idx) => idx !== pointIndex
          );
          if (newPoints.length < MIN_POLYGON_POINTS) return null;
          return { ...polygon, points: newPoints };
        }
        return polygon;
      })
      .filter((p): p is PolygonData => p !== null);

    setPolygons(updatedPolygons);
    setSelectedPointIndex(null);
    setSelectedPolygonId(null);
    saveToHistory(updatedPolygons);
  };

  // Polygon handlers
  const handlePolygonClick = (polygonId: string) => {
    setSelectedPolygonId(polygonId);
    setSelectedPointIndex(null);
  };

  const handlePolygonDragStart = (polygonId: string) => {
    setSelectedPolygonId(polygonId);
    setSelectedPointIndex(null);

    const polygon = polygons.find((p) => p.id === polygonId);
    if (polygon) setDragOriginalPoints(polygon.points);
  };

  const handlePolygonDragEnd = (
    e: Konva.KonvaEventObject<DragEvent>,
    polygonId: string
  ) => {
    if (!dragOriginalPoints) return;

    const shape = e.target;
    const dx = shape.x();
    const dy = shape.y();

    const updatedPolygons = polygons.map((polygon) =>
      polygon.id === polygonId
        ? {
            ...polygon,
            points: dragOriginalPoints.map((point) => ({
              x: point.x + dx,
              y: point.y + dy,
            })),
          }
        : polygon
    );

    setPolygons(updatedPolygons);
    saveToHistory(updatedPolygons);
    setDragOriginalPoints(null);
    shape.position({ x: 0, y: 0 });
  };

  const handlePolygonRightClick = (
    e: Konva.KonvaEventObject<MouseEvent>,
    polygonId: string
  ) => {
    e.evt.preventDefault();

    const updatedPolygons = polygons.filter(
      (polygon) => polygon.id !== polygonId
    );
    setPolygons(updatedPolygons);
    setSelectedPointIndex(null);
    setSelectedPolygonId(null);
    saveToHistory(updatedPolygons);
  };

  // Clear selection helper
  const clearSelection = () => {
    setCurrentPolygon(null);
    setSelectedPointIndex(null);
    setSelectedPolygonId(null);
  };

  // Toolbar handlers
  const handleClear = () => {
    setPolygons([]);
    clearSelection();
    saveToHistory([]);
  };

  const handleUndo = () => {
    const previous = undo();
    if (previous) {
      setPolygons(previous);
      clearSelection();
    }
  };

  const handleRedo = () => {
    const next = redo();
    if (next) {
      setPolygons(next);
      clearSelection();
    }
  };

  // Keyboard shortcuts
  useHotkeys("ctrl+z, cmd+z", handleUndo, { preventDefault: true });
  useHotkeys("ctrl+y, cmd+y, ctrl+shift+z, cmd+shift+z", handleRedo, {
    preventDefault: true,
  });

  useHotkeys(
    "delete, backspace",
    () => {
      if (selectedPointIndex !== null && selectedPolygonId !== null) {
        // Delete selected point
        const updatedPolygons = polygons
          .map((polygon) => {
            if (polygon.id === selectedPolygonId) {
              const newPoints = polygon.points.filter(
                (_, idx) => idx !== selectedPointIndex
              );
              if (newPoints.length < MIN_POLYGON_POINTS) return null;
              return { ...polygon, points: newPoints };
            }
            return polygon;
          })
          .filter((p): p is PolygonData => p !== null);

        setPolygons(updatedPolygons);
        clearSelection();
        saveToHistory(updatedPolygons);
      } else if (selectedPolygonId !== null) {
        // Delete entire polygon
        const updatedPolygons = polygons.filter(
          (p) => p.id !== selectedPolygonId
        );
        setPolygons(updatedPolygons);
        setSelectedPolygonId(null);
        saveToHistory(updatedPolygons);
      }
    },
    { preventDefault: true }
  );

  useHotkeys(
    "tab",
    () => {
      setHideUI(true);
    },
    { preventDefault: true, keydown: true, keyup: false }
  );

  useHotkeys(
    "tab",
    () => {
      setHideUI(false);
    },
    { preventDefault: true, keydown: false, keyup: true }
  );

  // Zoom handler
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

    const nextScale =
      direction > 0 ? oldScale * ZOOM_SCALE_BY : oldScale / ZOOM_SCALE_BY;
    const newScale = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, nextScale));

    stage.scale({ x: newScale, y: newScale });

    const newPos = {
      x: pointer.x - mousePointTo.x * newScale,
      y: pointer.y - mousePointTo.y * newScale,
    };
    stage.position(newPos);
    stage.batchDraw();
  };

  // Export handler
  const getImageBlob = async (): Promise<Blob | undefined | null> => {
    const stage = stageRef.current;
    const layer = polygonLayerRef.current;
    if (!stage || !layer) return;

    const circles = layer.find<Konva.Circle>("Circle");
    const lines = layer.find<Konva.Line>("Line");

    // Hide UI elements for export
    circles.forEach((circle) => circle.hide());
    lines.forEach((line) => {
      if (line.stroke() && !line.fill()) {
        line.hide(); // Hide outline lines
      } else if (line.fill()) {
        line.setAttr("exportOpacity", line.opacity());
        line.opacity(1); // Full opacity for filled polygons
      }
    });

    // Reset transform for export
    const prevScale = stage.scale();
    const prevPos = stage.position();
    stage.scale({ x: 1, y: 1 });
    stage.position({ x: -imageX, y: -imageY });
    stage.batchDraw();

    const dataURL = stage.toDataURL({
      width: imageEl.width,
      height: imageEl.height,
      pixelRatio: 1,
    });

    // Restore UI elements
    circles.forEach((circle) => circle.show());
    lines.forEach((line) => {
      line.show();
      const exportOpacity = line.getAttr("exportOpacity");
      if (exportOpacity !== undefined) {
        line.opacity(exportOpacity);
        line.setAttr("exportOpacity", undefined);
      }
    });

    // Restore transform
    stage.scale(prevScale);
    stage.position(prevPos);
    stage.batchDraw();

    const response = await fetch(dataURL);
    return await response.blob();
  };

  useImperativeHandle(ref, () => ({
    getImageBlob,
  }));

  // Cursor helpers
  const setCursor = (e: Konva.KonvaEventObject<MouseEvent>, cursor: string) => {
    const container = e.target.getStage()?.container();
    if (container) container.style.cursor = cursor;
  };

  return (
    <div className="w-full h-full flex flex-col">
      {/* Toolbar */}
      <ImageEditorPolygonToolbar
        fillColor={fillColor}
        canUndo={canUndo}
        canRedo={canRedo}
        onFillColorChange={setFillColor}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onClear={handleClear}
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
          onClick={handleStageClick}
          onWheel={handleWheel}
          onContextMenu={(e) => e.evt.preventDefault()}
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
            ref={polygonLayerRef}
            clipX={imageX}
            clipY={imageY}
            clipWidth={imageEl.width}
            clipHeight={imageEl.height}
          >
            {/* Completed polygons */}
            {polygons.map((polygon) => {
              const isSelected = selectedPolygonId === polygon.id;
              const polygonPoints = polygon.points.flatMap((p) => [p.x, p.y]);

              return (
                <React.Fragment key={polygon.id}>
                  {/* Filled polygon */}
                  <Line
                    points={polygonPoints}
                    closed={polygon.closed}
                    fill={polygon.color}
                    opacity={isSelected ? 0.7 : 0.5}
                    draggable
                    onDragStart={() => handlePolygonDragStart(polygon.id)}
                    onDragEnd={(e) => handlePolygonDragEnd(e, polygon.id)}
                    onClick={() => handlePolygonClick(polygon.id)}
                    onContextMenu={(e) =>
                      handlePolygonRightClick(e, polygon.id)
                    }
                    onMouseEnter={(e) => setCursor(e, "move")}
                    onMouseLeave={(e) => setCursor(e, "default")}
                  />

                  {/* Outline */}
                  {!hideUI && (
                    <Line
                      points={polygonPoints}
                      closed={polygon.closed}
                      stroke={polygon.color}
                      strokeWidth={isSelected ? 3 : 2}
                      listening={false}
                    />
                  )}

                  {/* Control points */}
                  {!hideUI &&
                    polygon.points.map((point, idx) => (
                      <Circle
                        key={`${polygon.id}-${idx}`}
                        x={point.x}
                        y={point.y}
                        radius={POINT_RADIUS}
                        fill={
                          isSelected && selectedPointIndex === idx
                            ? "#ffffff"
                            : polygon.color
                        }
                        stroke="#000000"
                        strokeWidth={2}
                        draggable
                        onDragMove={(e) =>
                          handlePointDragMove(e, polygon.id, idx)
                        }
                        onDragEnd={handlePointDragEnd}
                        onClick={() => handlePointClick(polygon.id, idx)}
                        onContextMenu={(e) =>
                          handlePointRightClick(e, polygon.id, idx)
                        }
                        onMouseEnter={(e) => setCursor(e, "grab")}
                        onMouseLeave={(e) => setCursor(e, "default")}
                      />
                    ))}
                </React.Fragment>
              );
            })}

            {/* Current polygon being created */}
            {currentPolygon && !hideUI && (
              <>
                <Line
                  points={currentPolygon.points.flatMap((p) => [p.x, p.y])}
                  stroke={currentPolygon.color}
                  strokeWidth={2}
                />

                {currentPolygon.points.map((point, idx) => {
                  const isStartPoint = idx === 0;
                  return (
                    <Circle
                      key={`current-${idx}`}
                      x={point.x}
                      y={point.y}
                      radius={isStartPoint ? START_POINT_RADIUS : POINT_RADIUS}
                      fill={isStartPoint ? "#ffffff" : currentPolygon.color}
                      stroke={currentPolygon.color}
                      strokeWidth={isStartPoint ? 3 : 2}
                      listening={false}
                    />
                  );
                })}

                {/* Start point indicator (close hint) */}
                {currentPolygon.points.length >= MIN_POLYGON_POINTS && (
                  <Circle
                    x={currentPolygon.points[0].x}
                    y={currentPolygon.points[0].y}
                    radius={START_POINT_RADIUS}
                    stroke={currentPolygon.color}
                    strokeWidth={2}
                    opacity={0.5}
                    listening={false}
                  />
                )}
              </>
            )}
          </Layer>
        </Stage>
      </div>
    </div>
  );
});
