"use client";

import {
  useCallback,
  useMemo,
  useRef,
  useState
} from "react";

import {
  useCanvasTouchGesture
} from "@/hooks/canvas/use-canvas-touch-gesture";

import {
  CanvasRenderer
} from "@/components/canvas/canvas-renderer";

import {
  useCanvasPan
} from "@/hooks/canvas/use-canvas-pan";

import {
  useCanvasPointer
} from "@/hooks/canvas/use-canvas-pointer";

import {
  useCanvasWheel
} from "@/hooks/canvas/use-canvas-wheel";

import {
  createDrawingElement
} from "@/lib/canvas/drawing-element";

import {
  createDrawingPath,
  DEFAULT_PRESSURE,
  distanceBetween,
  normalizePressure
} from "@/lib/canvas/drawing-geometry";

import {
  useCanvasCamera,
  useCanvasElements
} from "@/stores/canvas/canvas-selectors";

import {
  useCanvasCameraStore
} from "@/stores/canvas/canvas-camera-store";

import {
  useCanvasStore
} from "@/stores/canvas/canvas-store";

import type {
  CanvasPoint,
  DrawingPoint
} from "@/types/canvas";

import type {
  CanvasTransform
} from "@/types/canvas-pointer";

interface CanvasSurfaceProps {
  readonly className?: string;
}

const STROKE_WIDTH = 3;

const STROKE_COLOR = "#f4f4f5";

const MIN_POINT_DISTANCE = 1.5;

const MIN_STROKE_DISTANCE = 0.75;

export function CanvasSurface({
  className
}: CanvasSurfaceProps) {
  const elements =
    useCanvasElements();

  const camera =
    useCanvasCamera();

  const zoomCamera =
    useCanvasCameraStore(
      (store) =>
        store.zoom
    );

  const panCamera =
    useCanvasCameraStore(
      (store) =>
        store.pan
    );

  const addElement =
    useCanvasStore(
      (store) =>
        store.addElement
    );

  const activeStrokeRef =
    useRef<DrawingPoint[]>(
      []
    );

  const renderingFrameRef =
    useRef<number | null>(
      null
    );

  const [
    renderedStroke,
    setRenderedStroke
  ] = useState<
    readonly DrawingPoint[]
  >([]);

  const [
    lastPointerPosition,
    setLastPointerPosition
  ] = useState<
    CanvasPoint | null
  >(null);

  /*
   * --------------------------------------------------------------------------
   * Camera transform
   * --------------------------------------------------------------------------
   *
   * The pointer system expects a transform
   * in screen space.
   *
   * The camera itself stores world-space
   * position and zoom.
   */
  const transform =
    useMemo<CanvasTransform>(
      () => ({
        x:
          -camera.x *
          camera.scale,

        y:
          -camera.y *
          camera.scale,

        scale:
          camera.scale
      }),
      [
        camera.x,
        camera.y,
        camera.scale
      ]
    );

  /*
   * The world layer receives the exact same
   * camera transform used by the pointer
   * coordinate system.
   */
  const worldLayerStyle =
    useMemo(
      () => ({
        transform: `translate3d(${
          -camera.x *
          camera.scale
        }px, ${
          -camera.y *
          camera.scale
        }px, 0) scale(${
          camera.scale
        })`,

        transformOrigin:
          "0 0"
      }),
      [
        camera.x,
        camera.y,
        camera.scale
      ]
    );

  /*
   * --------------------------------------------------------------------------
   * Camera zoom
   * --------------------------------------------------------------------------
   */

  const handleWheelZoom =
  useCallback(
    (
      scale: number,
      anchorX: number,
      anchorY: number
    ) => {
      zoomCamera(
        camera.scale * scale,
        anchorX,
        anchorY
      );
    },
    [
      camera.scale,
      zoomCamera
    ]
  );

  const handleWheelPan =
    useCallback(
      (
        deltaX: number,
        deltaY: number
      ) => {
        panCamera(
          deltaX,
          deltaY
        );
      },
      [panCamera]
    );

  const {
    elementRef:
      wheelElementRef
  } = useCanvasWheel({
    onZoom:
      handleWheelZoom,

    onPan:
      handleWheelPan
  });

  /*
   * --------------------------------------------------------------------------
   * Camera pan
   * --------------------------------------------------------------------------
   */

  const handlePan =
    useCallback(
      (
        deltaX: number,
        deltaY: number
      ) => {
        panCamera(
          deltaX,
          deltaY
        );
      },
      [panCamera]
    );

  const {
    elementRef:
      panElementRef
  } = useCanvasPan({
    onPan:
      handlePan
  });


  const handleTouchZoom =
    useCallback(
      (
        scale: number,
        anchorX: number,
        anchorY: number
      ) => {
        zoomCamera(
          camera.scale * scale,
          anchorX,
          anchorY
        );
      },
      [
        camera.scale,
        zoomCamera
      ]
    );

  

  const {
    elementRef:
      touchElementRef
  } =
    useCanvasTouchGesture({
      onPan:
        handlePan,

      onZoom:
        handleTouchZoom
    });

  /*
   * --------------------------------------------------------------------------
   * Active stroke rendering
   * --------------------------------------------------------------------------
   */

  const publishActiveStroke =
    useCallback(() => {
      renderingFrameRef.current =
        null;

      setRenderedStroke([
        ...activeStrokeRef.current
      ]);
    }, []);

  const scheduleStrokeRender =
    useCallback(() => {
      if (
        renderingFrameRef.current !==
        null
      ) {
        return;
      }

      renderingFrameRef.current =
        requestAnimationFrame(
          publishActiveStroke
        );
    }, [
      publishActiveStroke
    ]);

  const addPointToStroke =
    useCallback(
      (
        point: DrawingPoint
      ) => {
        const points =
          activeStrokeRef.current;

        const lastPoint =
          points[
            points.length - 1
          ];

        if (
          lastPoint &&
          distanceBetween(
            lastPoint,
            point
          ) <
            MIN_POINT_DISTANCE
        ) {
          return;
        }

        points.push(point);

        scheduleStrokeRender();
      },
      [
        scheduleStrokeRender
      ]
    );

  /*
   * --------------------------------------------------------------------------
   * Pointer / drawing
   * --------------------------------------------------------------------------
   */

  const handlePointerDown =
    useCallback(
      (
        position: {
          canvas: CanvasPoint;
        },
        event: PointerEvent
      ) => {
        /*
         * Space + mouse is reserved for panning.
         *
         * Middle mouse is also reserved for panning.
         *
         * This prevents a pan gesture from
         * accidentally creating a tiny drawing.
         */
        if (
          event.pointerType ===
            "mouse" &&
          (
            event.button !== 0 ||
            event.shiftKey ||
            event.ctrlKey ||
            event.metaKey ||
            event.altKey
          )
        ) {
          return;
        }

        /*
         * The pan hook handles Space + drag
         * separately. We also inspect the
         * currently pressed Space key here
         * through the browser's event state.
         *
         * The pan hook itself prevents the
         * event when it starts panning.
         */
        if (
          event.pointerType ===
            "mouse" &&
          event.button !== 0
        ) {
          return;
        }

        const point: DrawingPoint =
          createDrawingPoint(
            position.canvas,
            event.pressure,
            event.pointerType
          );

        activeStrokeRef.current =
          [point];

        setLastPointerPosition(
          position.canvas
        );

        scheduleStrokeRender();
      },
      [
        scheduleStrokeRender
      ]
    );

  const handlePointerMove =
    useCallback(
      (
        position: {
          canvas: CanvasPoint;
        },
        event: PointerEvent
      ) => {
        /*
         * Only continue a drawing if the
         * primary pointer is active.
         */
        if (
          event.pointerType ===
            "mouse" &&
          event.buttons !== 1
        ) {
          return;
        }

        const point: DrawingPoint =
          createDrawingPoint(
            position.canvas,
            event.pressure,
            event.pointerType
          );

        setLastPointerPosition(
          position.canvas
        );

        addPointToStroke(
          point
        );
      },
      [
        addPointToStroke
      ]
    );

  const commitActiveStroke =
    useCallback(
      async (
        finalPosition: CanvasPoint,
        event: PointerEvent
      ) => {
        const finalPoint =
          createDrawingPoint(
            finalPosition,
            event.pressure,
            event.pointerType
          );

        const points =
          activeStrokeRef.current;

        const lastPoint =
          points[
            points.length - 1
          ];

        if (
          !lastPoint ||
          distanceBetween(
            lastPoint,
            finalPoint
          ) >=
            MIN_POINT_DISTANCE
        ) {
          points.push(
            finalPoint
          );
        }

        const completedStroke =
          [...points];

        activeStrokeRef.current =
          [];

        setRenderedStroke([]);

        if (
          completedStroke.length ===
          0
        ) {
          return;
        }

        /*
         * A single point is allowed as
         * a deliberate dot.
         */
        if (
          completedStroke.length > 1 &&
          calculateStrokeLength(
            completedStroke
          ) <
            MIN_STROKE_DISTANCE
        ) {
          return;
        }

        const element =
          createDrawingElement({
            points:
              completedStroke,

            strokeWidth:
              calculateStrokeWidth(
                completedStroke
              ),

            color:
              STROKE_COLOR
          });

        try {
          await addElement(
            element
          );
        } catch (error) {
          console.error(
            "Unable to save drawing:",
            error
          );
        }
      },
      [addElement]
    );

  const handlePointerUp =
    useCallback(
      (
        position: {
          canvas: CanvasPoint;
        },
        event: PointerEvent
      ) => {
        setLastPointerPosition(
          position.canvas
        );

        void commitActiveStroke(
          position.canvas,
          event
        );
      },
      [
        commitActiveStroke
      ]
    );

  const handlePointerCancel =
    useCallback(() => {
      activeStrokeRef.current =
        [];

      setRenderedStroke([]);

      setLastPointerPosition(
        null
      );
    }, []);

  /*
   * Drawing pointer handler.
   */
  const {
    elementRef
  } = useCanvasPointer({
    transform,

    onPointerDown:
      handlePointerDown,

    onPointerMove:
      handlePointerMove,

    onPointerUp:
      handlePointerUp,

    onPointerCancel:
      handlePointerCancel
  });

  /*
   * All three interaction systems need
   * to attach to the exact same DOM node:
   *
   * 1. Freehand drawing
   * 2. Wheel zoom
   * 3. Pan
   */
  const surfaceRef =
  useCallback(
    (
      element: HTMLDivElement | null
    ) => {
      elementRef(
        element
      );

      wheelElementRef(
        element
      );

      panElementRef(
        element
      );

      touchElementRef(
        element
      );
    },
    [
      elementRef,
      wheelElementRef,
      panElementRef,
      touchElementRef
    ]
  );

  const positionLabel =
    formatPointerPosition(
      lastPointerPosition
    );

  return (
    <div
      ref={surfaceRef}
      className={[
        "canvas-surface",
        className
      ]
        .filter(Boolean)
        .join(" ")}
      data-canvas-surface=""
      role="application"
      aria-label="Shared drawing canvas"
    >
      <div
        className="canvas-world-layer"
        style={worldLayerStyle}
      >
        <CanvasRenderer
          elements={elements}
        />

        <ActiveStroke
          points={
            renderedStroke
          }
          color={
            STROKE_COLOR
          }
          strokeWidth={
            calculateStrokeWidth(
              renderedStroke
            )
          }
        />
      </div>

      <div
        className="canvas-debug-position"
        aria-live="polite"
      >
        {positionLabel}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Active stroke                                                              */
/* -------------------------------------------------------------------------- */

interface ActiveStrokeProps {
  readonly points:
    readonly DrawingPoint[];

  readonly color: string;

  readonly strokeWidth: number;
}

function ActiveStroke({
  points,
  color,
  strokeWidth
}: ActiveStrokeProps) {
  if (
    points.length ===
    0
  ) {
    return null;
  }

  const firstPoint =
    points[0];

  if (!firstPoint) {
    return null;
  }

  /*
   * Single-point drawing becomes a dot.
   */
  if (
    points.length ===
    1
  ) {
    return (
      <svg
        className="canvas-active-stroke"
        aria-hidden="true"
      >
        <circle
          cx={
            firstPoint.x
          }
          cy={
            firstPoint.y
          }
          r={
            strokeWidth / 2
          }
          fill={color}
        />
      </svg>
    );
  }

  return (
    <svg
      className="canvas-active-stroke"
      aria-hidden="true"
    >
      <path
        d={createDrawingPath(
          points
        )}
        fill="none"
        stroke={color}
        strokeWidth={
          strokeWidth
        }
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

/* -------------------------------------------------------------------------- */
/* Drawing helpers                                                            */
/* -------------------------------------------------------------------------- */

function createDrawingPoint(
  position: CanvasPoint,
  pressure: number,
  pointerType: string
): DrawingPoint {
  const fallbackPressure =
    pointerType === "mouse"
      ? DEFAULT_PRESSURE
      : DEFAULT_PRESSURE;

  return {
    x: position.x,
    y: position.y,

    pressure:
      normalizePressure(
        pressure,
        fallbackPressure
      )
  };
}

function calculateStrokeLength(
  points:
    readonly CanvasPoint[]
): number {
  let length = 0;

  for (
    let index = 1;
    index <
    points.length;
    index += 1
  ) {
    const previous =
      points[index - 1];

    const current =
      points[index];

    if (
      !previous ||
      !current
    ) {
      continue;
    }

    length +=
      distanceBetween(
        previous,
        current
      );
  }

  return length;
}

function calculateStrokeWidth(
  points:
    readonly DrawingPoint[]
): number {
  if (
    points.length ===
    0
  ) {
    return STROKE_WIDTH;
  }

  let pressureTotal =
    0;

  for (
    const point of points
  ) {
    pressureTotal +=
      point.pressure ??
      DEFAULT_PRESSURE;
  }

  const averagePressure =
    pressureTotal /
    points.length;

  const pressureScale =
    0.8 +
    averagePressure *
      0.4;

  return (
    STROKE_WIDTH *
    pressureScale
  );
}

function formatPointerPosition(
  point:
    CanvasPoint | null
): string {
  if (!point) {
    return "Ready";
  }

  return `${Math.round(
    point.x
  )}, ${Math.round(
    point.y
  )}`;
}