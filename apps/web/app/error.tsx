"use client";

import { useEffect } from "react";

interface ErrorPageProps {
  error: Error & {
    digest?: string;
  };
  reset: () => void;
}

export default function ErrorPage({
  error,
  reset
}: ErrorPageProps) {
  useEffect(() => {
    console.error(
      "Couple Space application error:",
      error
    );
  }, [error]);

  return (
    <main className="system-screen">
      <section
        className="system-content"
        aria-labelledby="error-title"
      >
        <p className="system-code">
          Something went wrong
        </p>

        <h1
          id="error-title"
          className="system-title"
        >
          We couldn&apos;t load this space.
        </h1>

        <p className="system-description">
          The application encountered an unexpected
          problem. You can safely try again.
        </p>

        <button
          type="button"
          className="system-action"
          onClick={reset}
        >
          Try again
        </button>
      </section>
    </main>
  );
}