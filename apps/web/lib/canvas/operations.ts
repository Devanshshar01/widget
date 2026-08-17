import type {
  CanvasElement,
  CanvasState
} from "@/types/canvas";

import type {
  CanvasOperation
} from "@/types/protocol";

export type {
  CanvasOperation
} from "@/types/protocol";

export function applyCanvasOperation(
  state: CanvasState,
  operation: CanvasOperation
): CanvasState {
  switch (operation.type) {
    case "CREATE_ELEMENT": {
      const exists =
        state.elements.some(
          (element) =>
            element.id ===
            operation.element.id
        );

      if (exists) {
        return state;
      }

      return {
        ...state,

        version:
          state.version + 1,

        elements: [
          ...state.elements,
          operation.element
        ],

        updatedAt:
          Date.now()
      };
    }

    case "DELETE_ELEMENT": {
      const elements =
        state.elements.filter(
          (element) =>
            element.id !==
            operation.elementId
        );

      if (
        elements.length ===
        state.elements.length
      ) {
        return state;
      }

      return {
        ...state,

        version:
          state.version + 1,

        elements,

        updatedAt:
          Date.now()
      };
    }

    case "UPDATE_ELEMENT": {
      let changed =
        false;

      const elements =
        state.elements.map(
          (element) => {
            if (
              element.id !==
              operation.elementId
            ) {
              return element;
            }

            changed = true;

            return {
              ...element,

              ...operation.changes,

              updatedAt:
                Date.now()
            } as CanvasElement;
          }
        );

      if (!changed) {
        return state;
      }

      return {
        ...state,

        version:
          state.version + 1,

        elements,

        updatedAt:
          Date.now()
      };
    }

    case "INSERT_TEXT": {
      let changed =
        false;

      const elements =
        state.elements.map(
          (element) => {
            if (
              element.id !==
                operation.elementId ||
              element.type !==
                "text"
            ) {
              return element;
            }

            changed = true;

            const index =
              Math.max(
                0,
                Math.min(
                  operation.index,
                  element.content.length
                )
              );

            return {
              ...element,

              content:
                element.content.slice(
                  0,
                  index
                ) +
                operation.text +
                element.content.slice(
                  index
                ),

              updatedAt:
                Date.now()
            };
          }
        );

      if (!changed) {
        return state;
      }

      return {
        ...state,

        version:
          state.version + 1,

        elements,

        updatedAt:
          Date.now()
      };
    }

    case "DELETE_TEXT": {
      let changed =
        false;

      const elements =
        state.elements.map(
          (element) => {
            if (
              element.id !==
                operation.elementId ||
              element.type !==
                "text"
            ) {
              return element;
            }

            changed = true;

            const start =
              Math.max(
                0,
                operation.index
              );

            const end =
              Math.min(
                element.content.length,
                start +
                  operation.length
              );

            return {
              ...element,

              content:
                element.content.slice(
                  0,
                  start
                ) +
                element.content.slice(
                  end
                ),

              updatedAt:
                Date.now()
            };
          }
        );

      if (!changed) {
        return state;
      }

      return {
        ...state,

        version:
          state.version + 1,

        elements,

        updatedAt:
          Date.now()
      };
    }
  }
}
