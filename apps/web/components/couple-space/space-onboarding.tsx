"use client";

import {
  useState
} from "react";

import {
  useRouter
} from "next/navigation";

export function SpaceOnboarding() {
  const router =
    useRouter();

  const [
    isCreating,
    setIsCreating
  ] = useState(false);

  const [
    error,
    setError
  ] = useState<string | null>(
    null
  );

  async function handleCreateSpace() {
    if (isCreating) {
      return;
    }

    setIsCreating(true);
    setError(null);

    try {
      const response =
        await fetch(
          "/api/couple-space/create",
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json"
            }
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ??
            "Unable to create Couple Space."
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

      setIsCreating(false);
    }
  }

  return (
    <main className="auth-screen">
      <section
        className="auth-card"
        aria-labelledby="space-onboarding-title"
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
          id="space-onboarding-title"
          className="auth-title"
        >
          Your space starts here
        </h1>

        <p className="auth-description">
          Create a private space for the two of
          you, or join one using an invitation.
        </p>

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
            handleCreateSpace
          }
          disabled={isCreating}
        >
          {isCreating
            ? "Creating space…"
            : "Create our space"}
        </button>

        <button
          type="button"
          className="auth-switch-button"
          onClick={() =>
            router.push(
              "/invite"
            )
          }
          disabled={isCreating}
        >
          I have an invitation
        </button>
      </section>
    </main>
  );
}