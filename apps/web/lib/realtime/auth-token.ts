import {
  createHmac
} from "node:crypto";

const TOKEN_TTL_SECONDS = 60;

function getSecret(): string {
  const secret =
    process.env["REALTIME_AUTH_SECRET"];

  if (!secret) {
    throw new Error(
      "REALTIME_AUTH_SECRET is not configured."
    );
  }

  return secret;
}

function base64url(
  value: string
): string {
  return Buffer
    .from(value)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function sign(
  payload: string
): string {
  return createHmac(
    "sha256",
    getSecret()
  )
    .update(payload)
    .digest("base64url");
}

export interface RealtimeAuthPayload {
  readonly userId: string;
  readonly roomId: string;
  readonly memberId: string;
  readonly slot: "A" | "B";
  readonly exp: number;
}

export function createRealtimeAuthToken(
  payload: Omit<
    RealtimeAuthPayload,
    "exp"
  >
): string {
  const body: RealtimeAuthPayload = {
    ...payload,
    exp:
      Math.floor(Date.now() / 1000) +
      TOKEN_TTL_SECONDS
  };

  const encoded =
    base64url(
      JSON.stringify(body)
    );

  const signature =
    sign(encoded);

  return `${encoded}.${signature}`;
}
