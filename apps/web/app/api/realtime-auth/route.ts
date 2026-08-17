import { NextResponse } from "next/server";

import { getServerSession } from "@/lib/auth/session";
import {
  getCoupleSpaceMembership
} from "@/lib/couple-space/service";

import {
  createRealtimeAuthToken
} from "@/lib/realtime/auth-token";

export const runtime = "nodejs";

export async function GET() {
  try {
    const session =
      await getServerSession();

    if (!session) {
      return NextResponse.json(
        {
          authenticated: false,
          error: "UNAUTHENTICATED"
        },
        {
          status: 401
        }
      );
    }

    const membership =
      await getCoupleSpaceMembership(
        session.user.id
      );

    if (!membership) {
      return NextResponse.json(
        {
          authenticated: false,
          error: "NO_COUPLE_SPACE"
        },
        {
          status: 403
        }
      );
    }

    const authenticationToken =
      createRealtimeAuthToken({
        userId:
          session.user.id,

        roomId:
          membership.spaceId,

        memberId:
          membership.memberId,

        slot:
          membership.slot
      });

    return NextResponse.json({
      authenticated: true,

      user: {
        id:
          session.user.id,

        name:
          session.user.name,

        email:
          session.user.email
      },

      membership,

      authenticationToken
    });
  } catch (error) {
    console.error(
      "[REALTIME AUTH]",
      error
    );

    return NextResponse.json(
      {
        authenticated: false,
        error:
          "AUTHENTICATION_FAILED"
      },
      {
        status: 500
      }
    );
  }
}
