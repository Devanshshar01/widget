import {
  relations
} from "drizzle-orm";

import {
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex
} from "drizzle-orm/pg-core";

import {
  user
} from "./auth-schema";

export const coupleSpace =
  pgTable(
    "couple_space",
    {
      id: text("id")
        .primaryKey(),

      createdAt:
        timestamp(
          "created_at"
        )
          .defaultNow()
          .notNull(),

      updatedAt:
        timestamp(
          "updated_at"
        )
          .defaultNow()
          .$onUpdate(
            () => new Date()
          )
          .notNull()
    }
  );

export const coupleMember =
  pgTable(
    "couple_member",
    {
      id: text("id")
        .primaryKey(),

      spaceId:
        text("space_id")
          .notNull()
          .references(
            () =>
              coupleSpace.id,
            {
              onDelete:
                "cascade"
            }
          ),

      userId:
        text("user_id")
          .notNull()
          .references(
            () =>
              user.id,
            {
              onDelete:
                "cascade"
            }
          ),

      slot:
        text("slot")
          .notNull(),

      joinedAt:
        timestamp(
          "joined_at"
        )
          .defaultNow()
          .notNull()
    },
    (table) => [
      uniqueIndex(
        "couple_member_space_user_idx"
      ).on(
        table.spaceId,
        table.userId
      ),

      uniqueIndex(
        "couple_member_space_slot_idx"
      ).on(
        table.spaceId,
        table.slot
      ),

      uniqueIndex(
        "couple_member_user_unique_idx"
      ).on(
        table.userId
      )
    ]
  );

export const invitation =
  pgTable(
    "invitation",
    {
      id: text("id")
        .primaryKey(),

      spaceId:
        text("space_id")
          .notNull()
          .references(
            () =>
              coupleSpace.id,
            {
              onDelete:
                "cascade"
            }
          ),

      createdBy:
        text("created_by")
          .notNull()
          .references(
            () =>
              user.id,
            {
              onDelete:
                "cascade"
            }
          ),

      tokenHash:
        text("token_hash")
          .notNull()
          .unique(),

      invitedEmail:
        text("invited_email"),

      expiresAt:
        timestamp(
          "expires_at"
        )
          .notNull(),

      consumedAt:
        timestamp(
          "consumed_at"
        ),

      revokedAt:
        timestamp(
          "revoked_at"
        ),

      createdAt:
        timestamp(
          "created_at"
        )
          .defaultNow()
          .notNull()
    },
    (table) => [
      index(
        "invitation_space_idx"
      ).on(
        table.spaceId
      ),

      index(
        "invitation_creator_idx"
      ).on(
        table.createdBy
      ),

      index(
        "invitation_expires_idx"
      ).on(
        table.expiresAt
      )
    ]
  );

/*
 * One persistent canvas per Couple Space.
 *
 * The complete CanvasState is stored as JSON.
 * Realtime operations are transported through
 * the WebSocket server and the latest state is
 * persisted here.
 */
export const canvasState =
  pgTable(
    "canvas_state",
    {
      id:
        text("id")
          .primaryKey(),

      spaceId:
        text("space_id")
          .notNull()
          .references(
            () =>
              coupleSpace.id,
            {
              onDelete:
                "cascade"
            }
          ),

      version:
        integer("version")
          .notNull()
          .default(0),

      state:
        jsonb("state")
          .notNull()
          .default({
            id: "",
            version: 0,
            elements: [],
            updatedAt: 0
          }),

      createdAt:
        timestamp(
          "created_at"
        )
          .defaultNow()
          .notNull(),

      updatedAt:
        timestamp(
          "updated_at"
        )
          .defaultNow()
          .$onUpdate(
            () => new Date()
          )
          .notNull()
    },
    (table) => [
      uniqueIndex(
        "canvas_state_space_idx"
      ).on(
        table.spaceId
      )
    ]
  );

export const coupleSpaceRelations =
  relations(
    coupleSpace,
    ({ many, one }) => ({
      members:
        many(coupleMember),

      invitations:
        many(invitation),

      canvasState:
        one(canvasState)
    })
  );

export const coupleMemberRelations =
  relations(
    coupleMember,
    ({ one }) => ({
      space: one(
        coupleSpace,
        {
          fields: [
            coupleMember.spaceId
          ],

          references: [
            coupleSpace.id
          ]
        }
      ),

      user: one(
        user,
        {
          fields: [
            coupleMember.userId
          ],

          references: [
            user.id
          ]
        }
      )
    })
  );

export const invitationRelations =
  relations(
    invitation,
    ({ one }) => ({
      space: one(
        coupleSpace,
        {
          fields: [
            invitation.spaceId
          ],

          references: [
            coupleSpace.id
          ]
        }
      ),

      creator: one(
        user,
        {
          fields: [
            invitation.createdBy
          ],

          references: [
            user.id
          ]
        }
      )
    })
  );

export const canvasStateRelations =
  relations(
    canvasState,
    ({ one }) => ({
      space: one(
        coupleSpace,
        {
          fields: [
            canvasState.spaceId
          ],

          references: [
            coupleSpace.id
          ]
        }
      )
    })
  );
