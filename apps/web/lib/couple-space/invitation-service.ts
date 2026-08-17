import {
  eq
} from "drizzle-orm";

import {
  db
} from "@/lib/db";

import {
  coupleMember,
  invitation
} from "@/lib/db/app-schema";

interface CreateInvitationInput {
  readonly userId: string;
  readonly invitedEmail?: string;
}

export interface CreatedInvitation {
  readonly invitationId: string;
  readonly token: string;
  readonly expiresAt: Date;
}

const INVITATION_TTL_MS =
  7 * 24 * 60 * 60 * 1000;

const INVITATION_TOKEN_BYTES =
  32;

function generateToken(): string {
  const bytes =
    crypto.getRandomValues(
      new Uint8Array(
        INVITATION_TOKEN_BYTES
      )
    );

  return Buffer
    .from(bytes)
    .toString("base64url");
}

async function hashToken(
  token: string
): Promise<string> {
  const encoded =
    new TextEncoder().encode(
      token
    );

  const digest =
    await crypto.subtle.digest(
      "SHA-256",
      encoded
    );

  return Buffer
    .from(digest)
    .toString("hex");
}

async function getMembership(
  userId: string
) {
  const rows =
    await db
      .select({
        id:
          coupleMember.id,

        spaceId:
          coupleMember.spaceId,

        slot:
          coupleMember.slot
      })
      .from(coupleMember)
      .where(
        eq(
          coupleMember.userId,
          userId
        )
      )
      .limit(1);

  return rows[0] ?? null;
}

export async function createInvitation(
  input: CreateInvitationInput
): Promise<CreatedInvitation> {
  const membership =
    await getMembership(
      input.userId
    );

  if (!membership) {
    throw new Error(
      "You do not belong to a Couple Space."
    );
  }

  if (
    membership.slot !== "A"
  ) {
    throw new Error(
      "Only the Couple Space creator can create an invitation."
    );
  }

  const members =
    await db
      .select({
        id:
          coupleMember.id
      })
      .from(coupleMember)
      .where(
        eq(
          coupleMember.spaceId,
          membership.spaceId
        )
      );

  if (
    members.length >= 2
  ) {
    throw new Error(
      "This Couple Space already has two members."
    );
  }

  const token =
    generateToken();

  const tokenHash =
    await hashToken(token);

  const expiresAt =
    new Date(
      Date.now() +
        INVITATION_TTL_MS
    );

  const invitationId =
    `invite_${crypto.randomUUID()}`;

  await db
    .insert(invitation)
    .values({
      id:
        invitationId,

      spaceId:
        membership.spaceId,

      createdBy:
        input.userId,

      tokenHash,

      invitedEmail:
        input.invitedEmail ??
        null,

      expiresAt
    });

  return {
    invitationId,
    token,
    expiresAt
  };
}