"use client";

import {
  useEffect,
  useRef
} from "react";

import type {
  TextElement
} from "@/types/canvas";

interface CanvasTextElementProps {
  readonly element: TextElement;
  readonly isEditing: boolean;
  readonly onStartEditing: (
    elementId: string
  ) => void;
  readonly onCommit: (
    elementId: string,
    content: string
  ) => void;
}

export function CanvasTextElement({
  element,
  isEditing,
  onStartEditing,
  onCommit
}: CanvasTextElementProps) {
  const editorRef =
    useRef<HTMLDivElement | null>(
      null
    );

  const committedContentRef =
    useRef(element.content);

  useEffect(() => {
    committedContentRef.current =
      element.content;

    if (
      !isEditing ||
      !editorRef.current
    ) {
      return;
    }

    if (
      editorRef.current.textContent !==
      element.content
    ) {
      editorRef.current.textContent =
        element.content;
    }

    editorRef.current.focus();

    placeCaretAtEnd(
      editorRef.current
    );
  }, [
    element.content,
    isEditing
  ]);

  const handleInput = () => {
    if (!editorRef.current) {
      return;
    }

    committedContentRef.current =
      editorRef.current.textContent ??
      "";
  };

  const handleBlur = () => {
    const content =
      editorRef.current?.textContent ??
      "";

    onCommit(
      element.id,
      content
    );
  };

  const handleKeyDown = (
    event: React.KeyboardEvent<HTMLDivElement>
  ) => {
    if (event.key === "Escape") {
      event.preventDefault();

      onCommit(
        element.id,
        committedContentRef.current
      );

      return;
    }

    /*
     * Ctrl/Cmd + Enter is treated as an
     * explicit "finish editing" shortcut.
     *
     * Normal Enter remains available for
     * multiline text.
     */
    if (
      event.key === "Enter" &&
      (event.ctrlKey ||
        event.metaKey)
    ) {
      event.preventDefault();

      const content =
        editorRef.current?.textContent ??
        "";

      onCommit(
        element.id,
        content
      );
    }
  };

  if (isEditing) {
    return (
      <div
        ref={editorRef}
        className="canvas-rendered-text canvas-rendered-text-editor"
        data-element-id={element.id}
        data-element-type={element.type}
        contentEditable
        suppressContentEditableWarning
        role="textbox"
        aria-label="Edit canvas text"
        aria-multiline="true"
        spellCheck
        onInput={handleInput}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        style={{
          left: element.position.x,
          top: element.position.y,
          width: element.width,
          transform: `rotate(${element.rotation}deg)`,
          zIndex: element.zIndex
        }}
      />
    );
  }

  return (
    <div
      className="canvas-rendered-text"
      data-element-id={element.id}
      data-element-type={element.type}
      role="button"
      tabIndex={0}
      aria-label="Edit text"
      onPointerDown={(event) => {
        event.stopPropagation();

        onStartEditing(
          element.id
        );
      }}
      onKeyDown={(event) => {
        if (
          event.key === "Enter" ||
          event.key === " "
        ) {
          event.preventDefault();

          onStartEditing(
            element.id
          );
        }
      }}
      style={{
        left: element.position.x,
        top: element.position.y,
        width: element.width,
        transform: `rotate(${element.rotation}deg)`,
        zIndex: element.zIndex
      }}
    >
      {element.content}
    </div>
  );
}

function placeCaretAtEnd(
  element: HTMLElement
): void {
  const selection =
    window.getSelection();

  if (!selection) {
    return;
  }

  const range =
    document.createRange();

  range.selectNodeContents(
    element
  );

  range.collapse(false);

  selection.removeAllRanges();

  selection.addRange(range);
}