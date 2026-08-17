import {
  NextResponse
} from "next/server";

import type {
  NextRequest
} from "next/server";

const AUTH_COOKIE_NAME =
  "better-auth.session_token";

export function proxy(
  request: NextRequest
) {
  const pathname =
    request.nextUrl.pathname;

  if (
    !pathname.startsWith(
      "/space"
    )
  ) {
    return NextResponse.next();
  }

  const hasAuthCookie =
    request.cookies
      .getAll()
      .some(
        ({ name }) =>
          name === AUTH_COOKIE_NAME ||
          name === `__Secure-${AUTH_COOKIE_NAME}`
      );

  if (!hasAuthCookie) {
    const url =
      request.nextUrl.clone();

    url.pathname = "/auth";

    url.searchParams.set(
      "redirect",
      pathname
    );

    return NextResponse.redirect(
      url
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/space/:path*"
  ]
};