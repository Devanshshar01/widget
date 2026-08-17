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
  createCoupleSpace
} from "@/lib/couple-space/service";

export async function POST() {
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

  try {
    const membership =
      await createCoupleSpace(
        session.user.id
      );

    return NextResponse.json(
      membership,
      {
        status: 200
      }
    );
  } catch (error) {
    console.error(
      "Failed to create Couple Space:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Unable to create Couple Space."
      },
      {
        status: 500
      }
    );
  }
}