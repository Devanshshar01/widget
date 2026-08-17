import type {
  StorageDatabase
} from "@/lib/storage/storage-types";

const DATABASE_NAME = "couple-space";
const DATABASE_VERSION = 1;

const CANVAS_STORE = "canvas";
const SESSION_STORE = "session";
const OPERATIONS_STORE = "operations";

let databasePromise: Promise<IDBDatabase> | null = null;

function isIndexedDBAvailable(): boolean {
  return (
    typeof window !== "undefined" &&
    "indexedDB" in window
  );
}

function openDatabase(): Promise<IDBDatabase> {
  if (!isIndexedDBAvailable()) {
    return Promise.reject(
      new Error(
        "IndexedDB is not available in this environment."
      )
    );
  }

  if (databasePromise) {
    return databasePromise;
  }

  databasePromise = new Promise(
    (resolve, reject) => {
      const request = indexedDB.open(
        DATABASE_NAME,
        DATABASE_VERSION
      );

      request.onerror = () => {
        databasePromise = null;

        reject(
          request.error ??
            new Error(
              "Unable to open IndexedDB."
            )
        );
      };

      request.onupgradeneeded = () => {
        const database = request.result;

        if (
          !database.objectStoreNames.contains(
            CANVAS_STORE
          )
        ) {
          database.createObjectStore(
            CANVAS_STORE,
            {
              keyPath: "roomId"
            }
          );
        }

        if (
          !database.objectStoreNames.contains(
            SESSION_STORE
          )
        ) {
          database.createObjectStore(
            SESSION_STORE,
            {
              keyPath: "roomId"
            }
          );
        }

        if (
          !database.objectStoreNames.contains(
            OPERATIONS_STORE
          )
        ) {
          const store =
            database.createObjectStore(
              OPERATIONS_STORE,
              {
                keyPath: "id"
              }
            );

          store.createIndex(
            "roomId",
            "roomId",
            {
              unique: false
            }
          );
        }
      };

      request.onsuccess = () => {
        const database = request.result;

        database.onversionchange = () => {
          database.close();
          databasePromise = null;
        };

        resolve(database);
      };
    }
  );

  return databasePromise;
}

export async function getStorageDatabase(): Promise<
  StorageDatabase
> {
  await openDatabase();

  return {
    name: DATABASE_NAME,
    version: DATABASE_VERSION
  };
}

export async function getDatabase(): Promise<IDBDatabase> {
  return openDatabase();
}

export const storageStores = {
  canvas: CANVAS_STORE,
  session: SESSION_STORE,
  operations: OPERATIONS_STORE
} as const;