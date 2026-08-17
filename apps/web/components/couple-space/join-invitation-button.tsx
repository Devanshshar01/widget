"use client";

import {
  useState
} from "react";

import {
  useRouter
} from "next/navigation";

interface JoinInvitationButtonProps {
  readonly token: string;
}

export function JoinInvitationButton({
  token
}: JoinInvitationButtonProps) {
  const router =
    useRouter();

  const [
    isJoining,
    setIsJoining
  ] = useState(false);

  const [
    error,
    setError
  ] = useState<string | null>(
    null
  );

  async function handleJoin() {
    if (isJoining) {
      return;
    }

    setIsJoining(true);
    setError(null);

    try {
      const response =
        await fetch(
          "/api/couple-space/join",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json"
            },

            body: JSON.stringify({
              token
            })
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ??
            "Unable to join Couple Space."
        );
      }

      router.replace("/space");
      router.refresh();
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Something went wrong."
      );

      setIsJoining(false);
    }
  }

  return (
    <>
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
        onClick={handleJoin}
        disabled={isJoining}
      >
        {isJoining
          ? "Joining…"
          : "Join Couple Space"}
      </button>
    </>
  );
}