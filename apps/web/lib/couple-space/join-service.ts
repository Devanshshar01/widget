import {
  and,
  eq,
  gt,
  isNull
} from "drizzle-orm";

import {
  db
} from "@/lib/db";

import {
  coupleMember,
  invitation
} from "@/lib/db/app-schema";

interface InvitationRecord {
  readonly id: string;
  readonly spaceId: string;
  readonly createdBy: string;
  readonly expiresAt: Date;
}

export interface JoinCoupleSpaceResult {
  readonly spaceId: string;
  readonly memberId: string;
  readonly slot: "B";
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

async function findValidInvitation(
  tokenHash: string
): Promise<InvitationRecord | null> {
  const rows =
    await db
      .select({
        id:
          invitation.id,

        spaceId:
          invitation.spaceId,

        createdBy:
          invitation.createdBy,

        expiresAt:
          invitation.expiresAt
      })
      .from(invitation)
      .where(
        and(
          eq(
            invitation.tokenHash,
            tokenHash
          ),

          isNull(
            invitation.consumedAt
          ),

          isNull(
            invitation.revokedAt
          ),

          gt(
            invitation.expiresAt,
            new Date()
          )
        )
      )
      .limit(1);

  return (
    rows[0] ??
    null
  );
}

export async function joinCoupleSpace(
  token: string,
  userId: string
): Promise<JoinCoupleSpaceResult> {
  if (!token) {
    throw new Error(
      "Invitation token is required."
    );
  }

  if (!userId) {
    throw new Error(
      "Authentication is required."
    );
  }

  const tokenHash =
    await hashToken(token);

  const invitationRecord =
    await findValidInvitation(
      tokenHash
    );

  if (!invitationRecord) {
    throw new Error(
      "This invitation is invalid or has expired."
    );
  }

  /*
   * A user who already belongs to a space
   * cannot join another Couple Space.
   */
  const existingMembership =
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

  const existing =
    existingMembership[0];

  if (existing) {
    if (
      existing.spaceId ===
      invitationRecord.spaceId
    ) {
      throw new Error(
        "You are already a member of this Couple Space."
      );
    }

    throw new Error(
      "You already belong to another Couple Space."
    );
  }

  const memberId =
    `member_${crypto.randomUUID()}`;

  try {
    await db.transaction(
      async (tx) => {
        /*
         * Re-check the invitation inside the
         * transaction. The initial lookup happened
         * before the transaction and must not be
         * trusted for the final write.
         */
        const currentInvitation =
          await tx
            .select({
              id:
                invitation.id,

              spaceId:
                invitation.spaceId
            })
            .from(invitation)
            .where(
              and(
                eq(
                  invitation.id,
                  invitationRecord.id
                ),

                isNull(
                  invitation.consumedAt
                ),

                isNull(
                  invitation.revokedAt
                ),

                gt(
                  invitation.expiresAt,
                  new Date()
                )
              )
            )
            .limit(1);

        if (
          !currentInvitation[0]
        ) {
          throw new Error(
            "This invitation is no longer available."
          );
        }

        /*
         * The space must have fewer than two members.
         */
        const members =
          await tx
            .select({
              id:
                coupleMember.id
            })
            .from(coupleMember)
            .where(
              eq(
                coupleMember.spaceId,
                invitationRecord.spaceId
              )
            );

        if (
          members.length >= 2
        ) {
          throw new Error(
            "This Couple Space is already full."
          );
        }

        /*
         * The invitation creator is expected to
         * occupy slot A. The joining user becomes B.
         */
        const slotBExists =
          await tx
            .select({
              id:
                coupleMember.id
            })
            .from(coupleMember)
            .where(
              and(
                eq(
                  coupleMember.spaceId,
                  invitationRecord.spaceId
                ),

                eq(
                  coupleMember.slot,
                  "B"
                )
              )
            )
            .limit(1);

        if (slotBExists[0]) {
          throw new Error(
            "This Couple Space already has a partner."
          );
        }

        await tx
          .insert(coupleMember)
          .values({
            id:
              memberId,

            spaceId:
              invitationRecord.spaceId,

            userId,

            slot: "B"
          });

        const consumed =
          await tx
            .update(invitation)
            .set({
              consumedAt:
                new Date()
            })
            .where(
              and(
                eq(
                  invitation.id,
                  invitationRecord.id
                ),

                isNull(
                  invitation.consumedAt
                )
              )
            )
            .returning({
              id:
                invitation.id
            });

        if (!consumed[0]) {
          throw new Error(
            "The invitation was consumed by another request."
          );
        }
      }
    );
  } catch (error) {
    throw error;
  }

  return {
    spaceId:
      invitationRecord.spaceId,

    memberId,

    slot: "B"
  };
}