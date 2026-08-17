export default function Loading() {
  return (
    <main
      className="loading-screen"
      aria-label="Loading Couple Space"
      aria-busy="true"
    >
      <span
        className="loading-indicator"
        aria-hidden="true"
      />
    </main>
  );
}