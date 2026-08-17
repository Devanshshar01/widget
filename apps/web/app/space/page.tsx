import type {
  Metadata
} from "next";

import {
  CanvasShell
} from "@/components/canvas/canvas-shell";

import {
  SpaceHeader
} from "@/components/couple-space/space-header";

import {
  SpaceOnboarding
} from "@/components/couple-space/space-onboarding";

import {
  requireServerSession
} from "@/lib/auth/session";

import {
  getCoupleSpaceMemberCount,
  getCoupleSpaceMembership
} from "@/lib/couple-space/service";

export const metadata: Metadata = {
  title: "Our Space",
  description:
    "Your private shared Couple Space."
};

export default async function SpacePage() {
  const session =
    await requireServerSession();

  const membership =
    await getCoupleSpaceMembership(
      session.user.id
    );

  /*
   * A newly authenticated user does not
   * automatically receive a Couple Space.
   */
  if (!membership) {
    return (
      <SpaceOnboarding />
    );
  }

  const memberCount =
    await getCoupleSpaceMemberCount(
      membership.spaceId
    );

  const canInvite =
    membership.slot === "A" &&
    memberCount < 2;

  return (
    <main className="space-page">
      <SpaceHeader
        userName={
          session.user.name ||
          "Your account"
        }
        userEmail={
          session.user.email
        }
        canInvite={canInvite}
      />

      <div className="space-canvas">
        <CanvasShell
          roomId={
            membership.spaceId
          }
        />
      </div>
    </main>
  );
}

