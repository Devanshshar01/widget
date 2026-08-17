import {
  createHmac,
  timingSafeEqual
} from "node:crypto";

export interface RealtimeAuthPayload {
  readonly userId: string;
  readonly roomId: string;
  readonly memberId: string;
  readonly slot: "A" | "B";
  readonly exp: number;
}

function getSecret(): string {
  const secret =
    process.env.REALTIME_AUTH_SECRET;

  if (!secret) {
    throw new Error(
      "REALTIME_AUTH_SECRET is not configured."
    );
  }

  return secret;
}

function verifySignature(
  encoded: string,
  provided: string
): boolean {
  const expected =
    createHmac(
      "sha256",
      getSecret()
    )
      .update(encoded)
      .digest("base64url");

  const expectedBuffer =
    Buffer.from(expected);

  const providedBuffer =
    Buffer.from(provided);

  if (
    expectedBuffer.length !==
    providedBuffer.length
  ) {
    return false;
  }

  return timingSafeEqual(
    expectedBuffer,
    providedBuffer
  );
}

export function verifyRealtimeAuthToken(
  token: string
): RealtimeAuthPayload | null {
  const parts =
    token.split(".");

  if (parts.length !== 2) {
    return null;
  }

  const [
    encoded,
    signature
  ] = parts;

  if (
    !verifySignature(
      encoded,
      signature
    )
  ) {
    return null;
  }

  try {
    const payload =
      JSON.parse(
        Buffer
          .from(
            encoded,
            "base64url"
          )
          .toString("utf8")
      ) as RealtimeAuthPayload;

    if (
      !payload.userId ||
      !payload.roomId ||
      !payload.memberId ||
      !payload.slot ||
      !payload.exp
    ) {
      return null;
    }

    if (
      payload.slot !== "A" &&
      payload.slot !== "B"
    ) {
      return null;
    }

    if (
      payload.exp <
      Math.floor(Date.now() / 1000)
    ) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}
