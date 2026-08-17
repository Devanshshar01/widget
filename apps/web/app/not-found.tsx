import Link from "next/link";

export default function NotFound() {
  return (
    <main className="system-screen">
      <section
        className="system-content"
        aria-labelledby="not-found-title"
      >
        <p className="system-code">404</p>

        <h1
          id="not-found-title"
          className="system-title"
        >
          This space doesn&apos;t exist.
        </h1>

        <p className="system-description">
          The page you&apos;re looking for could not be
          found.
        </p>

        <Link
          href="/"
          className="system-action"
        >
          Return home
        </Link>
      </section>
    </main>
  );
}