"use client";

import {
  useEffect,
  useRef,
  type ReactNode
} from "react";

import {
  useCanvasStore
} from "@/stores/canvas/canvas-store";

import {
  createLifecycleManager,
  type LifecycleSnapshot
} from "@/providers/app/lifecycle-manager";

interface ApplicationProviderProps {
  readonly children: ReactNode;
}

const DEFAULT_ROOM_ID =
  "local-development-room";

export function ApplicationProvider({
  children
}: ApplicationProviderProps) {
  const hydrate = useCanvasStore(
    (store) => store.hydrate
  );

  const setRoomId = useCanvasStore(
    (store) => store.setRoomId
  );

  const lifecycleManagerRef =
    useRef<
      ReturnType<
        typeof createLifecycleManager
      > | null
    >(null);

  useEffect(() => {
    let cancelled = false;

    const initializeApplication =
      async () => {
        setRoomId(
          DEFAULT_ROOM_ID
        );

        if (cancelled) {
          return;
        }

        await hydrate(
          DEFAULT_ROOM_ID
        );
      };

    void initializeApplication();

    const lifecycleManager =
      createLifecycleManager({
        onStateChange:
          (
            snapshot: LifecycleSnapshot
          ) => {
            handleLifecycleState(
              snapshot
            );
          },

        onOnline: () => {
          handleApplicationOnline();
        },

        onOffline: () => {
          handleApplicationOffline();
        },

        onBackground: () => {
          handleApplicationBackground();
        },

        onForeground: () => {
          handleApplicationForeground();
        }
      });

    lifecycleManagerRef.current =
      lifecycleManager;

    lifecycleManager.start();

    return () => {
      cancelled = true;

      lifecycleManager.stop();

      lifecycleManagerRef.current =
        null;
    };
  }, [
    hydrate,
    setRoomId
  ]);

  return (
    <>
      {children}
    </>
  );
}

function handleLifecycleState(
  snapshot: LifecycleSnapshot
): void {
  if (
    process.env.NODE_ENV ===
    "development"
  ) {
    console.debug(
      "Couple Space lifecycle:",
      snapshot
    );
  }
}

function handleApplicationOnline(): void {
  if (
    process.env.NODE_ENV ===
    "development"
  ) {
    console.debug(
      "Couple Space: connection restored."
    );
  }
}

function handleApplicationOffline(): void {
  if (
    process.env.NODE_ENV ===
    "development"
  ) {
    console.debug(
      "Couple Space: browser is offline."
    );
  }
}

function handleApplicationBackground(): void {
  if (
    process.env.NODE_ENV ===
    "development"
  ) {
    console.debug(
      "Couple Space: application moved to background."
    );
  }
}

function handleApplicationForeground(): void {
  if (
    process.env.NODE_ENV ===
    "development"
  ) {
    console.debug(
      "Couple Space: application returned to foreground."
    );
  }
}