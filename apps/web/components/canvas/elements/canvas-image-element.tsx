import type {
  ImageElement
} from "@/types/canvas";

interface CanvasImageElementProps {
  readonly element: ImageElement;
}

export function CanvasImageElement({
  element
}: CanvasImageElementProps) {
  return (
    <img
      className="canvas-rendered-image"
      src={element.src}
      alt=""
      draggable={false}
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
    />
  );
}