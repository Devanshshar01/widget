import type { WebSocket } from "ws";

export interface RoomConnection {
  readonly connectionId: string;
  readonly userId: string;
  readonly memberId: string;
  readonly slot: "A" | "B";
  readonly socket: WebSocket;
}

export class RoomManager {
  private readonly rooms =
    new Map<string, Map<string, RoomConnection>>();

  public joinRoom(
    roomId: string,
    connection: RoomConnection
  ): boolean {
    let room =
      this.rooms.get(roomId);

    if (!room) {
      room =
        new Map();

      this.rooms.set(
        roomId,
        room
      );
    }

    if (
      room.has(connection.userId)
    ) {
      return false;
    }

    if (room.size >= 2) {
      return false;
    }

    room.set(
      connection.userId,
      connection
    );

    return true;
  }

  public leaveRoom(
    roomId: string,
    userId: string
  ): void {
    const room =
      this.rooms.get(roomId);

    if (!room) {
      return;
    }

    room.delete(userId);

    if (room.size === 0) {
      this.rooms.delete(roomId);
    }
  }

  public broadcast(
    roomId: string,
    message: unknown,
    excludeUserId?: string
  ): void {
    const room =
      this.rooms.get(roomId);

    if (!room) {
      return;
    }

    const serialized =
      JSON.stringify(message);

    for (const connection of room.values()) {
      if (
        connection.userId ===
        excludeUserId
      ) {
        continue;
      }

      if (
        connection.socket.readyState ===
        connection.socket.OPEN
      ) {
        connection.socket.send(
          serialized
        );
      }
    }
  }

  public getParticipants(
    roomId: string
  ): Array<{
    userId: string;
    memberId: string;
    slot: "A" | "B";
  }> {
    const room =
      this.rooms.get(roomId);

    if (!room) {
      return [];
    }

    return Array.from(
      room.values()
    ).map(
      ({
        userId,
        memberId,
        slot
      }) => ({
        userId,
        memberId,
        slot
      })
    );
  }

  public getRoomSize(
    roomId: string
  ): number {
    return (
      this.rooms.get(roomId)
        ?.size ?? 0
    );
  }
}
