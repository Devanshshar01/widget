import {
  headers
} from "next/headers";

import {
  NextResponse
} from "next/server";

import {
  auth
} from "@/lib/auth/auth";

import {
  joinCoupleSpace
} from "@/lib/couple-space/join-service";

import {
  z
} from "zod";

const joinInvitationSchema =
  z.object({
    token:
      z.string()
        .trim()
        .min(
          1,
          "Invitation token is required."
        )
  });

export async function POST(
  request: Request
) {
  const session =
    await auth.api.getSession({
      headers:
        await headers()
    });

  if (!session) {
    return NextResponse.json(
      {
        error:
          "Authentication required."
      },
      {
        status: 401
      }
    );
  }

  let body: unknown;

  try {
    body =
      await request.json();
  } catch {
    return NextResponse.json(
      {
        error:
          "Invalid request body."
      },
      {
        status: 400
      }
    );
  }

  const parsed =
    joinInvitationSchema.safeParse(
      body
    );

  if (!parsed.success) {
    return NextResponse.json(
      {
        error:
          parsed.error.issues[0]?.message ??
          "Invalid invitation."
      },
      {
        status: 400
      }
    );
  }

  try {
    const result =
      await joinCoupleSpace(
        parsed.data.token,
        session.user.id
      );

    return NextResponse.json(
      result,
      {
        status: 200
      }
    );
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Unable to join Couple Space.";

    return NextResponse.json(
      {
        error: message
      },
      {
        status: 400
      }
    );
  }
}