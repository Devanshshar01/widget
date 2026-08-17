export type ApplicationLifecycleState =
  | "active"
  | "background";

export interface LifecycleSnapshot {
  readonly state: ApplicationLifecycleState;
  readonly online: boolean;
  readonly visibility: DocumentVisibilityState;
}

export interface LifecycleManager {
  start(): void;
  stop(): void;
  getSnapshot(): LifecycleSnapshot;
}

export interface LifecycleManagerCallbacks {
  readonly onStateChange?: (
    snapshot: LifecycleSnapshot
  ) => void;

  readonly onOnline?: () => void;

  readonly onOffline?: () => void;

  readonly onBackground?: () => void;

  readonly onForeground?: () => void;
}

function getLifecycleState(): ApplicationLifecycleState {
  if (
    typeof document === "undefined"
  ) {
    return "active";
  }

  return document.visibilityState ===
    "hidden"
    ? "background"
    : "active";
}

function getOnlineState(): boolean {
  if (
    typeof navigator === "undefined"
  ) {
    return true;
  }

  return navigator.onLine;
}

export function createLifecycleManager(
  callbacks: LifecycleManagerCallbacks = {}
): LifecycleManager {
  let started = false;

  let previousVisibility:
    DocumentVisibilityState =
    typeof document !== "undefined"
      ? document.visibilityState
      : "visible";

  let previousOnlineState =
    getOnlineState();

  const getSnapshot =
    (): LifecycleSnapshot => ({
      state: getLifecycleState(),
      online: getOnlineState(),
      visibility:
        typeof document !== "undefined"
          ? document.visibilityState
          : "visible"
    });

  const emitSnapshot = () => {
    callbacks.onStateChange?.(
      getSnapshot()
    );
  };

  const handleVisibilityChange =
    () => {
      if (!document) {
        return;
      }

      const currentVisibility =
        document.visibilityState;

      if (
        currentVisibility ===
          "hidden" &&
        previousVisibility !==
          "hidden"
      ) {
        callbacks.onBackground?.();
      }

      if (
        currentVisibility ===
          "visible" &&
        previousVisibility !==
          "visible"
      ) {
        callbacks.onForeground?.();
      }

      previousVisibility =
        currentVisibility;

      emitSnapshot();
    };

  const handleOnline = () => {
    if (
      previousOnlineState
    ) {
      return;
    }

    previousOnlineState = true;

    callbacks.onOnline?.();

    emitSnapshot();
  };

  const handleOffline = () => {
    if (
      !previousOnlineState
    ) {
      return;
    }

    previousOnlineState = false;

    callbacks.onOffline?.();

    emitSnapshot();
  };

  return {
    start() {
      if (started) {
        return;
      }

      if (
        typeof window === "undefined"
      ) {
        return;
      }

      started = true;

      previousVisibility =
        document.visibilityState;

      previousOnlineState =
        navigator.onLine;

      document.addEventListener(
        "visibilitychange",
        handleVisibilityChange
      );

      window.addEventListener(
        "online",
        handleOnline
      );

      window.addEventListener(
        "offline",
        handleOffline
      );

      emitSnapshot();
    },

    stop() {
      if (!started) {
        return;
      }

      started = false;

      document.removeEventListener(
        "visibilitychange",
        handleVisibilityChange
      );

      window.removeEventListener(
        "online",
        handleOnline
      );

      window.removeEventListener(
        "offline",
        handleOffline
      );
    },

    getSnapshot
  };
}