import {
  NextResponse
} from "next/server";

import {
  headers
} from "next/headers";

import {
  auth
} from "@/lib/auth/auth";

import {
  createInvitation
} from "@/lib/couple-space/invitation-service";

interface CreateInvitationBody {
  readonly invitedEmail?: unknown;
}

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

  let body: CreateInvitationBody =
    {};

  try {
    body =
      (await request.json()) as
        CreateInvitationBody;
  } catch {
    /*
     * Empty request bodies are valid.
     */
  }

  const invitedEmail =
    typeof body.invitedEmail ===
    "string"
      ? body.invitedEmail
          .trim()
          .toLowerCase()
      : undefined;

  try {
    const result =
  invitedEmail
    ? await createInvitation({
        userId:
          session.user.id,

          invitedEmail
      })
    : await createInvitation({
        userId:
          session.user.id
      });

    const origin =
      request.headers.get(
        "origin"
      ) ??
      new URL(
        request.url
      ).origin;

    const invitationUrl =
      new URL(
        `/invite/${result.token}`,
        origin
      ).toString();

    return NextResponse.json(
      {
        invitationId:
          result.invitationId,

        invitationUrl,

        expiresAt:
          result.expiresAt.toISOString()
      },
      {
        status: 201
      }
    );
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Unable to create invitation.";

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