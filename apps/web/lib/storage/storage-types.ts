import type { CanvasState } from "@/types/canvas";

export const STORAGE_SCHEMA_VERSION = 1 as const;

export interface StoredCanvas {
  readonly roomId: string;
  readonly state: CanvasState;
  readonly savedAt: number;
  readonly schemaVersion: typeof STORAGE_SCHEMA_VERSION;
}

export interface StoredPendingOperation {
  readonly id: string;
  readonly roomId: string;
  readonly operation: unknown;
  readonly createdAt: number;
  readonly attempts: number;
}

export interface StoredSession {
  readonly roomId: string;
  readonly userId: string;
  readonly role: "owner" | "partner";
  readonly savedAt: number;
}

export interface StorageDatabase {
  readonly name: string;
  readonly version: number;
}