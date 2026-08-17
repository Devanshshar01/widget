"use client";

import {
  useEffect,
  useRef,
  useState
} from "react";

import {
  useRouter
} from "next/navigation";

import {
  authClient
} from "@/lib/auth/auth-client";

interface SpaceHeaderProps {
  readonly userName: string;
  readonly userEmail: string;
  readonly canInvite: boolean;
}

interface InvitationResponse {
  readonly invitationUrl?: string;
  readonly expiresAt?: string;
  readonly error?: string;
}

function HeartIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="space-header-icon"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20.8 8.7c0 5.1-8.8 10-8.8 10s-8.8-4.9-8.8-10A4.7 4.7 0 0 1 8 4a4.5 4.5 0 0 1 4 2.4A4.5 4.5 0 0 1 16 4a4.7 4.7 0 0 1 4.8 4.7Z" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="space-header-button-icon"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}


function CopyIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="space-copy-icon"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="8" y="8" width="11" height="11" rx="2" />
      <path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="space-close-icon"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
    >
      <path d="m6 6 12 12M18 6 6 18" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="space-success-icon"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m5 12 4 4L19 7" />
    </svg>
  );
}

function formatExpiry(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Valid for 7 days";
  }

  return `Expires ${date.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short"
  })}`;
}

export function SpaceHeader({
  userName,
  userEmail,
  canInvite
}: SpaceHeaderProps) {
  const router = useRouter();

  const [isProfileOpen, setIsProfileOpen] =
    useState(false);

  const [isInviteOpen, setIsInviteOpen] =
    useState(false);

  const [isCreatingInvite, setIsCreatingInvite] =
    useState(false);

  const [invitationUrl, setInvitationUrl] =
    useState<string | null>(null);

  const [expiresAt, setExpiresAt] =
    useState<string | null>(null);

  const [error, setError] =
    useState<string | null>(null);

  const [copied, setCopied] =
    useState(false);

  const profileRef = useRef<HTMLDivElement>(null);

  const initials =
    userName.trim().charAt(0).toUpperCase() || "♡";

  useEffect(() => {
    if (!isProfileOpen) {
      return;
    }

    function handlePointerDown(event: PointerEvent) {
      const target = event.target;

      if (
        target instanceof Node &&
        profileRef.current?.contains(target)
      ) {
        return;
      }

      setIsProfileOpen(false);
    }

    document.addEventListener(
      "pointerdown",
      handlePointerDown
    );

    return () => {
      document.removeEventListener(
        "pointerdown",
        handlePointerDown
      );
    };
  }, [isProfileOpen]);

  useEffect(() => {
    if (!isInviteOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsInviteOpen(false);
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isInviteOpen]);

  function openInvite() {
    setIsProfileOpen(false);
    setError(null);
    setCopied(false);
    setIsInviteOpen(true);
  }

  function closeInvite() {
    if (isCreatingInvite) {
      return;
    }

    setIsInviteOpen(false);
  }

  async function createInvitation() {
    if (isCreatingInvite) {
      return;
    }

    setIsCreatingInvite(true);
    setError(null);
    setCopied(false);

    try {
      const response = await fetch(
        "/api/couple-space/invitation",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({})
        }
      );

      const data =
        (await response.json()) as InvitationResponse;

      if (!response.ok) {
        throw new Error(
          data.error ??
            "Unable to create an invitation."
        );
      }

      if (!data.invitationUrl) {
        throw new Error(
          "The invitation was created but no link was returned."
        );
      }

      setInvitationUrl(data.invitationUrl);
      setExpiresAt(data.expiresAt ?? null);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to create an invitation."
      );
    } finally {
      setIsCreatingInvite(false);
    }
  }

  async function copyInvitation() {
    if (!invitationUrl) {
      return;
    }

    try {
      await navigator.clipboard.writeText(
        invitationUrl
      );

      setCopied(true);

      window.setTimeout(() => {
        setCopied(false);
      }, 1800);
    } catch {
      setError(
        "We couldn't copy the invitation. Please copy it manually."
      );
    }
  }

  async function signOut() {
    setIsProfileOpen(false);

    await authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          router.replace("/auth");
          router.refresh();
        }
      }
    });
  }

  return (
    <>
      <header className="space-header">
        <div className="space-floating-actions">
  {canInvite && (
    <button
      type="button"
      className="space-floating-invite"
      onClick={openInvite}
      aria-label="Invite your person"
    >
      <PlusIcon />
      <span>Invite</span>
    </button>
  )}

  <div
    ref={profileRef}
    className="space-profile"
  >
    <button
      type="button"
      className="space-profile-button"
      onClick={() =>
        setIsProfileOpen(
          (open) => !open
        )
      }
      aria-label="Open account menu"
      aria-expanded={isProfileOpen}
      aria-haspopup="menu"
    >
      <span aria-hidden="true">
        {initials}
      </span>
    </button>

    {isProfileOpen && (
      <div
        className="space-profile-menu"
        role="menu"
      >
        <div className="space-profile-summary">
          <div className="space-profile-summary-avatar">
            {initials}
          </div>

          <div className="space-profile-summary-text">
            <strong>{userName}</strong>
            <span>{userEmail}</span>
          </div>
        </div>

        <div className="space-profile-divider" />

        <button
          type="button"
          className="space-profile-menu-item space-profile-signout"
          role="menuitem"
          onClick={signOut}
        >
          Sign out
        </button>
      </div>
    )}
  </div>
</div>
      </header>

      {isInviteOpen && (
        <div
          className="space-dialog-layer"
          role="presentation"
          onPointerDown={(event) => {
            if (event.target === event.currentTarget) {
              closeInvite();
            }
          }}
        >
          <section
            className="space-invite-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="space-invite-title"
          >
            <div className="space-dialog-header">
              <div className="space-dialog-heading">
                <span
                  className="space-dialog-icon"
                  aria-hidden="true"
                >
                  <HeartIcon />
                </span>

                <div>
                  <p className="space-dialog-eyebrow">
                    Couple Space
                  </p>

                  <h2 id="space-invite-title">
                    Invite your person
                  </h2>
                </div>
              </div>

              <button
                type="button"
                className="space-dialog-close"
                onClick={closeInvite}
                disabled={isCreatingInvite}
                aria-label="Close invitation"
              >
                <CloseIcon />
              </button>
            </div>

            {!invitationUrl ? (
              <>
                <p className="space-dialog-description">
                  Create a private invitation link and
                  send it to the person you want to share
                  this space with.
                </p>

                <div className="space-invite-features">
                  <div>
                    <span aria-hidden="true">♡</span>
                    <strong>Private</strong>
                    <small>Just the two of you</small>
                  </div>

                  <div>
                    <span aria-hidden="true">⌁</span>
                    <strong>Secure</strong>
                    <small>One-time invitation</small>
                  </div>

                  <div>
                    <span aria-hidden="true">◷</span>
                    <strong>7 days</strong>
                    <small>Before it expires</small>
                  </div>
                </div>

                {error && (
                  <p
                    className="space-dialog-error"
                    role="alert"
                  >
                    {error}
                  </p>
                )}

                <button
                  type="button"
                  className="space-dialog-primary"
                  onClick={createInvitation}
                  disabled={isCreatingInvite}
                >
                  {isCreatingInvite
                    ? "Creating invitation…"
                    : "Create invitation"}
                </button>
              </>
            ) : (
              <>
                <div className="space-invite-success-heading">
                  <span
                    className="space-invite-success-mark"
                    aria-hidden="true"
                  >
                    <CheckIcon />
                  </span>

                  <div>
                    <h3>Your invitation is ready</h3>
                    <p>
                      Send this link to your person so
                      they can join your private space.
                    </p>
                  </div>
                </div>

                <div className="space-invite-link-row">
                  <input
                    value={invitationUrl}
                    readOnly
                    aria-label="Invitation link"
                    onFocus={(event) =>
                      event.currentTarget.select()
                    }
                  />

                  <button
                    type="button"
                    onClick={copyInvitation}
                    className="space-copy-button"
                    aria-label={
                      copied
                        ? "Invitation copied"
                        : "Copy invitation"
                    }
                  >
                    {copied ? (
                      <CheckIcon />
                    ) : (
                      <CopyIcon />
                    )}
                  </button>
                </div>

                {error && (
                  <p
                    className="space-dialog-error"
                    role="alert"
                  >
                    {error}
                  </p>
                )}

                <button
                  type="button"
                  className="space-dialog-primary"
                  onClick={copyInvitation}
                >
                  {copied
                    ? "Invitation copied"
                    : "Copy invitation link"}
                </button>

                <p className="space-dialog-expiry">
                  {expiresAt
                    ? formatExpiry(expiresAt)
                    : "Valid for 7 days"}
                </p>
              </>
            )}
          </section>
        </div>
      )}
    </>
  );
}