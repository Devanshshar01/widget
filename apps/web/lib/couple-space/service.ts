import {
  eq,
  count
} from "drizzle-orm";

import {
  db
} from "@/lib/db";

import {
  coupleMember,
  coupleSpace
} from "@/lib/db/app-schema";

export interface CoupleSpaceMembership {
  readonly spaceId: string;
  readonly memberId: string;
  readonly slot: "A" | "B";
}

function createId(
  prefix: string
): string {
  return `${prefix}_${crypto.randomUUID()}`;
}

export async function getCoupleSpaceMembership(
  userId: string
): Promise<CoupleSpaceMembership | null> {
  const rows =
    await db
      .select({
        spaceId:
          coupleMember.spaceId,

        memberId:
          coupleMember.id,

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

  const membership =
    rows[0];

  if (!membership) {
    return null;
  }

  if (
    membership.slot !== "A" &&
    membership.slot !== "B"
  ) {
    throw new Error(
      "Invalid Couple Space membership slot."
    );
  }

  return {
    spaceId:
      membership.spaceId,

    memberId:
      membership.memberId,

    slot:
      membership.slot
  };
}

export async function getCoupleSpaceMemberCount(
  spaceId: string
): Promise<number> {
  const rows =
    await db
      .select({
        count:
          count(coupleMember.id)
      })
      .from(coupleMember)
      .where(
        eq(
          coupleMember.spaceId,
          spaceId
        )
      );

  return Number(
    rows[0]?.count ?? 0
  );
}

function isUniqueViolation(
  error: unknown
): boolean {
  if (
    typeof error !== "object" ||
    error === null
  ) {
    return false;
  }

  return (
    "code" in error &&
    error.code === "23505"
  );
}

export async function createCoupleSpace(
  userId: string
): Promise<CoupleSpaceMembership> {
  /*
   * Never create a second Couple Space for a user.
   *
   * This check also makes the function safe to call
   * repeatedly from the UI.
   */
  const existing =
    await getCoupleSpaceMembership(
      userId
    );

  if (existing) {
    return existing;
  }

  const spaceId =
    createId("space");

  const memberId =
    createId("member");

  try {
    await db.transaction(
      async (tx) => {
        await tx
          .insert(coupleSpace)
          .values({
            id:
              spaceId
          });

        await tx
          .insert(coupleMember)
          .values({
            id:
              memberId,

            spaceId,

            userId,

            slot: "A"
          });
      }
    );

    return {
      spaceId,
      memberId,
      slot: "A"
    };
  } catch (error) {
    /*
     * The unique user membership index protects us
     * from two simultaneous create requests.
     *
     * If another request won the race, simply return
     * that membership instead of creating another one.
     */
    if (
      !isUniqueViolation(error)
    ) {
      throw error;
    }

    const winner =
      await getCoupleSpaceMembership(
        userId
      );

    if (!winner) {
      throw error;
    }

    return winner;
  }
}