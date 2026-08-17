"use client";

import {
  useState
} from "react";

import {
  useRouter
} from "next/navigation";

import {
  authClient
} from "@/lib/auth/auth-client";

interface LogoutButtonProps {
  readonly className?: string;
}

export function LogoutButton({
  className
}: LogoutButtonProps) {
  const router =
    useRouter();

  const [
    isSigningOut,
    setIsSigningOut
  ] = useState(false);

  async function handleSignOut() {
    if (isSigningOut) {
      return;
    }

    setIsSigningOut(true);

    try {
      const result =
        await authClient.signOut();

      if (result.error) {
        console.error(
          "Sign out failed:",
          result.error
        );

        setIsSigningOut(false);

        return;
      }

      router.push("/");
    } catch (error) {
      console.error(
        "Sign out failed:",
        error
      );

      setIsSigningOut(false);
    }
  }

  return (
    <button
      type="button"
      className={className}
      onClick={handleSignOut}
      disabled={isSigningOut}
    >
      {isSigningOut
        ? "Signing out…"
        : "Sign out"}
    </button>
  );
}