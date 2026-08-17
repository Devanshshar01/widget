import {
  NextResponse
} from "next/server";

import {
  getServerSession
} from "@/lib/auth/session";

import {
  getCoupleSpaceMembership
} from "@/lib/couple-space/service";

import {
  getCanvasState,
  saveCanvasState
} from "@/lib/canvas/service";

export const runtime =
  "nodejs";

export async function GET() {
  try {
    const session =
      await getServerSession();

    if (!session) {
      return NextResponse.json(
        {
          error:
            "UNAUTHENTICATED"
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
          error:
            "NO_COUPLE_SPACE"
        },
        {
          status: 403
        }
      );
    }

    const state =
      await getCanvasState(
        membership.spaceId
      );

    return NextResponse.json({
      state
    });
  } catch (error) {
    console.error(
      "[CANVAS GET]",
      error
    );

    return NextResponse.json(
      {
        error:
          "CANVAS_LOAD_FAILED"
      },
      {
        status: 500
      }
    );
  }
}

export async function PUT(
  request: Request
) {
  try {
    const session =
      await getServerSession();

    if (!session) {
      return NextResponse.json(
        {
          error:
            "UNAUTHENTICATED"
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
          error:
            "NO_COUPLE_SPACE"
        },
        {
          status: 403
        }
      );
    }

    const body =
      await request.json();

    if (
      !body ||
      typeof body !==
        "object" ||
      !body.state
    ) {
      return NextResponse.json(
        {
          error:
            "INVALID_CANVAS_STATE"
        },
        {
          status: 400
        }
      );
    }

    await saveCanvasState(
      membership.spaceId,
      body.state
    );

    return NextResponse.json({
      success: true
    });
  } catch (error) {
    console.error(
      "[CANVAS PUT]",
      error
    );

    return NextResponse.json(
      {
        error:
          "CANVAS_SAVE_FAILED"
      },
      {
        status: 500
      }
    );
  }
}
