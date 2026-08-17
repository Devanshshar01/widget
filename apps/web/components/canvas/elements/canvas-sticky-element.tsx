import type {
  StickyElement
} from "@/types/canvas";

interface CanvasStickyElementProps {
  readonly element: StickyElement;
}

export function CanvasStickyElement({
  element
}: CanvasStickyElementProps) {
  return (
    <div
      className="canvas-rendered-sticky"
      data-element-id={element.id}
      data-element-type={element.type}
      style={{
        left: element.position.x,
        top: element.position.y,
        width: element.width,
        height: element.height,
        transform: `rotate(${element.rotation}deg)`,
        zIndex: element.zIndex
      }}
    >
      <div className="canvas-rendered-sticky-content">
        {element.content}
      </div>
    </div>
  );
}