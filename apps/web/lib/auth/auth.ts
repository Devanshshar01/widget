import {
  betterAuth
} from "better-auth";

import {
  drizzleAdapter
} from "@better-auth/drizzle-adapter";

import {
  db
} from "@/lib/db";

import * as schema
  from "@/lib/db/schema";

export const auth =
  betterAuth({
    database:
      drizzleAdapter(
        db,
        {
          provider: "pg",
          schema
        }
      ),

    emailAndPassword: {
      enabled: true
    },

    session: {
      expiresIn:
        60 * 60 * 24 * 30,

      updateAge:
        60 * 60 * 24
    }
  });