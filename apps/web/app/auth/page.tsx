"use client";

import {
  FormEvent,
  useState
} from "react";

import {
  useRouter,
  useSearchParams
} from "next/navigation";

import GradientWaves from "@/components/GradientWaves";

import {
  authClient
} from "@/lib/auth/auth-client";

type AuthMode =
  | "sign-in"
  | "sign-up";

function getSafeRedirect(
  value: string | null
): string {
  if (!value) {
    return "/space";
  }

  if (
    !value.startsWith("/") ||
    value.startsWith("//")
  ) {
    return "/space";
  }

  return value;
}

function EyeIcon({
  visible
}: {
  visible: boolean;
}) {
  if (visible) {
    return (
      <svg
        viewBox="0 0 24 24"
        width="18"
        height="18"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" />
        <circle
          cx="12"
          cy="12"
          r="2.75"
        />
      </svg>
    );
  }

  return (
    <svg
      viewBox="0 0 24 24"
      width="18"
      height="18"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="m3 3 18 18" />
      <path d="M10.6 6.15A10.7 10.7 0 0 1 12 6c6 0 9.5 6 9.5 6a18.8 18.8 0 0 1-3.15 3.72" />
      <path d="M6.55 6.6C4.05 8.15 2.5 12 2.5 12s3.5 6 9.5 6a9.8 9.8 0 0 0 3.25-.55" />
      <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
    </svg>
  );
}

export default function AuthPage() {
  const router =
    useRouter();

  const searchParams =
    useSearchParams();

  const redirectTarget =
    getSafeRedirect(
      searchParams.get(
        "redirect"
      )
    );

  const [
    mode,
    setMode
  ] = useState<AuthMode>(
    "sign-in"
  );

  const [
    name,
    setName
  ] = useState("");

  const [
    email,
    setEmail
  ] = useState("");

  const [
    password,
    setPassword
  ] = useState("");

  const [
    showPassword,
    setShowPassword
  ] = useState(false);

  const [
    isSubmitting,
    setIsSubmitting
  ] = useState(false);

  const [
    error,
    setError
  ] = useState<string | null>(
    null
  );

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError(null);
    setIsSubmitting(true);

    try {
      if (mode === "sign-up") {
        const result =
          await authClient.signUp.email({
            name,
            email,
            password
          });

        if (result.error) {
          throw new Error(
            result.error.message ??
              "Unable to create your account."
          );
        }
      } else {
        const result =
          await authClient.signIn.email({
            email,
            password
          });

        if (result.error) {
          throw new Error(
            result.error.message ??
              "Unable to sign in."
          );
        }
      }

      router.replace(
        redirectTarget
      );

      router.refresh();
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Something went wrong."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  function switchMode() {
    if (isSubmitting) {
      return;
    }

    setError(null);
    setShowPassword(false);

    setMode(
      mode === "sign-in"
        ? "sign-up"
        : "sign-in"
    );
  }

  const isSignUp =
    mode === "sign-up";

  return (
    <main className="auth-screen">
      <div
        className="auth-background"
        aria-hidden="true"
      >
        <GradientWaves
          horizonColor="#757bd7"
          waveColor="#0a0f15"
          crestColor="#bab6ba"
          speed={0.4}
          amplitude={2.5}
          waveScale={0.6}
          waveRatio={0.9}
          swell={35}
          turbulence={20}
          tilt={1.11}
          zoom={1}
          height={5.5}
          fogDepth={15}
          detail="medium"
          brightness={0.8}
          opacity={0.78}
          mouseInteraction={true}
          parallaxStrength={0.5}
          grain={true}
          grainIntensity={0.05}
        />
      </div>

      <section
        className="auth-card"
        aria-labelledby="auth-title"
      >
        <div className="auth-header">
          <div
            className="auth-mark"
            aria-hidden="true"
          >
            <span>♡</span>
          </div>

          <p className="auth-eyebrow">
            Couple Space
          </p>

          <h1
            id="auth-title"
            className="auth-title"
          >
            {isSignUp
              ? "Create your space"
              : "Welcome back"}
          </h1>

          <p className="auth-description">
            {isSignUp
              ? "A private little corner for the two of you."
              : "Your little corner is waiting for you."}
          </p>
        </div>

        <form
          className="auth-form"
          onSubmit={handleSubmit}
        >
          {isSignUp && (
            <label className="auth-field">
              <span>
                Your name
              </span>

              <input
                type="text"
                name="name"
                autoComplete="name"
                placeholder="What should we call you?"
                value={name}
                onChange={(event) =>
                  setName(
                    event.target.value
                  )
                }
                required
                disabled={
                  isSubmitting
                }
              />
            </label>
          )}

          <label className="auth-field">
            <span>
              Email
            </span>

            <input
              type="email"
              name="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(event) =>
                setEmail(
                  event.target.value
                )
              }
              required
              disabled={
                isSubmitting
              }
            />
          </label>

          <label className="auth-field">
            <span>
              Password
            </span>

            <div className="auth-password">
              <input
                type={
                  showPassword
                    ? "text"
                    : "password"
                }
                name="password"
                autoComplete={
                  isSignUp
                    ? "new-password"
                    : "current-password"
                }
                placeholder="Enter your password"
                value={password}
                onChange={(event) =>
                  setPassword(
                    event.target.value
                  )
                }
                minLength={8}
                required
                disabled={
                  isSubmitting
                }
              />

              <button
                type="button"
                className="auth-password-toggle"
                onClick={() =>
                  setShowPassword(
                    (current) =>
                      !current
                  )
                }
                aria-label={
                  showPassword
                    ? "Hide password"
                    : "Show password"
                }
                aria-pressed={
                  showPassword
                }
                disabled={
                  isSubmitting
                }
              >
                <EyeIcon
                  visible={
                    showPassword
                  }
                />
              </button>
            </div>
          </label>

          {error && (
            <p
              className="auth-error"
              role="alert"
            >
              {error}
            </p>
          )}

          <button
            type="submit"
            className="auth-submit"
            disabled={
              isSubmitting
            }
          >
            {isSubmitting ? (
              <>
                <span
                  className="auth-spinner"
                  aria-hidden="true"
                />
                <span>
                  {isSignUp
                    ? "Creating your space…"
                    : "Signing you in…"}
                </span>
              </>
            ) : (
              <span>
                {isSignUp
                  ? "Create account"
                  : "Sign in"}
              </span>
            )}
          </button>
        </form>

        <div className="auth-switch">
          <span>
            {isSignUp
              ? "Already have an account?"
              : "New to Couple Space?"}
          </span>

          <button
            type="button"
            className="auth-switch-button"
            onClick={
              switchMode
            }
            disabled={
              isSubmitting
            }
          >
            {isSignUp
              ? "Sign in"
              : "Create account"}
          </button>
        </div>

        <p className="auth-footer">
          Made for two.
        </p>
      </section>
    </main>
  );
}