/**
 * Types related to users, rooms, and realtime presence.
 *
 * Couple Space is intentionally limited to two participants per room.
 */

export type ConnectionState =
  | "connecting"
  | "connected"
  | "reconnecting"
  | "disconnected";

export type PresenceStatus =
  | "online"
  | "away"
  | "offline";

export type UserRole =
  | "owner"
  | "partner";

export interface UserProfile {
  readonly id: string;
  readonly displayName: string;
  readonly avatarUrl: string | null;
}

export interface RoomParticipant {
  readonly user: UserProfile;
  readonly role: UserRole;
  readonly joinedAt: number;
  readonly lastSeenAt: number;
  readonly presence: PresenceStatus;
}

export interface Room {
  readonly id: string;
  readonly participants: readonly RoomParticipant[];
  readonly createdAt: number;
}

export interface LocalSession {
  readonly userId: string;
  readonly roomId: string;
  readonly role: UserRole;
}

export interface PresenceState {
  readonly userId: string;
  readonly status: PresenceStatus;
  readonly lastSeenAt: number;
}

export interface RealtimeConnectionState {
  readonly state: ConnectionState;
  readonly connectedAt: number | null;
  readonly lastDisconnectedAt: number | null;
  readonly reconnectAttempt: number;
}