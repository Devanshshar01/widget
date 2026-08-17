import {
  headers
} from "next/headers";

import {
  redirect
} from "next/navigation";

import {
  auth
} from "@/lib/auth/auth";

export async function getServerSession() {
  const requestHeaders =
    await headers();

  const session =
    await auth.api.getSession({
      headers: requestHeaders
    });

  console.log(
    "[SERVER SESSION]",
    {
      hasCookie:
        Boolean(
          requestHeaders.get("cookie")
        ),

      hasSession:
        Boolean(session),

      userId:
        session?.user?.id ?? null,

      sessionId:
        session?.session?.id ?? null
    }
  );

  return session;
}

export async function requireServerSession() {
  const session =
    await getServerSession();

  console.log(
    "[REQUIRE SERVER SESSION]",
    {
      authenticated:
        Boolean(session)
    }
  );

  if (!session) {
    console.log(
      "[REQUIRE SERVER SESSION] REDIRECTING"
    );

    redirect(
      "/auth?redirect=/space"
    );
  }

  return session;
}