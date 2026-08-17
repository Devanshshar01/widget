import type {
  Metadata
} from "next";

import {
  headers
} from "next/headers";

import {
  redirect
} from "next/navigation";

import {
  auth
} from "@/lib/auth/auth";

import {
  JoinInvitationButton
} from "@/components/couple-space/join-invitation-button";

import {
  InvitationBackground
} from "@/components/couple-space/invitation-background";

interface InvitationPageProps {
  readonly params: Promise<{
    token: string;
  }>;
}

export const metadata: Metadata = {
  title: "You're Invited | Couple Space",
  description:
    "You've been invited to join a private Couple Space."
};

export default async function InvitationPage({
  params
}: InvitationPageProps) {
  const {
    token
  } = await params;

  if (!token) {
    redirect("/auth");
  }

  const session =
    await auth.api.getSession({
      headers:
        await headers()
    });

  if (!session) {
    const redirectPath =
      `/invite/${encodeURIComponent(
        token
      )}`;

    redirect(
      `/auth?redirect=${encodeURIComponent(
        redirectPath
      )}`
    );
  }

  return (
    <main className="invitation-screen">
      <InvitationBackground />

      <section
        className="invitation-card"
        aria-labelledby="invitation-title"
      >
        <div
          className="auth-mark"
          aria-hidden="true"
        >
          ♡
        </div>

        <p className="auth-eyebrow">
          Couple Space
        </p>

        <h1
          id="invitation-title"
          className="auth-title"
        >
          You&apos;ve been invited
        </h1>

        <p className="auth-description">
          Someone wants to share their
          private space with you.
        </p>

        <div className="invitation-message">
          <span
            className="invitation-message-icon"
            aria-hidden="true"
          >
            ✦
          </span>

          <p>
            A little corner of the internet,
            made just for two.
          </p>
        </div>

        <JoinInvitationButton
          token={token}
        />

        <p className="invitation-helper">
          By joining, you'll become part of
          this private Couple Space.
        </p>
      </section>
    </main>
  );
}