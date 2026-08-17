import Link from "next/link";

import MoltenMetal from "@/components/effects/MoltenMetal";

export default function HomePage() {
  return (
    <main className="home-screen">

      {/* ------------------------------------------------------------------ */}
      {/* Animated background                                                */}
      {/* ------------------------------------------------------------------ */}

      <div
        className="home-background"
        aria-hidden="true"
      >
        <MoltenMetal
          color1="#234ae4"
          color2="#162e57"
          color3="#0049ff"
          speed={0.35}
          scale={4}
          detail={6}
          glow={2.45}
          coreSize={0.05}
          swirl={2}
          fold={-0.2}
          blackPoint={0.14}
          brightness={2.9}
          colorMode="molten"
          grain={true}
          grainIntensity={0.025}
          mouseInteraction={true}
          mouseStrength={0.3}
          opacity={1}
        />
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Landing page content                                                */}
      {/* ------------------------------------------------------------------ */}

      <section
        className="home-content"
        aria-labelledby="home-title"
      >
        <div
          className="home-mark"
          aria-hidden="true"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78Z"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        <h1
          id="home-title"
          className="home-title"
        >
          A space that belongs to two.
        </h1>

        <p className="home-description">
          A private realtime space where words,
          little moments, and presence can exist
          together.
        </p>

        <div
          className="home-status"
          aria-label="Application is ready"
        >
          <span
            className="home-status-dot"
            aria-hidden="true"
          />

          <span>
            Private by design
          </span>
        </div>

        <Link
          href="/space"
          className="home-enter-button"
        >
          Enter Couple Space

          <span aria-hidden="true">
            →
          </span>
        </Link>
      </section>
    </main>
  );
}