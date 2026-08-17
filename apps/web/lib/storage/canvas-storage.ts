import type { CanvasState } from "@/types/canvas";

import {
  getDatabase,
  storageStores
} from "@/lib/storage/indexed-db";

import {
  STORAGE_SCHEMA_VERSION,
  type StoredCanvas
} from "@/lib/storage/storage-types";

function isStorageAvailable(): boolean {
  return (
    typeof window !== "undefined" &&
    "indexedDB" in window
  );
}

export async function saveCanvas(
  roomId: string,
  state: CanvasState
): Promise<void> {
  if (!isStorageAvailable()) {
    return;
  }

  if (!roomId.trim()) {
    throw new Error(
      "Cannot save canvas without a room ID."
    );
  }

  const database = await getDatabase();

  const record: StoredCanvas = {
    roomId,
    state,
    savedAt: Date.now(),
    schemaVersion: STORAGE_SCHEMA_VERSION
  };

  await new Promise<void>(
    (resolve, reject) => {
      const transaction =
        database.transaction(
          storageStores.canvas,
          "readwrite"
        );

      const store =
        transaction.objectStore(
          storageStores.canvas
        );

      store.put(record);

      transaction.oncomplete = () => {
        resolve();
      };

      transaction.onerror = () => {
        reject(
          transaction.error ??
            new Error(
              "Unable to save canvas."
            )
        );
      };

      transaction.onabort = () => {
        reject(
          transaction.error ??
            new Error(
              "Canvas storage transaction was aborted."
            )
        );
      };
    }
  );
}

export async function loadCanvas(
  roomId: string
): Promise<CanvasState | null> {
  if (!isStorageAvailable()) {
    return null;
  }

  if (!roomId.trim()) {
    return null;
  }

  const database = await getDatabase();

  return new Promise<CanvasState | null>(
    (resolve, reject) => {
      const transaction =
        database.transaction(
          storageStores.canvas,
          "readonly"
        );

      const store =
        transaction.objectStore(
          storageStores.canvas
        );

      const request = store.get(roomId);

      request.onsuccess = () => {
        const record =
          request.result as
            | StoredCanvas
            | undefined;

        if (!record) {
          resolve(null);
          return;
        }

        if (
          record.schemaVersion !==
          STORAGE_SCHEMA_VERSION
        ) {
          resolve(null);
          return;
        }

        resolve(record.state);
      };

      request.onerror = () => {
        reject(
          request.error ??
            new Error(
              "Unable to load canvas."
            )
        );
      };
    }
  );
}

export async function deleteCanvas(
  roomId: string
): Promise<void> {
  if (!isStorageAvailable()) {
    return;
  }

  if (!roomId.trim()) {
    return;
  }

  const database = await getDatabase();

  await new Promise<void>(
    (resolve, reject) => {
      const transaction =
        database.transaction(
          storageStores.canvas,
          "readwrite"
        );

      const store =
        transaction.objectStore(
          storageStores.canvas
        );

      store.delete(roomId);

      transaction.oncomplete = () => {
        resolve();
      };

      transaction.onerror = () => {
        reject(
          transaction.error ??
            new Error(
              "Unable to delete canvas."
            )
        );
      };

      transaction.onabort = () => {
        reject(
          transaction.error ??
            new Error(
              "Canvas deletion was aborted."
            )
        );
      };
    }
  );
}