"use client";

import {
  useState
} from "react";

interface InvitationResponse {
  readonly invitationId: string;
  readonly invitationUrl: string;
  readonly expiresAt: string;
}

export function InvitePerson() {
  const [
    invitation,
    setInvitation
  ] = useState<InvitationResponse | null>(
    null
  );

  const [
    isCreating,
    setIsCreating
  ] = useState(false);

  const [
    isCopied,
    setIsCopied
  ] = useState(false);

  const [
    error,
    setError
  ] = useState<string | null>(
    null
  );

  async function createInvitation() {
    if (isCreating) {
      return;
    }

    setIsCreating(true);
    setError(null);
    setIsCopied(false);

    try {
      const response =
        await fetch(
          "/api/couple-space/invitation",
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json"
            },
            body: JSON.stringify({})
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ??
            "Unable to create an invitation."
        );
      }

      setInvitation(
        data as InvitationResponse
      );
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Something went wrong."
      );
    } finally {
      setIsCreating(false);
    }
  }

  async function copyInvitation() {
    if (!invitation) {
      return;
    }

    try {
      await navigator.clipboard.writeText(
        invitation.invitationUrl
      );

      setIsCopied(true);

      window.setTimeout(() => {
        setIsCopied(false);
      }, 2200);
    } catch {
      setError(
        "Unable to copy the invitation. Please copy it manually."
      );
    }
  }

  const expiresAt =
    invitation
      ? new Date(
          invitation.expiresAt
        ).toLocaleDateString(
          undefined,
          {
            day: "numeric",
            month: "short",
            year: "numeric"
          }
        )
      : null;

  return (
    <div className="invite-person">
      {!invitation ? (
        <>
          <div className="invite-person-copy">
            <p className="invite-person-title">
              Invite your person
            </p>

            <p className="invite-person-description">
              Create a private invitation and
              send it to the person you want
              to share this space with.
            </p>
          </div>

          {error && (
            <p
              className="auth-error"
              role="alert"
            >
              {error}
            </p>
          )}

          <button
            type="button"
            className="auth-submit"
            onClick={
              createInvitation
            }
            disabled={isCreating}
          >
            {isCreating
              ? "Creating invitation…"
              : "Create invitation"}
          </button>

          <p className="invite-person-note">
            Your invitation will remain valid
            for 7 days.
          </p>
        </>
      ) : (
        <>
          <div className="invite-person-copy">
            <p className="invite-person-title">
              Your invitation is ready ♡
            </p>

            <p className="invite-person-description">
              Send this private link to your
              person. Once they join, you&apos;ll
              share the same Couple Space.
            </p>
          </div>

          <div className="invite-link-box">
            <span>
              {invitation.invitationUrl}
            </span>
          </div>

          {error && (
            <p
              className="auth-error"
              role="alert"
            >
              {error}
            </p>
          )}

          <button
            type="button"
            className="auth-submit"
            onClick={
              copyInvitation
            }
          >
            {isCopied
              ? "Invitation copied ✓"
              : "Copy invitation"}
          </button>

          {expiresAt && (
            <p className="invite-person-note">
              This invitation expires on{" "}
              {expiresAt}.
            </p>
          )}

          <button
            type="button"
            className="auth-switch-button"
            onClick={() => {
              setInvitation(null);
              setError(null);
              setIsCopied(false);
            }}
          >
            Create another invitation
          </button>
        </>
      )}
    </div>
  );
}